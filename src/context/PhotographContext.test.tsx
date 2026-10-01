import {act, renderHook, waitFor} from "@testing-library/react";
import * as React from "react";
import {afterEach, describe, expect, test, vi, type Mock} from "vitest";
import type {PhotographDTO} from "../types";
import {getPhotographs} from "../api/client.ts";
import {CircularArray} from "../data-structures/CircularArray.ts";
import {PhotographProvider, usePhotographs} from "./PhotographContext.tsx";

vi.mock("../api/client.ts", () => ({
    getPhotographs: vi.fn<() => void>(),
}));

const mockedGetPhotographs = getPhotographs as Mock;

const SUNSET = {uuid: '1', title: 'Sunset', description: '', filePath: '/sunset.jpg'} as PhotographDTO;
const NIGHT = {uuid: '2', title: 'Night', description: '', filePath: '/night.jpg'} as PhotographDTO;
const MORNING = {uuid: '3', title: 'Morning', description: '', filePath: '/morning.jpg'} as PhotographDTO;
const DUSK = {uuid: '4', title: 'Dusk', description: '', filePath: '/dusk.jpg'} as PhotographDTO;

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

    test('addPhotograph puts the new photograph first', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT]);

        act(() => result.current.addPhotograph(MORNING));

        expect(Array.from(result.current.photographs)).toEqual([MORNING, SUNSET, NIGHT]);
    });

    test('editPhotograph replaces the photograph with the same uuid and keeps the order', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT, MORNING]);
        const editedNight = {...NIGHT, title: 'Starry night'};

        act(() => result.current.editPhotograph(editedNight));

        expect(Array.from(result.current.photographs)).toEqual([SUNSET, editedNight, MORNING]);
    });

    test('editPhotograph leaves the photographs untouched for an unknown uuid', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT]);

        act(() => result.current.editPhotograph(DUSK));

        expect(Array.from(result.current.photographs)).toEqual([SUNSET, NIGHT]);
    });

    test('removePhotograph removes the photograph with the given uuid', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT, MORNING]);

        act(() => result.current.removePhotograph('2'));

        expect(Array.from(result.current.photographs)).toEqual([SUNSET, MORNING]);
    });

    /*
     * The next two tests guard against a regression: when these functions
     * built the new array from the photographs captured at render time,
     * updates made before the next render overwrote each other and only
     * the last one survived.
     */
    test('keeps every photograph when several uploads finish at the same time', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET]);

        act(() => {
            result.current.addPhotograph(NIGHT);
            result.current.addPhotograph(MORNING);
            result.current.addPhotograph(DUSK);
        });

        expect(Array.from(result.current.photographs)).toEqual([DUSK, MORNING, NIGHT, SUNSET]);
    });

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

        expect(mockedGetPhotographs).toHaveBeenCalledWith({title: '', signal: expect.any(AbortSignal)});
    });

    test('searchPhotographsByTitle loads the matching photographs', async () => {
        const {result} = await renderLoadedPhotographs([SUNSET, NIGHT]);
        mockedGetPhotographs.mockResolvedValue([SUNSET]);

        act(() => result.current.searchPhotographsByTitle('Sun'));

        await waitFor(() => expect(Array.from(result.current.photographs)).toEqual([SUNSET]));
        expect(mockedGetPhotographs).toHaveBeenLastCalledWith({title: 'Sun', signal: expect.any(AbortSignal)});
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
