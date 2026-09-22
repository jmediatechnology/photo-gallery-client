import {fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, test, vi, type Mock} from "vitest";
import type {PhotographDTO} from "../../types";
import {useAuth} from "../../context/AuthContext.tsx";
import {usePhotographSelection} from "../../context/PhotographSelectionContext.tsx";
import {NavBar} from "./NavBar.tsx";

vi.mock("../../context/AuthContext.tsx", () => ({
    useAuth: vi.fn(),
}));

vi.mock("../../context/PhotographSelectionContext.tsx", () => ({
    usePhotographSelection: vi.fn(),
}));

/*
 * The modal has its own tests; here it only needs to show whether NavBar
 * opened it and to close it again. It renders a .modal-overlay like every
 * real modal does.
 */
vi.mock("../PhotographSelectionDeleteModal/PhotographSelectionDeleteModal.tsx", () => ({
    PhotographSelectionDeleteModal: ({onClose}: {onClose: () => void}) => (
        <div className="modal-overlay" data-testid="selection-delete-modal">
            <button onClick={onClose}>Close selection delete modal</button>
        </div>
    ),
}));

const mockedUseAuth = useAuth as Mock;
const mockedUsePhotographSelection = usePhotographSelection as Mock;

const ANONYMOUS = {username: null, roles: null, token: null};
const ADMIN = {username: 'admin', roles: ['ROLE_ADMIN'], token: 'test-token'};
const USER = {username: 'user', roles: ['ROLE_USER'], token: 'test-token'};

let unrelatedModals: HTMLElement[] = [];

const SUNSET = {uuid: '1', title: 'Sunset', description: '', filePath: '/sunset.jpg'} as PhotographDTO;
const NIGHT = {uuid: '2', title: 'Night', description: '', filePath: '/night.jpg'} as PhotographDTO;

describe('NavBar', () => {

    beforeEach(() => {
        mockedUseAuth.mockReturnValue(ANONYMOUS);
        selectPhotographs([]);
    });

    afterEach(() => {
        unrelatedModals.forEach((overlay: HTMLElement) => overlay.remove());
        unrelatedModals = [];
        vi.clearAllMocks();
    });

    test('shows the login link to anonymous visitors', () => {
        render(<NavBar />);

        expect(screen.getByText('Login')).toBeInTheDocument();
    });

    test('shows no selection count when nothing is selected', () => {
        render(<NavBar />);

        expect(screen.queryByTestId('navbar-selection-count')).not.toBeInTheDocument();
    });

    test('shows the number of selected photographs', () => {
        selectPhotographs([SUNSET, NIGHT]);

        render(<NavBar />);

        expect(screen.getByTestId('navbar-selection-count')).toHaveTextContent('2 selected');
    });

    test('hides the delete link from users who are not admin', () => {
        mockedUseAuth.mockReturnValue(USER);
        selectPhotographs([SUNSET]);

        render(<NavBar />);

        expect(screen.queryByRole('link', {name: 'Delete selected'})).not.toBeInTheDocument();
    });

    test('opens the selection delete modal from the delete link', () => {
        mockedUseAuth.mockReturnValue(ADMIN);
        selectPhotographs([SUNSET]);
        render(<NavBar />);

        fireEvent.click(screen.getByRole('link', {name: 'Delete selected'}));

        expect(screen.getByTestId('selection-delete-modal')).toBeInTheDocument();
    });

    test('opens the selection delete modal with the Delete key', () => {
        mockedUseAuth.mockReturnValue(ADMIN);
        selectPhotographs([SUNSET]);
        render(<NavBar />);

        pressDeleteKey();

        expect(screen.getByTestId('selection-delete-modal')).toBeInTheDocument();
    });

    test('closes the selection delete modal', () => {
        mockedUseAuth.mockReturnValue(ADMIN);
        selectPhotographs([SUNSET]);
        render(<NavBar />);
        pressDeleteKey();

        fireEvent.click(screen.getByRole('button', {name: 'Close selection delete modal'}));

        expect(screen.queryByTestId('selection-delete-modal')).not.toBeInTheDocument();
    });

    test('ignores the Delete key when nothing is selected', () => {
        mockedUseAuth.mockReturnValue(ADMIN);
        render(<NavBar />);

        pressDeleteKey();

        expect(screen.queryByTestId('selection-delete-modal')).not.toBeInTheDocument();
    });

    test('ignores the Delete key for users who are not admin', () => {
        mockedUseAuth.mockReturnValue(USER);
        selectPhotographs([SUNSET]);
        render(<NavBar />);

        pressDeleteKey();

        expect(screen.queryByTestId('selection-delete-modal')).not.toBeInTheDocument();
    });

    test('ignores the Delete key while another modal is open', () => {
        mockedUseAuth.mockReturnValue(ADMIN);
        selectPhotographs([SUNSET]);
        render(<NavBar />);
        openUnrelatedModal();

        pressDeleteKey();

        expect(screen.queryByTestId('selection-delete-modal')).not.toBeInTheDocument();
    });
});

const selectPhotographs = (photographs: PhotographDTO[]): void => {
    mockedUsePhotographSelection.mockReturnValue({selectedPhotographs: photographs});
};

const pressDeleteKey = (): void => {
    fireEvent.keyDown(document.body, {key: 'Delete', code: 'Delete'});
};

/*
 * Stands in for a modal owned by another component, such as PhotoGallery's
 * PhotographShowModal, whose state NavBar cannot see.
 */
const openUnrelatedModal = (): void => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
    unrelatedModals.push(overlay);
};
