/*
 * Every modal in the app renders a .modal-overlay or .modal-overlay-edit element.
 * Checking the DOM at the moment it matters covers modals owned by other
 * components (PhotoGallery's show, edit and delete modals), whose state the
 * caller cannot see. A new modal must keep this convention.
 */
const MODAL_OVERLAY_SELECTOR = '.modal-overlay, .modal-overlay-edit';

export const isAnyModalOpen = (): boolean => {
    return document.querySelector(MODAL_OVERLAY_SELECTOR) !== null;
};
