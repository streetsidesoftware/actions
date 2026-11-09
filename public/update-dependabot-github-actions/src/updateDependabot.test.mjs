import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, test } from 'node:test';
import { parse } from 'yaml';
import { updateDependabot } from './updateDependabot.mjs';

const marker = '# Automatically added by streetsidesoftware/public/update-dependabot-github-actions';
const actionYaml = 'name: test\nruns:\n  using: composite\n  steps: []\n';

const workflowsEntry = `\
  - package-ecosystem: 'github-actions'
    directory: '/'
    schedule:
      interval: 'daily'
`;

const oldStyleConfig = `\
version: 2
updates:
${workflowsEntry}
  ${marker}
  - package-ecosystem: github-actions
    directory: /.github/actions/setup
    schedule:
      interval: daily
    commit-message:
      prefix: ci

  ${marker}
  - package-ecosystem: github-actions
    directory: /.github/actions/pr
    schedule:
      interval: daily
    commit-message:
      prefix: ci
`;

const actions = {
    '.github/actions/setup/action.yml': actionYaml,
    '.github/actions/pr/action.yaml': actionYaml,
};

describe('updateDependabot', () => {
    test('converts old style entries into one directories entry', async () => {
        const cwd = await makeRepo({ ...actions, '.github/dependabot.yml': oldStyleConfig });

        const result = await updateDependabot('.github/actions/*', '', cwd, { prefix: 'ci' });

        assert.equal(result.changes, 3);
        assert.deepEqual(result.addedDirectories, ['/.github/actions/*']);
        assert.deepEqual(
            result.removedEntries.map((entry) => entry.directory),
            ['/.github/actions/setup', '/.github/actions/pr'],
        );

        const content = await readConfig(cwd);
        assert.deepEqual(parse(content).updates, [
            { 'package-ecosystem': 'github-actions', directory: '/', schedule: { interval: 'daily' } },
            {
                'package-ecosystem': 'github-actions',
                directories: ['/.github/actions/*'],
                schedule: { interval: 'daily' },
                'commit-message': { prefix: 'ci' },
            },
        ]);
        assert.equal(content.split(marker).length, 2, 'the new entry is marked');
    });

    test('changes nothing once converted', async () => {
        const cwd = await makeRepo({ ...actions, '.github/dependabot.yml': oldStyleConfig });
        await updateDependabot('.github/actions/*', '', cwd, { prefix: 'ci' });
        const converted = await readConfig(cwd);

        const result = await updateDependabot('.github/actions/*', '', cwd, { prefix: 'ci' });

        assert.equal(result.changes, 0);
        assert.equal(await readConfig(cwd), converted);
    });

    test('does not write when existing directories cover every action', async () => {
        const config = `\
version: 2
updates:
${workflowsEntry}
  - package-ecosystem: 'github-actions'
    directories:
      - '/.github/actions/*'
    schedule:
      interval: 'weekly'
`;
        const cwd = await makeRepo({ ...actions, '.github/dependabot.yml': config });

        const result = await updateDependabot('.github/actions/*', '', cwd, {});

        assert.equal(result.changes, 0);
        assert.equal(await readConfig(cwd), config);
    });

    test('adds a glob for a new parent folder to the marked entry', async () => {
        const cwd = await makeRepo({ ...actions, '.github/dependabot.yml': oldStyleConfig });
        await updateDependabot('.github/actions/*', '', cwd, { prefix: 'ci' });
        await writeFiles(cwd, { 'public/summary/action.yaml': actionYaml });

        const result = await updateDependabot('{.github/actions,public}', '', cwd, { prefix: 'ci' });

        assert.deepEqual(result.addedDirectories, ['/public/*']);
        const updates = parse(await readConfig(cwd)).updates;
        assert.equal(updates.length, 2);
        assert.deepEqual(updates[1].directories, ['/.github/actions/*', '/public/*']);
    });

    test('creates a marked entry when no github-actions entry covers the actions', async () => {
        const config = `version: 2\nupdates:\n${workflowsEntry}`;
        const cwd = await makeRepo({ ...actions, '.github/dependabot.yml': config });

        const result = await updateDependabot('.github/actions/*', '', cwd, { interval: 'weekly' });

        assert.deepEqual(result.addedDirectories, ['/.github/actions/*']);
        assert.deepEqual(parse(await readConfig(cwd)).updates[1], {
            'package-ecosystem': 'github-actions',
            directories: ['/.github/actions/*'],
            schedule: { interval: 'weekly' },
        });
    });

    test('converts a marked entry that is first in the list, keeping its other comments', async () => {
        const config = `\
version: 2
updates:
  # Keep this list sorted
  ${marker}
  - package-ecosystem: github-actions
    directory: /.github/actions/setup
    schedule:
      interval: daily

${workflowsEntry}`;
        const cwd = await makeRepo({ ...actions, '.github/dependabot.yml': config });

        const result = await updateDependabot('.github/actions/*', '', cwd, {});

        assert.deepEqual(
            result.removedEntries.map((entry) => entry.directory),
            ['/.github/actions/setup'],
        );
        assert.equal(
            await readConfig(cwd),
            `\
version: 2
updates:
  # Keep this list sorted
  ${marker}
  - package-ecosystem: github-actions
    directories:
      - /.github/actions/*
    schedule:
      interval: daily

${workflowsEntry}`,
        );
    });

    test('keeps the comments of a removed entry in the middle of the list', async () => {
        const config = `\
version: 2
updates:
${workflowsEntry}
  # generated, do not edit
  ${marker}
  - package-ecosystem: github-actions
    directory: /.github/actions/setup

  - package-ecosystem: npm
    directory: /
`;
        const cwd = await makeRepo({ ...actions, '.github/dependabot.yml': config });

        await updateDependabot('.github/actions/*', '', cwd, {});

        assert.equal(
            await readConfig(cwd),
            `\
version: 2
updates:
${workflowsEntry}
  # generated, do not edit
  ${marker}
  - package-ecosystem: github-actions
    directories:
      - /.github/actions/*
    schedule:
      interval: daily

  - package-ecosystem: npm
    directory: /
`,
        );
    });

    test('removes old style entries that an unmarked entry already covers', async () => {
        const config = `\
version: 2
updates:
  - package-ecosystem: github-actions
    directories: ['/.github/actions/*']

  ${marker}
  - package-ecosystem: github-actions
    directory: /.github/actions/setup
`;
        const cwd = await makeRepo({ ...actions, '.github/dependabot.yml': config });

        const result = await updateDependabot('.github/actions/*', '', cwd, {});

        assert.equal(result.changes, 1);
        assert.deepEqual(result.addedDirectories, []);
        assert.equal(
            await readConfig(cwd),
            `\
version: 2
updates:
  - package-ecosystem: github-actions
    directories: ['/.github/actions/*']
`,
        );
    });

    test('leaves the text of unmarked entries as it was', async () => {
        const unmarked = `\
  - package-ecosystem: npm
    directory: /
    ignore:
      - dependency-name: "a-very-long-package-name-that-is-well-past-the-default-line-width/of-eighty"
  - package-ecosystem: github-actions
    directories: ['/public/*']
`;
        const cwd = await makeRepo({ ...actions, '.github/dependabot.yml': `version: 2\nupdates:\n${unmarked}` });

        await updateDependabot('.github/actions/*', '', cwd, {});

        assert.ok((await readConfig(cwd)).startsWith(`version: 2\nupdates:\n${unmarked}\n  ${marker}\n`));
    });

    test('finishes a conversion that left an old style entry behind', async () => {
        const config = `\
version: 2
updates:
  ${marker}
  - package-ecosystem: github-actions
    directories:
      - /public/*

  ${marker}
  - package-ecosystem: github-actions
    directory: /.github/actions/setup
`;
        const cwd = await makeRepo({ ...actions, '.github/dependabot.yml': config });

        await updateDependabot('.github/actions/*', '', cwd, {});

        const updates = parse(await readConfig(cwd)).updates;
        assert.deepEqual(updates, [
            { 'package-ecosystem': 'github-actions', directories: ['/public/*', '/.github/actions/*'] },
        ]);
    });

    test('adds an entry to an empty updates list', async () => {
        const cwd = await makeRepo({ ...actions, '.github/dependabot.yml': 'version: 2\nupdates: []\n' });

        await updateDependabot('.github/actions/*', '', cwd, {});

        assert.equal(
            await readConfig(cwd),
            `\
version: 2
updates:
  ${marker}
  - package-ecosystem: github-actions
    directories:
      - /.github/actions/*
    schedule:
      interval: daily
`,
        );
    });

    test('fails when the file has no updates list', async () => {
        const cwd = await makeRepo({ ...actions, '.github/dependabot.yml': 'version: 2\n' });

        await assert.rejects(updateDependabot('.github/actions/*', '', cwd, {}), /no "updates" list/);
    });

    test('finds the marked directories entry when it is first in the list', async () => {
        const config = `\
version: 2
updates:
  ${marker}
  - package-ecosystem: github-actions
    directories:
      - /.github/actions/*
    schedule:
      interval: daily
`;
        const cwd = await makeRepo({
            ...actions,
            'public/summary/action.yaml': actionYaml,
            '.github/dependabot.yml': config,
        });

        await updateDependabot('{.github/actions,public}', '', cwd, {});

        const updates = parse(await readConfig(cwd)).updates;
        assert.equal(updates.length, 1);
        assert.deepEqual(updates[0].directories, ['/.github/actions/*', '/public/*']);
    });

    test('dry run reports changes without writing', async () => {
        const cwd = await makeRepo({ ...actions, '.github/dependabot.yml': oldStyleConfig });

        const result = await updateDependabot('.github/actions/*', '', cwd, { prefix: 'ci', dryRun: true });

        assert.equal(result.changes, 3);
        assert.equal(await readConfig(cwd), oldStyleConfig);
    });
});

/**
 * @param {Record<string, string>} files - content by relative path
 * @returns {Promise<string>} the repo folder
 */
async function makeRepo(files) {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'update-dependabot-'));
    await writeFiles(cwd, files);
    return cwd;
}

/**
 * @param {string} cwd
 * @param {Record<string, string>} files - content by relative path
 */
async function writeFiles(cwd, files) {
    for (const [file, content] of Object.entries(files)) {
        const filePath = path.join(cwd, file);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content);
    }
}

function readConfig(cwd) {
    return fs.readFile(path.join(cwd, '.github/dependabot.yml'), 'utf8');
}
