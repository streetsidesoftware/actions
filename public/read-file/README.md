## `read-file` Action

Read a file from the filesystem and return it in `output.result`.

Example:

<!--- @@inject: ../../.github/workflows/example-read-file.yaml --->

````````````yaml
name: '📗 Example Read File'

on:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  run-example:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2

      - name: Read a File
        id: read-file
        uses: streetsidesoftware/actions/public/read-file@v1
        with:
          # Relative to the root of the repository
          path: 'README.md'

      - name: Summary
        uses: streetsidesoftware/actions/public/summary@v1
        with:
          text: |
            # Summary
            File:
            ```````````markdown
            ${{ steps.read-file.outputs.result }}
            ```````````
````````````

<!--- @@inject-end: ../../.github/workflows/example-read-file.yaml --->
