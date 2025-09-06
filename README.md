# Workflow Actions

Collection of actions for GitHub Workflows

<!--- @@inject: public/summary/README.md --->

## `summary` Action

Easily add markdown text to a workflow summary.

Example:

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

<!--- @@inject-end: public/summary/README.md --->

<!--- @@inject: public/output/README.md --->

## `output` Action

Set the `output.value` of a step. This is a useful way to keep calculated values.

Example:

````yaml
name: '📗 Example Set Output'

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
      - name: Test Step Output
        id: my_step
        uses: streetsidesoftware/actions/public/output@v1
        with:
          value: |
            Action: ${{ github.action }}
            Actor: ${{ github.actor }}
            Ref: ${{ github.ref }}

      - name: Detect if Main
        id: is_main
        uses: streetsidesoftware/actions/public/output@v1
        with:
          value: ${{ github.ref == 'refs/heads/main' || '' }}

      - name: Summary
        uses: streetsidesoftware/actions/public/summary@v1
        with:
          text: |
            # Summary
            Node: `${{ matrix.version }}`
            Output:
            ```
            ${{ steps.my_step.outputs.value }}
            ```
            Is Main: ${{ steps.is_main.outputs.value }} as bool ${{ !!steps.is_main.outputs.value }}
````

<!--- @@inject-end: public/output/README.md --->

<!--- @@inject: public/dirty/README.md --->

## `dirty` Action

Determine if the git tree has changes.

Example:

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
        uses: actions/checkout@v5

      - name: Dirty 1
        id: dirty_1
        uses: streetsidesoftware/actions/public/dirty@v1

      - name: Touch
        run: |
          touch test.txt
          echo "\n make dirty \n" >> README.md

      - name: Dirty 2
        id: dirty_2
        uses: streetsidesoftware/actions/public/dirty@v1

      - name: Summary
        uses: streetsidesoftware/actions/public/summary@v1
        with:
          text: |
            # Dirty Summary

            ## Dirty 1

            isDirty: `${{ steps.dirty_1.outputs.isDirty }}` = ${{ steps.dirty_1.outputs.isDirty && 'Yes' || 'No' }} = ${{ !!steps.dirty_1.outputs.isDirty }}
            status:
            ```
            ${{ steps.dirty_1.outputs.status }}
            ```

            ## Dirty 2

            isDirty: `${{ steps.dirty_2.outputs.isDirty }}` = ${{ steps.dirty_2.outputs.isDirty && 'Yes' || 'No' }} = ${{ !!steps.dirty_2.outputs.isDirty }}
            status:
            ```
            ${{ steps.dirty_2.outputs.status }}
            ```
````

<!--- @@inject-end: public/dirty/README.md --->
