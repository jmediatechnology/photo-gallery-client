import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, test, vi, type Mock} from "vitest";
import type {PhotographDTO} from "../../types";
import {PhotographDeleteModal} from "./PhotographDeleteModal.tsx";
import {useAuth} from "../../context/AuthContext.tsx";
import {usePhotographs} from "../../context/PhotographContext.tsx";
import {deletePhotograph} from "../../api/client.ts";
import {extractErrorMessage} from "../../api/error.ts";
import {useEscape} from "../../hooks/useEscape.tsx";

vi.mock("../../api/config", () => ({
    api: {
        url: (path: string) => `https://test.com${path}`
    }
}));

vi.mock("../../context/AuthContext.tsx", () => ({
    useAuth: vi.fn(),
}));

vi.mock("../../context/PhotographContext.tsx", () => ({
    usePhotographs: vi.fn(),
}));

vi.mock("../../api/client.ts", () => ({
    deletePhotograph: vi.fn(),
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
const mockedDeletePhotograph = deletePhotograph as Mock;
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

const removePhotograph = vi.fn<(uuid: string) => void>();
const onClose = vi.fn<() => void>();

describe('PhotographDeleteModal', () => {

    beforeEach(() => {
        mockedUseAuth.mockReturnValue(ADMIN);
        mockedUsePhotographs.mockReturnValue({removePhotograph});
        mockedDeletePhotograph.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        test('shows the photograph and asks for confirmation', () => {
            renderDeleteModal();

            expect(screen.getByRole('heading', {name: `Permanently delete photograph: "${BEACH.title}"?`})).toBeInTheDocument();
            expect(screen.getByRole('img', {name: BEACH.title})).toHaveAttribute('src', 'https://test.com/images/beach.jpg');
            expect(screen.getByText(BEACH.title)).toBeInTheDocument();
            expect(screen.getByText(`: ${BEACH.description}`)).toBeInTheDocument();
            expect(yesButton()).toBeEnabled();
            expect(noButton()).toBeEnabled();
        });

        test('omits the description when there is none', () => {
            renderDeleteModal({...BEACH, description: ''});

            expect(screen.queryByText(/^:/)).not.toBeInTheDocument();
        });

        test('shows no error initially', () => {
            renderDeleteModal();

            expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
        });
    });

    describe('confirming', () => {
        test('deletes the photograph with the current token', () => {
            renderDeleteModal();

            fireEvent.click(yesButton());

            expect(mockedDeletePhotograph).toHaveBeenCalledExactlyOnceWith({token: ADMIN.token, uuid: BEACH.uuid});
        });

        test('removes the photograph from the gallery and closes', async () => {
            renderDeleteModal();

            fireEvent.click(yesButton());

            await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
            expect(removePhotograph).toHaveBeenCalledExactlyOnceWith(BEACH.uuid);
        });

        test('does nothing without a token', () => {
            mockedUseAuth.mockReturnValue(ANONYMOUS);
            renderDeleteModal();

            fireEvent.click(yesButton());

            expect(mockedDeletePhotograph).not.toHaveBeenCalled();
            expect(yesButton()).toBeEnabled();
        });

        test('disables the confirm button while deleting', async () => {
            const pending = deferred<void>();
            mockedDeletePhotograph.mockReturnValue(pending.promise);
            renderDeleteModal();

            fireEvent.click(yesButton());
            fireEvent.click(yesButton());

            expect(yesButton()).toBeDisabled();
            expect(mockedDeletePhotograph).toHaveBeenCalledOnce();

            pending.resolve();
            await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
        });
    });

    describe('failed deletion', () => {
        test('shows the extracted error message', async () => {
            const failure = new Error('500');
            mockedDeletePhotograph.mockRejectedValue(failure);
            mockedExtractErrorMessage.mockReturnValue('Server exploded');
            renderDeleteModal();

            fireEvent.click(yesButton());

            expect(await screen.findByText('Server exploded')).toBeInTheDocument();
            expect(mockedExtractErrorMessage).toHaveBeenCalledWith(failure, 'Failed to delete photograph');
        });

        test('keeps the photograph and stays open', async () => {
            mockedDeletePhotograph.mockRejectedValue(new Error('500'));
            mockedExtractErrorMessage.mockReturnValue('Server exploded');
            renderDeleteModal();

            fireEvent.click(yesButton());
            await screen.findByText('Server exploded');

            expect(removePhotograph).not.toHaveBeenCalled();
            expect(onClose).not.toHaveBeenCalled();
        });

        test('re-enables the confirm button so the admin can retry', async () => {
            mockedDeletePhotograph.mockRejectedValue(new Error('500'));
            mockedExtractErrorMessage.mockReturnValue('Server exploded');
            renderDeleteModal();

            fireEvent.click(yesButton());

            await waitFor(() => expect(yesButton()).toBeEnabled());
        });
    });

    describe('closing', () => {
        test('closes with the NO button', () => {
            renderDeleteModal();

            fireEvent.click(noButton());

            expect(onClose).toHaveBeenCalledOnce();
            expect(mockedDeletePhotograph).not.toHaveBeenCalled();
        });

        test('closes with the close button', () => {
            renderDeleteModal();

            fireEvent.click(screen.getByRole('button', {name: 'Close'}));

            expect(onClose).toHaveBeenCalledOnce();
        });

        test('closes when the overlay is clicked', () => {
            renderDeleteModal();

            fireEvent.click(screen.getByTestId('modal-overlay'));

            expect(onClose).toHaveBeenCalledOnce();
        });

        test('does not close when clicking inside the modal content', () => {
            renderDeleteModal();

            fireEvent.click(screen.getByRole('img', {name: BEACH.title}));

            expect(onClose).not.toHaveBeenCalled();
        });

        test('closes with the Escape key', () => {
            renderDeleteModal();

            expect(useEscape).toHaveBeenCalledWith(onClose);
        });
    });
});

const renderDeleteModal = (photo: PhotographDTO = BEACH) => {
    return render(<PhotographDeleteModal photo={photo} onClose={onClose}/>);
};

const yesButton = (): HTMLElement => {
    return screen.getByRole('button', {name: 'YES'});
};

const noButton = (): HTMLElement => {
    return screen.getByRole('button', {name: 'NO'});
};

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return {promise, resolve};
}
