import { globFiles, globPaths } from './glob.mjs';

/**
 *
 * @param {string} pattern
 * @param {string} cwd
 * @returns {Promise<string[]>}
 */
export async function findActions(pattern, cwd) {
    cwd = cwd || process.cwd();
    const foundDirs = await globPaths(pattern, cwd);

    const found = (await Promise.all(foundDirs.map(findActionsInFolder))).flatMap((a) => a);

    return found;
}

const isActionFile = /\baction\.ya?ml$/i;

async function findActionsInFolder(folder) {
    if (isActionFile.test(folder)) return [folder];
    const foundInFolder = await globFiles('{action.yaml,action.yml}', folder);
    if (foundInFolder.length) return foundInFolder;
    const found = await globFiles('*/{action.yaml,action.yml}', folder);
    return found;
}
