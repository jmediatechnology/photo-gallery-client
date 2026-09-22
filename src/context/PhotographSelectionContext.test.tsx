import {act, renderHook} from "@testing-library/react";
import * as React from "react";
import {afterEach, beforeEach, describe, expect, test, vi, type Mock} from "vitest";
import type {PhotographDTO} from "../types";
import {usePhotographs} from "./PhotographContext.tsx";
import {PhotographSelectionProvider, usePhotographSelection} from "./PhotographSelectionContext.tsx";

vi.mock("./PhotographContext.tsx", () => ({
    usePhotographs: vi.fn(),
}));

const mockedUsePhotographs = usePhotographs as Mock;

const SUNSET = {uuid: '1', title: 'Sunset', description: '', filePath: '/sunset.jpg'} as PhotographDTO;
const NIGHT = {uuid: '2', title: 'Night', description: '', filePath: '/night.jpg'} as PhotographDTO;
const MORNING = {uuid: '3', title: 'Morning', description: '', filePath: '/morning.jpg'} as PhotographDTO;

describe('PhotographSelectionContext', () => {

    beforeEach(() => {
        mockedUsePhotographs.mockReturnValue({photographs: [SUNSET, NIGHT, MORNING]});
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test('starts with an empty selection', () => {
        const {result} = renderSelection();

        expect(result.current.selectedPhotographUuids.size).toBe(0);
        expect(result.current.selectedPhotographs).toEqual([]);
    });

    test('replaceSelection selects photographs in gallery order', async () => {
        const {result} = renderSelection();

        await act(async () => result.current.replaceSelection(new Set(['3', '1'])));

        expect(result.current.selectedPhotographs).toEqual([SUNSET, MORNING]);
    });

    test('replaceSelection keeps the current set when the contents are equal', async () => {
        const {result} = renderSelection();
        await act(async () => result.current.replaceSelection(new Set(['1', '2'])));
        const currentSelection = result.current.selectedPhotographUuids;

        await act(async () => result.current.replaceSelection(new Set(['2', '1'])));

        expect(result.current.selectedPhotographUuids).toBe(currentSelection);
    });

    test('replaceSelection replaces the set when the contents differ', async () => {
        const {result} = renderSelection();
        await act(async () => result.current.replaceSelection(new Set(['1', '2'])));

        await act(async () => result.current.replaceSelection(new Set(['2', '3'])));

        expect(result.current.selectedPhotographs).toEqual([NIGHT, MORNING]);
    });

    test('deselectPhotograph removes one photograph from the selection', async () => {
        const {result} = renderSelection();
        await act(async () => result.current.replaceSelection(new Set(['1', '2'])));

        await act(async () => result.current.deselectPhotograph('1'));

        expect(result.current.selectedPhotographs).toEqual([NIGHT]);
    });

    test('deselectPhotograph keeps the current set for a photograph that is not selected', async () => {
        const {result} = renderSelection();
        await act(async () => result.current.replaceSelection(new Set(['1'])));
        const currentSelection = result.current.selectedPhotographUuids;

        await act(async () => result.current.deselectPhotograph('3'));

        expect(result.current.selectedPhotographUuids).toBe(currentSelection);
    });

    test('clearSelection empties the selection', async () => {
        const {result} = renderSelection();
        await act(async () => result.current.replaceSelection(new Set(['1', '2'])));

        await act(async () => result.current.clearSelection());

        expect(result.current.selectedPhotographs).toEqual([]);
    });

    test('clearSelection keeps the current set when the selection is already empty', async () => {
        const {result} = renderSelection();
        const currentSelection = result.current.selectedPhotographUuids;

        await act(async () => result.current.clearSelection());

        expect(result.current.selectedPhotographUuids).toBe(currentSelection);
    });

    test('selectedPhotographs leaves out photographs that no longer exist', async () => {
        const {result, rerender} = renderSelection();
        await act(async () => result.current.replaceSelection(new Set(['1', '2'])));

        mockedUsePhotographs.mockReturnValue({photographs: [NIGHT, MORNING]});
        rerender();

        expect(result.current.selectedPhotographs).toEqual([NIGHT]);
    });

    test('usePhotographSelection throws outside its provider', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        expect(() => renderHook(() => usePhotographSelection())).toThrow(
            'usePhotographSelection must be used inside PhotographSelectionProvider'
        );
    });
});

const renderSelection = () => {
    return renderHook(() => usePhotographSelection(), {
        wrapper: ({children}: {children: React.ReactNode}) => (
            <PhotographSelectionProvider>{children}</PhotographSelectionProvider>
        ),
    });
};
