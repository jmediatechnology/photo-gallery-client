import * as React from "react";
import type {PhotographDTO} from "../../types";
import {patchPhotograph} from "../../api/client.ts";
import {useAuth} from "../../auth/AuthContext.tsx";
import {usePhotographs} from "../../photograph/PhotographContext.tsx";
import {useEscape} from "../../hooks/useEscape.tsx";

interface PhotographEditModalProps {
    photo: PhotographDTO,
    onClose: () => void,
}

export const PhotographEditModal: React.FC<PhotographEditModalProps> = ({photo, onClose}: PhotographEditModalProps) => {
    useEscape(onClose);
    const { token } = useAuth();
    const {editPhotograph} = usePhotographs();
    const [uuid] = React.useState(photo.uuid);
    const [title, setTitle] = React.useState(photo.title);
    const [description, setDescription] = React.useState(photo.description || null);

    const [error, setError] = React.useState<string | null>(null);

    const handleEdit = async() => {

        if (!token) {
            return;
        }

        patchPhotograph({
            token,
            uuid,
            title,
            description,
        }).then((response: PhotographDTO) => {
            editPhotograph(response);
            onClose();
        }).catch((err) => {
            console.error(err);
            setError(err.response?.data?.message);
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose} data-testid="modal-overlay">
            <div className="modal-content padding-32" onClick={(e) => e.stopPropagation()}>
                <div className="modal-field">
                    <label htmlFor="uuid" className="">UUID</label>
                    <input
                        type="text"
                        id="uuid"
                        className=""
                        value={uuid}
                        readOnly={true}
                    />
                </div>
                <div className="modal-field">
                    <label htmlFor="title" className="">Title</label>
                    <input
                        type="text"
                        id="title"
                        className=""
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div className="modal-field-column">
                    <label htmlFor="description" className="">Description</label>
                    <textarea
                        id="description"
                        className=""
                        value={description ?? ''}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {error && (
                    <div style={{ color: "red", fontSize: "14px" }}>{error}</div>
                )}

                <div className="modal-actions">
                    <button onClick={() => handleEdit()}>Update</button>
                </div>
            </div>
        </div>
    );
};