import { glob } from 'glob';
import { minimatch } from 'minimatch';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Document, parseDocument, visitAsync, stringify as yamlStringify } from 'yaml';
import { findActions } from './findActions.mjs';

const nodeComment = ' Automatically added by streetsidesoftware/public/update-dependabot-github-actions';

/**
 * Update Dependabot
 * @param {string} actionsGlob
 * @param {string} dependabotFile
 * @param {string|URL} cwd
 */
export async function updateDependabot(actionsGlob, dependabotFile, cwd, options) {
    cwd = cwd || process.cwd();
    cwd = asPath(cwd);
    cwd = path.resolve(cwd);
    options = normalizeOptions(options);
    actionsGlob = actionsGlob || '.github/actions';
    const depFile = await findDependabotFile(dependabotFile, cwd);

    if (!(await isFile(depFile))) {
        throw new Error('Unable to find "dependabot.yml" file.');
    }

    const yamlDoc = await readDepFile(depFile);

    const actionsAbs = await findActions(actionsGlob, cwd);
    const actionFolders = normalizeActionsToFolders(actionsAbs, cwd);

    const result = await updateDoc(yamlDoc, actionFolders, actionsGlob, cwd, options);

    if (!options.dryRun) {
        await fs.writeFile(depFile, yamlDoc.toString());
    }

    result.dependabotFile = path.relative(cwd, depFile);

    return result;
}

/**
 *
 * @param {import('yaml').Document} doc
 * @param {string[]} actionFolders
 * @param {string} cwd
 */
async function updateDoc(doc, actionFolders, actionsGlob, cwd, options) {
    const foldersToProcess = new Set(actionFolders);
    const actionsTaken = [];
    /**
     * @type {{path: (string | number)[], value: any}[]}
     */
    const changes = [];
    /**
     * @type {{path: (string | number)[], value: any}[]}
     */
    const additions = [];
    /**
     * @type {{ path: (string | number)[]}[]}
     */
    const removals = [];

    const pathToInterval = ['schedule', 'interval'];

    const pattern = '{,/}' + actionsGlob + '{,/*}';
    const doesMatchGlobs = minimatch.filter(pattern, { dot: true });

    const result = {
        changes: 0,
        actionFolders,
        actionsGlob,
        options,
        actionsTaken,
    };

    /** @type {import('yaml').YAMLSeq} */
    const secUpdate = doc.get('updates');

    await visitAsync(secUpdate, {
        async Map(key, node, _parent) {
            return (await processExistingNode(node, key)) || visitAsync.SKIP;
        },
    });

    calcAdditions();

    processChanges();

    result.actionsTaken = [...new Map(actionsTaken)].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    result.changedActions = result.actionsTaken.filter(([_, action]) => action === 'changed').map(([dir]) => dir);
    result.addedActions = result.actionsTaken.filter(([_, action]) => action === 'added').map(([dir]) => dir);
    result.removedActions = result.actionsTaken.filter(([_, action]) => action === 'removed').map(([dir]) => dir);
    result.changes = result.actionsTaken.filter(([_, changed]) => !!changed).length;

    return result;

    /**
     * @param {import('yaml').YAMLMap} node
     * @param {number} index
     * @return {Promise<void | symbol>}
     */
    async function processExistingNode(node, index) {
        const ecoSystem = node.get('package-ecosystem');
        if (ecoSystem !== 'github-actions') return;
        const directory = node.get('directory');
        if (!directory) return;

        const dir = normalizeDirectoryEntry(directory);

        if (foldersToProcess.has(dir)) {
            const interval = node.getIn(pathToInterval);
            if (interval !== options.interval) {
                changes.push({ path: ['updates', index, ...pathToInterval], value: options.interval });
                actionsTaken.push([directory, 'changed']);
            } else {
                actionsTaken.push([directory, '']);
            }
            foldersToProcess.delete(dir);
            return;
        }
        const matches = doesMatchGlobs(dir);
        if (!matches) return;

        const exists = await isDir(path.join(cwd, dir));
        if (!exists) {
            // We want to remove it if it doesn't exist.
            removals.push({ path: ['updates', index] });
            actionsTaken.push([directory, 'removed']);
        }
        return undefined;
    }

    function calcAdditions() {
        for (const directory of foldersToProcess) {
            actionsTaken.push([directory, 'added']);
            additions.push({
                path: ['updates'],
                value: {
                    'package-ecosystem': 'github-actions',
                    directory,
                    schedule: { interval: options.interval },
                },
            });
        }
    }

    function processChanges() {
        // console.log('%o', { changes, removals, additions });

        const changedNodes = new Set();
        const removedNodes = new Set();
        const addedNodes = new Set();

        // Changes first
        for (const change of changes) {
            doc.setIn(change.path, change.value);
            const node = doc.getIn(change.path.slice(0, 2));
            /** @type {string} */
            const comment = node.commentBefore || '';
            if (!comment.includes(nodeComment)) {
                node.commentBefore = comment + '\n' + nodeComment;
            }
            changedNodes.add(node);
        }

        // Removals
        for (const remove of removals) {
            removedNodes.add(doc.getIn(remove.path)?.clone());
            doc.deleteIn(remove.path);
        }

        // Additions
        for (const add of additions) {
            const node = doc.createNode(add.value);
            node.spaceBefore = true;
            node.commentBefore = nodeComment;
            doc.addIn(add.path, node);
            addedNodes.add(node);
        }

        const reportDoc = new Document({});
        addSection('changes', ' Changes Made');
        addSection('additions', 'Added Actions');
        addSection('removals', 'Removed Actions');

        // console.error('%o', reportDoc);

        for (const n of changedNodes) {
            reportDoc.addIn(['changes'], n);
        }

        for (const n of addedNodes) {
            reportDoc.addIn(['additions'], n);
        }

        for (const n of removedNodes) {
            reportDoc.addIn(['removals'], n);
        }

        result.summary = reportDoc.toString();

        function addSection(key, comment) {
            const pair = reportDoc.createPair(key, []);
            pair.key.commentBefore = ' ' + comment.trim();
            pair.key.spaceBefore = true;
            reportDoc.add(pair);
        }
    }
}

/**
 * @param {string} dependabotFile
 * @param {string} cwd
 * @returns {Promise<string | undefined>}
 */
async function findDependabotFile(dependabotFile, cwd) {
    if (dependabotFile) return path.resolve(cwd, dependabotFile);

    // cspell:ignore nodir
    const found = await glob('.github/dependabot.{yml,yaml}', { cwd, nodir: true, absolute: true });
    return found[0];
}

/**
 *
 * @param {string} path
 * @returns {Promise<boolean>}
 */
async function isFile(path) {
    try {
        const s = await fs.stat(path);
        return s.isFile;
    } catch (e) {
        return false;
    }
}

/**
 *
 * @param {string} path
 * @returns {Promise<boolean>}
 */
async function isDir(path) {
    try {
        const s = await fs.stat(path);
        return s.isDirectory();
    } catch (e) {
        return false;
    }
}

/**
 *
 * @param {string} path
 * @returns {import('yaml').Document}
 */
async function readDepFile(path) {
    const content = await fs.readFile(path, 'utf8');
    return parseDocument(content);
}

/**
 *
 * @param {string | URL} pathOrUrl
 * @returns {string}
 */
function asPath(pathOrUrl) {
    return pathOrUrl instanceof URL ? fileURLToPath(pathOrUrl) : pathOrUrl;
}

/**
 *
 * @param {string[]} actions
 * @param {string} cwd
 */
function normalizeActionsToFolders(actions, cwd) {
    const rel = actions
        .map((p) => path.relative(cwd, p))
        .map((p) => path.dirname(p))
        .map((p) => normalizeDirectoryEntry(p));
    return rel;
}

function normalizeDirectoryEntry(dir) {
    return (
        '/' +
        dir
            .split('/')
            .filter((a) => !!a)
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

- Changed: ${result.changedActions.length}
- Added: ${result.addedActions.length}
- Removed: ${result.removedActions.length}

### Actions Directories Processed

${yamlStart}
${yamlStringify(result.actionsTaken.map(([dir, action]) => dir + (action ? ` (${action})` : '')))}
${yamlEnd}

### Action Search Glob
- glob: \`${result.actionsGlob}\`

### Options

${yamlStart}
${yamlStringify(result.options)}
${yamlEnd}


### Details

${yamlStart}
${result.summary}
${yamlEnd}
`;
}
