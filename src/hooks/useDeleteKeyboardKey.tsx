import * as React from "react";

/**
 * Calls `onDelete` when the user presses the Delete key.
 *
 * The hook is deliberately dumb: it knows nothing about selections or modals.
 * The caller decides *when* deleting is allowed by passing `enabled`, e.g.
 *
 *   useDeleteKeyboardKey(
 *       selectedPhotographUuids.size > 0 && !selectedPhoto && !selectedPhotoToBeEdited,
 *       () => setIsSelectionDeleteModalOpen(true)
 *   );
 *
 * Keypresses originating from a form field or a contenteditable region are
 * always ignored, so typing in an input never triggers a delete.
 */
export const useDeleteKeyboardKey = (enabled: boolean, onDelete: () => void): void => {
    React.useEffect(() => {
        if (!enabled) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key !== 'Delete') {
                return;
            }

            if (isEditableTarget(event.target)) {
                return;
            }

            event.preventDefault();
            onDelete();
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled, onDelete]);
};

const isEditableTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    if (isFormField(target)) {
        return true;
    }

    return isContentEditable(target);
};

const isFormField = (element: HTMLElement): boolean => {
    return ['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'].includes(element.tagName);
};

const isContentEditable = (element: HTMLElement): boolean => {
    return element.closest('[contenteditable]:not([contenteditable="false"])') !== null;
};
