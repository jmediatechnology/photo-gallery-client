import {extractErrorMessage} from "./error.ts";
import {createAxiosError} from "../../tests/utils/createAxiosError.ts";
import {AxiosError} from "axios";

describe('error', () => {

    test('returns error message for error object', () => {
        const error = new Error('My error message');
        expect(extractErrorMessage(error, 'Fallback error message')).toBe('My error message');
    });

    test('returns axios error response message when axios error response has message', () => {
        const error = createAxiosError({ message: 'Axios error message' });
        expect(extractErrorMessage(error, 'Fallback error message')).toBe('Axios error message');
    });

    test('returns axios error response title when axios error response message is not set but title is set', () => {
        const error = createAxiosError({ title: 'Axios error title' });
        expect(extractErrorMessage(error, 'Fallback error message')).toBe('Axios error title');
    });

    test('returns axios error response title when axios error response message is empty string and title is set', () => {
        const error = createAxiosError({ message: '', title: 'Axios error title' });
        expect(extractErrorMessage(error, 'Fallback error message')).toBe('Axios error title');
    });

    test('returns fallback when axios error response message is an empty string and title is also absent', () => {
        const error = createAxiosError({ message: '' });
        expect(extractErrorMessage(error, 'Fallback error message')).toBe('Fallback error message');
    });

    test('returns fallback when axios error has no response object (network error)', () => {
        const error = createAxiosError(undefined);
        expect(extractErrorMessage(error, 'Fallback error message')).toBe('Fallback error message');
    });

    test('returns fallback for a genuine network error with no response at all', () => {
        const error = new AxiosError('Network Error', 'ERR_NETWORK');
        expect(extractErrorMessage(error, 'Fallback error message')).toBe('Fallback error message');
    });

    test('returns fallback for a spoofed object that looks axios-shaped but is not', () => {
        const error = { response: { data: { message: 'spoofed message' } } };
        expect(extractErrorMessage(error, 'Fallback error message')).toBe('Fallback error message');
    });

    test('returns fallback for null', () => {
        expect(extractErrorMessage(null, 'Fallback error message')).toBe('Fallback error message');
    });
});
