import {fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, test, vi} from "vitest";
import {PhotographSortDropdown} from "./PhotographSortDropdown.tsx";
import {DEFAULT_PHOTOGRAPH_SORT, type PhotographSort} from "../../types/PhotographSort.ts";

let openModals: HTMLElement[] = [];

describe('PhotographSortDropdown', () => {

    afterEach(() => {
        openModals.forEach((overlay: HTMLElement) => overlay.remove());
        openModals = [];
        vi.clearAllMocks();
    });

    test('shows the label of the current sort on the button', () => {
        renderDropdown({field: 'title', direction: 'asc'});

        expect(trigger()).toHaveTextContent('Title A–Z');
        expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    });

    test('opens a menu with every sort option, the current one checked', () => {
        renderDropdown();

        fireEvent.click(trigger());

        const options = screen.getAllByRole('menuitemradio');
        expect(options.map((option) => option.textContent)).toEqual([
            'Newest first',
            'Oldest first',
            'Recently updated',
            'Least recently updated',
            'Title A–Z',
            'Title Z–A',
        ]);
        expect(screen.getByRole('menuitemradio', {name: 'Newest first'})).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('menuitemradio', {name: 'Oldest first'})).toHaveAttribute('aria-checked', 'false');
    });

    test('focuses the checked option when it opens', () => {
        renderDropdown({field: 'updatedAt', direction: 'desc'});

        fireEvent.click(trigger());

        expect(screen.getByRole('menuitemradio', {name: 'Recently updated'})).toHaveFocus();
    });

    test('reports the chosen sort and closes', () => {
        const {onSort} = renderDropdown();
        fireEvent.click(trigger());

        fireEvent.click(screen.getByRole('menuitemradio', {name: 'Title Z–A'}));

        expect(onSort).toHaveBeenCalledExactlyOnceWith({field: 'title', direction: 'desc'});
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        expect(trigger()).toHaveFocus();
    });

    test('closes when the button is clicked again', () => {
        renderDropdown();
        fireEvent.click(trigger());

        fireEvent.click(trigger());

        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    test('closes on a mouse down outside the dropdown', () => {
        const {onSort} = renderDropdown();
        fireEvent.click(trigger());

        fireEvent.mouseDown(document.body);

        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        expect(onSort).not.toHaveBeenCalled();
    });

    test('stays open on a mouse down inside the menu', () => {
        renderDropdown();
        fireEvent.click(trigger());

        fireEvent.mouseDown(screen.getByRole('menuitemradio', {name: 'Oldest first'}));

        expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    test('closes on Escape and returns focus to the button', () => {
        renderDropdown();
        fireEvent.click(trigger());

        fireEvent.keyDown(window, {key: 'Escape'});

        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        expect(trigger()).toHaveFocus();
    });

    test('moves focus with the arrow keys and wraps around', () => {
        renderDropdown();
        fireEvent.click(trigger());
        const menu = screen.getByRole('menu');

        fireEvent.keyDown(menu, {key: 'ArrowDown'});
        expect(screen.getByRole('menuitemradio', {name: 'Oldest first'})).toHaveFocus();

        fireEvent.keyDown(menu, {key: 'ArrowUp'});
        fireEvent.keyDown(menu, {key: 'ArrowUp'});
        expect(screen.getByRole('menuitemradio', {name: 'Title Z–A'})).toHaveFocus();
    });

    test.each([
        ['the show modal', 'modal-overlay'],
        ['the edit modal', 'modal-overlay-edit'],
    ])('does not open while %s is open', (_: string, overlayClassName: string) => {
        renderDropdown();
        openModal(overlayClassName);

        fireEvent.click(trigger());

        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
});

const renderDropdown = (sort: PhotographSort = DEFAULT_PHOTOGRAPH_SORT) => {
    const onSort = vi.fn();
    render(<PhotographSortDropdown sort={sort} onSort={onSort} />);
    return {onSort};
};

/*
 * The options carry role="menuitemradio", so the trigger is the only element
 * with the button role, open or closed.
 */
const trigger = (): HTMLElement => {
    return screen.getByRole('button');
};

const openModal = (className: string): void => {
    const overlay = document.createElement('div');
    overlay.className = className;
    document.body.appendChild(overlay);
    openModals.push(overlay);
};
