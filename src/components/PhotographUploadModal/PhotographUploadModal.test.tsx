import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {PhotographUploadModal} from "./PhotographUploadModal.tsx";
import {afterEach, type Mock, vi} from "vitest";
import {AuthProvider} from "../../auth/AuthContext.tsx";
import {usePhotographs} from "../../context/PhotographContext.tsx";
import {postPhotograph} from "../../api/client.ts";
import type {PhotographDTO} from "../../types";

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

const mockAddPhotograph = vi.fn();
const mockOnClose = vi.fn();

const buildPhoto = (overrides: Partial<PhotographDTO> = {}): PhotographDTO => ({
    uuid: '123',
    filePath: '/images/beach.jpg',
    title: 'Summer Beach',
    description: 'Crystal clear water at sunset',
    createdAt: "",
    updatedAt: "",
    ...overrides,
});

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

        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByTestId('muli-file-upload-input-element')).toHaveAttribute('multiple');
        expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
    });

    test('shows validation error and does not upload when title is missing', async () => {
        render(
            <AuthProvider>
                <PhotographUploadModal onClose={mockOnClose} />
            </AuthProvider>
        );

        const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
        const fileInput = screen.getByTestId('muli-file-upload-input-element');
        await userEvent.upload(fileInput, file);

        const uploadButton = screen.getByRole('button', { name: 'Upload' });
        await userEvent.click(uploadButton);

        expect(await screen.findByText('Title is required')).toBeInTheDocument();
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
        await userEvent.type(titleInput, 'My Trip');

        const uploadButton = screen.getByRole('button', { name: 'Upload' });
        await userEvent.click(uploadButton);

        expect(await screen.findByText('No file specified')).toBeInTheDocument();
        expect(postPhotograph).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('uploads a single file: resolves the promise, adds the photograph, and closes the modal', async () => {
        const uploadedPhoto = buildPhoto({ uuid: 'new-uuid', title: 'My Trip' });
        mockedPostPhotograph.mockResolvedValueOnce(uploadedPhoto);

        render(
            <AuthProvider>
                <PhotographUploadModal onClose={mockOnClose} />
            </AuthProvider>
        );

        const titleInput = screen.getByRole('textbox', { name: /title/i });
        const descriptionInput = screen.getByRole('textbox', { name: /description/i });
        await userEvent.type(titleInput, 'My Trip');
        await userEvent.type(descriptionInput, 'A lovely trip');

        const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
        const fileInput = screen.getByTestId('muli-file-upload-input-element');
        await userEvent.upload(fileInput, file);

        const uploadButton = screen.getByRole('button', { name: 'Upload' });
        await userEvent.click(uploadButton);

        await waitFor(() => {
            expect(mockedPostPhotograph).toHaveBeenCalledTimes(1);
            expect(mockAddPhotograph).toHaveBeenCalledTimes(1);
            expect(mockAddPhotograph).toHaveBeenCalledWith(uploadedPhoto);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        expect(mockedPostPhotograph).toHaveBeenCalledWith(
            expect.objectContaining({
                token: 'xxxx',
                title: 'My Trip',
                description: 'A lovely trip',
                file,
            })
        );
    });

    test('uploads multiple files: waits for every promise in Promise.all before closing', async () => {
        const file1 = new File(['one'], 'photo1.jpg', { type: 'image/jpeg' });
        const file2 = new File(['two'], 'photo2.jpg', { type: 'image/jpeg' });
        const photo1 = buildPhoto({ uuid: 'uuid-1', title: 'Trip' });
        const photo2 = buildPhoto({ uuid: 'uuid-2', title: 'Trip 1' });

        // Deliberately resolve out of order to prove Promise.all waits for both,
        // regardless of which underlying request finishes first.
        let resolveFirst: (value: PhotographDTO) => void;
        const firstCallPromise = new Promise<PhotographDTO>((resolve) => {
            resolveFirst = resolve;
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
        await userEvent.type(titleInput, 'Trip');

        const fileInput = screen.getByTestId('muli-file-upload-input-element');
        await userEvent.upload(fileInput, [file1, file2]);

        const uploadButton = screen.getByRole('button', { name: 'Upload' });
        await userEvent.click(uploadButton);

        // Second file's promise has already resolved, but onClose must not fire yet
        // because the first file's promise is still pending.
        await waitFor(() => {
            expect(mockedPostPhotograph).toHaveBeenCalledTimes(2);
        });
        expect(mockOnClose).not.toHaveBeenCalled();

        resolveFirst!(photo1);

        await waitFor(() => {
            expect(mockAddPhotograph).toHaveBeenCalledTimes(2);
            expect(mockAddPhotograph).toHaveBeenCalledWith(photo1);
            expect(mockAddPhotograph).toHaveBeenCalledWith(photo2);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        // First file keeps the plain title, subsequent files get an index suffix.
        expect(mockedPostPhotograph).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ title: 'Trip', file: file1 })
        );
        expect(mockedPostPhotograph).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ title: 'Trip 1', file: file2 })
        );
    });

    test('shows an error and does not close the modal when upload fails', async () => {
        mockedPostPhotograph.mockRejectedValueOnce({
            response: { data: { message: 'Upload failed on server' } }
        });

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

        expect(await screen.findByText('Upload failed on server')).toBeInTheDocument();
        expect(mockAddPhotograph).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
    });
});
