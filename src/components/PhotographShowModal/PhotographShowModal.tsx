import '../../style/modal.css'
import {api} from "../../api/config.ts";
import * as React from "react";
import type {PhotographDTO} from "../../types";
import {useEscape} from "../../hooks/useEscape.tsx";
import {useSlideShow} from "../../hooks/useSlideShow.tsx";
import {ThumbnailFooter} from "../ThumbnailFooter/ThumbnailFooter.tsx";
import {ActionFooter} from "../ActionFooter/ActionFooter.tsx";
import {usePhotographs} from "../../context/PhotographContext.tsx";
import './PhotographShowModal.css';
import {useImageZoom} from "../../hooks/useImageZoom.tsx";

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

    const { isPlaying, toggleSlideshow } = useSlideShow(photographs, selectedPhotoIndex, onSelect);
    const { containerRef, containerProps, imageStyle } = useImageZoom({ resetKey: photo.uuid });

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

                <div className="modal-photograph">
                    <div className="modal-photograph-image" ref={containerRef} {...containerProps} >
                        <img
                            src={api.url(photo.filePath)}
                            alt={photo.title}
                            className="modal-image"
                            style={{ ...imageStyle }}
                        />
                    </div>

                    {photo.description && <p className='description'>{photo.description}</p>}
                </div>

                <ThumbnailFooter photographs={photographs} offset={selectedPhotoIndex} onSelect={onSelect} />
                <ActionFooter isPlaying={isPlaying} onToggleSlideshow={toggleSlideshow} />
            </div>
        </div>
    );
}
