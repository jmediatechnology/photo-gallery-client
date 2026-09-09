import { useEffect, useState } from "react";
import type { PhotographDTO } from "../types";
import { CircularArray } from "../data-structures/CircularArray.ts";

const SLIDESHOW_INTERVAL_MS = 5000;

export const useSlideShow = (
    photographs: CircularArray<PhotographDTO>,
    offset: number,
    onSelect: (photograph: PhotographDTO) => void,
) => {
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (!isPlaying) return;

        const timer = setTimeout(() => {
            const next = photographs.getNext(offset);
            if (next) onSelect(next);
        }, SLIDESHOW_INTERVAL_MS);

        return () => clearTimeout(timer);
    }, [isPlaying, offset, photographs, onSelect]);

    const toggleSlideshow = () => setIsPlaying((playing) => !playing);

    return { isPlaying, toggleSlideshow };
};
