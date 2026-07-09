import React from "react";
import {api} from "../../api/config.ts";
import type {PhotographDTO} from "../../types";
import {useAuth} from "../../auth/AuthContext.tsx";
import {deletePhotograph} from "../../api/client.ts";
import {usePhotographs} from "../../context/PhotographContext.tsx";
import {useEscape} from "../../hooks/useEscape.tsx";
import './PhotographDeleteModal.css';
import {extractErrorMessage} from "../../api/error.ts";

interface PhotographModalProps {
    photo: PhotographDTO;
    onClose: () => void;
}

export const PhotographDeleteModal: React.FC<PhotographModalProps> = ({ photo, onClose }: PhotographModalProps) => {
    useEscape(onClose);
    const { token } = useAuth();
    const { removePhotograph } = usePhotographs();
    const [isBusy, setIsBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleDelete = (photograph: PhotographDTO) => {

        if (!token || isBusy) {
            return;
        }

        setIsBusy(true);

        const {uuid} = photograph;

        deletePhotograph({
            token,
            uuid,
        }).then(() => {
            removePhotograph(uuid);
            onClose();
        }).catch((response) => {
            setError(extractErrorMessage(response, 'Failed to delete photograph'));
        }).finally(() => {
            setIsBusy(false);
        });
    };

    return (
        <div className="modal-overlay-delete" onClick={onClose} data-testid="modal-overlay">
            <div className="modal-content-delete background-black padding-32" onClick={(e) => e.stopPropagation()}>

                <div className="modal-header">
                    <h2>Delete {photo.title}?</h2>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>

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
                    <button onClick={() => handleDelete(photo)} disabled={isBusy}>YES</button>
                    <button onClick={onClose}>NO</button>
                </div>
            </div>
        </div>
    );
};
