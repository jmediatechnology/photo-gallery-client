// api/errors.ts
import axios from "axios";
import type {ApiErrorPayload} from "./types/ApiErrorPayload.ts";

export const extractErrorMessage = (err: unknown, fallback: string): string => {
    if (axios.isAxiosError<ApiErrorPayload>(err)) {
        return err.response?.data?.message || err.response?.data?.title || fallback;
    }

    if (err instanceof Error && err.message) {
        return err.message;
    }

    return fallback;
};
