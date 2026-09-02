import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('uuid', () => ({
    v4: vi.fn(() => 'a4168ffd-df31-4ba6-9988-a31f35998620'),
}));

import { createUuid } from './uuid';
import { v4 } from 'uuid';

describe('createUuid', () => {
    const originalCrypto = globalThis.crypto;

    afterEach(() => {
        Object.defineProperty(globalThis, 'crypto', {
            value: originalCrypto,
            configurable: true,
            writable: true,
        });
        vi.clearAllMocks();
    });

    it('uses crypto.randomUUID when available (secure context)', () => {
        const randomUUIDMock = vi.fn(() => '31574f14-ba18-426d-9bd7-c56fc0aa236c');
        Object.defineProperty(globalThis, 'crypto', {
            value: { randomUUID: randomUUIDMock },
            configurable: true,
            writable: true,
        });

        const uuid = createUuid();

        expect(uuid).toBe('31574f14-ba18-426d-9bd7-c56fc0aa236c');
        expect(randomUUIDMock).toHaveBeenCalledTimes(1);
        expect(v4).not.toHaveBeenCalled();
    });

    it('falls back to uuid package when crypto.randomUUID is not a function (insecure context)', () => {
        Object.defineProperty(globalThis, 'crypto', {
            value: { randomUUID: undefined },
            configurable: true,
            writable: true,
        });

        const uuid = createUuid();

        expect(uuid).toBe('a4168ffd-df31-4ba6-9988-a31f35998620');
        expect(v4).toHaveBeenCalledTimes(1);
    });

    it('falls back to uuid package when crypto is entirely undefined', () => {
        Object.defineProperty(globalThis, 'crypto', {
            value: undefined,
            configurable: true,
            writable: true,
        });

        const uuid = createUuid();

        expect(uuid).toBe('a4168ffd-df31-4ba6-9988-a31f35998620');
        expect(v4).toHaveBeenCalledTimes(1);
    });
});
