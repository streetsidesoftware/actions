import { randomUUID } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { EOL } from 'node:os';

/**
 * Read one of the action's inputs.
 * @param {string} name - the input name in `action.yaml`.
 * @returns {string} the trimmed value, or `''` when the input is not set.
 */
export function getInput(name) {
    const value = process.env[`INPUT_${name.replaceAll(' ', '_').toUpperCase()}`] || '';
    return value.trim();
}

/**
 * Set one of the action's outputs.
 * @param {string} name - the output name in `action.yaml`.
 * @param {string | number | boolean} value
 */
export function setOutput(name, value) {
    // The runner reads the value from between the two delimiter lines, so the value may span lines.
    const delimiter = `delimiter_${randomUUID()}`;
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}<<${delimiter}${EOL}${value}${EOL}${delimiter}${EOL}`);
}

/**
 * Add Markdown to the end of the job summary.
 * @param {string} markdown
 */
export function appendJobSummary(markdown) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
}

/**
 * Report an error to the runner and make the step fail.
 * @param {string} message
 */
export function setFailed(message) {
    process.exitCode = 1;
    console.log(`::error::${escapeCommandData(message)}`);
}

/**
 * A workflow command is one line of output, and the runner decodes `%` escapes in it.
 * @param {string} data
 * @returns {string}
 */
function escapeCommandData(data) {
    return data.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
}
