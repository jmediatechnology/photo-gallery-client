import type {PhotographDTO} from "../../types";
import {api} from "../../api/config.ts";
import {FaTrashAlt} from "react-icons/fa";
import {MdModeEdit} from "react-icons/md";
import {useAuth} from "../../auth/AuthContext.tsx";

interface PhotographProps {
    photograph: PhotographDTO,
    onSelect: (photograph: PhotographDTO) => void,
    onSelectForEdit: (photograph: PhotographDTO) => void,
    onSelectForDelete: (photograph: PhotographDTO) => void,
}

export const Photograph = ({
    photograph,
    onSelect,
    onSelectForEdit,
    onSelectForDelete,
}: PhotographProps) => {

    const { roles } = useAuth();

    return (
        <div
            key={photograph.uuid}
            className="photo-gallery-item"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(photograph)}
        >
            <img
                src={api.url(photograph.filePath)}
                alt={photograph.title}
                loading="lazy"
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
