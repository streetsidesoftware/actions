import { glob } from 'glob';

/**
 *
 * @param {string} pattern
 * @param {string|URL} cwd
 * @returns {string[]}
 */
export async function findActions(pattern, cwd) {
    cwd = cwd || process.cwd();
    const foundDirs = await glob(pattern, { dot: true, cwd, absolute: true });

    const found = (await Promise.all(foundDirs.map(findActionsInFolder))).flatMap((a) => a);

    return found;
}

const isActionFile = /\baction\.ya?ml$/i;

async function findActionsInFolder(folder) {
    if (isActionFile.test(folder)) return [folder];
    // cspell:ignore nodir
    const foundInFolder = await glob('{action.yaml,action.yml}', { cwd: folder, nodir: true, absolute: true });
    if (foundInFolder.length) return foundInFolder;
    const found = await glob('*/{action.yaml,action.yml}', { cwd: folder, nodir: true, absolute: true });
    return found;
}
