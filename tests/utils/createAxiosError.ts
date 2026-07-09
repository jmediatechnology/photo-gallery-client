import { AxiosError } from "axios";
import type {ApiErrorPayload} from "../../src/api/types/ApiErrorPayload.ts";

export const createAxiosError = (
    responseData?: ApiErrorPayload,
    code: string = 'ERR_BAD_REQUEST',
    status: number = 400,
    statusText: string = 'Bad Request'
): AxiosError => {
    return new AxiosError(
        `Request failed with status code ${status}`,
        code,
        undefined,
        undefined,
        {
            data: responseData,
            status,
            statusText,
            headers: {},
            config: {} as never,
        }
    );
};
