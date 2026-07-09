import * as React from "react";
import {postPhotograph} from "../../api/client.ts";
import {useAuth} from "../../auth/AuthContext.tsx";
import type {PhotographDTO} from "../../types";
import {usePhotographs} from "../../context/PhotographContext.tsx";
import {useEscape} from "../../hooks/useEscape.tsx";
import {extractErrorMessage} from "../../api/error.ts";

interface UploadModalProps {
    onClose: () => void
}

export const PhotographUploadModal: React.FC<UploadModalProps> = ({onClose}: UploadModalProps) => {
    useEscape(onClose);
    const { token } = useAuth();
    const { addPhotograph } = usePhotographs();
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [files, setFiles] = React.useState<File[]>([]);
    const [isBusy, setIsBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [validationErrorTitle, setValidationErrorTitle] = React.useState<string | null>(null);
    const [validationErrorFile, setValidationErrorFile] = React.useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = () => {

        if (!token || isBusy) {
            return;
        }

        setIsBusy(true);

        if (title.length === 0) {
            setValidationErrorTitle('Title is required');
            return;
        }

        if (files.length === 0) {
            setValidationErrorFile('No file specified');
            return;
        }

        Promise.all(
            files.map(
                async (file: File, index: number) => {
                    const response: PhotographDTO = await postPhotograph({
                        token,
                        uuid: crypto.randomUUID(),
                        title: index === 0 ? title : `${title} ${index}`,
                        description,
                        file
                    });
                    return addPhotograph(response);
                }
            )
        ).then(() => {
            onClose();
        }).catch((response) => {
            setError(extractErrorMessage(response, 'Failed to upload'));
        }).finally(() => {
            setIsBusy(false);
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose} data-testid="modal-overlay">
            <div className="modal-content padding-32" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Upload</h2>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        &times;
                    </button>
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
                        data-testid="muli-file-upload-input-element"
                        type="file"
                        id="file"
                        className=""
                        onChange={(e) => {
                            setValidationErrorFile(null);
                            handleFileChange(e);
                        }}
                        multiple
                    />
                    {validationErrorFile && (
                        <p style={{ color: "red", fontSize: "14px" }}>{validationErrorFile}</p>
                    )}
                </div>

                {error && (
                    <div style={{ color: "red", fontSize: "14px" }}>{error}</div>
                )}

                <div className="modal-field">
                    <button className="" onClick={handleUpload} disabled={isBusy}>Upload</button>
                </div>
            </div>
        </div>
    );
};
