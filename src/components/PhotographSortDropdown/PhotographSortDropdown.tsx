import './PhotographSortDropdown.css';
import * as React from "react";
import {FaCheck, FaChevronDown, FaSort} from "react-icons/fa";
import {isSamePhotographSort, type PhotographSort} from "../../types/PhotographSort.ts";
import {isAnyModalOpen} from "../../dom/isAnyModalOpen.ts";
import {PHOTOGRAPH_SORT_OPTIONS, type PhotographSortOption} from "./photographSortOptions.ts";

interface PhotographSortDropdownProps {
    sort: PhotographSort,
    onSort: (sort: PhotographSort) => void,
}

export const PhotographSortDropdown = ({sort, onSort}: PhotographSortDropdownProps) => {
    const [isOpen, setIsOpen] = React.useState<boolean>(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

    const selectedIndex = PHOTOGRAPH_SORT_OPTIONS.findIndex(
        (option: PhotographSortOption) => isSamePhotographSort(option.sort, sort)
    );
    const selectedLabel = PHOTOGRAPH_SORT_OPTIONS[selectedIndex]?.label ?? 'Sort';

    const close = React.useCallback((): void => setIsOpen(false), []);

    const closeAndFocusTrigger = React.useCallback((): void => {
        setIsOpen(false);
        triggerRef.current?.focus();
    }, []);

    useCloseOnOutsideMouseDown(isOpen, containerRef, close);
    useCloseOnEscape(isOpen, closeAndFocusTrigger);

    React.useEffect(() => {
        if (isOpen) {
            optionRefs.current[Math.max(selectedIndex, 0)]?.focus();
        }
        // Only on opening; moving focus on every sort change would steal it.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const toggle = (): void => {
        if (!isOpen && isAnyModalOpen()) {
            return;
        }

        setIsOpen((previous: boolean) => !previous);
    };

    const select = (option: PhotographSortOption): void => {
        onSort(option.sort);
        closeAndFocusTrigger();
    };

    const moveFocus = (event: React.KeyboardEvent<HTMLUListElement>): void => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
            return;
        }

        event.preventDefault();
        const amountOfOptions = PHOTOGRAPH_SORT_OPTIONS.length;
        const focusedIndex = optionRefs.current.findIndex(
            (element: HTMLButtonElement | null) => element === document.activeElement
        );
        const step = event.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = (focusedIndex + step + amountOfOptions) % amountOfOptions;
        optionRefs.current[nextIndex]?.focus();
    };

    return (
        <div className="sort-dropdown" ref={containerRef}>
            <button
                ref={triggerRef}
                type="button"
                className="sort-dropdown-trigger"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={toggle}
            >
                <FaSort className="sort-dropdown-icon" aria-hidden="true" />
                {selectedLabel}
                <FaChevronDown className="sort-dropdown-chevron" aria-hidden="true" />
            </button>
            {isOpen && (
                <ul className="sort-dropdown-menu" role="menu" aria-label="Sort photographs" onKeyDown={moveFocus}>
                    {PHOTOGRAPH_SORT_OPTIONS.map((option: PhotographSortOption, index: number) => {
                        const isSelected = index === selectedIndex;
                        return (
                            <li key={option.label} role="none">
                                <button
                                    ref={(element) => { optionRefs.current[index] = element; }}
                                    type="button"
                                    role="menuitemradio"
                                    aria-checked={isSelected}
                                    className={`sort-dropdown-option${isSelected ? ' sort-dropdown-option--selected' : ''}`}
                                    onClick={() => select(option)}
                                >
                                    <FaCheck className="sort-dropdown-check" aria-hidden="true" />
                                    {option.label}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

const useCloseOnOutsideMouseDown = (
    isOpen: boolean,
    containerRef: React.RefObject<HTMLElement | null>,
    onClose: () => void,
): void => {
    React.useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleMouseDown = (event: MouseEvent): void => {
            if (!containerRef.current?.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [isOpen, containerRef, onClose]);
};

const useCloseOnEscape = (isOpen: boolean, onClose: () => void): void => {
    React.useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
};
