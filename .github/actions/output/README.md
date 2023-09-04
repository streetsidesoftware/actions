# `output` Action

Set the `output.value` of a step. This is a useful way to keep calculated values.

Example:

<!--- @@inject: ../../workflows/example-output.yaml --->

```yaml
name: Example Summary

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
        uses: streetsidesoftware/actions/.github/actions/summary@db72c52e539c5e2c1423c949aad1d7d26f35931f
        with:
          text: |
            # Summary
            Finished with Node: `${{ matrix.version }}`
```

<!--- @@inject-end: ../../workflows/example-summary.yaml --->
