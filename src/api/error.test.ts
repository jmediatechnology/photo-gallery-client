import {type ApiErrorPayload, extractErrorMessage} from "./error.ts";
import {
    AxiosError
} from "axios";


const createAxiosError = (
    data?: ApiErrorPayload,
    status: number = 400,
    statusText: string = 'Bad Request'
): AxiosError => {
    return new AxiosError(
        'Request failed with status code 422',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
            data,
            status,
            statusText,
            headers: {},
            config: {} as never,
        }
    );
};

describe('error', () => {

    test('returns error message', () => {
        const error = new Error('My error message');
        expect(extractErrorMessage(error, 'Fallback error message')).toBe('My error message');
    });

    test('returns axios error message', () => {
        const error = createAxiosError({ message: 'Axios error message' });
        expect(extractErrorMessage(error, 'Fallback error message')).toBe('Axios error message');
    });

    test('returns axios error title', () => {
        const error = createAxiosError({ title: 'Axios error title' });
        expect(extractErrorMessage(error, 'Fallback error message')).toBe('Axios error title');
    });

    test('returns axios error has no data', () => {
        const error = createAxiosError();
        expect(extractErrorMessage(error, 'Fallback error message')).toBe('Fallback error message');
    });

    test('returns fallback when there is no response object at all (network error)', () => {
        const error = new AxiosError('Network Error', 'ERR_NETWORK');
        expect(extractErrorMessage(error, 'Fallback error message')).toBe('Fallback error message');
    });

    test('returns fallback for a spoofed object that looks axios-shaped but is not', () => {
        const fakeError = { response: { data: { message: 'spoofed message' } } };
        expect(extractErrorMessage(fakeError, 'Fallback error message')).toBe('Fallback error message');
    });

    test('returns from custom object the message', () => {
        const customObject = { message: 'My error message' };
        expect(extractErrorMessage(customObject, 'Fallback error message')).toBe('My error message');
    });

    test('returns fallback for null', () => {
        expect(extractErrorMessage(null, 'Fallback error message')).toBe('Fallback error message');
    });
});
