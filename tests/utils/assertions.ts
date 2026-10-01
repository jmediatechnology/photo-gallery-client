export function assertIsFormData(value: unknown): asserts value is FormData {
    if (!(value instanceof FormData)) {
        throw new Error(`Expected FormData, received ${typeof value}`);
    }
}
