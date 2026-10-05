import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, beforeEach, describe, expect, test, vi, type Mock} from "vitest";
import type {PhotographDTO} from "../../types";
import {PhotographEditModal} from "./PhotographEditModal.tsx";
import {useAuth} from "../../context/AuthContext.tsx";
import {usePhotographs} from "../../context/PhotographContext.tsx";
import {patchPhotograph, postGenerateDescription} from "../../api/client.ts";
import {extractErrorMessage} from "../../api/error.ts";
import {useEscape} from "../../hooks/useEscape.tsx";

vi.mock("../../context/AuthContext.tsx", () => ({
    useAuth: vi.fn(),
}));

vi.mock("../../context/PhotographContext.tsx", () => ({
    usePhotographs: vi.fn(),
}));

vi.mock("../../api/client.ts", () => ({
    patchPhotograph: vi.fn(),
    postGenerateDescription: vi.fn(),
}));

vi.mock("../../api/error.ts", () => ({
    extractErrorMessage: vi.fn(),
}));

/*
 * useEscape has its own tests; here it only matters that the modal hands it
 * onClose.
 */
vi.mock("../../hooks/useEscape.tsx", () => ({
    useEscape: vi.fn(),
}));

const mockedUseAuth = useAuth as Mock;
const mockedUsePhotographs = usePhotographs as Mock;
const mockedPatchPhotograph = patchPhotograph as Mock;
const mockedPostGenerateDescription = postGenerateDescription as Mock;
const mockedExtractErrorMessage = extractErrorMessage as Mock;

const ADMIN = {username: 'admin', roles: ['ROLE_ADMIN'], token: 'test-token'};
const ANONYMOUS = {username: null, roles: null, token: null};

const BEACH = {
    uuid: '123',
    filePath: '/images/beach.jpg',
    title: 'Summer Beach',
    description: 'Crystal clear water at sunset',
    createdAt: "",
    updatedAt: ""
} satisfies PhotographDTO;

const refreshPhotographs = vi.fn<() => void>();
const onClose = vi.fn<() => void>();

describe('PhotographEditModal', () => {

    beforeEach(() => {
        mockedUseAuth.mockReturnValue(ADMIN);
        mockedUsePhotographs.mockReturnValue({refreshPhotographs});
        mockedPatchPhotograph.mockResolvedValue(BEACH);
        mockedPostGenerateDescription.mockResolvedValue({description: 'Generated description'});
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        test('prefills the form with the photograph', () => {
            renderEditModal();

            expect(screen.getByRole('heading', {name: BEACH.title})).toBeInTheDocument();
            expect(uuidInput()).toHaveValue(BEACH.uuid);
            expect(uuidInput()).toHaveAttribute('readonly');
            expect(titleInput()).toHaveValue(BEACH.title);
            expect(descriptionInput()).toHaveValue(BEACH.description);
            expect(generateDescriptionButton()).toBeEnabled();
            expect(updateButton()).toBeEnabled();
        });

        test('shows an empty description when the photograph has none', () => {
            renderEditModal({...BEACH, description: ''});

            expect(descriptionInput()).toHaveValue('');
        });

        test('focuses the title field on open', () => {
            renderEditModal();

            expect(titleInput()).toHaveFocus();
        });

        test('shows no error initially', () => {
            renderEditModal();

            expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
        });
    });

    describe('updating', () => {
        test('sends the edited title and description', async () => {
            const user = userEvent.setup();
            renderEditModal();

            await user.clear(titleInput());
            await user.type(titleInput(), 'Winter Beach');
            await user.clear(descriptionInput());
            await user.type(descriptionInput(), 'Snow on the sand');
            await user.click(updateButton());

            expect(mockedPatchPhotograph).toHaveBeenCalledExactlyOnceWith({
                token: ADMIN.token,
                uuid: BEACH.uuid,
                title: 'Winter Beach',
                description: 'Snow on the sand',
            });
        });

        test('sends no description when the photograph has none', async () => {
            const user = userEvent.setup();
            renderEditModal({...BEACH, description: ''});

            await user.click(updateButton());

            expect(mockedPatchPhotograph).toHaveBeenCalledWith(expect.objectContaining({description: null}));
        });

        test('refreshes the gallery and closes', async () => {
            const user = userEvent.setup();
            renderEditModal();

            await user.click(updateButton());

            await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
            expect(refreshPhotographs).toHaveBeenCalledOnce();
        });

        test('does nothing without a token', async () => {
            mockedUseAuth.mockReturnValue(ANONYMOUS);
            const user = userEvent.setup();
            renderEditModal();

            await user.click(updateButton());

            expect(mockedPatchPhotograph).not.toHaveBeenCalled();
        });

        test('disables both actions while updating, without claiming to generate', async () => {
            const pending = deferred<PhotographDTO>();
            mockedPatchPhotograph.mockReturnValue(pending.promise);
            const user = userEvent.setup();
            renderEditModal();

            await user.click(updateButton());

            expect(updateButton()).toBeDisabled();
            expect(generateDescriptionButton()).toBeDisabled();
            expect(screen.queryByRole('button', {name: 'Generating…'})).not.toBeInTheDocument();

            pending.resolve(BEACH);
            await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
        });

        test('shows the extracted error and stays open when updating fails', async () => {
            const failure = new Error('500');
            mockedPatchPhotograph.mockRejectedValue(failure);
            mockedExtractErrorMessage.mockReturnValue('Could not save');
            const user = userEvent.setup();
            renderEditModal();

            await user.click(updateButton());

            expect(await screen.findByText('Could not save')).toBeInTheDocument();
            expect(mockedExtractErrorMessage).toHaveBeenCalledWith(failure, 'Failed to edit photograph');
            expect(refreshPhotographs).not.toHaveBeenCalled();
            expect(onClose).not.toHaveBeenCalled();
            expect(updateButton()).toBeEnabled();
        });
    });

    describe('generating a description', () => {
        test('asks for a description of this photograph', async () => {
            const user = userEvent.setup();
            renderEditModal();

            await user.click(generateDescriptionButton());

            expect(mockedPostGenerateDescription).toHaveBeenCalledExactlyOnceWith({token: ADMIN.token, uuid: BEACH.uuid});
        });

        test('replaces the description with the generated one', async () => {
            const user = userEvent.setup();
            renderEditModal();

            await user.click(generateDescriptionButton());

            await waitFor(() => expect(descriptionInput()).toHaveValue('Generated description'));
        });

        test('does nothing without a token', async () => {
            mockedUseAuth.mockReturnValue(ANONYMOUS);
            const user = userEvent.setup();
            renderEditModal();

            await user.click(generateDescriptionButton());

            expect(mockedPostGenerateDescription).not.toHaveBeenCalled();
        });

        test('shows progress and disables both actions while generating', async () => {
            const pending = deferred<{description: string}>();
            mockedPostGenerateDescription.mockReturnValue(pending.promise);
            const user = userEvent.setup();
            renderEditModal();

            await user.click(generateDescriptionButton());

            expect(screen.getByRole('button', {name: 'Generating…'})).toBeDisabled();
            expect(updateButton()).toBeDisabled();

            pending.resolve({description: 'Generated description'});
            await waitFor(() => expect(generateDescriptionButton()).toBeEnabled());
            expect(updateButton()).toBeEnabled();
        });

        test('shows the extracted error and keeps the description when generating fails', async () => {
            const failure = new Error('503');
            mockedPostGenerateDescription.mockRejectedValue(failure);
            mockedExtractErrorMessage.mockReturnValue('AI unavailable');
            const user = userEvent.setup();
            renderEditModal();

            await user.click(generateDescriptionButton());

            expect(await screen.findByText('AI unavailable')).toBeInTheDocument();
            expect(mockedExtractErrorMessage).toHaveBeenCalledWith(failure, 'Failed to generate description');
            expect(descriptionInput()).toHaveValue(BEACH.description);
            expect(generateDescriptionButton()).toBeEnabled();
        });
    });

    describe('closing', () => {
        test('closes with the close button', async () => {
            const user = userEvent.setup();
            renderEditModal();

            await user.click(screen.getByRole('button', {name: 'Close'}));

            expect(onClose).toHaveBeenCalledOnce();
            expect(mockedPatchPhotograph).not.toHaveBeenCalled();
        });

        test('closes when the overlay is clicked', async () => {
            const user = userEvent.setup();
            renderEditModal();

            await user.click(screen.getByTestId('modal-overlay'));

            expect(onClose).toHaveBeenCalledOnce();
        });

        test('does not close when clicking inside the modal content', async () => {
            const user = userEvent.setup();
            renderEditModal();

            await user.click(titleInput());
            await user.click(screen.getByRole('heading', {name: BEACH.title}));

            expect(onClose).not.toHaveBeenCalled();
        });

        test('closes with the Escape key', () => {
            renderEditModal();

            expect(useEscape).toHaveBeenCalledWith(onClose);
        });
    });
});

const renderEditModal = (photo: PhotographDTO = BEACH) => {
    return render(<PhotographEditModal photo={photo} onClose={onClose}/>);
};

const uuidInput = (): HTMLElement => screen.getByRole('textbox', {name: 'UUID'});
const titleInput = (): HTMLElement => screen.getByRole('textbox', {name: 'Title'});
const descriptionInput = (): HTMLElement => screen.getByRole('textbox', {name: 'Description'});
const generateDescriptionButton = (): HTMLElement => screen.getByRole('button', {name: 'Generate description'});
const updateButton = (): HTMLElement => screen.getByRole('button', {name: 'Update'});

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return {promise, resolve};
}
