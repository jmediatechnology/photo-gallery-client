import * as React from "react";
import {FaSearch, FaTimes} from "react-icons/fa";
import './PhotographTitleSearch.css';

const SEARCH_DELAY_IN_MILLISECONDS = 300;
const TITLE_MAX_LENGTH = 255;

interface PhotographTitleSearchProps {
    onSearch: (title: string) => void,
}

export const PhotographTitleSearch = ({onSearch}: PhotographTitleSearchProps) => {
    const [title, setTitle] = React.useState<string>('');
    const inputRef = React.useRef<HTMLInputElement>(null);
    const pendingSearchRef = React.useRef<number | undefined>(undefined);

    React.useEffect(() => {
        return () => window.clearTimeout(pendingSearchRef.current);
    }, []);

    const cancelPendingSearch = (): void => {
        window.clearTimeout(pendingSearchRef.current);
    };

    const searchImmediately = (searchTitle: string): void => {
        cancelPendingSearch();
        onSearch(searchTitle);
    };

    const searchAfterTypingPause = (searchTitle: string): void => {
        cancelPendingSearch();
        pendingSearchRef.current = window.setTimeout(
            () => onSearch(searchTitle),
            SEARCH_DELAY_IN_MILLISECONDS
        );
    };

    const clearSearch = (): void => {
        setTitle('');
        searchImmediately('');
        inputRef.current?.focus();
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setTitle(event.target.value);
        searchAfterTypingPause(event.target.value);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        searchImmediately(title);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        if (event.key !== 'Escape' || title === '') {
            return;
        }

        event.preventDefault();
        clearSearch();
    };

    return (
        <form role="search" className="photograph-title-search" onSubmit={handleSubmit}>
            <FaSearch className="photograph-title-search-icon" aria-hidden="true" />
            <input
                ref={inputRef}
                type="search"
                className="photograph-title-search-input"
                aria-label="Search photographs by title"
                placeholder="Search by title"
                value={title}
                maxLength={TITLE_MAX_LENGTH}
                autoComplete="off"
                onChange={handleChange}
                onKeyDown={handleKeyDown}
            />
            {title !== '' && (
                <button
                    type="button"
                    className="photograph-title-search-clear"
                    aria-label="Clear search"
                    onClick={clearSearch}
                >
                    <FaTimes aria-hidden="true" />
                </button>
            )}
        </form>
    );
};
