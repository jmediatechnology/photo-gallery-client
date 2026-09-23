import {act, renderHook, waitFor} from "@testing-library/react";
import * as React from "react";
import {afterEach, describe, expect, test, vi, type Mock} from "vitest";
import type {PhotographDTO} from "../types";
import {getPhotographs} from "../api/client.ts";
import {CircularArray} from "../data-structures/CircularArray.ts";
import {PhotographProvider, usePhotographs} from "./PhotographContext.tsx";

vi.mock("../api/client.ts", () => ({
    getPhotographs: vi.fn(),
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
