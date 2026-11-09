import { glob } from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Find the files and directories that match a pattern.
 * @param {string} pattern
 * @param {string} cwd
 * @returns {Promise<string[]>} absolute paths
 */
export async function globPaths(pattern, cwd) {
    const found = await Array.fromAsync(glob(pattern, { cwd }));
    return found.map((relPath) => path.resolve(cwd, relPath));
}

/**
 * Find the files that match a pattern. Directories are skipped.
 * @param {string} pattern
 * @param {string} cwd
 * @returns {Promise<string[]>} absolute paths
 */
export async function globFiles(pattern, cwd) {
    const entries = await Array.fromAsync(glob(pattern, { cwd, withFileTypes: true }));
    return entries.filter((entry) => entry.isFile()).map((entry) => path.join(entry.parentPath, entry.name));
}
