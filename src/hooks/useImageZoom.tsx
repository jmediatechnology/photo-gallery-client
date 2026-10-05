import {useRef, useState, useEffect, useCallback, type RefObject, type CSSProperties, type MouseEvent} from 'react';

interface UseImageZoomOptions {
    minScale?: number;
    maxScale?: number;
    sensitivity?: number;
    resetKey?: string|number;
}

export interface UseImageZoomResult {
    containerRef: RefObject<HTMLDivElement|null>;
    containerProps: {
        onMouseMove: (e: MouseEvent) => void;
        style: CSSProperties;
    };
    imageStyle: CSSProperties;
}

type coordinatesType = {
    x: number;
    y: number;
};

const DEFAULT_TRANSFORM_ORIGIN: coordinatesType = { x: 50, y: 50 };

export function useImageZoom({
                                 minScale = 1,
                                 maxScale = 5,
                                 sensitivity = 0.0015,
                                 resetKey,
                             }: UseImageZoomOptions = {}): UseImageZoomResult {
    const containerRef: RefObject<HTMLDivElement|null> = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState<number>(minScale);
    const [transformOriginCoordinates, setTransformOriginCoordinates] = useState<coordinatesType>(DEFAULT_TRANSFORM_ORIGIN);

    const clamp = useCallback(
        (value: number) => Math.min(Math.max(value, minScale), maxScale),
        [minScale, maxScale]
    );

    const reset = useCallback(() => {
        setScale(minScale);
        setTransformOriginCoordinates(DEFAULT_TRANSFORM_ORIGIN);
    }, [minScale]);

    useEffect(() => {
        reset();
    }, [resetKey, reset]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();

            setScale((prevScale) => {
                const nextScale = clamp(prevScale - e.deltaY * sensitivity);
                if (nextScale !== minScale) {
                    setTransformOriginCoordinates(convertMouseClientCoordinatesToOriginXYOffsetPercentages(el, e.clientX, e.clientY));
                }

                return nextScale;
            });
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [clamp, sensitivity, minScale]);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (scale === minScale) return;
            setTransformOriginCoordinates(convertMouseClientCoordinatesToOriginXYOffsetPercentages(e.currentTarget, e.clientX, e.clientY));
        },
        [scale, minScale]
    );

    return {
        containerRef,
        containerProps: {
            onMouseMove: handleMouseMove,
            style: {
                cursor: scale >= maxScale ? 'zoom-out' : 'zoom-in',
            },
        },
        imageStyle: {
            transform: `scale(${scale})`,
            transformOrigin: `${transformOriginCoordinates.x}% ${transformOriginCoordinates.y}%`,
            transition: scale === minScale ? 'transform 0.2s ease-out' : 'none',
        },
    };
}

/*
 * Takes the element the event was registered on instead of reading
 * containerRef: both callers already hold that element, so there is no
 * "container not attached" case to handle here.
 */
const convertMouseClientCoordinatesToOriginXYOffsetPercentages = (
    container: Element,
    clientX: number,
    clientY: number
): coordinatesType => {
    const rect: DOMRect = container.getBoundingClientRect();

    return {
        x: ((clientX - rect.left) / rect.width) * 100,
        y: ((clientY - rect.top) / rect.height) * 100,
    };
};
