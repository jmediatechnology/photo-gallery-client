import {createContext, useContext} from "react";
import * as React from "react";
import type {PhotographDTO} from "../types";
import {usePhotographs} from "./PhotographContext.tsx";

interface PhotographSelectionContextInterface {
    /**
     * Raw uuids, suited for membership checks such as isSelected.
     * May briefly contain uuids of photographs that no longer exist,
     * so never use its size as a count; use selectedPhotographs instead.
     */
    selectedPhotographUuids: Set<string>,
    /** The selected photographs that still exist, in gallery order. */
    selectedPhotographs: PhotographDTO[],
    replaceSelection: (uuids: Set<string>) => void,
    deselectPhotograph: (uuid: string) => void,
    clearSelection: () => void,
}

const PhotographSelectionContext = createContext<PhotographSelectionContextInterface | undefined>(undefined);

export const PhotographSelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { photographs } = usePhotographs();
    const [selectedPhotographUuids, setSelectedPhotographUuids] = React.useState<Set<string>>(new Set());

    const replaceSelection = React.useCallback((uuids: Set<string>) => {
        setSelectedPhotographUuids((previous: Set<string>) => {
            return areSetsEqual(previous, uuids) ? previous : uuids;
        });
    }, []);

    const deselectPhotograph = React.useCallback((uuid: string) => {
        setSelectedPhotographUuids((previous: Set<string>) => {
            if (!previous.has(uuid)) {
                return previous;
            }

            const next = new Set(previous);
            next.delete(uuid);
            return next;
        });
    }, []);

    const clearSelection = React.useCallback(() => {
        setSelectedPhotographUuids((previous: Set<string>) => {
            return previous.size === 0 ? previous : new Set();
        });
    }, []);

    const selectedPhotographs = React.useMemo(() => {
        return photographs.filter((photograph: PhotographDTO) => selectedPhotographUuids.has(photograph.uuid));
    }, [photographs, selectedPhotographUuids]);

    const value = React.useMemo(() => ({
        selectedPhotographUuids,
        selectedPhotographs,
        replaceSelection,
        deselectPhotograph,
        clearSelection,
    }), [selectedPhotographUuids, selectedPhotographs, replaceSelection, deselectPhotograph, clearSelection]);

    return (
        <PhotographSelectionContext.Provider value={value}>
            {children}
        </PhotographSelectionContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePhotographSelection = (): PhotographSelectionContextInterface => {
    const photographSelectionContext = useContext(PhotographSelectionContext);
    if (!photographSelectionContext) throw new Error("usePhotographSelection must be used inside PhotographSelectionProvider");
    return photographSelectionContext;
};

/**
 * The rubber band reports a brand-new Set on every animation frame, even when
 * nothing changed. Keeping the previous Set in that case stops every consumer
 * from re-rendering at frame rate during a drag.
 */
const areSetsEqual = (a: Set<string>, b: Set<string>): boolean => {
    if (a.size !== b.size) {
        return false;
    }

    for (const value of a) {
        if (!b.has(value)) {
            return false;
        }
    }

    return true;
};
