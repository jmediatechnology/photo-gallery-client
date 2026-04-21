import React from "react";
import {api} from "../../api/config.ts";
import type {PhotographDTO} from "../../types";
import {useAuth} from "../../auth/AuthContext.tsx";
import {deletePhotograph} from "../../api/client.ts";
import {usePhotographs} from "../../photograph/PhotographContext.tsx";
import {useEscape} from "../../hooks/useEscape.tsx";
import './PhotographDeleteModal.css';

interface PhotographModalProps {
    photo: PhotographDTO;
    onClose: () => void;
}

export const PhotographDeleteModal: React.FC<PhotographModalProps> = ({ photo, onClose }: PhotographModalProps) => {
    useEscape(onClose);
    const { token } = useAuth();
    const { removePhotograph } = usePhotographs();
    const [error, setError] = React.useState<string | null>(null);

    const handleDelete = (photograph: PhotographDTO) => {

        if (!token) {
            return;
        }

        const {uuid} = photograph;

        deletePhotograph({
            token,
            uuid,
        }).then(() => {
            removePhotograph(uuid);
            onClose();
        }).catch((err) => {
            console.error(err);
            setError(err.response?.data?.message);
        });
    };

    return (
        <div className="modal-overlay-delete" onClick={onClose} data-testid="modal-overlay">
            <div className="modal-content-delete background-black padding-32" onClick={(e) => e.stopPropagation()}>

                <h2>Delete {photo.title}?</h2>

                <img
                    src={api.url(photo.filePath)}
                    alt={photo.title}
                    className="modal-image"
                />

                <div>
                    <span>{photo.title}</span>{photo.description && <span>: {photo.description}</span>}
                </div>

                {error && (
                    <div style={{ color: "red", fontSize: "14px" }}>{error}</div>
                )}

                <div className="modal-actions">
                    <button onClick={() => handleDelete(photo)}>YES</button>
                    <button onClick={onClose}>NO</button>
                </div>
            </div>
        </div>
    );
};
