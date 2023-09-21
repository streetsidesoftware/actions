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
        };

        const { directory, dependabot, ...opts } = inputs;
        const cwd = path.resolve(args.cwd || process.cwd());

        adjustEnvValues(process.env, { cwd });
        if (args.debug) {
            await prepDebug();
        }

        console.log('Start: %o', { inputs });
        const result = await updateDependabot(directory, dependabot, cwd, opts);
        console.log('Result: %o', { result });
        summary.addRaw(generateSummary(result));
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
    console.log(parsed);
    return parsed;
}

run(processArgs());
