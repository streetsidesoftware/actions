## `output` Action

Set the `output.value` of a step. This is a useful way to keep calculated values.

Example:

<!--- @@inject: ../../workflows/example-output.yaml --->

```yaml
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
        uses: streetsidesoftware/actions/.github/actions/output@v1
        with:
          value: |
            Action: ${{ github.action }}
            Actor: ${{ github.actor }}
            Ref: ${{ github.ref }}

      - name: Detect if Main
        id: is_main
        uses: streetsidesoftware/actions/.github/actions/output@v1
        with:
          value: ${{ github.ref == 'refs/heads/main' }}

      - name: Summary
        uses: streetsidesoftware/actions/.github/actions/summary@v1
        with:
          text: |
            # Summary
            Node: `${{ matrix.version }}
            Output: ${{ steps.my_step.outputs.value }}
            Is Main: ${{ steps.is_main.outputs.value }}
```

<!--- @@inject-end: ../../workflows/example-output.yaml --->
