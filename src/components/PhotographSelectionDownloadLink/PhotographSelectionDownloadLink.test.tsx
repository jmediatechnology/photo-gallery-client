import {render, screen} from "@testing-library/react";
import {describe, expect, test, vi} from "vitest";
import type {PhotographDTO} from "../../types";
import {MAX_PHOTOGRAPHS_PER_DOWNLOAD} from "../../api/photographDownload.ts";
import {PhotographSelectionDownloadLink} from "./PhotographSelectionDownloadLink.tsx";

vi.mock("../../api/config.ts", () => ({
    api: {
        url: (path: string) => `https://api.test${path}`,
    },
}));

const createPhotographs = (amount: number): PhotographDTO[] => {
    return Array.from({length: amount}, (_: unknown, index: number) => ({
        uuid: String(index + 1),
        title: `Photograph ${index + 1}`,
        filePath: `/images/${index + 1}.jpg`,
    }) as PhotographDTO);
};

describe('PhotographSelectionDownloadLink', () => {

    test('links to the download of the selected photographs', () => {
        render(<PhotographSelectionDownloadLink photographs={createPhotographs(2)} />);

        expect(screen.getByRole('link', {name: 'Download selected'}))
            .toHaveAttribute('href', 'https://api.test/photographs/download?uuids=1,2');
    });

    test('opens the download in a new tab, so an error page never replaces the gallery', () => {
        render(<PhotographSelectionDownloadLink photographs={createPhotographs(1)} />);

        const link = screen.getByRole('link', {name: 'Download selected'});
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener');
    });

    test('still offers the download at exactly the limit', () => {
        render(<PhotographSelectionDownloadLink photographs={createPhotographs(MAX_PHOTOGRAPHS_PER_DOWNLOAD)} />);

        expect(screen.getByRole('link', {name: 'Download selected'})).toBeInTheDocument();
    });

    test('asks for a smaller selection above the limit instead of cutting it', () => {
        render(<PhotographSelectionDownloadLink photographs={createPhotographs(MAX_PHOTOGRAPHS_PER_DOWNLOAD + 1)} />);

        expect(screen.queryByRole('link', {name: 'Download selected'})).not.toBeInTheDocument();
        expect(screen.getByText('Select at most 100 photographs to download')).toBeInTheDocument();
    });
});
