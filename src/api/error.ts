// api/errors.ts
import axios from "axios";

export interface ApiErrorPayload {
    message?: string;
    title?: string;
}

export const extractErrorMessage = (err: unknown, fallback: string): string => {
    if (axios.isAxiosError<ApiErrorPayload>(err)) {
        return err.response?.data?.message ?? err.response?.data?.title ?? fallback;
    }
    if (err instanceof Error) {
        return err.message;
    }
    return fallback;
};
