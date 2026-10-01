import { renderHook } from "@testing-library/react";
import {describe, expect, vi, beforeEach, afterEach, type Mock} from "vitest";
import { useEscape } from "./useEscape";

describe("useEscape", () => {
    let onClose: Mock<() => void>;

    beforeEach(() => {
        onClose = vi.fn<() => void>();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("calls onClose when Escape is pressed", () => {
        renderHook(() => useEscape(onClose));

        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

        expect(onClose).toHaveBeenCalledOnce();
    });

    test("does not call onClose for other keys", () => {
        renderHook(() => useEscape(onClose));

        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));

        expect(onClose).not.toHaveBeenCalled();
    });

    test("removes the event listener on unmount", () => {
        const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

        const { unmount } = renderHook(() => useEscape(onClose));
        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    });

    test("does not call a stale onClose after callback reference changes", () => {
        const firstOnClose = vi.fn<() => void>();
        const secondOnClose = vi.fn<() => void>();

        const { rerender } = renderHook(({ onCloseHandler }) => useEscape(onCloseHandler), {
            initialProps: {onCloseHandler: firstOnClose},
        });

        rerender({ onCloseHandler: secondOnClose });

        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

        expect(firstOnClose).not.toHaveBeenCalled();
        expect(secondOnClose).toHaveBeenCalledOnce();
    });
});