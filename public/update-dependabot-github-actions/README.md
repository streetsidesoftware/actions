# Update Dependabot GitHub Actions

Github Dependabot can help keep versions up to date in workflows and actions. But there is a limitation on the current implementation that prevents it from automatically finding `.github/actions/*/action.yml` files.

See: [Local actions in .github/actions/ are not checked · Issue #6345 · dependabot/dependabot-core](https://github.com/dependabot/dependabot-core/issues/6345)

The workaround is to add an entry into `.github/dependabot.yml` for each action.

**`.github/dependabot.yml`**

```yaml
updates:
  # Added to find
  - package-ecosystem: 'github-actions'
    # Workflow files stored in the
    # default location of `.github/workflows`
    directory: '/.github/actions/a_reusable_workflow'
    schedule:
      interval: 'daily'
```

This action can help keep `.github/dependabot.yml` up to date based upon the action files found.

## Usage

## Options

`action.yml`

<!--- @@inject: ./action.yaml --->

```yaml
name: 'Update dependabot Github Actions'
description: 'Update .github/dependabot.yml file to include a list of actions.'

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
      Set the commit title prefix.
      See: [dependabot commit message](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#commit-message)
    default: ci
    required: false
  interval:
    description: |
      Scan frequency. See dependabot schedule.interval
    default: 'daily'
    required: false
  dry-run:
    description: |
      Only report on what would happen.
    required: false
  summary:
    description: Show a summary
    default: true
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
  using: 'node20'
  main: 'action-build/index.cjs'
```

<!--- @@inject-end: ./action.yaml --->
