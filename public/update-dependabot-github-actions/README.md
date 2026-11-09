# Update Dependabot GitHub Actions

Dependabot only updates local actions, such as `.github/actions/*/action.yml`, when `.github/dependabot.yml` lists their folders.
Its `directories` setting accepts globs, so one entry can cover every action:

```yaml
updates:
  - package-ecosystem: 'github-actions'
    directories:
      - '/.github/actions/*'
    schedule:
      interval: 'daily'
```

This action finds the local actions and makes sure the `github-actions` entries cover them.

- When every action is already covered, the file is not changed.
- An action that is not covered adds a `/<parent>/*` glob to the entry this action manages, creating the entry if needed.
- Older versions of this action added one entry per action folder. Those entries are replaced by the `directories` entry.

Entries this action manages are marked with:

```yaml
# Automatically added by streetsidesoftware/public/update-dependabot-github-actions
```

Entries without the marker are never changed.

## Usage

## Options

`action.yml`

<!--- @@inject: ./action.yaml --->

```yaml
name: 'Update dependabot Github Actions'
description: 'Make sure the github-actions entries in .github/dependabot.yml cover every local action, using directories globs.'

inputs:
  directory:
    description: |
      A glob pattern to search for directories containing `action.yaml` or `action.yml` files.
      Example:
        .github/actions/*
      or
        {.github/actions,private/actions}
    required: false
    default: '.github/actions/*'
  dependabot:
    description: |
      Path to the dependabot yaml file.
      Defaults to searching for `.github/dependabot.yml` and `.github/dependabot.yaml`
    required: false
  prefix:
    description: |
      Set the commit title prefix. Only used when the action creates the `directories` entry.
      See: [dependabot commit message](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#commit-message)
    default: ci
    required: false
  interval:
    description: |
      Scan frequency. Only used when the action creates the `directories` entry.
      See dependabot schedule.interval
    default: 'daily'
    required: false
  dry-run:
    description: |
      Only report on what would happen.
    required: false
  summary:
    description: Show a summary
    default: 'true'
    required: false

outputs:
  updated:
    description: |
      - "true" - the dependabot file was changed.
      - "" - the dependabot file was not changed.
  changes:
    description: Number of changes

  results:
    description: Detailed results in JSON format.

  summary:
    description: Markdown summary of changes, can be used in a PR.
runs:
  using: 'node24'
  main: 'action-build/index.cjs'
```

<!--- @@inject-end: ./action.yaml --->
