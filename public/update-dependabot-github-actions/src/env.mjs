const envPrefix = /^GITHUB_|^INPUt_/;

const replaceDirective = /\$\{([^}]+)\}/g;

/**
 * Adjust the environment variable.
 * @param {{ [string]: string }} env
 * @param {{ [string]: string }} keyValues
 */
export function adjustEnvValues(env, keyValues) {
    for (const [key, value] of Object.entries(env)) {
        if (!envPrefix.test(key)) continue;
        const newValue = value.replace(replaceDirective, (match, p1) => {
            return p1 in keyValues ? keyValues[p1] : match;
        });
        env[key] = newValue;
    }
}
