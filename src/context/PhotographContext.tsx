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
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
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

    const addPhotograph = (response: PhotographDTO) => {
        setPhotographs(CircularArray.from([response, ...photographs]));
    };

    const editPhotograph = (response: PhotographDTO) => {
        const newPhotographs = photographs.reduce<CircularArray<PhotographDTO>>(
            (accumulator, current) => {
                accumulator.push(current.uuid === response.uuid ? response : current);
                return accumulator;
            },
            new CircularArray()
        );
        setPhotographs(newPhotographs);
    };

    const removePhotograph = (uuid: string) => {
        setPhotographs(CircularArray.from(
            photographs.filter((photograph: PhotographDTO) => photograph.uuid !== uuid)
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
