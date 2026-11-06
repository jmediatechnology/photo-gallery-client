import * as React from "react";

interface UseKeyboardNavigationOptions {
    enabled?: boolean;
}

export function useKeyboardNavigation(
    onNext: () => void,
    onPrev: () => void,
    {enabled = true}: UseKeyboardNavigationOptions = {}
) {
    React.useEffect(() => {
        if (!enabled) {
            return;
        }

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
    }, [onNext, onPrev, enabled]);
}
