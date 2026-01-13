import React, { createContext, useContext, useState } from "react";
import {jwtDecode} from "jwt-decode";

interface JwtPayload {
    username?: string;
    roles?: string[];
}

interface AuthContextType {
    token: string | null;
    username: string | null;
    roles: string[] | null;
    setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setTokenState] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [roles, setRoles] = useState<string[] | null>(null);

    const setToken = (jwtToken: string | null) => {
        setTokenState(jwtToken);

        if (jwtToken) {
            const payload: JwtPayload = jwtDecode(jwtToken);
            setUsername(payload.username ?? null);
            setRoles(payload.roles ?? null);
        } else {
            setUsername(null);
            setRoles(null);
        }
    };

    return (
        <AuthContext.Provider value={{ token, username, roles, setToken }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const authContext = useContext(AuthContext);
    if (!authContext) throw new Error("useAuth must be used inside AuthProvider");
    return authContext;
};
