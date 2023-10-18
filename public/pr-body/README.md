## `pr-body` Action

Generate a PR Body based upon the file diffs. Useful for dependency updates.

<!--- @@inject: ../../.github/workflows/example-pr-body.yaml --->

```yaml
name: '📗 Example Dirty'

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

      - name: PR Body
        id: body
        uses: streetsidesoftware/actions/public/pr-body@v1
        with:
          title: Example PR Body based upon a diff.
          message: |
            This is the message body.
          path: >-
            package.json
            README.md

      - name: Summary
        uses: streetsidesoftware/actions/public/summary@v1
        with:
          text: ${{ steps.body.outputs.body }}
```

<!--- @@inject-end: ../../.github/workflows/example-pr-body.yaml --->
