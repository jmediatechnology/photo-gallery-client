// api/errors.ts
import axios from "axios";

export const extractErrorMessage = (err: unknown, fallback: string): string => {
    if (axios.isAxiosError(err)) {
        return err.response?.data?.message || err.response?.data?.title || fallback;
    }

    if (err instanceof Error && err.message) {
        return err.message;
    }

    return fallback;
};
