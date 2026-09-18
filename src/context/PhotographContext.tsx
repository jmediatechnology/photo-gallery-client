import {createContext, useContext} from "react";
import * as React from "react";
import {getPhotographs} from "../api/client.ts";
import type {PhotographDTO} from "../types";
import { CircularArray } from "../data-structures/CircularArray.ts";
import {extractErrorMessage} from "../api/error.ts";

interface PhotographContextInterface {
    photographs: CircularArray<PhotographDTO>,
    isLoading: boolean,
    error: string,
    addPhotograph: (response: PhotographDTO) => void,
    editPhotograph: (response: PhotographDTO) => void,
    removePhotograph: (uuid: string) => void,
}

const PhotographContext = createContext<PhotographContextInterface | undefined>(undefined);

export const PhotographProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [photographs, setPhotographs] = React.useState<CircularArray<PhotographDTO>>(new CircularArray());
    const [isLoading, setIsLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string>('');

    React.useEffect((): void => {
        getPhotographs()
            .then((response: PhotographDTO[]) => {
                setPhotographs(CircularArray.from(response));
            })
            .catch((response) => {
                setError(extractErrorMessage(response, 'Failed to get photographs'));
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    const addPhotograph = (response: PhotographDTO): void => {
        setPhotographs((prev: CircularArray<PhotographDTO>) => CircularArray.from([response, ...prev]));
    };

    const editPhotograph = (response: PhotographDTO): void => {
        setPhotographs((prev: CircularArray<PhotographDTO>) => prev.reduce<CircularArray<PhotographDTO>>(
            (accumulator: CircularArray<PhotographDTO>, current: PhotographDTO): CircularArray<PhotographDTO> => {
                accumulator.push(current.uuid === response.uuid ? response : current);
                return accumulator;
            },
            new CircularArray()
        ));
    };

    const removePhotograph = (uuid: string): void => {
        setPhotographs((prev: CircularArray<PhotographDTO>) => CircularArray.from(
            prev.filter((photograph: PhotographDTO) => photograph.uuid !== uuid)
        ));
    };

    return (
        <PhotographContext.Provider value={{photographs, isLoading, error, addPhotograph, editPhotograph, removePhotograph}}>
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
