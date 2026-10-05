import {fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, test, vi, type Mock} from "vitest";
import type {PhotographDTO} from "../../types";
import {useAuth} from "../../context/AuthContext.tsx";
import {usePhotographSelection} from "../../context/PhotographSelectionContext.tsx";
import {NavBar} from "./NavBar.tsx";
import {usePhotographs} from "../../context/PhotographContext.tsx";
import {DEFAULT_PHOTOGRAPH_SORT} from "../../types/PhotographSort.ts";

vi.mock("../../context/AuthContext.tsx", () => ({
    useAuth: vi.fn<() => void>(),
}));

vi.mock("../../context/PhotographContext.tsx", () => ({
    usePhotographs: vi.fn<() => void>(),
}));

vi.mock("../../context/PhotographSelectionContext.tsx", () => ({
    usePhotographSelection: vi.fn<() => void>(),
}));

/*
 * The modals have their own tests; here they only need to show whether NavBar
 * opened them and to close them again. Each renders a .modal-overlay like
 * every real modal does.
 */
vi.mock("../PhotographSelectionDeleteModal/PhotographSelectionDeleteModal.tsx", () => ({
    PhotographSelectionDeleteModal: ({onClose}: {onClose: () => void}) => (
        <div className="modal-overlay" data-testid="selection-delete-modal">
            <button onClick={onClose}>Close selection delete modal</button>
        </div>
    ),
}));

vi.mock("../LoginModal/LoginModal.tsx", () => ({
    LoginModal: ({onClose}: {onClose: () => void}) => (
        <div className="modal-overlay" data-testid="login-modal">
            <button onClick={onClose}>Close login modal</button>
        </div>
    ),
}));

vi.mock("../PhotographUploadModal/PhotographUploadModal.tsx", () => ({
    PhotographUploadModal: ({onClose}: {onClose: () => void}) => (
        <div className="modal-overlay" data-testid="upload-modal">
            <button onClick={onClose}>Close upload modal</button>
        </div>
    ),
}));

const mockedUseAuth = useAuth as Mock;
const mockedUsePhotographs = usePhotographs as Mock;
const mockedUsePhotographSelection = usePhotographSelection as Mock;

const ANONYMOUS = {username: null, roles: null, token: null};
const ADMIN = {username: 'admin', roles: ['ROLE_ADMIN'], token: 'test-token'};
const USER = {username: 'user', roles: ['ROLE_USER'], token: 'test-token'};

const searchPhotographsByTitle = vi.fn<() => void>();
const sortPhotographs = vi.fn<() => void>();

let unrelatedModals: HTMLElement[] = [];

const SUNSET = {uuid: '1', title: 'Sunset', description: '', filePath: '/sunset.jpg'} as PhotographDTO;
const NIGHT = {uuid: '2', title: 'Night', description: '', filePath: '/night.jpg'} as PhotographDTO;

describe('NavBar', () => {

    beforeEach(() => {
        mockedUseAuth.mockReturnValue(ANONYMOUS);
        mockedUsePhotographs.mockReturnValue({
            searchPhotographsByTitle,
            sort: DEFAULT_PHOTOGRAPH_SORT,
            sortPhotographs,
        });
        selectPhotographs([]);
    });

    afterEach(() => {
        unrelatedModals.forEach((overlay: HTMLElement) => overlay.remove());
        unrelatedModals = [];
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    describe('authentication', () => {
        test('shows the login link to anonymous visitors', () => {
            render(<NavBar />);

            expect(screen.getByRole('link', {name: 'Login'})).toBeInTheDocument();
            expect(screen.queryByRole('link', {name: 'Logout'})).not.toBeInTheDocument();
        });

        test('opens the login modal from the login link', () => {
            render(<NavBar />);

            fireEvent.click(screen.getByRole('link', {name: 'Login'}));

            expect(screen.getByTestId('login-modal')).toBeInTheDocument();
        });

        test('closes the login modal', () => {
            render(<NavBar />);
            fireEvent.click(screen.getByRole('link', {name: 'Login'}));

            fireEvent.click(screen.getByRole('button', {name: 'Close login modal'}));

            expect(screen.queryByTestId('login-modal')).not.toBeInTheDocument();
        });

        test('shows who is logged in instead of the login link', () => {
            mockedUseAuth.mockReturnValue(USER);

            render(<NavBar />);

            expect(screen.getByText('Logged in as', {exact: false})).toHaveTextContent('Logged in as user');
            expect(screen.getByRole('link', {name: 'Logout'})).toBeInTheDocument();
            expect(screen.queryByRole('link', {name: 'Login'})).not.toBeInTheDocument();
        });

        test('reloads the page on logout', () => {
            const reload = vi.fn<() => void>();
            vi.stubGlobal('location', {...window.location, reload});
            mockedUseAuth.mockReturnValue(USER);
            render(<NavBar />);

            fireEvent.click(screen.getByRole('link', {name: 'Logout'}));

            expect(reload).toHaveBeenCalledOnce();
        });
    });

    describe('upload', () => {
        test.each([
            ['anonymous visitors', ANONYMOUS],
            ['users who are not admin', USER],
        ])('hides the upload link from %s', (_: string, auth: typeof ANONYMOUS | typeof USER) => {
            mockedUseAuth.mockReturnValue(auth);

            render(<NavBar />);

            expect(screen.queryByRole('link', {name: 'Upload'})).not.toBeInTheDocument();
        });

        test('opens the upload modal from the upload link', () => {
            mockedUseAuth.mockReturnValue(ADMIN);
            render(<NavBar />);

            fireEvent.click(screen.getByRole('link', {name: 'Upload'}));

            expect(screen.getByTestId('upload-modal')).toBeInTheDocument();
        });

        test('closes the upload modal', () => {
            mockedUseAuth.mockReturnValue(ADMIN);
            render(<NavBar />);
            fireEvent.click(screen.getByRole('link', {name: 'Upload'}));

            fireEvent.click(screen.getByRole('button', {name: 'Close upload modal'}));

            expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument();
        });
    });

    describe('selection', () => {
        test('shows no selection count when nothing is selected', () => {
            render(<NavBar />);

            expect(screen.queryByTestId('navbar-selection-count')).not.toBeInTheDocument();
        });

        test('shows no delete link to admins when nothing is selected', () => {
            mockedUseAuth.mockReturnValue(ADMIN);

            render(<NavBar />);

            expect(screen.queryByRole('link', {name: 'Delete selected'})).not.toBeInTheDocument();
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

        test.each([
            ['the show modal', 'modal-overlay'],
            ['the edit modal', 'modal-overlay-edit'],
        ])('ignores the Delete key while %s is open', (_: string, overlayClassName: string) => {
            mockedUseAuth.mockReturnValue(ADMIN);
            selectPhotographs([SUNSET]);
            render(<NavBar />);
            openUnrelatedModal(overlayClassName);

            pressDeleteKey();

            expect(screen.queryByTestId('selection-delete-modal')).not.toBeInTheDocument();
        });

        test('ignores the Delete key while the upload modal is open', () => {
            mockedUseAuth.mockReturnValue(ADMIN);
            selectPhotographs([SUNSET]);
            render(<NavBar />);
            fireEvent.click(screen.getByRole('link', {name: 'Upload'}));

            pressDeleteKey();

            expect(screen.queryByTestId('selection-delete-modal')).not.toBeInTheDocument();
        });
    });

    describe('browsing', () => {
        test('lets every visitor search photographs by title', () => {
            render(<NavBar />);

            fireEvent.change(screen.getByRole('searchbox', {name: 'Search photographs by title'}), {target: {value: 'Sun'}});
            fireEvent.submit(screen.getByRole('search'));

            expect(searchPhotographsByTitle).toHaveBeenCalledWith('Sun');
        });

        test('lets every visitor sort the photographs', () => {
            render(<NavBar />);

            fireEvent.click(screen.getByRole('button', {name: 'Newest first'}));
            fireEvent.click(screen.getByRole('menuitemradio', {name: 'Title A–Z'}));

            expect(sortPhotographs).toHaveBeenCalledWith({field: 'title', direction: 'asc'});
        });
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
const openUnrelatedModal = (overlayClassName: string = 'modal-overlay'): void => {
    const overlay = document.createElement('div');
    overlay.className = overlayClassName;
    document.body.appendChild(overlay);
    unrelatedModals.push(overlay);
};
