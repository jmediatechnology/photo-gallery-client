import * as React from "react";
import {
    createRectangle,
    findOverlappingUuids,
    type Point,
    type Rectangle,
    type RectangleWithUuid,
} from "../geometry/rectangle";

export const PHOTOGRAPH_UUID_ATTRIBUTE = 'data-photograph-uuid';

const LEFT_MOUSE_BUTTON = 0;

interface RectangularSelectionOptions {
    /**
     * Receives the uuids covered by the rubber band: an empty set on mousedown,
     * then the overlapping uuids as the drag moves. Pass a stable callback.
     */
    onSelectionChange: (uuids: Set<string>) => void;
}

interface RectangularSelection {
    containerRef: React.RefObject<HTMLDivElement | null>;
    selectionRectangle: Rectangle | null;
    isSelecting: boolean;
    onMouseDown: (event: React.MouseEvent<HTMLElement>) => void;
}

/**
 * The rubber-band gesture over a grid of photographs.
 *
 * Attach `containerRef` and `onMouseDown` to the selection surface and render
 * an absolutely positioned overlay from `selectionRectangle`. The hook does
 * not own the selection itself; it reports covered uuids via
 * `onSelectionChange`.
 *
 * All coordinates are expressed relative to the container's content box, which
 * makes them invariant under both page scroll and container scroll, and makes
 * them directly usable as the overlay's `left` / `top`.
 */
export const useRectangularSelection = (
    {onSelectionChange}: RectangularSelectionOptions
): RectangularSelection => {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const startPointRef = React.useRef<Point | null>(null);
    const latestPointRef = React.useRef<Point | null>(null);
    const photographRectanglesRef = React.useRef<RectangleWithUuid[]>([]);
    const animationFrameRef = React.useRef<number | null>(null);

    const [isSelecting, setIsSelecting] = React.useState(false);
    const [selectionRectangle, setSelectionRectangle] = React.useState<Rectangle | null>(null);

    const onMouseDown = React.useCallback((event: React.MouseEvent<HTMLElement>): void => {
        if (event.button !== LEFT_MOUSE_BUTTON) {
            return;
        }

        const container = containerRef.current;
        if (!container) {
            return;
        }

        if (isWithinPhotograph(event.target)) {
            return;
        }

        event.preventDefault();

        startPointRef.current = toContentPoint(container, event.clientX, event.clientY);
        latestPointRef.current = startPointRef.current;
        photographRectanglesRef.current = computePhotographRectangles(container);

        onSelectionChange(new Set());
        setSelectionRectangle(null);
        setIsSelecting(true);
    }, [onSelectionChange]);

    React.useEffect(() => {
        if (!isSelecting) {
            return;
        }

        const container = containerRef.current;
        if (!container) {
            return;
        }

        const applyLatestPoint = (): void => {
            animationFrameRef.current = null;

            const startPoint = startPointRef.current;
            const latestPoint = latestPointRef.current;
            if (!startPoint || !latestPoint) {
                return;
            }

            const rectangle = createRectangle(startPoint, latestPoint);
            setSelectionRectangle(rectangle);
            onSelectionChange(findOverlappingUuids(rectangle, photographRectanglesRef.current));
        };

        const handleMouseMove = (event: MouseEvent): void => {
            latestPointRef.current = toContentPoint(container, event.clientX, event.clientY);

            if (animationFrameRef.current !== null) {
                return;
            }

            animationFrameRef.current = window.requestAnimationFrame(applyLatestPoint);
        };

        const handleSelectionEnd = (): void => {
            setIsSelecting(false);
            setSelectionRectangle(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleSelectionEnd);
        window.addEventListener('blur', handleSelectionEnd);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleSelectionEnd);
            window.removeEventListener('blur', handleSelectionEnd);

            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [isSelecting, onSelectionChange]);

    return {
        containerRef,
        selectionRectangle,
        isSelecting,
        onMouseDown,
    };
};

const isWithinPhotograph = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return target.closest(`[${PHOTOGRAPH_UUID_ATTRIBUTE}]`) !== null;
};

/**
 * Converts viewport coordinates into container content-box coordinates.
 */
const toContentPoint = (container: HTMLElement, clientX: number, clientY: number): Point => {
    const containerRectangle = container.getBoundingClientRect();

    return {
        x: clientX - containerRectangle.left - container.clientLeft + container.scrollLeft,
        y: clientY - containerRectangle.top - container.clientTop + container.scrollTop,
    };
};

/**
 * Reads every photograph's geometry from the DOM and converts it into
 * container content-box coordinates.
 *
 * getBoundingClientRect() forces a synchronous reflow, so this runs once on
 * mousedown and never during mousemove. The result is held in a ref for the
 * duration of the drag.
 */
const computePhotographRectangles = (container: HTMLElement): RectangleWithUuid[] => {
    const containerRectangle = container.getBoundingClientRect();
    const offsetX = containerRectangle.left + container.clientLeft - container.scrollLeft;
    const offsetY = containerRectangle.top + container.clientTop - container.scrollTop;
    const elements = container.querySelectorAll<HTMLElement>(`[${PHOTOGRAPH_UUID_ATTRIBUTE}]`);

    return Array.from(elements).reduce<RectangleWithUuid[]>(
        (accumulator: RectangleWithUuid[], element: HTMLElement) => {
            const uuid = element.getAttribute(PHOTOGRAPH_UUID_ATTRIBUTE);
            if (!uuid) {
                return accumulator;
            }

            const elementRectangle = element.getBoundingClientRect();
            accumulator.push({
                uuid,
                left: elementRectangle.left - offsetX,
                top: elementRectangle.top - offsetY,
                right: elementRectangle.right - offsetX,
                bottom: elementRectangle.bottom - offsetY,
            });

            return accumulator;
        },
        []
    );
};
