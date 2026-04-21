import './ThumbnailFooter.css'
import type {PhotographDTO} from "../../types";
import {api} from "../../api/config.ts";
import {CircularArray} from "../../data-structures/CircularArray.ts";
import React from "react";


interface ThumbnailFooterProps {
    photographs: CircularArray<PhotographDTO>,
    offset: number,
    onSelect: (photograph: PhotographDTO) => void,
}

export const ThumbnailFooter = ({ photographs, offset, onSelect }: ThumbnailFooterProps) => {

    const prev2: PhotographDTO|undefined = photographs.getPrev(offset - 2);
    const prev1: PhotographDTO|undefined = photographs.getPrev(offset - 1);
    const prev: PhotographDTO|undefined = photographs.getPrev(offset);
    const current: PhotographDTO|undefined = photographs.at(offset);
    const next: PhotographDTO|undefined = photographs.getNext(offset);
    const next1: PhotographDTO|undefined = photographs.getNext(offset + 1);
    const next2: PhotographDTO|undefined = photographs.getNext(offset + 2);

    const photographsForThumbnailFooter: CircularArray<PhotographDTO | undefined> = CircularArray.from([
        prev2,
        prev1,
        prev,
        current,
        next,
        next1,
        next2,
    ]);

    return (
        <div data-testid="thumbnail-footer" className='modal-footer'>
            {photographsForThumbnailFooter.uniq().map((photograph: PhotographDTO | undefined, index): React.ReactElement | null => {
                if (photograph === undefined) {
                    return null;
                }

                return <img
                    key={index}
                    src={api.url(photograph.filePath ?? '')}
                    alt={photograph.title}
                    loading="lazy"
                    onClick={() => onSelect(photograph)}
                />;
            })}
        </div>
    );
};
