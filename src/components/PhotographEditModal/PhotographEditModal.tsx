import * as React from "react";
import type {PhotographDTO} from "../../types";
import {patchPhotograph, postGenerateDescription} from "../../api/client.ts";
import {useAuth} from "../../auth/AuthContext.tsx";
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

export const PhotographEditModal: React.FC<PhotographEditModalProps> = ({photo, onClose}: PhotographEditModalProps) => {
    useEscape(onClose);
    const { token } = useAuth();
    const {editPhotograph} = usePhotographs();
    const [uuid] = React.useState(photo.uuid);
    const [title, setTitle] = React.useState(photo.title);
    const [description, setDescription] = React.useState(photo.description || null);

    const [isBusy, setIsBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleEdit = () => {

        if (!token || isBusy) {
            return;
        }

        setIsBusy(true);

        patchPhotograph({
            token,
            uuid,
            title,
            description,
        }).then((response: PhotographDTO) => {
            editPhotograph(response);
            onClose();
        }).catch((response) => {
            setError(extractErrorMessage(response, 'Failed to edit photograph'));
        }).finally(() => {
            setIsBusy(false);
        });
    };

    const handleGenerateDescription = () => {

        if (!token || isBusy) {
            return;
        }

        setIsBusy(true);

        postGenerateDescription({
            token,
            uuid,
        }).then((response: DescriptionDTO) => {
            setDescription(response.description);
        }).catch((response) => {
            setError(extractErrorMessage(response, 'Failed to generate description'));
        }).finally(() => {
            setIsBusy(false);
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
                        <HiOutlineSparkles />{isBusy ? 'Generating…' : 'Generate description'}
                    </button>
                </div>

                <div className="modal-actions">
                    <button onClick={() => handleEdit()} disabled={isBusy}>Update</button>
                </div>
            </div>
        </div>
    );
};