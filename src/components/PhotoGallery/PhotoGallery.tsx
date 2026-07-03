import './PhotoGallery.css';
import '../../style/spinner.css';
import '../../style/error.css';
import * as React from "react";
import type { PhotographDTO } from "../../types";
import {PhotographModal} from "../PhotographModal/PhotographModal.tsx";
import {PhotographDeleteModal} from "../PhotographDeleteModal/PhotographDeleteModal.tsx";
import {PhotographEditModal} from "../PhotographEditModal/PhotographEditModal.tsx";
import {usePhotographs} from "../../context/PhotographContext.tsx";
import {Photograph} from "../Photograph/Photograph.tsx";
import {useKeyboardNavigation} from "../../hooks/useKeyboardNavigation.tsx";

export const PhotoGallery = () => {
    const {photographs, isLoading, error} = usePhotographs();
    const [selectedPhoto, setSelectedPhoto] = React.useState<PhotographDTO | null | undefined>(null);
    const [selectedPhotoToBeDeleted, setSelectedPhotoToBeDeleted] = React.useState<PhotographDTO | null>(null);
    const [selectedPhotoToBeEdited, setSelectedPhotoToBeEdited] = React.useState<PhotographDTO | null>(null);

    const selectedPhotoIndex: number = photographs.findIndex((element: PhotographDTO) => {
        return element.uuid === selectedPhoto?.uuid;
    });

    useKeyboardNavigation(
        () => setSelectedPhoto(photographs.getNext(selectedPhotoIndex)),
        () => setSelectedPhoto(photographs.getPrev(selectedPhotoIndex))
    );

    if (isLoading) {
        return (
            <div className="spinner-container">
                <div className="spinner"></div>
                <div className="">Loading photographs...</div>
            </div>
        );
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (photographs.length === 0) {
        return <div className="warning">No photographs found</div>;
    }

    return (
        <>
            <div className="photo-gallery">
                {photographs.map((photograph: PhotographDTO, index: number) => (
                    <Photograph
                        key={index}
                        photograph={photograph}
                        onSelect={setSelectedPhoto}
                        onSelectForEdit={setSelectedPhotoToBeEdited}
                        onSelectForDelete={setSelectedPhotoToBeDeleted}
                    />
                ))}
            </div>

            {selectedPhoto && (
                <>
                    <PhotographModal
                        photo={selectedPhoto}
                        onClose={() => setSelectedPhoto(null)}
                        onSelect={setSelectedPhoto}
                    >
                    </PhotographModal>
                </>

            )}

            {selectedPhotoToBeDeleted && (
                <PhotographDeleteModal
                    photo={selectedPhotoToBeDeleted}
                    onClose={() => setSelectedPhotoToBeDeleted(null)}
                />
            )}

            {selectedPhotoToBeEdited && (
                <PhotographEditModal
                    photo={selectedPhotoToBeEdited}
                    onClose={() => setSelectedPhotoToBeEdited(null)}
                />
            )}
        </>
    );
};
