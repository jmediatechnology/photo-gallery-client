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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async() => {

        if (!token) {
            return;
        }

        if (!file) {
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
                        onChange={(e) => setUuid(e.target.value)}
                    />
                </div>
                <div className="modal-field">
                    <label htmlFor="title" className="">Title</label>
                    <input
                        type="text"
                        id="title"
                        className=""
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
                <div className="modal-field">
                    <label htmlFor="file" className="">File</label>
                    <input
                        type="file"
                        id="file"
                        className=""
                        onChange={handleFileChange}
                    />
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
