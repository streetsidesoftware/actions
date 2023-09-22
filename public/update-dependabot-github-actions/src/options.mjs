export const defaultOptions = {
    /**
     * A glob pattern to search for directories containing `action.yaml` or `action.yml` files.
     * Examples:
     *   - `.github/actions/*`
     *   - `{.github/actions,private/actions}`
     * @required false
     * @default ".github/actions"
     */
    directory: '.github/action',
    /**
     * Path to the dependabot yaml file.
     * @default ".github/dependabot.yml"
     * @required false
     */
    dependabot: '',
    /**
     * Scan frequency. See dependabot schedule.interval
     * @default "daily"
     * @required false
     */
    interval: 'daily',
    /**
     * Only report on what would happen.
     * @default false
     * @required false
     */
    dry_run: false,
    /**
     * Set the commit title prefix.
     * See: [dependabot commit message](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#commit-message)
     */
    prefix: '',
    /**
     * Show a summary
     * @default true
     * @required false
     */
    summary: true,
};
