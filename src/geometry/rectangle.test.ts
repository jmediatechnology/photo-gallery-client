import { describe, expect, it } from "vitest";
import {
    createRectangle,
    doRectanglesOverlap,
    findOverlappingUuids,
    getRectangleHeight,
    getRectangleWidth,
    type Rectangle,
    type RectangleWithUuid,
} from "./rectangle";

describe('createRectangle', () => {

    it.each([
        ['down-right', { x: 10, y: 20 }, { x: 110, y: 220 }],
        ['down-left', { x: 110, y: 20 }, { x: 10, y: 220 }],
        ['up-right', { x: 10, y: 220 }, { x: 110, y: 20 }],
        ['up-left', { x: 110, y: 220 }, { x: 10, y: 20 }],
    ])('normalises a drag in the %s direction', (_direction, start, end) => {
        expect(createRectangle(start, end)).toEqual({
            left: 10,
            top: 20,
            right: 110,
            bottom: 220,
        });
    });

    it('produces a zero-area rectangle when the pointer has not moved', () => {
        const rectangle = createRectangle({ x: 50, y: 50 }, { x: 50, y: 50 });

        expect(getRectangleWidth(rectangle)).toBe(0);
        expect(getRectangleHeight(rectangle)).toBe(0);
    });
});

describe('doRectanglesOverlap', () => {

    const photograph: Rectangle = { left: 100, top: 100, right: 200, bottom: 200 };

    it('is true when the photograph is fully inside the selection', () => {
        const selection: Rectangle = { left: 0, top: 0, right: 300, bottom: 300 };

        expect(doRectanglesOverlap(selection, photograph)).toBe(true);
    });

    it('is true when the selection is fully inside the photograph', () => {
        const selection: Rectangle = { left: 120, top: 120, right: 140, bottom: 140 };

        expect(doRectanglesOverlap(selection, photograph)).toBe(true);
    });

    it('is true when only a corner overlaps', () => {
        const selection: Rectangle = { left: 190, top: 190, right: 260, bottom: 260 };

        expect(doRectanglesOverlap(selection, photograph)).toBe(true);
    });

    it.each([
        ['left of', { left: 0, top: 100, right: 50, bottom: 200 }],
        ['right of', { left: 250, top: 100, right: 300, bottom: 200 }],
        ['above', { left: 100, top: 0, right: 200, bottom: 50 }],
        ['below', { left: 100, top: 250, right: 200, bottom: 300 }],
    ])('is false when the selection sits entirely %s the photograph', (_position, selection: Rectangle) => {
        expect(doRectanglesOverlap(selection, photograph)).toBe(false);
    });

    it.each([
        ['left edge', { left: 0, top: 100, right: 100, bottom: 200 }],
        ['right edge', { left: 200, top: 100, right: 300, bottom: 200 }],
        ['top edge', { left: 100, top: 0, right: 200, bottom: 100 }],
        ['bottom edge', { left: 100, top: 200, right: 200, bottom: 300 }],
    ])('is false when the selection only touches the %s', (_edge, selection: Rectangle) => {
        expect(doRectanglesOverlap(selection, photograph)).toBe(false);
    });

    it('is false for a zero-area selection inside the photograph', () => {
        const selection: Rectangle = { left: 150, top: 150, right: 150, bottom: 150 };

        expect(doRectanglesOverlap(selection, photograph)).toBe(false);
    });
});

describe('findOverlappingUuids', () => {

    const photographRectangles: RectangleWithUuid[] = [
        { uuid: 'top-left', left: 0, top: 0, right: 100, bottom: 100 },
        { uuid: 'top-right', left: 200, top: 0, right: 300, bottom: 100 },
        { uuid: 'bottom-left', left: 0, top: 200, right: 100, bottom: 300 },
        { uuid: 'bottom-right', left: 200, top: 200, right: 300, bottom: 300 },
    ];

    it('selects every photograph the rectangle covers, including ones the pointer never crossed', () => {
        const selection = createRectangle({ x: 10, y: 10 }, { x: 290, y: 290 });

        expect(findOverlappingUuids(selection, photographRectangles)).toEqual(
            new Set(['top-left', 'top-right', 'bottom-left', 'bottom-right'])
        );
    });

    it('selects only the photographs within the rectangle', () => {
        const selection = createRectangle({ x: 10, y: 10 }, { x: 90, y: 290 });

        expect(findOverlappingUuids(selection, photographRectangles)).toEqual(
            new Set(['top-left', 'bottom-left'])
        );
    });

    it('returns an empty set when the rectangle covers the gap between photographs', () => {
        const selection = createRectangle({ x: 120, y: 120 }, { x: 180, y: 180 });

        expect(findOverlappingUuids(selection, photographRectangles)).toEqual(new Set());
    });

    it('returns an empty set when there are no photographs', () => {
        const selection = createRectangle({ x: 0, y: 0 }, { x: 500, y: 500 });

        expect(findOverlappingUuids(selection, [])).toEqual(new Set());
    });
});
