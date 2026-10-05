import {Logo} from "../Logo/Logo.tsx";
import './NavBar.css';
import * as React from "react";
import {FaTrashAlt} from "react-icons/fa";
import {LoginModal} from "../LoginModal/LoginModal.tsx";
import {useAuth} from "../../context/AuthContext.tsx";
import {PhotographUploadModal} from "../PhotographUploadModal/PhotographUploadModal.tsx";
import {PhotographSelectionDeleteModal} from "../PhotographSelectionDeleteModal/PhotographSelectionDeleteModal.tsx";
import {usePhotographSelection} from "../../context/PhotographSelectionContext.tsx";
import {useDeleteKeyboardKey} from "../../hooks/useDeleteKeyboardKey.tsx";
import {PhotographTitleSearch} from "../PhotographTitleSearch/PhotographTitleSearch.tsx";
import {usePhotographs} from "../../context/PhotographContext.tsx";
import {PhotographSortDropdown} from "../PhotographSortDropdown/PhotographSortDropdown.tsx";
import {isAnyModalOpen} from "../../dom/isAnyModalOpen.ts";

export const NavBar = () => {

    const [isOpenLoginModal, setIsOpenLoginModal] = React.useState<boolean>(false);
    const [isOpenUploadModal, setIsOpenUploadModal] = React.useState<boolean>(false);
    const [isOpenSelectionDeleteModal, setIsOpenSelectionDeleteModal] = React.useState<boolean>(false);
    const { username, roles } = useAuth();
    const { searchPhotographsByTitle, sort, sortPhotographs } = usePhotographs();
    const { selectedPhotographs } = usePhotographSelection();

    const isAdmin = Boolean(roles?.includes('ROLE_ADMIN'));
    const amountOfSelectedPhotographs = selectedPhotographs.length;

    const openSelectionDeleteModalIfNoModalIsOpen = React.useCallback(() => {
        if (isAnyModalOpen()) {
            return;
        }

        setIsOpenSelectionDeleteModal(true);
    }, []);

    useDeleteKeyboardKey(isAdmin && amountOfSelectedPhotographs > 0, openSelectionDeleteModalIfNoModalIsOpen);

    return (
        <>
            <nav className="navbar">
                <div className="navbar-left">
                    <div className='logo'>
                        <Logo />
                    </div>
                    <PhotographTitleSearch onSearch={searchPhotographsByTitle} />
                    <PhotographSortDropdown sort={sort} onSort={sortPhotographs} />
                    {amountOfSelectedPhotographs > 0 && (
                        <div className="navbar-selection">
                            <span className="navbar-selection-count" data-testid="navbar-selection-count">
                                {amountOfSelectedPhotographs} selected
                            </span>
                            {isAdmin && (
                                <a
                                    href="#"
                                    className="navbar-action"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        setIsOpenSelectionDeleteModal(true);
                                    }}
                                >
                                    <FaTrashAlt /> Delete selected
                                </a>
                            )}
                        </div>
                    )}
                </div>
                <div className="navbar-center">
                    { isAdmin ?
                        <ul className="nav-links">
                            <li>
                                <a
                                    href='#'
                                    onClick={() => setIsOpenUploadModal(true)}
                                >
                                    Upload
                                </a>
                            </li>
                        </ul> : <></> }
                </div>
                <div className="navbar-right">
                    {username ? (
                        <>
                            <p>Logged in as <strong>{username}</strong></p>
                            <ul className="nav-links">
                                <li>
                                    <a
                                        href="#"
                                        onClick={() => location.reload()}
                                    >
                                        Logout
                                    </a>
                                </li>
                            </ul>
                        </>
                    ) : (
                        <ul className="nav-links">
                            <li>
                                <a
                                    href="#"
                                    onClick={() => setIsOpenLoginModal(true)}
                                >
                                    Login
                                </a>
                            </li>
                        </ul>
                    )}
                </div>
            </nav>

            {isOpenLoginModal && (
                <LoginModal onClose={() => setIsOpenLoginModal(false)} />
            )}

            {isOpenUploadModal && (
                <PhotographUploadModal onClose={() => setIsOpenUploadModal(false)} />
            )}

            {isOpenSelectionDeleteModal && (
                <PhotographSelectionDeleteModal onClose={() => setIsOpenSelectionDeleteModal(false)} />
            )}
        </>
    );
};
