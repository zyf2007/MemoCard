/**
 * Lightweight deterministic hash for id generation.
 * Uses FNV-1a 32-bit and outputs a fixed 8-char hex string.
 */
export const generateMD5 = (str: string): string => {
    let hash = 0x811c9dc5;

    for (let i = 0; i < str.length; i += 1) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }

    return (hash >>> 0).toString(16).padStart(8, '0');
};
