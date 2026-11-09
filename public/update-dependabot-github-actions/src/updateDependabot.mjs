import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMap, parseDocument, stringify as yamlStringify } from 'yaml';
import { findActions } from './findActions.mjs';
import { globFiles } from './glob.mjs';

const nodeComment = ' Automatically added by streetsidesoftware/public/update-dependabot-github-actions';

/**
 * Make sure the `github-actions` entries in the dependabot file cover every action found.
 *
 * Old style entries (one marked entry per action `directory`) are replaced by `directories` globs.
 * The file is only written when an action is not covered or old style entries remain.
 *
 * @param {string} actionsGlob - pattern used to find the action folders.
 * @param {string} dependabotFile - path to the dependabot file, searched for when empty.
 * @param {string|URL} cwd
 * @param {object} options
 */
export async function updateDependabot(actionsGlob, dependabotFile, cwd, options) {
    cwd = path.resolve(asPath(cwd || process.cwd()));
    options = normalizeOptions(options);
    actionsGlob = actionsGlob || '.github/actions';
    const depFile = await findDependabotFile(dependabotFile, cwd);

    if (!depFile || !(await isFile(depFile))) {
        throw new Error('Unable to find "dependabot.yml" file.');
    }

    const yamlDoc = await readDepFile(depFile);

    const actionsAbs = await findActions(actionsGlob, cwd);
    const actionFolders = normalizeActionsToFolders(actionsAbs, cwd);

    const result = updateDoc(yamlDoc, actionFolders, options);

    if (result.changes && !options.dryRun) {
        await fs.writeFile(depFile, yamlDoc.toString());
    }

    return {
        ...result,
        actionFolders,
        actionsGlob,
        options,
        dependabotFile: path.relative(cwd, depFile),
    };
}

/**
 * @param {import('yaml').Document} doc
 * @param {string[]} actionFolders - normalized directory entries, e.g. `/.github/actions/setup`
 * @param {object} options
 */
function updateDoc(doc, actionFolders, options) {
    /** @type {import('yaml').YAMLSeq} */
    const updates = doc.get('updates');
    const entries = updates.items.filter((item) => isMap(item) && item.get('package-ecosystem') === 'github-actions');

    const oldStyleEntries = entries.filter((entry) => isMarked(entry) && entry.has('directory'));
    const oldStyle = new Set(oldStyleEntries);
    const coverage = entries.filter((entry) => !oldStyle.has(entry)).flatMap(directoryPatterns);

    const uncovered = actionFolders.filter((dir) => !coverage.some((pattern) => path.posix.matchesGlob(dir, pattern)));
    const addedDirectories = [...new Set(uncovered.map(folderToGlob))].sort();

    const removedEntries = oldStyleEntries.map((entry) => entry.toJSON());
    const changes = removedEntries.length + addedDirectories.length;

    if (changes) {
        const insertAt = oldStyleEntries.length ? updates.items.indexOf(oldStyleEntries[0]) : updates.items.length;
        updates.items = updates.items.filter((item) => !oldStyle.has(item));
        if (addedDirectories.length) {
            addDirectories(doc, updates, insertAt, addedDirectories, options);
        }
    }

    return { changes, addedDirectories, removedEntries };
}

/**
 * Add the globs to the marked `directories` entry, creating it when there is none.
 * @param {import('yaml').Document} doc
 * @param {import('yaml').YAMLSeq} updates
 * @param {number} insertAt - where a new entry goes.
 * @param {string[]} globs
 * @param {object} options
 */
function addDirectories(doc, updates, insertAt, globs, options) {
    const existing = updates.items.find(
        (item) =>
            isMap(item) &&
            item.get('package-ecosystem') === 'github-actions' &&
            isMarked(item) &&
            item.has('directories'),
    );

    if (existing) {
        for (const glob of globs) {
            existing.get('directories').add(doc.createNode(glob));
        }
        return;
    }

    const value = {
        'package-ecosystem': 'github-actions',
        directories: globs,
        schedule: { interval: options.interval },
    };
    if (options.prefix) {
        value['commit-message'] = { prefix: options.prefix };
    }
    const node = doc.createNode(value);
    node.spaceBefore = true;
    node.commentBefore = nodeComment;
    updates.items.splice(insertAt, 0, node);
}

/**
 * @param {import('yaml').YAMLMap} entry
 * @returns {boolean}
 */
function isMarked(entry) {
    return !!entry.commentBefore?.includes(nodeComment.trim());
}

/**
 * The directory patterns a `github-actions` entry covers.
 * @param {import('yaml').YAMLMap} entry
 * @returns {string[]}
 */
function directoryPatterns(entry) {
    const directories = entry.get('directories')?.toJSON() ?? [entry.get('directory')];
    return directories.filter((dir) => typeof dir === 'string').map(normalizeDirectoryEntry);
}

/**
 * The `directories` glob that covers an action folder and its siblings.
 * @param {string} dir - normalized directory entry
 * @returns {string}
 */
function folderToGlob(dir) {
    return dir === '/' ? dir : path.posix.join(path.posix.dirname(dir), '*');
}

/**
 * @param {string} dependabotFile
 * @param {string} cwd
 * @returns {Promise<string | undefined>}
 */
async function findDependabotFile(dependabotFile, cwd) {
    if (dependabotFile) return path.resolve(cwd, dependabotFile);

    const found = await globFiles('.github/dependabot.{yml,yaml}', cwd);
    return found[0];
}

/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
async function isFile(path) {
    try {
        const s = await fs.stat(path);
        return s.isFile();
    } catch {
        return false;
    }
}

/**
 * @param {string} path
 * @returns {Promise<import('yaml').Document>}
 */
async function readDepFile(path) {
    const content = await fs.readFile(path, 'utf8');
    return parseDocument(content);
}

/**
 * @param {string | URL} pathOrUrl
 * @returns {string}
 */
function asPath(pathOrUrl) {
    return pathOrUrl instanceof URL ? fileURLToPath(pathOrUrl) : pathOrUrl;
}

/**
 * @param {string[]} actions - absolute paths to action files
 * @param {string} cwd
 * @returns {string[]}
 */
function normalizeActionsToFolders(actions, cwd) {
    return actions.map((p) => normalizeDirectoryEntry(path.dirname(path.relative(cwd, p))));
}

/**
 * Write a directory the way dependabot expects it: a leading `/` and no trailing `/`.
 * @param {string} dir
 * @returns {string}
 */
function normalizeDirectoryEntry(dir) {
    return (
        '/' +
        dir
            .split('/')
            .filter((part) => !!part && part !== '.')
            .join('/')
    );
}

function normalizeOptions(options) {
    options = { ...(options || {}) };
    options.interval ??= 'daily';
    options.dryRun ??= options.dry_run;
    return options;
}

export function generateSummary(result) {
    const yamlStart = '```yaml';
    const yamlEnd = '```';
    return `\
## Update Dependabot File

File: \`${result.dependabotFile}\`

- Directories added: ${result.addedDirectories.length}
- Old style entries removed: ${result.removedEntries.length}

### Directories Added

${yamlStart}
${yamlStringify(result.addedDirectories)}
${yamlEnd}

### Old Style Entries Removed

${yamlStart}
${yamlStringify(result.removedEntries)}
${yamlEnd}

### Action Folders Found

${yamlStart}
${yamlStringify(result.actionFolders)}
${yamlEnd}

### Action Search Glob
- glob: \`${result.actionsGlob}\`

### Options

${yamlStart}
${yamlStringify(result.options)}
${yamlEnd}
`;
}
