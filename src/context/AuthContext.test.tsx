import {act, renderHook} from "@testing-library/react";
import * as React from "react";
import {describe, expect, test, vi} from "vitest";
import {AuthProvider, useAuth} from "./AuthContext.tsx";

const ADMIN_TOKEN = createToken({username: 'admin', roles: ['ROLE_ADMIN']});
const USER_TOKEN = createToken({username: 'user', roles: ['ROLE_USER']});

describe('AuthContext', () => {

    test('starts signed out', () => {
        const {result} = renderAuth();

        expect(result.current.token).toBeNull();
        expect(result.current.username).toBeNull();
        expect(result.current.roles).toBeNull();
    });

    test('setToken signs in with the username and roles from the token', async () => {
        const {result} = renderAuth();

        await act(async () => result.current.setToken(ADMIN_TOKEN));

        expect(result.current.token).toBe(ADMIN_TOKEN);
        expect(result.current.username).toBe('admin');
        expect(result.current.roles).toEqual(['ROLE_ADMIN']);
    });

    test('setToken leaves username and roles empty when the token has none', async () => {
        const {result} = renderAuth();
        const anonymousToken = createToken({});

        await act(async () => result.current.setToken(anonymousToken));

        expect(result.current.token).toBe(anonymousToken);
        expect(result.current.username).toBeNull();
        expect(result.current.roles).toBeNull();
    });

    test('setToken replaces the username and roles of the previous token', async () => {
        const {result} = renderAuth();
        await act(async () => result.current.setToken(ADMIN_TOKEN));

        await act(async () => result.current.setToken(USER_TOKEN));

        expect(result.current.username).toBe('user');
        expect(result.current.roles).toEqual(['ROLE_USER']);
    });

    test('setToken with null signs out', async () => {
        const {result} = renderAuth();
        await act(async () => result.current.setToken(ADMIN_TOKEN));

        await act(async () => result.current.setToken(null));

        expect(result.current.token).toBeNull();
        expect(result.current.username).toBeNull();
        expect(result.current.roles).toBeNull();
    });

    /*
     * The throw is caught inside act on purpose. If it escaped, act would
     * discard the queued updates and hide a partial update that the browser
     * would apply.
     */
    test('setToken rejects an invalid token and keeps the current session', async () => {
        const {result} = renderAuth();
        await act(async () => result.current.setToken(ADMIN_TOKEN));

        await act(async () => {
            expect(() => result.current.setToken('not-a-jwt')).toThrow();
        });

        expect(result.current.token).toBe(ADMIN_TOKEN);
        expect(result.current.username).toBe('admin');
        expect(result.current.roles).toEqual(['ROLE_ADMIN']);
    });

    test('useAuth throws outside its provider', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used inside AuthProvider');
    });
});

function renderAuth() {
    return renderHook(() => useAuth(), {
        wrapper: ({children}: {children: React.ReactNode}) => <AuthProvider>{children}</AuthProvider>,
    });
}

/*
 * jwtDecode only decodes the payload and never verifies the signature, so a
 * placeholder signature is enough. A function declaration is hoisted, which
 * lets the token constants at the top of the file use it.
 */
function createToken(payload: object): string {
    const header = {alg: 'HS256', typ: 'JWT'};
    return `${toBase64Url(header)}.${toBase64Url(payload)}.signature`;
}

function toBase64Url(value: object): string {
    return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
