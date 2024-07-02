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
  default: '20.x'
```

Example:

<!--- @@inject: ../../.github/workflows/example-setup-node-pnpm.yaml --->
