# Summary Action

Easily add markdown text to a workflow summary.

Example:

```yaml
jobs:
  test:
    strategy:
      matrix:
        version: [10, 12, 14]
    runs-on: ubuntu-latest
    steps:
      - name: Summary
        uses: streetsidesoftware/actions/.github/actions/summary
        with:
          text: |
          # Summary
          Node: `${{ matrix.version }}``
```
