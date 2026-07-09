import { AxiosError } from "axios";

interface AxiosErrorResponseData {
    message?: string;
    title?: string;
}

export const createAxiosError = (
    responseData?: AxiosErrorResponseData,
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
