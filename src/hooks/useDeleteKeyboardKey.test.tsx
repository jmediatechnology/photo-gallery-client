import { renderHook } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import {useDeleteKeyboardKey} from "./useDeleteKeyboardKey.tsx";

describe('useDeleteKeyboardKeyboardKey', () => {

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('calls onDelete when the Delete key on the keyboard is pressed globally', () => {
        const onDelete = vi.fn();
        renderHook(() => useDeleteKeyboardKey(true, onDelete));

        fireEvent.keyDown(window, { key: 'Delete' });

        expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('does not call onDelete when the hook is disabled', () => {
        const onDelete = vi.fn();
        renderHook(() => useDeleteKeyboardKey(false, onDelete));

        fireEvent.keyDown(window, { key: 'Delete' });

        expect(onDelete).not.toHaveBeenCalled();
    });

    it.each([
        'Backspace',
        'Escape',
        'Enter',
        'a',
    ])('does not call onDelete for the %s key', (key: string) => {
        const onDelete = vi.fn();
        renderHook(() => useDeleteKeyboardKey(true, onDelete));

        fireEvent.keyDown(window, { key });

        expect(onDelete).not.toHaveBeenCalled();
    });

    it.each([
        ['an input', '<input type="text" />'],
        ['a textarea', '<textarea></textarea>'],
        ['a select', '<select><option>a</option></select>'],
        ['a contenteditable element', '<div contenteditable="true"></div>'],
        ['a child of a contenteditable element', '<div contenteditable="true"><span></span></div>'],
    ])('does not call onDelete when the event originates from %s', (_name: string, html: string) => {
        const onDelete = vi.fn();
        renderHook(() => useDeleteKeyboardKey(true, onDelete));
        const target = renderTarget(html);

        fireEvent.keyDown(target, { key: 'Delete' });

        expect(onDelete).not.toHaveBeenCalled();
    });

    it('calls onDelete when the event originates from a contenteditable="false" element', () => {
        const onDelete = vi.fn();
        renderHook(() => useDeleteKeyboardKey(true, onDelete));
        const target = renderTarget('<div contenteditable="false"></div>');

        fireEvent.keyDown(target, { key: 'Delete' });

        expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete when the event originates from a regular element', () => {
        const onDelete = vi.fn();
        renderHook(() => useDeleteKeyboardKey(true, onDelete));
        const target = renderTarget('<div class="photo-gallery"></div>');

        fireEvent.keyDown(target, { key: 'Delete' });

        expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('stops listening after unmount', () => {
        const onDelete = vi.fn();
        const { unmount } = renderHook(() => useDeleteKeyboardKey(true, onDelete));

        unmount();
        fireEvent.keyDown(window, { key: 'Delete' });

        expect(onDelete).not.toHaveBeenCalled();
    });

    it('stops listening when enabled flips to false', () => {
        const onDelete = vi.fn();
        const { rerender } = renderHook(
            ({ enabled }: { enabled: boolean }) => useDeleteKeyboardKey(enabled, onDelete),
            { initialProps: { enabled: true } }
        );

        rerender({ enabled: false });
        fireEvent.keyDown(window, { key: 'Delete' });

        expect(onDelete).not.toHaveBeenCalled();
    });

    it('calls the most recent callback after a rerender', () => {
        const initialOnDelete = vi.fn();
        const nextOnDelete = vi.fn();
        const { rerender } = renderHook(
            ({ onDelete }: { onDelete: () => void }) => useDeleteKeyboardKey(true, onDelete),
            { initialProps: { onDelete: initialOnDelete } }
        );

        rerender({ onDelete: nextOnDelete });
        fireEvent.keyDown(window, { key: 'Delete' });

        expect(initialOnDelete).not.toHaveBeenCalled();
        expect(nextOnDelete).toHaveBeenCalledTimes(1);
    });

    it('prevents the default browser behaviour', () => {
        const onDelete = vi.fn();
        renderHook(() => useDeleteKeyboardKey(true, onDelete));

        const isNotPrevented = fireEvent.keyDown(window, { key: 'Delete' });

        expect(isNotPrevented).toBe(false);
    });
});

const renderTarget = (html: string): HTMLElement => {
    document.body.innerHTML = html;
    const element = document.body.firstElementChild as HTMLElement;
    return (element.firstElementChild as HTMLElement) ?? element;
};
