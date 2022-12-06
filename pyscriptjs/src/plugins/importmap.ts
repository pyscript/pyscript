import type { Runtime } from '../runtime';
import { showWarning } from '../utils';
import { Plugin } from '../plugin';
import { getLogger } from '../logger';

const logger = getLogger('plugins/importmap');

type ImportType = { [key: string]: unknown };
type ImportMapType = {
    imports: ImportType | null;
};

export class ImportmapPlugin extends Plugin {
    async afterSetup(runtime: Runtime) {
        // make importmap ES modules available from python using 'import'.
        //
        // XXX: this code can probably be improved because errors are silently
        // ignored.
        //
        // Moreover, it's also wrong because it's async and currently we don't
        // await the module to be fully registered before executing the code
        // inside py-script. It's also unclear whether we want to wait or not
        // (or maybe only wait only if we do an actual 'import'?)
        for (const node of document.querySelectorAll("script[type='importmap']")) {
            const importmap: ImportMapType = (() => {
                try {
                    return JSON.parse(node.textContent) as ImportMapType;
                } catch (error) {
                    showWarning('Failed to parse import map: ' + error.message);
                }
            })();

            if (importmap?.imports == null) continue;

            for (const [name, url] of Object.entries(importmap.imports)) {
                if (typeof name != 'string' || typeof url != 'string') continue;

                let exports: object;
                try {
                    // XXX: pyodide doesn't like Module(), failing with
                    // "can't read 'name' of undefined" at import time
                    exports = { ...(await import(url)) } as object;
                } catch {
                    logger.warn(`failed to fetch '${url}' for '${name}'`);
                    continue;
                }

                logger.info('Registering JS module', name);
                runtime.registerJsModule(name, exports);
            }
        }
    }
}
