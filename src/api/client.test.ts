import {beforeEach, describe, expect, test, vi} from "vitest";
import type {PhotographDTO} from "../types";

/*
 * vi.hoisted keeps one set of axios mocks alive across vi.resetModules(), so
 * the freshly imported client and the assertions share the same functions.
 */
const axiosMock = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
}));

vi.mock("axios", () => ({
    default: axiosMock,
}));

vi.mock("./config", () => ({
    api: {
        url: (path: string) => `https://api.test${path}`,
    },
}));

const SUNSET = {uuid: '1', title: 'Sunset', description: '', filePath: '/sunset.jpg'} as PhotographDTO;

/*
 * client.ts caches the anonymous token in module state. A fresh import per
 * test keeps that cache from leaking between tests.
 */
let client: typeof import('./client.ts');

describe('api client', () => {

    beforeEach(async () => {
        vi.resetAllMocks();
        vi.resetModules();
        client = await import('./client.ts');
    });

    describe('getAnonymousToken', () => {

        test('fetches an anonymous token', async () => {
            axiosMock.get.mockResolvedValue({data: {token: 'anonymous-token'}});

            await expect(client.getAnonymousToken()).resolves.toBe('anonymous-token');
            expect(axiosMock.get).toHaveBeenCalledWith('https://api.test/api/login/anonymous');
        });

        test('reuses the token on later calls', async () => {
            axiosMock.get.mockResolvedValue({data: {token: 'anonymous-token'}});

            await client.getAnonymousToken();
            await expect(client.getAnonymousToken()).resolves.toBe('anonymous-token');

            expect(axiosMock.get).toHaveBeenCalledTimes(1);
        });

        test('does not remember a failed request', async () => {
            axiosMock.get
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({data: {token: 'anonymous-token'}});

            await expect(client.getAnonymousToken()).rejects.toThrow('Network error');
            await expect(client.getAnonymousToken()).resolves.toBe('anonymous-token');
        });
    });

    test('postLogin sends the credentials and returns the token', async () => {
        axiosMock.post.mockResolvedValue({data: {token: 'admin-token'}});

        const token = await client.postLogin({username: 'admin', password: 'secret'});

        expect(token).toBe('admin-token');
        expect(axiosMock.post).toHaveBeenCalledWith(
            'https://api.test/api/login_check',
            {username: 'admin', password: 'secret'}
        );
    });

    test('getPhotographs fetches the photographs with the anonymous token', async () => {
        axiosMock.get.mockImplementation((url: string) => {
            return url.endsWith('/api/login/anonymous')
                ? Promise.resolve({data: {token: 'anonymous-token'}})
                : Promise.resolve({data: [SUNSET]});
        });

        const photographs = await client.getPhotographs();

        expect(photographs).toEqual([SUNSET]);
        expect(axiosMock.get).toHaveBeenCalledWith(
            'https://api.test/photographs',
            {headers: {Authorization: 'Bearer anonymous-token'}}
        );
    });

    test('postPhotograph uploads the photograph as form data', async () => {
        axiosMock.post.mockResolvedValue({data: SUNSET});
        const file = new File(['image'], 'sunset.jpg', {type: 'image/jpeg'});

        const photograph = await client.postPhotograph({
            token: 'admin-token',
            uuid: '1',
            title: 'Sunset',
            description: 'Beautiful sunset',
            file,
        });

        expect(photograph).toEqual(SUNSET);
        const [url, formData, config] = axiosMock.post.mock.calls[0];
        expect(url).toBe('https://api.test/photographs');
        expect(formData.get('uuid')).toBe('1');
        expect(formData.get('title')).toBe('Sunset');
        expect(formData.get('description')).toBe('Beautiful sunset');
        expect((formData.get('0') as File).name).toBe('sunset.jpg');
        expect(config).toEqual({headers: {Authorization: 'Bearer admin-token'}});
    });

    test('deletePhotograph deletes the photograph with the given uuid', async () => {
        axiosMock.delete.mockResolvedValue({data: ''});

        await client.deletePhotograph({token: 'admin-token', uuid: '1'});

        expect(axiosMock.delete).toHaveBeenCalledWith(
            'https://api.test/photographs/1',
            {headers: {Authorization: 'Bearer admin-token'}}
        );
    });

    test('deletePhotograph passes a failed request on to the caller', async () => {
        axiosMock.delete.mockRejectedValue(new Error('Forbidden'));

        await expect(client.deletePhotograph({token: 'admin-token', uuid: '1'})).rejects.toThrow('Forbidden');
    });

    test('patchPhotograph sends the new title and description', async () => {
        const edited = {...SUNSET, title: 'Red sunset'};
        axiosMock.patch.mockResolvedValue({data: edited});

        const photograph = await client.patchPhotograph({
            token: 'admin-token',
            uuid: '1',
            title: 'Red sunset',
            description: null,
        });

        expect(photograph).toEqual(edited);
        expect(axiosMock.patch).toHaveBeenCalledWith(
            'https://api.test/photographs/1',
            {title: 'Red sunset', description: null},
            {headers: {Authorization: 'Bearer admin-token'}}
        );
    });

    test('postGenerateDescription requests a description for the photograph', async () => {
        axiosMock.post.mockResolvedValue({data: {description: 'A sunset over the sea'}});

        const result = await client.postGenerateDescription({token: 'admin-token', uuid: '1'});

        expect(result).toEqual({description: 'A sunset over the sea'});
        expect(axiosMock.post).toHaveBeenCalledWith(
            'https://api.test/photographs/1/generate-description',
            {},
            {headers: {Authorization: 'Bearer admin-token'}}
        );
    });
});
