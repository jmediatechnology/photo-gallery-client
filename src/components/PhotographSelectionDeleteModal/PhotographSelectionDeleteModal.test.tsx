import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, test, vi, type Mock} from "vitest";
import type {PhotographDTO} from "../../types";
import {deletePhotograph} from "../../api/client.ts";
import {usePhotographs} from "../../context/PhotographContext.tsx";
import {usePhotographSelection} from "../../context/PhotographSelectionContext.tsx";
import {PhotographSelectionDeleteModal} from "./PhotographSelectionDeleteModal.tsx";

vi.mock("../../api/client.ts", () => ({
    deletePhotograph: vi.fn(),
}));

vi.mock("../../api/config.ts", () => ({
    api: {
        url: (path: string) => `https://test.com${path}`,
    },
}));

vi.mock("../../auth/AuthContext.tsx", () => ({
    useAuth: () => ({token: 'test-token'}),
}));

vi.mock("../../context/PhotographContext.tsx", () => ({
    usePhotographs: vi.fn(),
}));

vi.mock("../../context/PhotographSelectionContext.tsx", () => ({
    usePhotographSelection: vi.fn(),
}));

const mockedDeletePhotograph = deletePhotograph as Mock;
const mockedUsePhotographs = usePhotographs as Mock;
const mockedUsePhotographSelection = usePhotographSelection as Mock;

const SUNSET = {uuid: '1', title: 'Sunset', description: '', filePath: '/sunset.jpg'} as PhotographDTO;
const NIGHT = {uuid: '2', title: 'Night', description: '', filePath: '/night.jpg'} as PhotographDTO;

describe('PhotographSelectionDeleteModal', () => {

    const removePhotograph = vi.fn();
    const deselectPhotograph = vi.fn();

    beforeEach(() => {
        mockedUsePhotographs.mockReturnValue({removePhotograph});
        mockedUsePhotographSelection.mockReturnValue({
            selectedPhotographs: [SUNSET, NIGHT],
            deselectPhotograph,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test('lists every selected photograph with its thumbnail and title', () => {
        render(<PhotographSelectionDeleteModal onClose={vi.fn()} />);

        expect(screen.getByRole('heading', {name: 'Delete 2 photographs?'})).toBeInTheDocument();
        expect(screen.getByText('Sunset')).toBeInTheDocument();
        expect(screen.getByText('Night')).toBeInTheDocument();
        expect(screen.getByRole('img', {name: 'Sunset'})).toHaveAttribute('src', 'https://test.com/sunset.jpg');
    });

    test('uses the singular in the heading for one photograph', () => {
        mockedUsePhotographSelection.mockReturnValue({selectedPhotographs: [SUNSET], deselectPhotograph});

        render(<PhotographSelectionDeleteModal onClose={vi.fn()} />);

        expect(screen.getByRole('heading', {name: 'Delete 1 photograph?'})).toBeInTheDocument();
    });

    test('closes without deleting anything when cancelled', () => {
        const onClose = vi.fn();
        render(<PhotographSelectionDeleteModal onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(mockedDeletePhotograph).not.toHaveBeenCalled();
    });

    test('sends one delete request per photograph', () => {
        mockedDeletePhotograph.mockReturnValue(new Promise(() => undefined));
        render(<PhotographSelectionDeleteModal onClose={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', {name: 'Delete'}));

        expect(mockedDeletePhotograph).toHaveBeenCalledTimes(2);
        expect(mockedDeletePhotograph).toHaveBeenCalledWith({token: 'test-token', uuid: '1'});
        expect(mockedDeletePhotograph).toHaveBeenCalledWith({token: 'test-token', uuid: '2'});
    });

    test('marks a deleted photograph and removes it from the gallery and the selection', async () => {
        mockedDeletePhotograph.mockResolvedValue('');
        render(<PhotographSelectionDeleteModal onClose={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', {name: 'Delete'}));

        await waitFor(() => {
            expect(within(getRow('Sunset')).getByText('Deleted')).toBeInTheDocument();
        });
        expect(removePhotograph).toHaveBeenCalledWith('1');
        expect(deselectPhotograph).toHaveBeenCalledWith('1');
    });

    test('shows the error of a failed deletion and keeps the photograph', async () => {
        mockedDeletePhotograph.mockRejectedValue(new Error('Forbidden'));
        render(<PhotographSelectionDeleteModal onClose={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', {name: 'Delete'}));

        await waitFor(() => {
            expect(within(getRow('Sunset')).getByText('Failed')).toBeInTheDocument();
        });
        expect(within(getRow('Sunset')).getByText('Forbidden')).toBeInTheDocument();
        expect(removePhotograph).not.toHaveBeenCalled();
        expect(deselectPhotograph).not.toHaveBeenCalled();
    });

    test('reports every photograph separately when only some deletions fail', async () => {
        mockedDeletePhotograph.mockImplementation(({uuid}: {uuid: string}) => {
            return uuid === '1' ? Promise.resolve('') : Promise.reject(new Error('Forbidden'));
        });
        render(<PhotographSelectionDeleteModal onClose={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', {name: 'Delete'}));

        await waitFor(() => {
            expect(within(getRow('Sunset')).getByText('Deleted')).toBeInTheDocument();
            expect(within(getRow('Night')).getByText('Failed')).toBeInTheDocument();
        });
        expect(removePhotograph).toHaveBeenCalledTimes(1);
        expect(removePhotograph).toHaveBeenCalledWith('1');
        expect(screen.queryByRole('button', {name: 'Delete'})).not.toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'Cancel'})).not.toBeInTheDocument();
    });

    test('cannot be closed while deletions are pending', async () => {
        const deletion = createDeferred<string>();
        mockedDeletePhotograph.mockReturnValue(deletion.promise);
        const onClose = vi.fn();
        render(<PhotographSelectionDeleteModal onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', {name: 'Delete'}));

        expect(screen.getByRole('button', {name: 'Cancel'})).toBeDisabled();
        expect(screen.getByRole('button', {name: 'Close'})).toBeDisabled();
        expect(screen.getByRole('button', {name: 'Deleting…'})).toBeDisabled();

        fireEvent.click(screen.getByTestId('modal-overlay'));
        fireEvent.keyDown(document, {key: 'Escape', code: 'Escape'});
        expect(onClose).not.toHaveBeenCalled();

        deletion.resolve('');

        const closeButton = await screen.findByText('Close');
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('keeps every row visible when the selection changes after opening', () => {
        const {rerender} = render(<PhotographSelectionDeleteModal onClose={vi.fn()} />);

        mockedUsePhotographSelection.mockReturnValue({selectedPhotographs: [], deselectPhotograph});
        rerender(<PhotographSelectionDeleteModal onClose={vi.fn()} />);

        expect(screen.getByText('Sunset')).toBeInTheDocument();
        expect(screen.getByText('Night')).toBeInTheDocument();
    });
});

const getRow = (title: string): HTMLElement => {
    return screen.getByText(title).closest('li') as HTMLElement;
};

const createDeferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((onResolve) => {
        resolve = onResolve;
    });

    return {promise, resolve};
};
