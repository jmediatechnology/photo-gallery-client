import axios from "axios";
import type {ApiErrorPayload} from "./types/ApiErrorPayload.ts";

const pickFirstString = (...values: unknown[]): string | undefined => {
    return values.find((v): v is string => typeof v === 'string' && v.length > 0);
};

export const extractErrorMessage = (err: unknown, fallback: string): string => {
    if (axios.isAxiosError<ApiErrorPayload>(err)) {
        const {message, title, errors}: ApiErrorPayload = err.response?.data ?? {};
        return pickFirstString(message, title, errors) ?? fallback;
    }

    if (err instanceof Error && err.message) {
        return err.message;
    }

    return fallback;
};
