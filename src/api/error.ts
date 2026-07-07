// api/errors.ts
import axios from "axios";

export interface ApiErrorPayload {
    message?: string;
    title?: string;
}

export const extractErrorMessage = (err: unknown, fallback: string): string => {
    if (axios.isAxiosError<ApiErrorPayload>(err)) {
        return err.response?.data?.message || err.response?.data?.title || fallback;
    }

    if (err instanceof Error && err.message) {
        return err.message;
    }

    if (err !== null &&
        typeof err === 'object' &&
        'message' in err &&
        typeof err.message === 'string') {
        return err.message || fallback;
    }

    return fallback;
};
