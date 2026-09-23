import {act, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, test, vi} from "vitest";
import {PHOTOGRAPH_UUID_ATTRIBUTE, useRectangularSelection} from "./useRectangularSelection.tsx";

interface ViewportRectangle {
    left: number,
    top: number,
    right: number,
    bottom: number,
}

/*
 * jsdom performs no layout, so every element reports a zero-sized rectangle.
 * getBoundingClientRect is mocked instead: the container sits at (100, 50) in
 * the viewport, with a 2x2 grid of photographs inside it.
 */
const CONTAINER_RECTANGLE: ViewportRectangle = {left: 100, top: 50, right: 500, bottom: 450};

const PHOTOGRAPH_RECTANGLES: Record<string, ViewportRectangle> = {
    'top-left': {left: 110, top: 60, right: 210, bottom: 160},
    'top-right': {left: 310, top: 60, right: 410, bottom: 160},
    'bottom-left': {left: 110, top: 260, right: 210, bottom: 360},
    'bottom-right': {left: 310, top: 260, right: 410, bottom: 360},
};

const ALL_PHOTOGRAPHS = new Set(['top-left', 'top-right', 'bottom-left', 'bottom-right']);

/*
 * requestAnimationFrame is replaced by a queue that the tests flush by hand,
 * so the throttling behaviour can be observed.
 */
let pendingFrames = new Map<number, FrameRequestCallback>();
let nextFrameId = 1;

describe('useRectangularSelection', () => {

    beforeEach(() => {
        pendingFrames = new Map();
        nextFrameId = 1;

        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
            const uuid = this.getAttribute(PHOTOGRAPH_UUID_ATTRIBUTE);
            return toDomRect(uuid ? PHOTOGRAPH_RECTANGLES[uuid] : CONTAINER_RECTANGLE);
        });

        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
            const id = nextFrameId++;
            pendingFrames.set(id, callback);
            return id;
        });

        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number) => {
            pendingFrames.delete(id);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('starts a selection on mousedown in empty space and reports an empty selection', () => {
        const onSelectionChange = vi.fn();
        render(<SelectionHarness onSelectionChange={onSelectionChange} />);

        pressAt(105, 55);

        expect(onSelectionChange).toHaveBeenCalledWith(new Set());
        expect(getContainer()).toHaveAttribute('data-selecting', 'true');
    });

    test('does not start a selection on mousedown on a photograph', () => {
        const onSelectionChange = vi.fn();
        render(<SelectionHarness onSelectionChange={onSelectionChange} />);

        fireEvent.mouseDown(screen.getByAltText('top-left'), {button: 0, clientX: 150, clientY: 100});

        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(getContainer()).toHaveAttribute('data-selecting', 'false');
    });

    test('ignores mousedown with any button other than the left one', () => {
        const onSelectionChange = vi.fn();
        render(<SelectionHarness onSelectionChange={onSelectionChange} />);

        fireEvent.mouseDown(getContainer(), {button: 2, clientX: 105, clientY: 55});

        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(getContainer()).toHaveAttribute('data-selecting', 'false');
    });

    test('selects every photograph the rectangle covers, including ones the pointer never crossed', async () => {
        const onSelectionChange = vi.fn();
        render(<SelectionHarness onSelectionChange={onSelectionChange} />);

        pressAt(105, 55);
        moveTo(415, 365);
        await flushAnimationFrame();

        expect(onSelectionChange).toHaveBeenLastCalledWith(ALL_PHOTOGRAPHS);
    });

    test('selects only the photographs the rectangle overlaps', async () => {
        const onSelectionChange = vi.fn();
        render(<SelectionHarness onSelectionChange={onSelectionChange} />);

        pressAt(105, 55);
        moveTo(215, 365);
        await flushAnimationFrame();

        expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['top-left', 'bottom-left']));
    });

    test('expresses the rectangle in the coordinates of the container content box', async () => {
        render(<SelectionHarness onSelectionChange={vi.fn()} />);

        pressAt(105, 55);
        moveTo(205, 155);
        await flushAnimationFrame();

        expect(readSelectionRectangle()).toEqual({left: 5, top: 5, right: 105, bottom: 105});
    });

    test('includes the scroll position of the container', async () => {
        const onSelectionChange = vi.fn();
        render(<SelectionHarness onSelectionChange={onSelectionChange} />);
        Object.defineProperty(getContainer(), 'scrollTop', {value: 100, configurable: true});

        pressAt(105, 55);
        moveTo(205, 155);
        await flushAnimationFrame();

        expect(readSelectionRectangle()).toEqual({left: 5, top: 105, right: 105, bottom: 205});
        expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['top-left']));
    });

    test('processes several mousemoves in one animation frame, using the latest position', async () => {
        const onSelectionChange = vi.fn();
        render(<SelectionHarness onSelectionChange={onSelectionChange} />);

        pressAt(105, 55);
        moveTo(150, 100);
        moveTo(300, 200);
        moveTo(415, 365);

        expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);

        await flushAnimationFrame();

        expect(onSelectionChange).toHaveBeenLastCalledWith(ALL_PHOTOGRAPHS);
    });

    test('ends the selection on mouseup and keeps the selected photographs', async () => {
        const onSelectionChange = vi.fn();
        render(<SelectionHarness onSelectionChange={onSelectionChange} />);

        pressAt(105, 55);
        moveTo(415, 365);
        await flushAnimationFrame();
        fireEvent.mouseUp(window);

        expect(getContainer()).toHaveAttribute('data-selecting', 'false');
        expect(screen.queryByTestId('selection-rectangle')).not.toBeInTheDocument();
        expect(onSelectionChange).toHaveBeenLastCalledWith(ALL_PHOTOGRAPHS);
    });

    test('ends the selection when the window loses focus', () => {
        render(<SelectionHarness onSelectionChange={vi.fn()} />);

        pressAt(105, 55);
        fireEvent.blur(window);

        expect(getContainer()).toHaveAttribute('data-selecting', 'false');
    });

    test('stops following the pointer once the selection has ended', async () => {
        const onSelectionChange = vi.fn();
        render(<SelectionHarness onSelectionChange={onSelectionChange} />);

        pressAt(105, 55);
        fireEvent.mouseUp(window);
        const callCount = onSelectionChange.mock.calls.length;

        moveTo(415, 365);
        await flushAnimationFrame();

        expect(onSelectionChange).toHaveBeenCalledTimes(callCount);
        expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    });

    test('cancels a pending animation frame when the selection ends', async () => {
        const onSelectionChange = vi.fn();
        render(<SelectionHarness onSelectionChange={onSelectionChange} />);

        pressAt(105, 55);
        moveTo(415, 365);
        fireEvent.mouseUp(window);
        await flushAnimationFrame();

        expect(window.cancelAnimationFrame).toHaveBeenCalled();
        expect(onSelectionChange).not.toHaveBeenCalledWith(ALL_PHOTOGRAPHS);
    });
});

const SelectionHarness = ({onSelectionChange}: {onSelectionChange: (uuids: Set<string>) => void}) => {
    const {containerRef, onMouseDown, isSelecting, selectionRectangle} = useRectangularSelection({onSelectionChange});

    return (
        <div
            ref={containerRef}
            data-testid="container"
            data-selecting={String(isSelecting)}
            onMouseDown={onMouseDown}
        >
            {Object.keys(PHOTOGRAPH_RECTANGLES).map((uuid: string) => (
                <div key={uuid} {...{[PHOTOGRAPH_UUID_ATTRIBUTE]: uuid}}>
                    <img alt={uuid} />
                </div>
            ))}
            {selectionRectangle && (
                <div data-testid="selection-rectangle" data-rectangle={JSON.stringify(selectionRectangle)} />
            )}
        </div>
    );
};

const getContainer = (): HTMLElement => {
    return screen.getByTestId('container');
};

const pressAt = (clientX: number, clientY: number): void => {
    fireEvent.mouseDown(getContainer(), {button: 0, clientX, clientY});
};

const moveTo = (clientX: number, clientY: number): void => {
    fireEvent.mouseMove(window, {clientX, clientY});
};

const flushAnimationFrame = async (): Promise<void> => {
    await act(async () => {
        const frames = Array.from(pendingFrames.values());
        pendingFrames = new Map();
        frames.forEach((callback: FrameRequestCallback) => callback(0));
    });
};

const readSelectionRectangle = (): unknown => {
    return JSON.parse(screen.getByTestId('selection-rectangle').getAttribute('data-rectangle') ?? 'null');
};

const toDomRect = ({left, top, right, bottom}: ViewportRectangle): DOMRect => {
    return {
        left,
        top,
        right,
        bottom,
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
        toJSON: () => ({}),
    } as DOMRect;
};
