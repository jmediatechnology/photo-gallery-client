import {afterEach, describe, expect, test, vi} from "vitest";

/*
 * config.ts reads VITE_API_URL once, when it is first imported. Every test
 * therefore stubs the variable and imports a fresh copy of the module.
 */
describe('api config', () => {

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    test('uses VITE_API_URL as the base URL', async () => {
        const api = await loadConfig('https://api.example.com');

        expect(api.baseURL).toBe('https://api.example.com');
    });

    test('falls back to localhost:9000 when VITE_API_URL is empty', async () => {
        const api = await loadConfig('');

        expect(api.baseURL).toBe('http://localhost:9000');
    });

    test('removes trailing slashes from the base URL', async () => {
        const api = await loadConfig('https://api.example.com//');

        expect(api.baseURL).toBe('https://api.example.com');
    });

    test('url joins the base URL and the path', async () => {
        const api = await loadConfig('https://api.example.com');

        expect(api.url('/photographs')).toBe('https://api.example.com/photographs');
    });

    test('url adds a missing leading slash to the path', async () => {
        const api = await loadConfig('https://api.example.com');

        expect(api.url('photographs')).toBe('https://api.example.com/photographs');
    });

    test('url never produces a double slash when the base URL ends with one', async () => {
        const api = await loadConfig('https://api.example.com/');

        expect(api.url('/photographs')).toBe('https://api.example.com/photographs');
    });
});

const loadConfig = async (apiUrl: string) => {
    vi.resetModules();
    vi.stubEnv('VITE_API_URL', apiUrl);
    const {api} = await import('./config.ts');
    return api;
};
