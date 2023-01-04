import type { AppConfig } from '../pyconfig';
import { robustFetch } from '../fetch';
import { Plugin } from '../plugin';
import { getLogger } from '../logger';

const logger = getLogger('automatic-import-plugin');

export class AutomaticImportPlugin extends Plugin {
    pyscriptTag = document.querySelector('py-script');

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
        // named group called "dependency".
        const importRegexRule = /import\s+(?<dependency>[a-zA-Z0-9_]+)?/g;

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
        // TODO: Add logic to let users opt out of this behavior.

        // config.packages should already be a list, but
        // let's be defensive just in case.
        if (!config.packages) {
            config.packages = [];
        }

        this._addImportToPackagesList(this.pyscriptTag.innerHTML, config);
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
