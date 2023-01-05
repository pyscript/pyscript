import type { AppConfig } from '../pyconfig';
import { robustFetch } from '../fetch';
import { Plugin } from '../plugin';
import { getLogger } from '../logger';

const logger = getLogger('automatic-import-plugin');

export class AutomaticImportPlugin extends Plugin {
    pyscriptTag = document.querySelector('py-script');

    /**
     * Trim whitespace from the beginning and end of a string.
     * The text that we are getting has new lines and possibly
     * whitespace at the beginning and end of the line. Since
     * we want to match only import statements, we need to trim
     * the whitespace on each line, join them together and then
     * match each beginning of the line so the regex rule will
     * only match what we perceive as import statements.
     *
     * NOTE: This is not a perfect solution and I'm a bit worried
     * about the performance of this. I'm sure there is a better
     * way to do this.
     *
     * @param text - The text to trim
     */
    _trimWhiteSpace(text: string): string {
        const lines = text.split('\n');
        return lines.map(line => line.trim()).join('\n');
    }
    /**
     *
     * Use regex magic to capture import statements and add the
     * dependency(s) to the packages list in the config.
     *
     * @param text - The text to search for import statements
     * @param config - The config object to add the dependencies to
     *
     */
    _addImportToPackagesList(text: string, config: AppConfig) {
        // Regex encantation to capture the imported dependency into a
        // named group called "dependency". The rule will match any text
        // that contains 'import' or 'from' at the beginning of the line
        // or '\nimport', '\nfrom' which is the case when we invoke _trimWhiteSpace
        const importRegexRule = /^(?:\\n)?(?:import|from)\s+(?<dependency>[a-zA-Z0-9_]+)?/gm;

        text = this._trimWhiteSpace(text);

        const matches = text.matchAll(importRegexRule);
        // Regex matches full match and groups, let's just push the group.
        for (const match of matches) {
            const dependency = match.groups.dependency;
            if (dependency) {
                logger.info(`Found import statement for ${dependency}, adding to packages list.`);
                config.packages.push(dependency);
            }
        }
    }

    /**
     *
     * In this initial lifecycle hook, we will look for any imports
     * in the <py-script> tag inner HTML and add them to the packages list.
     *
     * We are skipping looking into the src attribute to not delay the
     * preliminary initialization phase.
     *
     */
    configure(config: AppConfig) {
        if (config.autoImports ?? true) {
            // config.packages should already be a list, but
            // let's be defensive just in case.
            if (!config.packages) {
                config.packages = [];
            }

            this._addImportToPackagesList(this.pyscriptTag.innerHTML, config);
        }
    }

    /**
     * In this lifecycle hook, we will to see if the user has specified a
     * src attribute in the <py-script> tag and fetch the script if so. Then
     * we will look for any imports in the fetched script and add them to the
     * packages list.
     *
     * NOTE: If we are fetching the file from a URL and not from the local file
     * system, this will delay the download of the python interpreter. Perhaps
     * we should throw an error if the src attribute is a URL?
     *
     */
    beforeLaunch(config: AppConfig) {
        if (config.autoImports ?? true) {
            const srcAttribute = this.pyscriptTag.getAttribute('src');
            if (srcAttribute) {
                logger.info(`Found src attribute in <py-script> tag, fetching ${srcAttribute}...`);
                robustFetch(srcAttribute)
                    .then(response => response.text())
                    .then(text => {
                        this._addImportToPackagesList(text, config);
                    })
                    .catch(error => {
                        logger.error(`Failed to fetch ${srcAttribute}: ${(error as Error).message}`);
                    });
            }
        }
    }
}
