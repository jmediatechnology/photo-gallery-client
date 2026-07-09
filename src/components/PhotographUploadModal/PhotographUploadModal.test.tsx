import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {PhotographUploadModal} from "./PhotographUploadModal.tsx";
import {afterEach, type Mock, vi} from "vitest";
import {AuthProvider} from "../../auth/AuthContext.tsx";
import {usePhotographs} from "../../context/PhotographContext.tsx";
import {postPhotograph} from "../../api/client.ts";
import type {PhotographDTO} from "../../types";
import {createAxiosError} from "../../../tests/utils/createAxiosError.ts";

vi.mock(import('../../auth/AuthContext'), async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useAuth: () => ({
            token: 'xxxx',
            username: 'test-user',
            roles: ['ROLE_ADMIN'],
            setToken: vi.fn()
        })
    };
});

vi.mock('../../context/PhotographContext', () => ({
    usePhotographs: vi.fn(),
}));

vi.mock('../../api/client', () => ({
    postPhotograph: vi.fn(),
}));

const mockedUsePhotographs = usePhotographs as Mock;
const mockedPostPhotograph = postPhotograph as Mock;

const mockPhoto = {
    uuid: '123',
    filePath: '/images/beach.jpg',
    title: 'Summer Beach',
    description: 'Crystal clear water at sunset',
    createdAt: "",
    updatedAt: ""
} satisfies PhotographDTO;

const mockAddPhotograph = vi.fn();
const mockOnClose = vi.fn();

describe('PhotographUploadModal', () => {

    beforeEach(() => {
        mockedUsePhotographs.mockReturnValue({
            photographs: [],
            isLoading: false,
            error: '',
            addPhotograph: mockAddPhotograph,
            editPhotograph: vi.fn(),
            removePhotograph: vi.fn(),
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test('renders title, description, file input and upload button', () => {
        render(
            <AuthProvider>
                <PhotographUploadModal onClose={mockOnClose} />
            </AuthProvider>
        );

        const title = screen.getByText('Title');
        const description = screen.getByText('Description');
        const fileInput = screen.getByTestId('muli-file-upload-input-element');
        const upload = screen.getByRole('button', { name: 'Upload' });

        expect(title).toBeInTheDocument();
        expect(description).toBeInTheDocument();
        expect(fileInput).toHaveAttribute('multiple');
        expect(upload).toBeInTheDocument();
    });

    test('shows validation error and does not upload when title is missing', async () => {
        render(
            <AuthProvider>
                <PhotographUploadModal onClose={mockOnClose} />
            </AuthProvider>
        );

        const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
        const fileInput = screen.getByTestId('muli-file-upload-input-element');
        await userEvent.upload(fileInput, file);

        const uploadButton = screen.getByRole('button', { name: 'Upload' });
        await userEvent.click(uploadButton);

        await waitFor(() => {
            const validationError = screen.getByText('Title is required');
            expect(validationError).toBeInTheDocument();
        });

        expect(postPhotograph).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('shows validation error and does not upload when no file is selected', async () => {
        render(
            <AuthProvider>
                <PhotographUploadModal onClose={mockOnClose} />
            </AuthProvider>
        );

        const titleInput = screen.getByRole('textbox', { name: /title/i });
        await userEvent.type(titleInput, 'Awesome Title');

        const uploadButton = screen.getByRole('button', { name: 'Upload' });
        await userEvent.click(uploadButton);

        await waitFor(() => {
            const validationError = screen.getByText('No file specified');
            expect(validationError).toBeInTheDocument();
        });

        expect(postPhotograph).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('uploads a single file: resolves the promise, adds the photograph, and closes the modal', async () => {

        mockedPostPhotograph.mockResolvedValueOnce(mockPhoto);

        render(
            <AuthProvider>
                <PhotographUploadModal onClose={mockOnClose} />
            </AuthProvider>
        );

        const titleInput = screen.getByRole('textbox', { name: /title/i });
        const descriptionInput = screen.getByRole('textbox', { name: /description/i });
        await userEvent.type(titleInput, 'Awesome Title');
        await userEvent.type(descriptionInput, 'A super awesome description');

        const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
        const fileInput = screen.getByTestId('muli-file-upload-input-element');
        await userEvent.upload(fileInput, file);

        const uploadButton = screen.getByRole('button', { name: 'Upload' });
        await userEvent.click(uploadButton);

        await waitFor(() => {
            expect(mockedPostPhotograph).toHaveBeenCalledTimes(1);
            expect(mockedPostPhotograph).toHaveBeenCalledWith(
                expect.objectContaining({
                    token: 'xxxx',
                    title: 'Awesome Title',
                    description: 'A super awesome description',
                    file,
                })
            );
            expect(mockAddPhotograph).toHaveBeenCalledTimes(1);
            expect(mockAddPhotograph).toHaveBeenCalledWith(mockPhoto);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    test('uploads multiple files: waits for every promise in Promise.all before closing', async () => {
        const file1 = new File(['one'], 'photo1.jpg', { type: 'image/jpeg' });
        const file2 = new File(['two'], 'photo2.jpg', { type: 'image/jpeg' });
        const photo1 = { ...mockPhoto, uuid: 'uuid-1', title: 'Awesome Title'};
        const photo2 = { ...mockPhoto, uuid: 'uuid-2', title: 'Awesome Title 2'};


        // Deliberately resolve out of order to prove Promise.all waits for both,
        // regardless of which underlying request finishes first.
        let promiseResolver1: (value: PhotographDTO) => void;
        const firstCallPromise = new Promise<PhotographDTO>((resolve) => {
            promiseResolver1 = resolve;
        });

        mockedPostPhotograph
            .mockImplementationOnce(() => firstCallPromise)
            .mockImplementationOnce(() => Promise.resolve(photo2));

        render(
            <AuthProvider>
                <PhotographUploadModal onClose={mockOnClose} />
            </AuthProvider>
        );

        const titleInput = screen.getByRole('textbox', { name: /title/i });
        await userEvent.type(titleInput, 'Awesome Title');

        const fileInput = screen.getByTestId('muli-file-upload-input-element');
        await userEvent.upload(fileInput, [file1, file2]);

        const uploadButton = screen.getByRole('button', { name: 'Upload' });
        await userEvent.click(uploadButton);

        await waitFor(() => {
            expect(mockedPostPhotograph).toHaveBeenCalledTimes(2);
        });

        expect(mockOnClose).not.toHaveBeenCalled();

        promiseResolver1!(photo1);

        await waitFor(() => {
            expect(mockAddPhotograph).toHaveBeenCalledTimes(2);
            expect(mockAddPhotograph).toHaveBeenCalledWith(photo1);
            expect(mockAddPhotograph).toHaveBeenCalledWith(photo2);
        });

        // First file keeps the plain title, subsequent files get an index suffix.
        expect(mockedPostPhotograph).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ title: 'Awesome Title', file: file1 })
        );
        expect(mockedPostPhotograph).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ title: 'Awesome Title 1', file: file2 })
        );

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('shows an error and does not close the modal when upload fails', async () => {
        mockedPostPhotograph.mockRejectedValueOnce(createAxiosError({ message: 'Upload failed on server'}));

        render(
            <AuthProvider>
                <PhotographUploadModal onClose={mockOnClose} />
            </AuthProvider>
        );

        const titleInput = screen.getByRole('textbox', { name: /title/i });
        await userEvent.type(titleInput, 'My Trip');

        const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
        const fileInput = screen.getByTestId('muli-file-upload-input-element');
        await userEvent.upload(fileInput, file);

        const uploadButton = screen.getByRole('button', { name: 'Upload' });
        await userEvent.click(uploadButton);

        await waitFor(() => {
            const error = screen.getByText('Upload failed on server');
            expect(error).toBeInTheDocument();
        });

        expect(mockAddPhotograph).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
    });
});
