import {render, screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {SelectionRectangle} from "./SelectionRectangle.tsx";

describe('SelectionRectangle', () => {

    test('is placed at the left and top of the rectangle', () => {
        render(<SelectionRectangle rectangle={{left: 10, top: 20, right: 110, bottom: 70}} />);

        expect(getSelectionRectangle()).toHaveStyle({left: '10px', top: '20px'});
    });

    test('is sized by the distance between the edges of the rectangle', () => {
        render(<SelectionRectangle rectangle={{left: 10, top: 20, right: 110, bottom: 70}} />);

        expect(getSelectionRectangle()).toHaveStyle({width: '100px', height: '50px'});
    });

    test('has no size before the pointer has moved', () => {
        render(<SelectionRectangle rectangle={{left: 40, top: 40, right: 40, bottom: 40}} />);

        expect(getSelectionRectangle()).toHaveStyle({width: '0px', height: '0px'});
    });

    /*
     * The class carries the styles the overlay depends on: absolute positioning
     * inside the selection surface, and pointer-events: none so it never
     * intercepts the mouse during a drag.
     */
    test('carries the selection-rectangle class', () => {
        render(<SelectionRectangle rectangle={{left: 10, top: 20, right: 110, bottom: 70}} />);

        expect(getSelectionRectangle()).toHaveClass('selection-rectangle');
    });
});

const getSelectionRectangle = (): HTMLElement => {
    return screen.getByTestId('selection-rectangle');
};
