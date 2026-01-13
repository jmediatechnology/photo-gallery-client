import {createContext, useContext} from "react";
import * as React from "react";
import {getPhotographs} from "../api/client.ts";
import type {PhotographDTO} from "../types";

interface PhotographContextInterface {
    photographs: PhotographDTO[],
    isLoading: boolean,
    error: string,
    addPhotograph: (response: PhotographDTO) => void,
    editPhotograph: (response: PhotographDTO) => void,
    removePhotograph: (uuid: string) => void,
}

const PhotographContext = createContext<PhotographContextInterface | undefined>(undefined);

export const PhotographProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [photographs, setPhotographs] = React.useState<PhotographDTO[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        getPhotographs()
            .then((response: PhotographDTO[]) => {
                setPhotographs(response);
            })
            .catch((response) => {
                if(response instanceof Error) {
                    setError(`${response.name}: ${response.message}`);
                    return;
                }

                setError('Failed to load photographs')
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    const addPhotograph = (response: PhotographDTO) => {
        setPhotographs([response, ...photographs]);
    };

    const editPhotograph = (response: PhotographDTO) => {
        const newPhotographs = photographs.reduce<PhotographDTO[]>((accumulator, currentValue: PhotographDTO) => {
            if (currentValue.uuid === response.uuid) {
                accumulator.push(response);
                return accumulator;
            }
            accumulator.push(currentValue);
            return accumulator;
        }, []);
        setPhotographs(newPhotographs);
    };

    const removePhotograph = (uuid: string) => {
        const photographsWithoutPhoto = photographs.filter((photograph: PhotographDTO) => photograph.uuid !== uuid);
        setPhotographs(photographsWithoutPhoto)
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
