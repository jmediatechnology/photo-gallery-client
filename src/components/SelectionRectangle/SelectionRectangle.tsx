import './selectionRectangle.css';
import * as React from "react";
import {
    getRectangleHeight,
    getRectangleWidth,
    type Rectangle,
} from "../../geometry/rectangle";

interface SelectionRectangleProps {
    rectangle: Rectangle;
}

/**
 * The visible rubber band.
 *
 * Positioned absolutely inside the gallery container, so it expects the
 * container to be `position: relative`. Coordinates arrive already expressed
 * in the container's content box, so they map straight onto left/top.
 */
export const SelectionRectangle: React.FC<SelectionRectangleProps> = (
    {rectangle}: SelectionRectangleProps
) => {
    return (
        <div
            className="selection-rectangle"
            data-testid="selection-rectangle"
            style={{
                left: `${rectangle.left}px`,
                top: `${rectangle.top}px`,
                width: `${getRectangleWidth(rectangle)}px`,
                height: `${getRectangleHeight(rectangle)}px`,
            }}
        />
    );
};
