import '../../style/modal.css'
import {api} from "../../api/config.ts";
import * as React from "react";
import type {PhotographDTO} from "../../types";
import {useEscape} from "../../hooks/useEscape.tsx";
import {ThumbnailFooter} from "../ThumbnailFooter/ThumbnailFooter.tsx";
import {usePhotographs} from "../../context/PhotographContext.tsx";
import './PhotographShowModal.css';

interface PhotographModalProps {
    photo: PhotographDTO;
    onClose: () => void;
    onSelect: (photograph: PhotographDTO) => void;
}

export const PhotographShowModal: React.FC<PhotographModalProps> = ({ photo, onClose, onSelect }) => {
    useEscape(onClose);

    const {photographs} = usePhotographs();

    const selectedPhotoIndex: number = photographs.findIndex((element: PhotographDTO) => {
        return element.uuid === photo.uuid;
    });

    return (
        <div className="modal-overlay-show" onClick={onClose} data-testid="modal-overlay">
            <div className="modal-content-show background-black" onClick={(e) => e.stopPropagation()}>

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

                <img
                    src={api.url(photo.filePath)}
                    alt={photo.title}
                    className="modal-image"
                />

                {photo.description && <p className='description'>{photo.description}</p>}

                <ThumbnailFooter photographs={photographs} offset={selectedPhotoIndex} onSelect={onSelect} />
            </div>
        </div>
    );
}
