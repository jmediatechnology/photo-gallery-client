import * as React from "react";

export function useKeyboardNavigation(
    onNext: () => void,
    onPrev: () => void
) {
    React.useEffect(() => {

        const handleNext = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') onNext();
        };

        const handlePrev = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') onPrev();
        };

        window.addEventListener('keydown', handleNext);
        window.addEventListener('keydown', handlePrev);

        return () => {
            window.removeEventListener('keydown', handleNext);
            window.removeEventListener('keydown', handlePrev);
        }
    }, [onNext, onPrev]);
}
