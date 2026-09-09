import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSlideShow } from './useSlideShow.tsx';
import type { PhotographDTO } from '../types';
import type { CircularArray } from '../data-structures/CircularArray.ts';

const createPhotographDTO = (uuid: string, title: string): PhotographDTO => ({
    uuid: uuid,
    filePath: `/images/${uuid}.jpg`,
    title: title,
    description: '',
    createdAt: '',
    updatedAt: '',
});

const createPhotographs = (nextPhoto: PhotographDTO | undefined): CircularArray<PhotographDTO> => {
    return {
        getNext: vi.fn().mockReturnValue(nextPhoto),
    } as unknown as CircularArray<PhotographDTO>;
};

const mockedPhotographDTO = createPhotographDTO(
    'ea0411aa-b170-4a8b-a9f9-508521aa51b9',
    'mocked photo'
);

describe('useSlideShow', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('starts paused', () => {
        const onSelect = vi.fn();
        const { result } = renderHook(() => useSlideShow(createPhotographs(mockedPhotographDTO), 0, onSelect));

        expect(result.current.isPlaying).toBe(false);

        // isPlaying starts false, so setTimeout was never called in the first place.
        expect(vi.getTimerCount()).toBe(0);
    });

    it('toggleSlideshow flips isPlaying on and off', () => {
        const onSelect = vi.fn();
        const { result } = renderHook(() => useSlideShow(createPhotographs(mockedPhotographDTO), 0, onSelect));

        act(() => result.current.toggleSlideshow());
        expect(result.current.isPlaying).toBe(true);

        act(() => result.current.toggleSlideshow());
        expect(result.current.isPlaying).toBe(false);
    });

    it('calls onSelect with the next photograph exactly 5 seconds after starting', () => {
        const onSelect = vi.fn();
        const photographs = createPhotographs(mockedPhotographDTO);
        const { result } = renderHook(() => useSlideShow(photographs, 0, onSelect));

        act(() => result.current.toggleSlideshow());

        act(() => vi.advanceTimersByTime(4999));
        expect(onSelect).not.toHaveBeenCalled();

        act(() => vi.advanceTimersByTime(1));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(mockedPhotographDTO);
        expect(photographs.getNext).toHaveBeenCalledWith(0);
    });

    it('stops advancing once toggled off before the 5s mark', () => {
        const onSelect = vi.fn();
        const { result } = renderHook(() => useSlideShow(createPhotographs(mockedPhotographDTO), 0, onSelect));

        act(() => result.current.toggleSlideshow()); // on
        act(() => vi.advanceTimersByTime(2000));
        act(() => result.current.toggleSlideshow()); // off before firing
        act(() => vi.advanceTimersByTime(10000));

        expect(onSelect).not.toHaveBeenCalled();
    });

    it('restarts the 5s countdown when offset changes while playing (e.g. a manual thumbnail click)', () => {
        const onSelect = vi.fn();
        const photographs = createPhotographs(mockedPhotographDTO);
        const { result, rerender } = renderHook(
            ({ offset }) => useSlideShow(photographs, offset, onSelect),
            { initialProps: { offset: 0 } },
        );

        act(() => result.current.toggleSlideshow());
        act(() => vi.advanceTimersByTime(4000)); // not yet fired

        rerender({ offset: 1 }); // simulates the user clicking a thumbnail

        act(() => vi.advanceTimersByTime(4000)); // 8s total, but only 4s since the restart
        expect(onSelect).not.toHaveBeenCalled();

        act(() => vi.advanceTimersByTime(1000)); // now 5s since the restart
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(photographs.getNext).toHaveBeenCalledWith(1);
    });

    it('clears the pending timer on unmount', () => {
        const onSelect = vi.fn();
        const { result, unmount } = renderHook(() => useSlideShow(createPhotographs(mockedPhotographDTO), 0, onSelect));

        act(() => result.current.toggleSlideshow());
        unmount();

        act(() => vi.advanceTimersByTime(10000));
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('does not call onSelect when there is no next photograph', () => {
        const onSelect = vi.fn();
        const { result } = renderHook(() => useSlideShow(createPhotographs(undefined), 0, onSelect));

        act(() => result.current.toggleSlideshow());
        act(() => vi.advanceTimersByTime(5000));

        expect(onSelect).not.toHaveBeenCalled();
    });
});
