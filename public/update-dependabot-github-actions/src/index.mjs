import { getInput, setFailed, setOutput, summary } from '@actions/core';
import * as path from 'node:path';
import nopt from 'nopt';
import { prepDebug } from './debugPrep.mjs';
import { adjustEnvValues } from './env.mjs';
import { defaultOptions } from './options.mjs';
import { generateSummary, updateDependabot } from './updateDependabot.mjs';

const options = { ...defaultOptions };

async function run(args) {
    try {
        const inputs = {
            ...defaultOptions,
            ...getOption('directory'),
            ...getOption('dependabot'),
            ...getOption('interval'),
            ...getOption('dry-run', 'dry_run'),
            ...getOption('summary'),
            ...getOption('prefix'),
        };

        const { directory, dependabot, ...opts } = inputs;
        const cwd = path.resolve(args.cwd || process.cwd());

        adjustEnvValues(process.env, { cwd });
        if (args.debug) {
            await prepDebug();
        }

        console.log('Start: %o', { inputs });
        const result = await updateDependabot(directory, dependabot, cwd, opts);
        {
            const { changes, actionFolders, actionsGlob, options, addedDirectories, removedEntries, dependabotFile } =
                result;
            const detailedResults = {
                changes,
                actionFolders,
                actionsGlob,
                options,
                addedDirectories,
                removedEntries,
                dependabotFile,
            };
            console.log('Result: %o', detailedResults);
            setOutput('results', JSON.stringify(detailedResults));
        }
        const summaryText = generateSummary(result);
        setOutput('summary', summaryText);
        summary.addRaw(summaryText);
        await summary.write();
        setOutput('updated', (result.changes && true) || '');
        setOutput('changes', result.changes);
    } catch (error) {
        setFailed(error.message);
    }
}

/**
 * @param {string} inputName - the input name in `action.yaml`.
 * @param {string} key - the option name, when it differs from the input name.
 * @returns {{ [key:string]: any } | undefined}
 */
function getOption(inputName, key = inputName) {
    const value = toBoolean(getInput(inputName));
    if (value === '') return undefined;
    return { [key]: value };
}

function toBoolean(value) {
    if (typeof value !== 'string') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
}

function processArgs() {
    const knownOpts = {
        cwd: String,
    };
    const shortHands = {};
    const parsed = nopt(knownOpts, shortHands);
    return parsed;
}

run(processArgs());
