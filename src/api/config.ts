import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||      // Vite
    // process.env.REACT_APP_API_URL ||     // CRA
    'http://localhost:9000';             // fallback


export const api = {
    baseURL: API_BASE_URL.replace(/\/+$/, ""), // removes trailing slashes

    // Helper to build full URLs
    url: (path: string) => {
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        return `${api.baseURL}${cleanPath}`;
    },

    instance: axios.create({
        baseURL: API_BASE_URL,
        headers: { "Content-Type": "application/json" },
    }),
};
