import {fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, test, vi} from "vitest";
import {ThumbnailFooter} from "./ThumbnailFooter.tsx";
import {CircularArray} from "../../data-structures/CircularArray.ts";
import type {PhotographDTO} from "../../types";

vi.mock("../../api/config.ts", () => ({
    api: {
        url: (path: string) => `https://test.com${path}`
    }
}));

const TITLES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India'];

const createPhotograph = (title: string, index: number): PhotographDTO => ({
    uuid: String(index + 1),
    title,
    description: `Description of ${title}`,
    filePath: `/images/${title.toLowerCase()}.jpg`,
    createdAt: `2025-10-0${index + 1} 0${index + 1}:00:00`,
    updatedAt: `2025-10-0${index + 1} 0${index + 1}:00:00`,
});

const NINE_PHOTOGRAPHS: CircularArray<PhotographDTO> = CircularArray.from(TITLES.map(createPhotograph));

const onSelect = vi.fn<(photograph: PhotographDTO) => void>();

describe('ThumbnailFooter', () => {

    afterEach(() => {
        vi.clearAllMocks();
    });

    test('renders thumbnail footer div', () => {
        renderThumbnailFooter(NINE_PHOTOGRAPHS, 0);

        expect(screen.getByTestId('thumbnail-footer')).toBeInTheDocument();
    });

    describe('window of seven thumbnails around the current photograph', () => {
        test.each([
            ['in the middle', 3, ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf']],
            ['in the middle, slid one to the right', 4, ['Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel']],
            ['at the first photograph, wrapping to the end', 0, ['Golf', 'Hotel', 'India', 'Alpha', 'Bravo', 'Charlie', 'Delta']],
            ['at the second photograph, wrapping to the end', 1, ['Hotel', 'India', 'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo']],
            ['at the last photograph, wrapping to the start', 8, ['Foxtrot', 'Golf', 'Hotel', 'India', 'Alpha', 'Bravo', 'Charlie']],
        ])('shows the right thumbnails %s', (_: string, offset: number, expectedTitles: string[]) => {
            renderThumbnailFooter(NINE_PHOTOGRAPHS, offset);

            expect(thumbnailTitles()).toEqual(expectedTitles);
        });
    });

    describe('fewer photographs than the window', () => {
        test('shows every photograph once', () => {
            const threePhotographs = CircularArray.from(TITLES.slice(0, 3).map(createPhotograph));

            renderThumbnailFooter(threePhotographs, 0);

            expect(thumbnailTitles()).toHaveLength(3);
            expect(new Set(thumbnailTitles())).toEqual(new Set(['Alpha', 'Bravo', 'Charlie']));
        });

        test('shows no thumbnails when there are no photographs', () => {
            renderThumbnailFooter(CircularArray.from([] as PhotographDTO[]), 0);

            expect(screen.getByTestId('thumbnail-footer')).toBeEmptyDOMElement();
        });
    });

    describe('thumbnails', () => {
        test('load the photograph file lazily', () => {
            renderThumbnailFooter(NINE_PHOTOGRAPHS, 3);

            const thumbnail = screen.getByRole('img', {name: 'Delta'});
            expect(thumbnail).toHaveAttribute('src', 'https://test.com/images/delta.jpg');
            expect(thumbnail).toHaveAttribute('loading', 'lazy');
        });

        test('select their photograph when clicked', () => {
            renderThumbnailFooter(NINE_PHOTOGRAPHS, 3);

            fireEvent.click(screen.getByRole('img', {name: 'Bravo'}));

            expect(onSelect).toHaveBeenCalledExactlyOnceWith(NINE_PHOTOGRAPHS[1]);
        });
    });
});

const renderThumbnailFooter = (photographs: CircularArray<PhotographDTO>, offset: number) => {
    return render(<ThumbnailFooter photographs={photographs} offset={offset} onSelect={onSelect}/>);
};

const thumbnailTitles = (): string[] => {
    return screen.queryAllByRole('img').map((thumbnail: HTMLElement) => thumbnail.getAttribute('alt') ?? '');
};
