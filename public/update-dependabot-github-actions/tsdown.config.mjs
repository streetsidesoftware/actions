import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: 'src/index.mjs',
    outDir: 'action-build',
    format: 'esm',
    platform: 'node',
    deps: { alwaysBundle: /./, onlyBundle: false },
});
