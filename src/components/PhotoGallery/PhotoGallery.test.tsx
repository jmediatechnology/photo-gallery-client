import {act, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, test, vi, type Mock} from "vitest";
import type {PhotographDTO} from "../../types";
import {PhotoGallery} from "./PhotoGallery";
import {usePhotographs} from "../../context/PhotographContext.tsx";
import {usePhotographSelection} from "../../context/PhotographSelectionContext.tsx";
import {useAuth} from "../../context/AuthContext.tsx";
import {useKeyboardNavigation} from "../../hooks/useKeyboardNavigation.tsx";
import {useRectangularSelection} from "../../hooks/useRectangularSelection.tsx";
import {PhotographShowModal} from "../PhotographShowModal/PhotographShowModal.tsx";
import {PhotographDeleteModal} from "../PhotographDeleteModal/PhotographDeleteModal.tsx";
import {PhotographEditModal} from "../PhotographEditModal/PhotographEditModal.tsx";
import {SelectionRectangle} from "../SelectionRectangle/SelectionRectangle.tsx";

vi.mock("../../api/config", () => ({
    api: {
        url: (path: string) => `https://test.com${path}`
    }
}));

vi.mock("../../context/PhotographContext.tsx", () => ({
    usePhotographs: vi.fn(),
}));

vi.mock("../../context/PhotographSelectionContext.tsx", () => ({
    usePhotographSelection: vi.fn(),
}));

vi.mock("../../context/AuthContext.tsx", () => ({
    useAuth: vi.fn(),
}));

vi.mock("../../hooks/useKeyboardNavigation.tsx", () => ({
    useKeyboardNavigation: vi.fn(),
}));

/*
 * Photograph reads PHOTOGRAPH_UUID_ATTRIBUTE from this module, so only the
 * hook is replaced and the rest of the module stays real.
 */
vi.mock("../../hooks/useRectangularSelection.tsx", async (importOriginal) => ({
    ...await importOriginal<typeof import("../../hooks/useRectangularSelection.tsx")>(),
    useRectangularSelection: vi.fn(),
}));

/*
 * The modals and the rectangle have their own tests. Here they only need to
 * show whether PhotoGallery rendered them and with which props; the props
 * are read back through the mock's call history.
 */
vi.mock("../PhotographShowModal/PhotographShowModal.tsx", () => ({
    PhotographShowModal: vi.fn(() => <div data-testid="show-modal"/>),
}));

vi.mock("../PhotographDeleteModal/PhotographDeleteModal.tsx", () => ({
    PhotographDeleteModal: vi.fn(() => <div data-testid="delete-modal"/>),
}));

vi.mock("../PhotographEditModal/PhotographEditModal.tsx", () => ({
    PhotographEditModal: vi.fn(() => <div data-testid="edit-modal"/>),
}));

vi.mock("../SelectionRectangle/SelectionRectangle.tsx", () => ({
    SelectionRectangle: vi.fn(() => <div data-testid="selection-rectangle"/>),
}));

const mockedUsePhotographs = usePhotographs as Mock;
const mockedUsePhotographSelection = usePhotographSelection as Mock;
const mockedUseAuth = useAuth as Mock;
const mockedUseKeyboardNavigation = useKeyboardNavigation as Mock;
const mockedUseRectangularSelection = useRectangularSelection as Mock;

const ADMIN = {username: 'admin', roles: ['ROLE_ADMIN'], token: 'test-token'};

const SUNSET = {uuid: '1', title: 'Sunset', description: 'Beautiful sunset', filePath: '/images/sunset.jpg'} as PhotographDTO;
const NIGHT = {uuid: '2', title: 'Night', description: 'Beautiful night', filePath: '/images/night.jpg'} as PhotographDTO;
const MORNING = {uuid: '3', title: 'Morning', description: 'Beautiful morning', filePath: '/images/morning.jpg'} as PhotographDTO;

const replaceSelection = vi.fn();
const onMouseDown = vi.fn();

describe('PhotoGallery', () => {

    beforeEach(() => {
        mockedUseAuth.mockReturnValue(ADMIN);
        loadPhotographs([SUNSET, NIGHT, MORNING]);
        selectPhotographUuids([]);
        stopRectangularSelection();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('loading states', () => {
        test('shows a spinner while the photographs are loading', () => {
            mockedUsePhotographs.mockReturnValue({photographs: photographCollection([]), isLoading: true, error: null});

            render(<PhotoGallery/>);

            expect(screen.getByText('Loading photographs...')).toBeInTheDocument();
        });

        test('shows the error when loading failed', () => {
            mockedUsePhotographs.mockReturnValue({photographs: photographCollection([]), isLoading: false, error: 'Network error'});

            render(<PhotoGallery/>);

            expect(screen.getByText('Network error')).toBeInTheDocument();
        });

        test('shows a warning when there are no photographs', () => {
            loadPhotographs([]);

            render(<PhotoGallery/>);

            expect(screen.getByText('No photographs found')).toBeInTheDocument();
        });
    });

    describe('gallery', () => {
        test('renders every photograph', () => {
            render(<PhotoGallery/>);

            expect(screen.getByRole('img', {name: 'Sunset'})).toHaveAttribute('src', 'https://test.com/images/sunset.jpg');
            expect(screen.getByRole('img', {name: 'Night'})).toBeInTheDocument();
            expect(screen.getByRole('img', {name: 'Morning'})).toBeInTheDocument();
        });

        test('marks only the selected photographs as selected', () => {
            selectPhotographUuids([NIGHT.uuid]);

            render(<PhotoGallery/>);

            expect(photographItem('Night')).toHaveClass('photo-gallery-item--selected');
            expect(photographItem('Sunset')).not.toHaveClass('photo-gallery-item--selected');
        });

        test('opens no modal on its own', () => {
            render(<PhotoGallery/>);

            expect(screen.queryByTestId('show-modal')).not.toBeInTheDocument();
            expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument();
            expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
        });
    });

    describe('rectangular selection', () => {
        test('replaces the selection with whatever the rectangle covers', () => {
            render(<PhotoGallery/>);

            expect(mockedUseRectangularSelection).toHaveBeenCalledWith({onSelectionChange: replaceSelection});
        });

        test('starts a selection on mouse down in the gallery', () => {
            render(<PhotoGallery/>);

            fireEvent.mouseDown(screen.getByTestId('photo-gallery-wrapper'));

            expect(onMouseDown).toHaveBeenCalledOnce();
        });

        test('shows no rectangle when not selecting', () => {
            render(<PhotoGallery/>);

            expect(screen.getByTestId('photo-gallery-wrapper')).not.toHaveClass('photo-gallery-wrapper--selecting');
            expect(screen.queryByTestId('selection-rectangle')).not.toBeInTheDocument();
        });

        test('shows the rectangle while selecting', () => {
            const rectangle = {left: 10, top: 20, width: 100, height: 50};
            mockedUseRectangularSelection.mockReturnValue({
                containerRef: {current: null},
                selectionRectangle: rectangle,
                isSelecting: true,
                onMouseDown,
            });

            render(<PhotoGallery/>);

            expect(screen.getByTestId('photo-gallery-wrapper')).toHaveClass('photo-gallery-wrapper--selecting');
            expect(screen.getByTestId('selection-rectangle')).toBeInTheDocument();
            expect(lastPropsOf(SelectionRectangle)).toEqual({rectangle});
        });
    });

    describe('show modal', () => {
        test('opens the clicked photograph', () => {
            render(<PhotoGallery/>);

            fireEvent.click(screen.getByRole('img', {name: 'Sunset'}));

            expect(screen.getByTestId('show-modal')).toBeInTheDocument();
            expect(lastPropsOf(PhotographShowModal).photo).toBe(SUNSET);
        });

        test('closes', () => {
            render(<PhotoGallery/>);
            fireEvent.click(screen.getByRole('img', {name: 'Sunset'}));

            act(() => lastPropsOf(PhotographShowModal).onClose());

            expect(screen.queryByTestId('show-modal')).not.toBeInTheDocument();
        });

        test('switches to a photograph picked inside the modal', () => {
            render(<PhotoGallery/>);
            fireEvent.click(screen.getByRole('img', {name: 'Sunset'}));

            act(() => lastPropsOf(PhotographShowModal).onSelect(MORNING));

            expect(lastPropsOf(PhotographShowModal).photo).toBe(MORNING);
        });
    });

    describe('keyboard navigation', () => {
        test('shows the next photograph', () => {
            const photographs = loadPhotographs([SUNSET, NIGHT, MORNING]);
            render(<PhotoGallery/>);
            fireEvent.click(screen.getByRole('img', {name: 'Night'}));

            act(() => navigateNext());

            expect(photographs.getNext).toHaveBeenCalledWith(1);
            expect(lastPropsOf(PhotographShowModal).photo).toBe(MORNING);
        });

        test('shows the previous photograph', () => {
            const photographs = loadPhotographs([SUNSET, NIGHT, MORNING]);
            render(<PhotoGallery/>);
            fireEvent.click(screen.getByRole('img', {name: 'Night'}));

            act(() => navigatePrevious());

            expect(photographs.getPrev).toHaveBeenCalledWith(1);
            expect(lastPropsOf(PhotographShowModal).photo).toBe(SUNSET);
        });
    });

    describe('delete modal', () => {
        test('opens for the photograph whose delete button was clicked', () => {
            render(<PhotoGallery/>);

            fireEvent.click(screen.getByRole('button', {name: 'Delete Night'}));

            expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
            expect(lastPropsOf(PhotographDeleteModal).photo).toBe(NIGHT);
            expect(screen.queryByTestId('show-modal')).not.toBeInTheDocument();
        });

        test('closes', () => {
            render(<PhotoGallery/>);
            fireEvent.click(screen.getByRole('button', {name: 'Delete Night'}));

            act(() => lastPropsOf(PhotographDeleteModal).onClose());

            expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument();
        });
    });

    describe('edit modal', () => {
        test('opens for the photograph whose edit button was clicked', () => {
            render(<PhotoGallery/>);

            fireEvent.click(screen.getByRole('button', {name: 'Edit Night'}));

            expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
            expect(lastPropsOf(PhotographEditModal).photo).toBe(NIGHT);
            expect(screen.queryByTestId('show-modal')).not.toBeInTheDocument();
        });

        test('closes', () => {
            render(<PhotoGallery/>);
            fireEvent.click(screen.getByRole('button', {name: 'Edit Night'}));

            act(() => lastPropsOf(PhotographEditModal).onClose());

            expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
        });
    });
});

/*
 * Stands in for the collection PhotographContext provides: an array with
 * getNext/getPrev. These wrap around, but PhotoGallery only cares that it
 * asks with the right index and shows whatever comes back.
 */
const photographCollection = (items: PhotographDTO[]) => {
    return Object.assign([...items], {
        getNext: vi.fn((index: number) => items[(index + 1) % items.length]),
        getPrev: vi.fn((index: number) => items[(index - 1 + items.length) % items.length]),
    });
};

const loadPhotographs = (items: PhotographDTO[]) => {
    const photographs = photographCollection(items);
    mockedUsePhotographs.mockReturnValue({photographs, isLoading: false, error: null});
    return photographs;
};

const selectPhotographUuids = (uuids: string[]): void => {
    mockedUsePhotographSelection.mockReturnValue({selectedPhotographUuids: new Set(uuids), replaceSelection});
};

const stopRectangularSelection = (): void => {
    mockedUseRectangularSelection.mockReturnValue({
        containerRef: {current: null},
        selectionRectangle: null,
        isSelecting: false,
        onMouseDown,
    });
};

/*
 * PhotoGallery recreates the navigation callbacks on every render with the
 * current index, so the latest registration is the one a key press would hit.
 */
const navigateNext = (): void => {
    mockedUseKeyboardNavigation.mock.lastCall![0]();
};

const navigatePrevious = (): void => {
    mockedUseKeyboardNavigation.mock.lastCall![1]();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lastPropsOf = (component: unknown): any => {
    return (component as Mock).mock.lastCall![0];
};

const photographItem = (title: string): HTMLElement => {
    return screen.getByRole('img', {name: title}).closest('.photo-gallery-item') as HTMLElement;
};
