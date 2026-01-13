import '../../style/modal.css'
import {api} from "../../api/config.ts";
import * as React from "react";
import type {PhotographDTO} from "../../types";
import {useEscape} from "../../hooks/useEscape.tsx";

interface PhotographModalProps {
    photo: PhotographDTO;
    onClose: () => void;
}

export const PhotographModal: React.FC<PhotographModalProps> = ({ photo, onClose }) => {
    useEscape(onClose);

    return (
        <div className="modal-overlay" onClick={onClose} data-testid="modal-overlay">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <img
                    src={api.url(photo.filePath)}
                    alt={photo.title}
                    className="modal-image"
                />

                <div className="modal-caption">
                    <h2>{photo.title}</h2>
                    {photo.description && <p>{photo.description}</p>}
                </div>
            </div>
        </div>
    );
}
