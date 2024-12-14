/**
 * Extracts the file extension from a MIME type and sends a response if invalid.
 * 
 * @param mimeType - The MIME type string (e.g., "image/jpeg").
 * @returns The file extension as a string (e.g., "jpeg") or undefined if invalid.
 */
export function getExtensionFromMimeType(mimeType: string): string | undefined {
    if (!mimeType.includes('/')) {
        return undefined; // Stop further processing
    }

    const parts = mimeType.split('/');
    const extension = parts[1];

    if (!extension) {
        return undefined;
    }

    return extension;
}
