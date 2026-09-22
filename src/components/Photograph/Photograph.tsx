import * as React from "react";
import type {PhotographDTO} from "../../types";
import {api} from "../../api/config.ts";
import {FaTrashAlt} from "react-icons/fa";
import {MdModeEdit} from "react-icons/md";
import {useAuth} from "../../context/AuthContext.tsx";
import {PHOTOGRAPH_UUID_ATTRIBUTE} from "../../hooks/useRectangularSelection.tsx";

interface PhotographProps {
    photograph: PhotographDTO,
    isSelected: boolean,
    onSelect: (photograph: PhotographDTO) => void,
    onSelectForEdit: (photograph: PhotographDTO) => void,
    onSelectForDelete: (photograph: PhotographDTO) => void,
}

const PhotographItem = ({
                            photograph,
                            isSelected,
                            onSelect,
                            onSelectForEdit,
                            onSelectForDelete,
                        }: PhotographProps) => {

    const { roles } = useAuth();

    return (
        <div
            className={`photo-gallery-item${isSelected ? ' photo-gallery-item--selected' : ''}`}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(photograph)}
            {...{[PHOTOGRAPH_UUID_ATTRIBUTE]: photograph.uuid}}
        >
            <img
                src={api.url(photograph.filePath)}
                alt={photograph.title}
                loading="lazy"
                draggable={false}
                onClick={() => onSelect(photograph)}
            />
            <div className="photo-gallery-item-info" onClick={() => onSelect(photograph)}>
                <p className="title">{photograph.title}</p>
                {photograph.description && (
                    <p className="description">{photograph.description}</p>
                )}
            </div>
            <div className="photo-gallery-actions">
                { roles?.includes('ROLE_ADMIN')
                    ? <><button onClick={() => onSelectForDelete(photograph)}><FaTrashAlt /></button><button onClick={() => onSelectForEdit(photograph)}><MdModeEdit /></button></>
                    : <></>
                }
            </div>
        </div>
    );
};

export const Photograph = React.memo(PhotographItem);
