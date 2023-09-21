import { promises as fs } from 'node:fs';
import * as path from 'node:path';

const createFilesFor = ['GITHUB_ENV', 'GITHUB_OUTPUT', 'GITHUB_STATE', 'GITHUB_STEP_SUMMARY'];

export async function prepDebug() {
    const env = process.env;

    for (const fileEnvKey of createFilesFor) {
        const file = env[fileEnvKey];
        if (!file) continue;
        await fs.mkdir(path.dirname(file), { recursive: true });
        const s = await fs.stat(file).catch((e) => undefined);
        if (s) continue;
        await fs.writeFile(file, '');
    }
}
