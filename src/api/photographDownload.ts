import {api} from "./config.ts";
import type {PhotographDTO} from "../types";

/**
 * Mirrors DownloadQuery::MAX_PHOTOGRAPHS in photo-gallery-server, which is the real limit.
 * It keeps the download URL well under the server's request-line limit.
 */
export const MAX_PHOTOGRAPHS_PER_DOWNLOAD = 100;

/**
 * The download is a browser navigation, not an axios call: the browser streams the zip straight
 * to disk and shows its own progress, without holding the archive in memory.
 * A navigation cannot send an Authorization header, which is why this endpoint needs no token.
 */
export const createPhotographDownloadUrl = (photographs: PhotographDTO[]): string => {
    const uuids = photographs
        .map((photograph: PhotographDTO) => encodeURIComponent(photograph.uuid))
        .join(',');

    return `${api.url('/photographs/download')}?uuids=${uuids}`;
};
