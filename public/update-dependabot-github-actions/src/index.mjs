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
            ...getOption('dry_run'),
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
            const { changes, actionFolders, actionsGlob, options, actionsTaken, dependabotFile } = result;
            const detailedResults = { changes, actionFolders, actionsGlob, options, actionsTaken, dependabotFile };
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
 *
 * @param {string} name
 * @returns {{ [name:string]: any } | undefined}
 */
function getOption(name) {
    const value = toBoolean(getInput(name));
    if (value === '') return undefined;
    return { [name]: value };
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
