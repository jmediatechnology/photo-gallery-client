import type { WithUuid } from "../types/WithUuid";

export interface Point {
    x: number;
    y: number;
}

export interface Rectangle {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export type RectangleWithUuid = WithUuid<Rectangle>;

/**
 * Builds a normalised rectangle from two points, so dragging up-left produces
 * the same rectangle as dragging down-right.
 */
export const createRectangle = (start: Point, end: Point): Rectangle => {
    return {
        left: Math.min(start.x, end.x),
        top: Math.min(start.y, end.y),
        right: Math.max(start.x, end.x),
        bottom: Math.max(start.y, end.y),
    };
};

/**
 * True when the two rectangles share actual area.
 *
 * Touching edges do NOT count as overlapping, which means a zero-area
 * rectangle (a plain click) never selects anything.
 */
export const doRectanglesOverlap = (a: Rectangle, b: Rectangle): boolean => {
    const overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);

    return overlapWidth > 0 && overlapHeight > 0;
};

export const findOverlappingUuids = (
    selection: Rectangle,
    rectangles: RectangleWithUuid[]
): Set<string> => {
    return rectangles.reduce<Set<string>>(
        (accumulator: Set<string>, rectangle: RectangleWithUuid) => {
            if (doRectanglesOverlap(selection, rectangle)) {
                accumulator.add(rectangle.uuid);
            }
            return accumulator;
        },
        new Set<string>()
    );
};

export const getRectangleWidth = (rectangle: Rectangle): number => {
    return rectangle.right - rectangle.left;
};

export const getRectangleHeight = (rectangle: Rectangle): number => {
    return rectangle.bottom - rectangle.top;
};
