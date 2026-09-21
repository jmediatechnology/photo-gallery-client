import './PhotographSelectionDeleteModal.css';
import * as React from "react";
import type {PhotographDTO} from "../../types";
import {api} from "../../api/config.ts";
import {deletePhotograph} from "../../api/client.ts";
import {extractErrorMessage} from "../../api/error.ts";
import {useAuth} from "../../auth/AuthContext.tsx";
import {useEscape} from "../../hooks/useEscape.tsx";
import {usePhotographs} from "../../context/PhotographContext.tsx";
import {usePhotographSelection} from "../../context/PhotographSelectionContext.tsx";

type DeletionStatus = 'pending' | 'deleted' | 'failed';

interface DeletionResult {
    status: DeletionStatus,
    errorMessage?: string,
}

const STATUS_LABELS: Record<DeletionStatus, string> = {
    pending: 'Deleting…',
    deleted: 'Deleted',
    failed: 'Failed',
};

interface PhotographSelectionDeleteModalProps {
    onClose: () => void
}

export const PhotographSelectionDeleteModal: React.FC<PhotographSelectionDeleteModalProps> = (
    {onClose}: PhotographSelectionDeleteModalProps
) => {
    const { token } = useAuth();
    const { removePhotograph } = usePhotographs();
    const { selectedPhotographs, deselectPhotograph } = usePhotographSelection();

    /*
     * A snapshot taken once, when the modal opens. Successful deletions remove
     * photographs from the selection, but their rows must stay visible so each
     * result can be shown.
     */
    const [photographsToBeDeleted] = React.useState<PhotographDTO[]>(() => selectedPhotographs);
    const [results, setResults] = React.useState<Record<string, DeletionResult>>({});

    const hasStarted = Object.keys(results).length > 0;
    const isDeleting = Object.values(results).some((result: DeletionResult) => result.status === 'pending');
    const isFinished = hasStarted && !isDeleting;

    const handleClose = () => {
        if (isDeleting) {
            return;
        }

        onClose();
    };

    useEscape(handleClose);

    const updateResult = (uuid: string, result: DeletionResult) => {
        setResults((previous: Record<string, DeletionResult>) => ({...previous, [uuid]: result}));
    };

    const handleConfirm = () => {
        if (!token || hasStarted) {
            return;
        }

        setResults(createPendingResults(photographsToBeDeleted));

        photographsToBeDeleted.forEach((photograph: PhotographDTO) => {
            deletePhotograph({token, uuid: photograph.uuid})
                .then(() => {
                    updateResult(photograph.uuid, {status: 'deleted'});
                    removePhotograph(photograph.uuid);
                    deselectPhotograph(photograph.uuid);
                })
                .catch((error) => {
                    updateResult(photograph.uuid, {
                        status: 'failed',
                        errorMessage: extractErrorMessage(error, 'Failed to delete'),
                    });
                });
        });
    };

    return (
        <div className="modal-overlay" onClick={handleClose} data-testid="modal-overlay">
            <div className="modal-content padding-32 selection-delete-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        Delete {photographsToBeDeleted.length} {pluralizePhotograph(photographsToBeDeleted.length)}?
                    </h2>
                    <button
                        className="modal-close"
                        onClick={handleClose}
                        disabled={isDeleting}
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>

                <ul className="selection-delete-list">
                    {photographsToBeDeleted.map((photograph: PhotographDTO) => {
                        const result = results[photograph.uuid];

                        return (
                            <li
                                key={photograph.uuid}
                                className={`selection-delete-item${result?.status === 'deleted' ? ' selection-delete-item--deleted' : ''}`}
                            >
                                <img
                                    src={api.url(photograph.filePath)}
                                    alt={photograph.title}
                                    loading="lazy"
                                />
                                <div className="selection-delete-item-text">
                                    <span className="selection-delete-item-title">{photograph.title}</span>
                                    {result?.status === 'failed' && (
                                        <span className="selection-delete-item-error">{result.errorMessage}</span>
                                    )}
                                </div>
                                {result && (
                                    <span className={`selection-delete-item-status selection-delete-item-status--${result.status}`}>
                                        {STATUS_LABELS[result.status]}
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ul>

                <div className="modal-field">
                    {isFinished ? (
                        <button onClick={handleClose}>Close</button>
                    ) : (
                        <>
                            <button onClick={handleClose} disabled={isDeleting}>Cancel</button>
                            <button onClick={handleConfirm} disabled={isDeleting}>
                                {isDeleting ? 'Deleting…' : 'Delete'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const createPendingResults = (photographs: PhotographDTO[]): Record<string, DeletionResult> => {
    return photographs.reduce<Record<string, DeletionResult>>(
        (accumulator: Record<string, DeletionResult>, photograph: PhotographDTO) => {
            accumulator[photograph.uuid] = {status: 'pending'};
            return accumulator;
        },
        {}
    );
};

const pluralizePhotograph = (count: number): string => {
    return count === 1 ? 'photograph' : 'photographs';
};
