## `summary` Action

Easily add markdown text to a workflow summary.

Example:

<!--- @@inject: ../../.github/workflows/example-summary.yaml --->

```yaml
name: '📗 Example Summary'

on:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  run-example:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        version: [10, 12, 14]
    steps:
      - name: Summary
        uses: streetsidesoftware/actions/public/summary@v1
        with:
          text: |
            # Summary
            Finished with Node: `${{ matrix.version }}`
```

<!--- @@inject-end: ../../.github/workflows/example-summary.yaml --->
