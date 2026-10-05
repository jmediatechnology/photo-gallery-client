import * as React from "react";
import type {PhotographDTO} from "../../types";
import {patchPhotograph, postGenerateDescription} from "../../api/client.ts";
import {useAuth} from "../../context/AuthContext.tsx";
import {usePhotographs} from "../../context/PhotographContext.tsx";
import {useEscape} from "../../hooks/useEscape.tsx";
import './PhotoGraphEditModal.css';
import type {DescriptionDTO} from "../../types/DescriptionDTO.ts";
import {HiOutlineSparkles} from "react-icons/hi2";
import {extractErrorMessage} from "../../api/error.ts";

interface PhotographEditModalProps {
    photo: PhotographDTO,
    onClose: () => void,
}

type PendingRequest = 'update' | 'generate-description';

export const PhotographEditModal: React.FC<PhotographEditModalProps> = ({photo, onClose}: PhotographEditModalProps) => {
    useEscape(onClose);
    const { token } = useAuth();
    const {refreshPhotographs} = usePhotographs();
    const [uuid] = React.useState(photo.uuid);
    const [title, setTitle] = React.useState(photo.title);
    const [description, setDescription] = React.useState(photo.description || null);

    const [pendingRequest, setPendingRequest] = React.useState<PendingRequest | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const isBusy = pendingRequest !== null;

    const handleEdit = () => {

        if (!token) {
            return;
        }

        setPendingRequest('update');

        patchPhotograph({
            token,
            uuid,
            title,
            description,
        }).then(() => {
            refreshPhotographs();
            onClose();
        }).catch((response) => {
            setError(extractErrorMessage(response, 'Failed to edit photograph'));
        }).finally(() => {
            setPendingRequest(null);
        });
    };

    const handleGenerateDescription = () => {

        if (!token) {
            return;
        }

        setPendingRequest('generate-description');

        postGenerateDescription({
            token,
            uuid,
        }).then((response: DescriptionDTO) => {
            setDescription(response.description);
        }).catch((response) => {
            setError(extractErrorMessage(response, 'Failed to generate description'));
        }).finally(() => {
            setPendingRequest(null);
        });
    };

    return (
        <div className="modal-overlay-edit" onClick={onClose} data-testid="modal-overlay">
            <div className="modal-content-edit background-black padding-32" onClick={(e) => e.stopPropagation()}>

                <div className="modal-header">
                    <h2>{photo.title}</h2>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>

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
                        autoFocus={true}
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
                    <button onClick={handleGenerateDescription} disabled={isBusy}>
                        <HiOutlineSparkles />{pendingRequest === 'generate-description' ? 'Generating…' : 'Generate description'}
                    </button>
                </div>

                <div className="modal-actions">
                    <button onClick={() => handleEdit()} disabled={isBusy}>Update</button>
                </div>
            </div>
        </div>
    );
};
