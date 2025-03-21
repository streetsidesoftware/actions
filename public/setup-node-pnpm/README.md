## `setup-node-pnpm` Action

This action will setup NodeJS and install the correct version of PNPM that matches [`package.json#packageManager`](https://nodejs.org/api/packages.html#packagemanager).

`package.json` packageManager:

```json
"packageManager": "pnpm@9.4.0"
```

Options:

```yaml
node-version:
  required: false
  description: The version of Node to use.
  default: '22.x'
```

Example:

<!--- @@inject: ../../.github/workflows/example-setup-node-pnpm.yaml --->

```yaml
name: '📗 Example Setup Node and PNPM'

on:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  run-example:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node and PNPM
        uses: streetsidesoftware/actions/public/setup-node-pnpm@v1

      - name: Install
        run: pnpm install
```

<!--- @@inject-end: ../../.github/workflows/example-setup-node-pnpm.yaml --->
