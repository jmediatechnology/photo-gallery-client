import * as React from "react";
import {postLogin} from "../../api/client.ts";
import {useAuth} from "../../auth/AuthContext.tsx";
import './loginModal.css'
import {extractErrorMessage} from "../../api/error.ts";

interface LoginModalProps {
    onClose: () => void
}

export const LoginModal: React.FC<LoginModalProps> = ({onClose}) => {

    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');

    const [error, setError] = React.useState<string | null>(null);

    const { setToken } = useAuth();

    const handleLogin = () => {
        postLogin({username, password})
            .then((token) => {
                setToken(token);
                onClose();
            })
            .catch((response) => {
                setError(extractErrorMessage(response, 'Failed to login'));
            });
    };

    return (
        <div className="modal-overlay-login" onClick={onClose} data-testid="modal-overlay">
            <div className="modal-content-login background-black padding-32" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Login</h2>
                        <button
                            className="modal-close"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            &times;
                        </button>
                    </div>
                    <div className="modal-field">
                        <label htmlFor="username" className="">Username</label>
                        <input
                            type="text"
                            id="username"
                            className=""
                            placeholder="Enter your username"
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="modal-field">
                        <label htmlFor="password" className="">Password</label>
                        <input
                            type="password"
                            id="password"
                            className=""
                            placeholder="Enter your password"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div style={{ color: "red", fontSize: "14px" }}>{error}</div>
                    )}

                    <div className="modal-field">
                        <button className="" onClick={handleLogin}>Login</button>
                    </div>
            </div>
        </div>
    );
};
