## `read-file` Action

Read a file from the filesystem and return it in `output.result`.

Example:

<!--- @@inject: ../../.github/workflows/example-read-file.yaml --->

````````````yaml
name: '📗 Example Set Output'

on:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  run-example:
    runs-on: ubuntu-latest
    steps:
      - name: Read a File
        id: read-file
        uses: ./public/read-file
        with:
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
