import {act, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, test, vi} from "vitest";
import {PhotographTitleSearch} from "./PhotographTitleSearch.tsx";

const SEARCH_DELAY_IN_MILLISECONDS = 300;

describe('PhotographTitleSearch', () => {

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        act(() => vi.runOnlyPendingTimers());
        vi.useRealTimers();
    });

    test('does not search on mount', () => {
        const {onSearch} = renderSearch();

        vi.advanceTimersByTime(SEARCH_DELAY_IN_MILLISECONDS);

        expect(onSearch).not.toHaveBeenCalled();
    });

    test('searches once the user stops typing', () => {
        const {onSearch, input} = renderSearch();

        typeKeystrokes(input, 'Sun');
        vi.advanceTimersByTime(SEARCH_DELAY_IN_MILLISECONDS - 1);

        expect(onSearch).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);

        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('Sun');
    });

    test('restarts the delay on every keystroke', () => {
        const {onSearch, input} = renderSearch();

        typeKeystrokes(input, 'S');
        vi.advanceTimersByTime(SEARCH_DELAY_IN_MILLISECONDS - 100);
        typeKeystrokes(input, 'Su');
        vi.advanceTimersByTime(SEARCH_DELAY_IN_MILLISECONDS - 100);

        expect(onSearch).not.toHaveBeenCalled();
    });

    test('searches immediately when the search form is submitted', () => {
        const {onSearch, input} = renderSearch();

        typeKeystrokes(input, 'Sun');
        fireEvent.submit(screen.getByRole('search'));

        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('Sun');

        vi.advanceTimersByTime(SEARCH_DELAY_IN_MILLISECONDS);

        expect(onSearch).toHaveBeenCalledTimes(1);
    });

    test('shows no clear button while the search field is empty', () => {
        renderSearch();

        expect(screen.queryByRole('button', {name: 'Clear search'})).not.toBeInTheDocument();
    });

    test('clears the search immediately with the clear button', () => {
        const {onSearch, input} = renderSearch();
        typeKeystrokes(input, 'Sun');

        fireEvent.click(screen.getByRole('button', {name: 'Clear search'}));

        expect(input).toHaveValue('');
        expect(input).toHaveFocus();
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('');

        vi.advanceTimersByTime(SEARCH_DELAY_IN_MILLISECONDS);

        expect(onSearch).toHaveBeenCalledTimes(1);
    });

    test('clears the search immediately with the Escape key', () => {
        const {onSearch, input} = renderSearch();
        typeKeystrokes(input, 'Sun');

        fireEvent.keyDown(input, {key: 'Escape'});

        expect(input).toHaveValue('');
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('');

        vi.advanceTimersByTime(SEARCH_DELAY_IN_MILLISECONDS);

        expect(onSearch).toHaveBeenCalledTimes(1);
    });

    test('ignores the Escape key while the search field is empty', () => {
        const {onSearch, input} = renderSearch();

        fireEvent.keyDown(input, {key: 'Escape'});
        vi.advanceTimersByTime(SEARCH_DELAY_IN_MILLISECONDS);

        expect(onSearch).not.toHaveBeenCalled();
    });

    test('drops a pending search when unmounted', () => {
        const {onSearch, input, unmount} = renderSearch();
        typeKeystrokes(input, 'Sun');

        unmount();
        vi.advanceTimersByTime(SEARCH_DELAY_IN_MILLISECONDS);

        expect(onSearch).not.toHaveBeenCalled();
    });
});

const renderSearch = () => {
    const onSearch = vi.fn();
    const {unmount} = render(<PhotographTitleSearch onSearch={onSearch} />);
    const input = screen.getByRole('searchbox', {name: 'Search photographs by title'});

    return {onSearch, input, unmount};
};

/*
 * One change event per keystroke ('S', 'Su', 'Sun'), like a real user typing.
 * A single change to the full value would never restart the debounce timer.
 */
const typeKeystrokes = (input: HTMLElement, text: string): void => {
    for (let length = 1; length <= text.length; length++) {
        fireEvent.change(input, {target: {value: text.slice(0, length)}});
    }
};
