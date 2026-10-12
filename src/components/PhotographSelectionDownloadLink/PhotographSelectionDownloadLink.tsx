import './PhotographSelectionDownloadLink.css';
import {FaDownload} from "react-icons/fa";
import type {PhotographDTO} from "../../types";
import {createPhotographDownloadUrl, MAX_PHOTOGRAPHS_PER_DOWNLOAD} from "../../api/photographDownload.ts";

interface PhotographSelectionDownloadLinkProps {
    photographs: PhotographDTO[],
}

/*
 * Opens the download in a new tab. A successful download closes that tab by itself; an error
 * (too many downloads, server busy) shows there instead of replacing the gallery and losing the selection.
 *
 * Above the limit the selection is never cut silently: the visitor is told to select fewer photographs.
 */
export const PhotographSelectionDownloadLink = ({photographs}: PhotographSelectionDownloadLinkProps) => {
    if (photographs.length > MAX_PHOTOGRAPHS_PER_DOWNLOAD) {
        return (
            <span className="navbar-action photograph-selection-download-unavailable">
                <FaDownload /> Select at most {MAX_PHOTOGRAPHS_PER_DOWNLOAD} photographs to download
            </span>
        );
    }

    return (
        <a
            href={createPhotographDownloadUrl(photographs)}
            target="_blank"
            rel="noopener"
            className="navbar-action"
        >
            <FaDownload /> Download selected
        </a>
    );
};
