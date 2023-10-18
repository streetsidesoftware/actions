## `diff` Action

Generate the git diff for the given files

Example:

<!--- @@inject: ../../.github/workflows/example-diff.yaml --->

````yaml
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

      - name: Diff
        id: diff
        uses: ./actions/public/diff
        with:
          path: >-
            package.json
            README.md

      - name: Summary
        uses: streetsidesoftware/actions/public/summary@v1
        with:
          text: |
            # Diff

            ```diff
            ${{ steps.diff.outputs.diff }}
            ```
````

<!--- @@inject-end: ../../.github/workflows/example-diff.yaml --->
