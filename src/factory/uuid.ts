import { v4 } from 'uuid';

/**
 * Generates a v4 UUID.
 *
 * Prefers the native Web Crypto API (`crypto.randomUUID`), which is only
 * available in secure contexts (HTTPS, or localhost as a special case).
 * Falls back to the `uuid` package's v4() — built on `crypto.getRandomValues`,
 * which has no secure-context restriction — for plain-HTTP deployments.
 *
 * Once the app is served over HTTPS everywhere, this automatically starts
 * using the native implementation with zero call-site changes.
 */
export function createUuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return v4();
}
