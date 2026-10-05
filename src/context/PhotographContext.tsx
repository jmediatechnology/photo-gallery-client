import {createContext, useContext} from "react";
import * as React from "react";
import {getPhotographs} from "../api/client.ts";
import type {PhotographDTO} from "../types";
import { CircularArray } from "../data-structures/CircularArray.ts";
import {extractErrorMessage} from "../api/error.ts";
import {DEFAULT_PHOTOGRAPH_SORT, isSamePhotographSort, type PhotographSort} from "../types/PhotographSort.ts";

interface PhotographContextInterface {
    photographs: CircularArray<PhotographDTO>,
    isLoading: boolean,
    error: string,
    sort: PhotographSort,
    searchPhotographsByTitle: (title: string) => void,
    sortPhotographs: (sort: PhotographSort) => void,
    /**
     * Fetches the current list again, with the current title search and sort.
     * The server owns the order, so call this after anything that may change
     * it (an upload or an edit) instead of patching the list locally.
     */
    refreshPhotographs: () => void,
    removePhotograph: (uuid: string) => void,
}

const PhotographContext = createContext<PhotographContextInterface | undefined>(undefined);

export const PhotographProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [photographs, setPhotographs] = React.useState<CircularArray<PhotographDTO>>(new CircularArray());
    const [isLoading, setIsLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string>('');

    const [titleSearchTerm, setTitleSearchTerm] = React.useState<string>('');
    const [sort, setSort] = React.useState<PhotographSort>(DEFAULT_PHOTOGRAPH_SORT);
    const [refreshCount, setRefreshCount] = React.useState<number>(0);

    React.useEffect(() => {
        const abortController = new AbortController();
        const isSuperseded = (): boolean => abortController.signal.aborted;

        getPhotographs({title: titleSearchTerm, sort, signal: abortController.signal})
            .then((response: PhotographDTO[]) => {
                if (isSuperseded()) return;
                setPhotographs(CircularArray.from(response));
                setError('');
            })
            .catch((response) => {
                if (isSuperseded()) return;
                setError(extractErrorMessage(response, 'Failed to get photographs'));
            })
            .finally(() => {
                if (isSuperseded()) return;
                setIsLoading(false);
            });

        return () => abortController.abort();
    }, [titleSearchTerm, sort, refreshCount]);

    const searchPhotographsByTitle = React.useCallback((title: string): void => {
        setTitleSearchTerm(title.trim());
    }, []);

    const sortPhotographs = React.useCallback((nextSort: PhotographSort): void => {
        setSort((previous: PhotographSort) => isSamePhotographSort(previous, nextSort) ? previous : nextSort);
    }, []);

    const refreshPhotographs = React.useCallback((): void => {
        setRefreshCount((previous: number) => previous + 1);
    }, []);

    const removePhotograph = React.useCallback((uuid: string): void => {
        setPhotographs((prev: CircularArray<PhotographDTO>) => CircularArray.from(
            prev.filter((photograph: PhotographDTO) => photograph.uuid !== uuid)
        ));
    }, []);

    return (
        <PhotographContext.Provider value={{
            photographs,
            isLoading,
            error,
            sort,
            searchPhotographsByTitle,
            sortPhotographs,
            refreshPhotographs,
            removePhotograph,
        }}>
            {children}
        </PhotographContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePhotographs = (): PhotographContextInterface => {
    const photographContext = useContext(PhotographContext);
    if (!photographContext) throw new Error("usePhotographs must be used inside PhotographProvider");
    return photographContext;
};
