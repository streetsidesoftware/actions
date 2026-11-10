import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { appendJobSummary, getInput, setFailed, setOutput } from './github.mjs';

describe('github', () => {
    const env = { ...process.env };
    let tempDir = '';

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'github-test-'));
    });

    afterEach(async () => {
        process.env = { ...env };
        await fs.rm(tempDir, { recursive: true });
    });

    test('getInput reads the input from the environment', () => {
        process.env['INPUT_DRY-RUN'] = 'true';
        assert.equal(getInput('dry-run'), 'true');
    });

    test('getInput trims the value', () => {
        process.env['INPUT_DIRECTORY'] = '  public \n';
        assert.equal(getInput('directory'), 'public');
    });

    test('getInput returns an empty string for an input that is not set', () => {
        delete process.env['INPUT_PREFIX'];
        assert.equal(getInput('prefix'), '');
    });

    test('setOutput adds each output to the output file', async () => {
        const outputFile = path.join(tempDir, 'output.txt');
        process.env['GITHUB_OUTPUT'] = outputFile;

        setOutput('summary', 'line 1\nline 2');
        setOutput('changes', 3);
        setOutput('updated', true);

        assert.deepEqual(await readOutputs(outputFile), {
            summary: 'line 1\nline 2',
            changes: '3',
            updated: 'true',
        });
    });

    test('appendJobSummary adds to the end of the summary file', async () => {
        const summaryFile = path.join(tempDir, 'summary.md');
        process.env['GITHUB_STEP_SUMMARY'] = summaryFile;
        await fs.writeFile(summaryFile, '# Earlier step\n');

        appendJobSummary('# This step\n');

        assert.equal(await fs.readFile(summaryFile, 'utf8'), '# Earlier step\n# This step\n');
    });

    test('setFailed prints the error as one line and sets the exit code', (t) => {
        const log = t.mock.method(console, 'log', () => undefined);
        try {
            setFailed('50% done\nthen it broke');
            assert.equal(process.exitCode, 1);
        } finally {
            process.exitCode = undefined;
        }
        assert.deepEqual(
            log.mock.calls.map((call) => call.arguments),
            [['::error::50%25 done%0Athen it broke']],
        );
    });
});

/**
 * Parse an output file the way the runner does: `name<<delimiter`, the value's lines, then `delimiter`.
 * @param {string} outputFile
 * @returns {Promise<Record<string, string>>}
 */
async function readOutputs(outputFile) {
    const content = await fs.readFile(outputFile, 'utf8');
    const entries = content.matchAll(/^(?<name>.+)<<(?<delimiter>.+)\r?\n(?<value>[\s\S]*?)\r?\n\k<delimiter>\r?\n/gm);
    return Object.fromEntries(Array.from(entries, (entry) => [entry.groups.name, entry.groups.value]));
}
