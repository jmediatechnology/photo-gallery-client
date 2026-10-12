import {describe, expect, test, vi} from "vitest";
import type {PhotographDTO} from "../types";
import {createPhotographDownloadUrl} from "./photographDownload.ts";

vi.mock("./config.ts", () => ({
    api: {
        url: (path: string) => `https://api.test${path}`,
    },
}));

const SUNSET = {uuid: '5c3f0e4e-8d2b-4b8e-9a51-2f6a7d1c9e01', title: 'Sunset', filePath: '/sunset.jpg'} as PhotographDTO;
const NIGHT = {uuid: '7a1d2c3b-4e5f-4a6b-8c7d-9e0f1a2b3c02', title: 'Night', filePath: '/night.jpg'} as PhotographDTO;

describe('createPhotographDownloadUrl', () => {

    test('lists the photograph uuids, comma separated, in the uuids parameter', () => {
        expect(createPhotographDownloadUrl([SUNSET, NIGHT])).toBe(
            'https://api.test/photographs/download?uuids=5c3f0e4e-8d2b-4b8e-9a51-2f6a7d1c9e01,7a1d2c3b-4e5f-4a6b-8c7d-9e0f1a2b3c02'
        );
    });

    test('encodes each uuid, so an unexpected value cannot add query parameters', () => {
        const unexpected = {...SUNSET, uuid: 'a&uuids=b'};

        expect(createPhotographDownloadUrl([unexpected])).toBe('https://api.test/photographs/download?uuids=a%26uuids%3Db');
    });
});
