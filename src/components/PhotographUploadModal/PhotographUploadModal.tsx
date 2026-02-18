import * as React from "react";
import {postPhotograph} from "../../api/client.ts";
import {useAuth} from "../../auth/AuthContext.tsx";
import type {PhotographDTO} from "../../types";
import {usePhotographs} from "../../photograph/PhotographContext.tsx";
import {useEscape} from "../../hooks/useEscape.tsx";

interface UploadModalProps {
    onClose: () => void
}

export const PhotographUploadModal: React.FC<UploadModalProps> = ({onClose}: UploadModalProps) => {
    useEscape(onClose);
    const { token } = useAuth();
    const { addPhotograph } = usePhotographs();
    const [uuid, setUuid] = React.useState(crypto.randomUUID().toString());
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [file, setFile] = React.useState<File | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [validationErrorUUID, setValidationErrorUUID] = React.useState<string | null>(null);
    const [validationErrorTitle, setValidationErrorTitle] = React.useState<string | null>(null);
    const [validationErrorFile, setValidationErrorFile] = React.useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {

        if (!token) {
            return;
        }

        if (title.length === 0) {
            setValidationErrorTitle('Title is required');
            return;
        }

        if (!file) {
            setValidationErrorFile('No file specified');
            return;
        }

        postPhotograph({
            token,
            uuid,
            title,
            description,
            file,
        }).then((response: PhotographDTO) => {
            addPhotograph(response);
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
                        onChange={(e) => {
                            const value = e.target.value;
                            setValidationErrorUUID(null);
                            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
                                setValidationErrorUUID('Invalid UUID');
                            }
                            setUuid(value)}
                        }
                    />
                    {validationErrorUUID && (
                        <p style={{ color: "red", fontSize: "14px" }}>{validationErrorUUID}</p>
                    )}
                </div>
                <div className="modal-field">
                    <label htmlFor="title" className="">Title</label>
                    <input
                        type="text"
                        id="title"
                        className=""
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={(e) => {
                            const value = e.target.value;
                            setValidationErrorTitle(null);
                            if (value === "") {
                                setValidationErrorTitle('Title is required');
                            }
                        }}
                    />
                    {validationErrorTitle && (
                        <p style={{ color: "red", fontSize: "14px" }}>{validationErrorTitle}</p>
                    )}
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
                <div className="modal-field">
                    <label htmlFor="file" className="">File</label>
                    <input
                        type="file"
                        id="file"
                        className=""
                        onChange={(e) => {
                            setValidationErrorFile(null);
                            handleFileChange(e);
                        }}
                    />
                    {validationErrorFile && (
                        <p style={{ color: "red", fontSize: "14px" }}>{validationErrorFile}</p>
                    )}
                </div>

                {error && (
                    <div style={{ color: "red", fontSize: "14px" }}>{error}</div>
                )}

                <div className="modal-field">
                    <button className="" onClick={handleUpload}>Upload</button>
                </div>
            </div>
        </div>
    );
};
