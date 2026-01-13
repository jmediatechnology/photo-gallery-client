import {Logo} from "../Logo/Logo.tsx";
import './NavBar.css';
import * as React from "react";
import {LoginModal} from "../LoginModal/LoginModal.tsx";
import {useAuth} from "../../auth/AuthContext.tsx";
import {PhotographUploadModal} from "../PhotographUploadModal/PhotographUploadModal.tsx";

export const NavBar = () => {

    const [isOpenLoginModal, setIsOpenLoginModal] = React.useState<boolean>(false);
    const [isOpenUploadModal, setIsOpenUploadModal] = React.useState<boolean>(false);
    const { username, roles } = useAuth();

    return (
        <>
            <nav className="navbar">
                <div className="navbar-left">
                    <div className='logo'>
                        <Logo />
                    </div>
                </div>
                <div className="navbar-center">
                    { roles?.includes('ROLE_ADMIN') ?
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
        </>
    );
};
