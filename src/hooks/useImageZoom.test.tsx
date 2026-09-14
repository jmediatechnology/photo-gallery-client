import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import {useImageZoom, type UseImageZoomResult} from './useImageZoom';

function Harness({
                     options,
                     onResult,
                 }: {
    options?: Parameters<typeof useImageZoom>[0];
    onResult: (useImageZoomResult: UseImageZoomResult) => void;
}) {
    const { containerRef, containerProps, imageStyle } = useImageZoom(options);
    onResult({ containerRef, containerProps, imageStyle });
    return (
        <div data-testid="container" ref={containerRef} {...containerProps}>
            <img data-testid="image" alt="" style={imageStyle} />
        </div>
    );
}

// CSS's transform property takes values like 'scale(1.7500000000000002)'.
// We want to extract that scale value to floats.
function extractScale(transform: string | number | undefined): number {
    const match = String(transform ?? '').match(/scale\(([\d.]+)\)/);
    if (!match) throw new Error(`Could not extract scale from transform: "${transform}"`);
    return parseFloat(match[1]);
}

describe('useImageZoom', () => {
    let latestImageZoomResult: ReturnType<typeof useImageZoom>;
    const onResult = (useImageZoomResult: UseImageZoomResult) => {
        latestImageZoomResult = useImageZoomResult;
    };

    beforeEach(() => {
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
            width: 200,
            height: 200,
            top: 0,
            left: 0,
            right: 200,
            bottom: 200,
            x: 0,
            y: 0,
            toJSON: () => {},
        } as DOMRect);
    });

    it('starts at minScale, centered origin, zoom-in cursor', () => {
        render(<Harness onResult={onResult} />);

        expect(extractScale(latestImageZoomResult.imageStyle.transform)).toBe(1);
        expect(latestImageZoomResult.imageStyle.transformOrigin).toBe('50% 50%');
        expect(latestImageZoomResult.containerProps.style.cursor).toBe('zoom-in');
        expect(latestImageZoomResult.imageStyle.transition).toBe('transform 0.2s ease-out');
    });

    it('zooms in on wheel-up and moves the origin to the cursor position', () => {
        const { getByTestId } = render(<Harness onResult={onResult} />);
        const container = getByTestId('container');

        act(() => {
            fireEvent.wheel(container, { deltaY: -500, clientX: 150, clientY: 50 });
        });

        expect(extractScale(latestImageZoomResult.imageStyle.transform)).toBeCloseTo(1.75);
        expect(latestImageZoomResult.imageStyle.transformOrigin).toBe('75% 25%');
        expect(latestImageZoomResult.imageStyle.transition).toBe('none');
    });

    it('keeps a zoom-in cursor anywhere below maxScale, even while zoomed in', () => {
        const { getByTestId } = render(<Harness onResult={onResult} />);
        const container = getByTestId('container');

        act(() => {
            fireEvent.wheel(container, { deltaY: -500, clientX: 100, clientY: 100 });
        });

        expect(extractScale(latestImageZoomResult.imageStyle.transform)).toBeCloseTo(1.75); // zoomed, below maxScale (5)
        expect(latestImageZoomResult.containerProps.style.cursor).toBe('zoom-in');
    });

    it('switches to a zoom-out cursor only once maxScale is reached', () => {
        const { getByTestId } = render(<Harness onResult={onResult} />);
        const container = getByTestId('container');

        act(() => {
            fireEvent.wheel(container, { deltaY: -100000, clientX: 100, clientY: 100 });
        });

        expect(extractScale(latestImageZoomResult.imageStyle.transform)).toBe(5); // default maxScale
        expect(latestImageZoomResult.containerProps.style.cursor).toBe('zoom-out');
    });

    it('clamps zoom-in at maxScale', () => {
        const { getByTestId } = render(<Harness onResult={onResult} />);
        const container = getByTestId('container');

        act(() => {
            fireEvent.wheel(container, { deltaY: -100000, clientX: 100, clientY: 100 });
        });

        expect(extractScale(latestImageZoomResult.imageStyle.transform)).toBe(5);
    });

    it('clamps zoom-out at minScale', () => {
        const { getByTestId } = render(<Harness onResult={onResult} />);
        const container = getByTestId('container');

        act(() => {
            fireEvent.wheel(container, { deltaY: 100000, clientX: 100, clientY: 100 });
        });

        expect(extractScale(latestImageZoomResult.imageStyle.transform)).toBe(1);
    });

    it('calls preventDefault on wheel so the page does not scroll behind the modal', () => {
        const { getByTestId } = render(<Harness onResult={onResult} />);
        const container = getByTestId('container');

        let notPrevented: boolean;
        act(() => {
            notPrevented = fireEvent.wheel(container, { deltaY: -100, clientX: 50, clientY: 50 });
        });

        expect(notPrevented!).toBe(false);
    });

    it('ignores mousemove while not zoomed', () => {
        const { getByTestId } = render(<Harness onResult={onResult} />);
        const container = getByTestId('container');

        act(() => {
            fireEvent.mouseMove(container, { clientX: 10, clientY: 10 });
        });

        expect(latestImageZoomResult.imageStyle.transformOrigin).toBe('50% 50%');
    });

    it('pans the origin on mousemove once zoomed', () => {
        const { getByTestId } = render(<Harness onResult={onResult} />);
        const container = getByTestId('container');

        act(() => {
            fireEvent.wheel(container, { deltaY: -500, clientX: 150, clientY: 50 });
        });
        act(() => {
            fireEvent.mouseMove(container, { clientX: 40, clientY: 180 });
        });

        expect(latestImageZoomResult.imageStyle.transformOrigin).toBe('20% 90%');
    });

    it('resets scale, origin, and cursor when resetKey changes', () => {
        const { getByTestId, rerender } = render(<Harness options={{ resetKey: 'photo-1' }} onResult={onResult} />);
        const container = getByTestId('container');

        act(() => {
            fireEvent.wheel(container, { deltaY: -100000, clientX: 150, clientY: 50 });
        });
        expect(latestImageZoomResult.containerProps.style.cursor).toBe('zoom-out');

        rerender(<Harness options={{ resetKey: 'photo-2' }} onResult={onResult} />);

        expect(extractScale(latestImageZoomResult.imageStyle.transform)).toBe(1);
        expect(latestImageZoomResult.imageStyle.transformOrigin).toBe('50% 50%');
        expect(latestImageZoomResult.containerProps.style.cursor).toBe('zoom-in');
    });

    it('does not zoom past maxScale even across repeated wheel events', () => {
        const { getByTestId } = render(<Harness onResult={onResult} />);
        const container = getByTestId('container');

        for (let i = 0; i < 10; i++) {
            act(() => {
                fireEvent.wheel(container, { deltaY: -1000, clientX: 100, clientY: 100 });
            });
        }

        expect(extractScale(latestImageZoomResult.imageStyle.transform)).toBe(5);
    });

    it('reaches maxScale gradually across realistic wheel notches, without overshooting', () => {
        const { getByTestId } = render(<Harness onResult={onResult} />);
        const container = getByTestId('container');

        // 120 is a realistic single-notch deltaY in Chrome's pixel mode.
        // 0.0015 sensitivity × 120 ≈ 0.18 scale per notch, so max (5) is reached after ~23 notches.
        for (let i = 0; i < 30; i++) {
            act(() => {
                fireEvent.wheel(container, { deltaY: -120, clientX: 100, clientY: 100 });
            });
        }

        expect(extractScale(latestImageZoomResult.imageStyle.transform)).toBe(5);
    });
});
