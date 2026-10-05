import {act, renderHook, waitFor} from "@testing-library/react";
import * as React from "react";
import {afterEach, describe, expect, test, vi, type Mock} from "vitest";
import type {PhotographDTO} from "../types";
import {getPhotographs} from "../api/client.ts";
import {CircularArray} from "../data-structures/CircularArray.ts";
import {PhotographProvider, usePhotographs} from "./PhotographContext.tsx";
import {DEFAULT_PHOTOGRAPH_SORT, type PhotographSort} from "../types/PhotographSort.ts";

vi.mock("../api/client.ts", () => ({
    getPhotographs: vi.fn<() => void>(),
}));

const mockedGetPhotographs = getPhotographs as Mock;

const SUNSET = {uuid: '1', title: 'Sunset', description: '', filePath: '/sunset.jpg'} as PhotographDTO;
const NIGHT = {uuid: '2', title: 'Night', description: '', filePath: '/night.jpg'} as PhotographDTO;
const MORNING = {uuid: '3', title: 'Morning', description: '', filePath: '/morning.jpg'} as PhotographDTO;
const DUSK = {uuid: '4', title: 'Dusk', description: '', filePath: '/dusk.jpg'} as PhotographDTO;

const TITLE_ASCENDING: PhotographSort = {field: 'title', direction: 'asc'};

describe('PhotographContext', () => {

    afterEach(() => {
        vi.clearAllMocks();
    });

    test('is loading until the photographs arrive', () => {
        mockedGetPhotographs.mockReturnValue(new Promise(() => undefined));

        const {result} = renderPhotographs();

        expect(result.current.isLoading).toBe(true);
        expect(result.current.photographs).toHaveLength(0);
        expect(result.current.error).toBe('');
    });

    test('loads the photographs into a CircularArray', async () => {
        mockedGetPhotographs.mockResolvedValue([SUNSET, NIGHT]);

        const {result} = renderPhotographs();

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.photographs).toBeInstanceOf(CircularArray);
        expect(Array.from(result.current.photographs)).toEqual([SUNSET, NIGHT]);
        expect(result.current.error).toBe('');
    });

    test('shows the error when the photographs cannot be loaded', async () => {
        mockedGetPhotographs.mockRejectedValue(new Error('Network error'));

        const {result} = renderPhotographs();

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.error).toBe('Network error');
        expect(result.current.photographs).toHaveLength(0);
    });

    test('removePhotograph removes the photograph with the given uuid', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT, MORNING]);

        act(() => result.current.removePhotograph('2'));

        expect(Array.from(result.current.photographs)).toEqual([SUNSET, MORNING]);
    });

    /*
     * Guards against a regression: when removePhotograph built the new array
     * from the photographs captured at render time, deletions made before the
     * next render overwrote each other and only the last one survived.
     */
    test('removes every photograph when several deletions finish at the same time', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT, MORNING, DUSK]);

        act(() => {
            result.current.removePhotograph('1');
            result.current.removePhotograph('2');
            result.current.removePhotograph('4');
        });

        expect(Array.from(result.current.photographs)).toEqual([MORNING]);
    });

    test('usePhotographs throws outside its provider', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        expect(() => renderHook(() => usePhotographs())).toThrow(
            'usePhotographs must be used inside PhotographProvider'
        );
    });

    test('loads all photographs initially without a title filter', async () => {
        await renderLoadedPhotographs([SUNSET, NIGHT]);

        expect(mockedGetPhotographs).toHaveBeenCalledWith({title: '', sort: DEFAULT_PHOTOGRAPH_SORT, signal: expect.any(AbortSignal)});
    });

    test('searchPhotographsByTitle loads the matching photographs', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT]);
        mockedGetPhotographs.mockResolvedValue([SUNSET]);

        act(() => result.current.searchPhotographsByTitle('Sun'));

        await waitFor(() => expect(Array.from(result.current.photographs)).toEqual([SUNSET]));
        expect(mockedGetPhotographs).toHaveBeenLastCalledWith({title: 'Sun', sort: DEFAULT_PHOTOGRAPH_SORT, signal: expect.any(AbortSignal)});
    });

    test('keeps showing the photographs while a search is loading', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT]);
        mockedGetPhotographs.mockReturnValue(new Promise(() => undefined));

        act(() => result.current.searchPhotographsByTitle('Sun'));

        expect(result.current.isLoading).toBe(false);
        expect(Array.from(result.current.photographs)).toEqual([SUNSET, NIGHT]);
    });

    test('ignores the response of a superseded search', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT]);
        const sunSearch = createDeferred<PhotographDTO[]>();
        const nightSearch = createDeferred<PhotographDTO[]>();
        mockedGetPhotographs
            .mockReturnValueOnce(sunSearch.promise)
            .mockReturnValueOnce(nightSearch.promise);

        act(() => result.current.searchPhotographsByTitle('Sun'));
        act(() => result.current.searchPhotographsByTitle('Night'));
        await act(async () => nightSearch.resolve([NIGHT]));
        await act(async () => sunSearch.resolve([SUNSET]));

        expect(Array.from(result.current.photographs)).toEqual([NIGHT]);
        expect(mockedGetPhotographs.mock.calls[1][0].signal.aborted).toBe(true);
    });

    test('shows no error when a superseded search fails', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT]);
        const sunSearch = createDeferred<PhotographDTO[]>();
        mockedGetPhotographs
            .mockReturnValueOnce(sunSearch.promise)
            .mockResolvedValueOnce([NIGHT]);

        act(() => result.current.searchPhotographsByTitle('Sun'));
        act(() => result.current.searchPhotographsByTitle('Night'));
        await act(async () => sunSearch.reject(new Error('canceled')));

        await waitFor(() => expect(Array.from(result.current.photographs)).toEqual([NIGHT]));
        expect(result.current.error).toBe('');
    });

    test('does not search again for the same trimmed title', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT]);
        mockedGetPhotographs.mockResolvedValue([SUNSET]);

        act(() => result.current.searchPhotographsByTitle('Sun'));
        await waitFor(() => expect(Array.from(result.current.photographs)).toEqual([SUNSET]));
        act(() => result.current.searchPhotographsByTitle('  Sun  '));

        expect(mockedGetPhotographs).toHaveBeenCalledTimes(2);
    });

    test('clears the error once a search succeeds', async () => {
        mockedGetPhotographs.mockRejectedValueOnce(new Error('Network error'));
        const {result} = renderPhotographs();
        await waitFor(() => expect(result.current.error).toBe('Network error'));
        mockedGetPhotographs.mockResolvedValue([SUNSET]);

        act(() => result.current.searchPhotographsByTitle('Sun'));

        await waitFor(() => expect(result.current.error).toBe(''));
        expect(Array.from(result.current.photographs)).toEqual([SUNSET]);
    });
    test('sorts by newest first by default', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT]);

        expect(result.current.sort).toEqual({field: 'createdAt', direction: 'desc'});
    });

    test('sortPhotographs loads the photographs in the new order', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT]);
        mockedGetPhotographs.mockResolvedValue([NIGHT, SUNSET]);

        act(() => result.current.sortPhotographs(TITLE_ASCENDING));

        await waitFor(() => expect(Array.from(result.current.photographs)).toEqual([NIGHT, SUNSET]));
        expect(result.current.sort).toEqual(TITLE_ASCENDING);
        expect(mockedGetPhotographs).toHaveBeenLastCalledWith({title: '', sort: TITLE_ASCENDING, signal: expect.any(AbortSignal)});
    });

    test('a title search keeps the chosen sort', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT]);
        act(() => result.current.sortPhotographs(TITLE_ASCENDING));

        act(() => result.current.searchPhotographsByTitle('Sun'));

        await waitFor(() => expect(mockedGetPhotographs).toHaveBeenLastCalledWith(
            {title: 'Sun', sort: TITLE_ASCENDING, signal: expect.any(AbortSignal)}
        ));
    });

    test('changing the sort keeps the title search', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT]);
        act(() => result.current.searchPhotographsByTitle('Sun'));

        act(() => result.current.sortPhotographs(TITLE_ASCENDING));

        await waitFor(() => expect(mockedGetPhotographs).toHaveBeenLastCalledWith(
            {title: 'Sun', sort: TITLE_ASCENDING, signal: expect.any(AbortSignal)}
        ));
    });

    test('does not load again when the same sort is chosen', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT]);

        act(() => result.current.sortPhotographs({field: 'createdAt', direction: 'desc'}));

        expect(mockedGetPhotographs).toHaveBeenCalledTimes(1);
    });

    test('keeps showing the photographs while a new sort is loading', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT]);
        mockedGetPhotographs.mockReturnValue(new Promise(() => undefined));

        act(() => result.current.sortPhotographs(TITLE_ASCENDING));

        expect(result.current.isLoading).toBe(false);
        expect(Array.from(result.current.photographs)).toEqual([SUNSET, NIGHT]);
    });

    test('refreshPhotographs loads again with the current title search and sort', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT]);
        act(() => result.current.searchPhotographsByTitle('Sun'));
        act(() => result.current.sortPhotographs(TITLE_ASCENDING));
        await waitFor(() => expect(mockedGetPhotographs).toHaveBeenCalledTimes(3));
        mockedGetPhotographs.mockResolvedValue([MORNING, SUNSET]);

        act(() => result.current.refreshPhotographs());

        await waitFor(() => expect(Array.from(result.current.photographs)).toEqual([MORNING, SUNSET]));
        expect(mockedGetPhotographs).toHaveBeenCalledTimes(4);
        expect(mockedGetPhotographs).toHaveBeenLastCalledWith({title: 'Sun', sort: TITLE_ASCENDING, signal: expect.any(AbortSignal)});
    });

    test('refreshPhotographs does not show the loading state', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT]);
        mockedGetPhotographs.mockReturnValue(new Promise(() => undefined));

        act(() => result.current.refreshPhotographs());

        expect(result.current.isLoading).toBe(false);
        expect(Array.from(result.current.photographs)).toEqual([SUNSET, NIGHT]);
    });
});

const renderPhotographs = () => {
    return renderHook(() => usePhotographs(), {
        wrapper: ({children}: {children: React.ReactNode}) => (
            <PhotographProvider>{children}</PhotographProvider>
        ),
    });
};

const renderLoadedPhotographs = async (photographs: PhotographDTO[]) => {
    mockedGetPhotographs.mockResolvedValue(photographs);
    const rendered = renderPhotographs();
    await waitFor(() => expect(rendered.result.current.isLoading).toBe(false));
    return rendered;
};

const createDeferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });

    return {promise, resolve, reject};
};
