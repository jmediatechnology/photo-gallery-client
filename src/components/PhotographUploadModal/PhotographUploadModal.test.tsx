import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, beforeEach, describe, expect, test, vi, type Mock} from "vitest";
import {PhotographUploadModal} from "./PhotographUploadModal.tsx";
import {useAuth} from "../../context/AuthContext.tsx";
import {usePhotographs} from "../../context/PhotographContext.tsx";
import {postPhotograph} from "../../api/client.ts";
import type {PhotographDTO} from "../../types";
import {createAxiosError} from "../../../tests/utils/createAxiosError.ts";

vi.mock("../../context/AuthContext.tsx", () => ({
    useAuth: vi.fn<() => void>(),
}));

vi.mock("../../context/PhotographContext.tsx", () => ({
    usePhotographs: vi.fn<() => void>(),
}));

vi.mock("../../api/client.ts", () => ({
    postPhotograph: vi.fn<() => void>(),
}));

const mockedUseAuth = useAuth as Mock;
const mockedUsePhotographs = usePhotographs as Mock;
const mockedPostPhotograph = postPhotograph as Mock;

const ADMIN = {username: 'admin', roles: ['ROLE_ADMIN'], token: 'xxxx'};
const ANONYMOUS = {username: null, roles: null, token: null};

const mockPhoto = {
    uuid: '123',
    filePath: '/images/beach.jpg',
    title: 'Summer Beach',
    description: 'Crystal clear water at sunset',
    createdAt: "",
    updatedAt: ""
} satisfies PhotographDTO;

const mockRefreshPhotographs = vi.fn<() => void>();
const mockOnClose = vi.fn<() => void>();

describe('PhotographUploadModal', () => {

    beforeEach(() => {
        mockedUseAuth.mockReturnValue(ADMIN);
        mockedUsePhotographs.mockReturnValue({refreshPhotographs: mockRefreshPhotographs});
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        test('renders title, description, file input and upload button', () => {
            renderUploadModal();

            expect(screen.getByRole('heading', {name: 'Upload'})).toBeInTheDocument();
            expect(titleInput()).toHaveFocus();
            expect(descriptionInput()).toHaveValue('');
            expect(fileInput()).toHaveAttribute('multiple');
            expect(uploadButton()).toBeEnabled();
        });
    });

    describe('validation', () => {
        test('shows validation error and does not upload when title is missing', async () => {
            const user = userEvent.setup();
            renderUploadModal();

            await user.upload(fileInput(), createFile('photo.jpg'));
            await user.click(uploadButton());

            expect(await screen.findByText('Title is required')).toBeInTheDocument();
            expect(mockedPostPhotograph).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        test('shows validation error and does not upload when no file is selected', async () => {
            const user = userEvent.setup();
            renderUploadModal();

            await user.type(titleInput(), 'Awesome Title');
            await user.click(uploadButton());

            expect(await screen.findByText('No file specified')).toBeInTheDocument();
            expect(mockedPostPhotograph).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        test('requires a title when leaving the title field empty', () => {
            renderUploadModal();

            fireEvent.blur(titleInput());

            expect(screen.getByText('Title is required')).toBeInTheDocument();
        });

        test('clears the title error when leaving the title field filled in', async () => {
            const user = userEvent.setup();
            renderUploadModal();
            fireEvent.blur(titleInput());

            await user.type(titleInput(), 'Awesome Title');
            fireEvent.blur(titleInput());

            expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
        });

        test('clears the file error once a file is chosen', async () => {
            const user = userEvent.setup();
            renderUploadModal();
            await user.type(titleInput(), 'Awesome Title');
            await user.click(uploadButton());
            await screen.findByText('No file specified');

            await user.upload(fileInput(), createFile('photo.jpg'));

            expect(screen.queryByText('No file specified')).not.toBeInTheDocument();
        });

        /*
         * Browsers always give a file input a FileList; React's types allow null
         * because they cover every input type. This test stands in for that case.
         */
        test('keeps no files when the input reports no file list', async () => {
            const user = userEvent.setup();
            renderUploadModal();
            await user.type(titleInput(), 'Awesome Title');

            fireEvent.change(fileInput(), {target: {files: null}});
            await user.click(uploadButton());

            expect(await screen.findByText('No file specified')).toBeInTheDocument();
            expect(mockedPostPhotograph).not.toHaveBeenCalled();
        });
    });

    describe('uploading', () => {
        test('does nothing without a token', async () => {
            mockedUseAuth.mockReturnValue(ANONYMOUS);
            const user = userEvent.setup();
            renderUploadModal();

            await user.type(titleInput(), 'Awesome Title');
            await user.upload(fileInput(), createFile('photo.jpg'));
            await user.click(uploadButton());

            expect(mockedPostPhotograph).not.toHaveBeenCalled();
            expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
        });

        test('uploads a single file: resolves the promise, refreshes the photographs, and closes the modal', async () => {
            mockedPostPhotograph.mockResolvedValueOnce(mockPhoto);
            const user = userEvent.setup();
            renderUploadModal();

            await user.type(titleInput(), 'Awesome Title');
            await user.type(descriptionInput(), 'A super awesome description');
            const file = createFile('photo.jpg');
            await user.upload(fileInput(), file);
            await user.click(uploadButton());

            await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
            expect(mockedPostPhotograph).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    token: 'xxxx',
                    title: 'Awesome Title',
                    description: 'A super awesome description',
                    file,
                })
            );
            expect(mockRefreshPhotographs).toHaveBeenCalledTimes(1);
        });

        test('disables the upload button while uploading', async () => {
            const pending = deferred<PhotographDTO>();
            mockedPostPhotograph.mockReturnValueOnce(pending.promise);
            const user = userEvent.setup();
            renderUploadModal();

            await user.type(titleInput(), 'Awesome Title');
            await user.upload(fileInput(), createFile('photo.jpg'));
            await user.click(uploadButton());

            expect(uploadButton()).toBeDisabled();

            pending.resolve(mockPhoto);
            await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
        });

        test('uploads multiple files: waits for every promise in Promise.all before closing', async () => {
            const file1 = createFile('photo1.jpg');
            const file2 = createFile('photo2.jpg');
            const photo1 = {...mockPhoto, uuid: 'uuid-1', title: 'Awesome Title'};
            const photo2 = {...mockPhoto, uuid: 'uuid-2', title: 'Awesome Title 2'};

            // Deliberately resolve out of order to prove Promise.all waits for both,
            // regardless of which underlying request finishes first.
            const firstUpload = deferred<PhotographDTO>();
            mockedPostPhotograph
                .mockImplementationOnce(() => firstUpload.promise)
                .mockImplementationOnce(() => Promise.resolve(photo2));

            const user = userEvent.setup();
            renderUploadModal();

            await user.type(titleInput(), 'Awesome Title');
            await user.upload(fileInput(), [file1, file2]);
            await user.click(uploadButton());

            await waitFor(() => expect(mockedPostPhotograph).toHaveBeenCalledTimes(2));
            expect(mockOnClose).not.toHaveBeenCalled();
            expect(mockRefreshPhotographs).not.toHaveBeenCalled();

            firstUpload.resolve(photo1);

            // One refresh for the whole batch, not one per file.
            await waitFor(() => expect(mockRefreshPhotographs).toHaveBeenCalledTimes(1));

            // First file keeps the plain title, subsequent files get an index suffix.
            expect(mockedPostPhotograph).toHaveBeenNthCalledWith(1, expect.objectContaining({title: 'Awesome Title', file: file1}));
            expect(mockedPostPhotograph).toHaveBeenNthCalledWith(2, expect.objectContaining({title: 'Awesome Title 1', file: file2}));
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        test('shows an error and does not close the modal when upload fails', async () => {
            mockedPostPhotograph.mockRejectedValueOnce(createAxiosError({message: 'Upload failed on server'}));
            const user = userEvent.setup();
            renderUploadModal();

            await user.type(titleInput(), 'My Trip');
            await user.upload(fileInput(), createFile('photo.jpg'));
            await user.click(uploadButton());

            expect(await screen.findByText('Upload failed on server')).toBeInTheDocument();
            expect(mockOnClose).not.toHaveBeenCalled();
            expect(uploadButton()).toBeEnabled();
        });

        test('refreshes the photographs when one of several uploads fails, since the others may have been stored', async () => {
            mockedPostPhotograph
                .mockResolvedValueOnce(mockPhoto)
                .mockRejectedValueOnce(createAxiosError({message: 'Upload failed on server'}));
            const user = userEvent.setup();
            renderUploadModal();

            await user.type(titleInput(), 'My Trip');
            await user.upload(fileInput(), [createFile('photo1.jpg'), createFile('photo2.jpg')]);
            await user.click(uploadButton());

            await waitFor(() => {
                expect(screen.getByText('Upload failed on server')).toBeInTheDocument();
                expect(mockRefreshPhotographs).toHaveBeenCalledTimes(1);
            });
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    describe('closing', () => {
        test('closes with the close button', async () => {
            const user = userEvent.setup();
            renderUploadModal();

            await user.click(screen.getByRole('button', {name: 'Close'}));

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        test('closes when the overlay is clicked', async () => {
            const user = userEvent.setup();
            renderUploadModal();

            await user.click(screen.getByTestId('modal-overlay'));

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        test('closes with the Escape key', () => {
            renderUploadModal();

            fireEvent.keyDown(document, {key: 'Escape', code: 'Escape'});

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        test('does not close when clicking inside the modal content', async () => {
            const user = userEvent.setup();
            renderUploadModal();

            await user.click(screen.getByRole('heading', {name: 'Upload'}));
            await user.click(descriptionInput());

            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });
});

const renderUploadModal = () => {
    return render(<PhotographUploadModal onClose={mockOnClose}/>);
};

const titleInput = (): HTMLElement => screen.getByRole('textbox', {name: 'Title'});
const descriptionInput = (): HTMLElement => screen.getByRole('textbox', {name: 'Description'});
const fileInput = (): HTMLElement => screen.getByTestId('muli-file-upload-input-element');
const uploadButton = (): HTMLElement => screen.getByRole('button', {name: 'Upload'});

const createFile = (name: string): File => {
    return new File([name], name, {type: 'image/jpeg'});
};

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return {promise, resolve};
}
