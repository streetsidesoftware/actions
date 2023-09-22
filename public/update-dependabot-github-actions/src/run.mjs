import { fileURLToPath } from 'url';
import { updateDependabot, generateSummary } from './updateDependabot.mjs';
import * as path from 'path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootUrl = new URL('../../..', import.meta.url);

async function run() {
    const result = await updateDependabot(
        '{.github/actions,public}',
        path.join(__dirname, '../fixtures/dependabot.yml'),
        rootUrl,
        {
            prefix: 'ci',
            dryRun: true,
        },
    );

    const summary = generateSummary(result);
    console.log('%s', summary);
}

run();
