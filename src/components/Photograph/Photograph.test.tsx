import {fireEvent, render, screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, test, vi, type Mock} from "vitest";
import type {PhotographDTO} from "../../types";
import {Photograph} from "./Photograph.tsx";
import {useAuth} from "../../context/AuthContext.tsx";
import {PHOTOGRAPH_UUID_ATTRIBUTE} from "../../hooks/useRectangularSelection.tsx";

vi.mock("../../api/config", () => ({
    api: {
        url: (path: string) => `https://test.com${path}`
    }
}));

vi.mock("../../context/AuthContext.tsx", () => ({
    useAuth: vi.fn<() => void>(),
}));

const mockedUseAuth = useAuth as Mock;

const ANONYMOUS = {username: null, roles: null, token: null};
const USER = {username: 'user', roles: ['ROLE_USER'], token: 'test-token'};
const ADMIN = {username: 'admin', roles: ['ROLE_ADMIN'], token: 'test-token'};

const BEACH = {
    uuid: '1234',
    filePath: '/images/beach.jpg',
    title: 'Summer Beach',
    description: 'Crystal clear water at sunset',
    createdAt: "",
    updatedAt: ""
} satisfies PhotographDTO;

const onSelect = vi.fn<(photograph: PhotographDTO) => void>();
const onSelectForEdit = vi.fn<(photograph: PhotographDTO) => void>();
const onSelectForDelete = vi.fn<(photograph: PhotographDTO) => void>();

describe('Photograph', () => {

    beforeEach(() => {
        mockedUseAuth.mockReturnValue(ANONYMOUS);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        test('shows the image, title and description', () => {
            renderPhotograph();

            const image = screen.getByAltText(BEACH.title);
            expect(image).toHaveAttribute('src', 'https://test.com/images/beach.jpg');
            expect(screen.getByText(BEACH.title)).toBeInTheDocument();
            expect(screen.getByText(BEACH.description)).toBeInTheDocument();
        });

        test('omits the description when there is none', () => {
            const {container} = renderPhotograph({photograph: {...BEACH, description: ''}});

            expect(container.querySelector('.description')).not.toBeInTheDocument();
        });

        test('exposes its uuid for rectangular selection', () => {
            renderPhotograph();

            expect(photographItem()).toHaveAttribute(PHOTOGRAPH_UUID_ATTRIBUTE, BEACH.uuid);
        });

        test('is keyboard focusable', () => {
            renderPhotograph();

            expect(photographItem()).toHaveAttribute('tabindex', '0');
        });

        test('marks itself as selected', () => {
            renderPhotograph({isSelected: true});

            expect(photographItem()).toHaveClass('photo-gallery-item', 'photo-gallery-item--selected');
        });

        test('is not marked as selected otherwise', () => {
            renderPhotograph({isSelected: false});

            expect(photographItem()).toHaveClass('photo-gallery-item');
            expect(photographItem()).not.toHaveClass('photo-gallery-item--selected');
        });
    });

    describe('selecting', () => {
        test('selects the photograph when the image is clicked', () => {
            renderPhotograph();

            fireEvent.click(screen.getByAltText(BEACH.title));

            expect(onSelect).toHaveBeenCalledExactlyOnceWith(BEACH);
        });

        test('selects the photograph when its title or description is clicked', () => {
            renderPhotograph();

            fireEvent.click(screen.getByText(BEACH.title));

            expect(onSelect).toHaveBeenCalledExactlyOnceWith(BEACH);
        });

        test('selects the photograph with the Enter key', () => {
            renderPhotograph();

            fireEvent.keyDown(photographItem(), {key: 'Enter'});

            expect(onSelect).toHaveBeenCalledExactlyOnceWith(BEACH);
        });

        test('ignores keys other than Enter', () => {
            renderPhotograph();

            fireEvent.keyDown(photographItem(), {key: ' '});

            expect(onSelect).not.toHaveBeenCalled();
        });

        test('does not select the photograph when Enter is pressed on an action button', () => {
            mockedUseAuth.mockReturnValue(ADMIN);
            renderPhotograph();

            fireEvent.keyDown(deleteButton(), {key: 'Enter'});

            expect(onSelect).not.toHaveBeenCalled();
        });
    });

    describe('admin actions', () => {
        test.each([
            ['anonymous visitors', ANONYMOUS],
            ['users who are not admin', USER],
        ])('are hidden from %s', (_: string, auth: typeof ANONYMOUS | typeof USER) => {
            mockedUseAuth.mockReturnValue(auth);

            renderPhotograph();

            expect(screen.queryByRole('button', {name: `Delete ${BEACH.title}`})).not.toBeInTheDocument();
            expect(screen.queryByRole('button', {name: `Edit ${BEACH.title}`})).not.toBeInTheDocument();
        });

        test('let admins select the photograph for deletion', () => {
            mockedUseAuth.mockReturnValue(ADMIN);
            renderPhotograph();

            fireEvent.click(deleteButton());

            expect(onSelectForDelete).toHaveBeenCalledExactlyOnceWith(BEACH);
            expect(onSelectForEdit).not.toHaveBeenCalled();
            expect(onSelect).not.toHaveBeenCalled();
        });

        test('let admins select the photograph for editing', () => {
            mockedUseAuth.mockReturnValue(ADMIN);
            renderPhotograph();

            fireEvent.click(editButton());

            expect(onSelectForEdit).toHaveBeenCalledExactlyOnceWith(BEACH);
            expect(onSelectForDelete).not.toHaveBeenCalled();
            expect(onSelect).not.toHaveBeenCalled();
        });
    });
});

const renderPhotograph = (overrides: Partial<{photograph: PhotographDTO, isSelected: boolean}> = {}) => {
    return render(
        <Photograph
            photograph={overrides.photograph ?? BEACH}
            isSelected={overrides.isSelected ?? false}
            onSelect={onSelect}
            onSelectForEdit={onSelectForEdit}
            onSelectForDelete={onSelectForDelete}
        />
    );
};

const photographItem = (): HTMLElement => {
    return screen.getByAltText(BEACH.title).closest('.photo-gallery-item') as HTMLElement;
};

const deleteButton = (): HTMLElement => {
    return screen.getByRole('button', {name: `Delete ${BEACH.title}`});
};

const editButton = (): HTMLElement => {
    return screen.getByRole('button', {name: `Edit ${BEACH.title}`});
};
