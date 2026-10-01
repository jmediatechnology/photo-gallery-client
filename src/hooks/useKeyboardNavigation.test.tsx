import { renderHook } from "@testing-library/react";
import { describe, expect, vi, beforeEach, afterEach } from "vitest";
import { useKeyboardNavigation } from "./useKeyboardNavigation";

type NavigationHandler = Parameters<typeof useKeyboardNavigation>[0];

describe("useKeyboardNavigation", () => {
    let onNext: NavigationHandler;
    let onPrev: NavigationHandler;

    beforeEach(() => {
        onNext = vi.fn<NavigationHandler>();
        onPrev = vi.fn<NavigationHandler>();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("calls onNext when ArrowRight is pressed", () => {
        renderHook(() => useKeyboardNavigation(onNext, onPrev));

        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));

        expect(onNext).toHaveBeenCalledOnce();
        expect(onPrev).not.toHaveBeenCalled();
    });

    test("calls onPrev when ArrowLeft is pressed", () => {
        renderHook(() => useKeyboardNavigation(onNext, onPrev));

        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));

        expect(onPrev).toHaveBeenCalledOnce();
        expect(onNext).not.toHaveBeenCalled();
    });

    test("does not call onNext or onPrev for other keys", () => {
        renderHook(() => useKeyboardNavigation(onNext, onPrev));

        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));

        expect(onNext).not.toHaveBeenCalled();
        expect(onPrev).not.toHaveBeenCalled();
    });

    test("removes both event listeners on unmount", () => {
        const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

        const { unmount } = renderHook(() => useKeyboardNavigation(onNext, onPrev));
        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
        expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    });

    test("does not call stale onNext after callback reference changes", () => {
        const firstOnNext = vi.fn<NavigationHandler>();
        const secondOnNext = vi.fn<NavigationHandler>();

        const { rerender } = renderHook(
            ({ nextHandler, prevHandler }) => useKeyboardNavigation(nextHandler, prevHandler),
            { initialProps: { nextHandler: firstOnNext, prevHandler: onPrev } }
        );

        rerender({ nextHandler: secondOnNext, prevHandler: onPrev });

        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));

        expect(firstOnNext).not.toHaveBeenCalled();
        expect(secondOnNext).toHaveBeenCalledOnce();
    });

    test("does not call stale onPrev after callback reference changes", () => {
        const firstOnPrev = vi.fn<NavigationHandler>();
        const secondOnPrev = vi.fn<NavigationHandler>();

        const { rerender } = renderHook(
            ({ nextHandler, prevHandler }) => useKeyboardNavigation(nextHandler, prevHandler),
            { initialProps: { nextHandler: onNext, prevHandler: firstOnPrev } }
        );

        rerender({ nextHandler: onNext, prevHandler: secondOnPrev });

        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));

        expect(firstOnPrev).not.toHaveBeenCalled();
        expect(secondOnPrev).toHaveBeenCalledOnce();
    });
});
