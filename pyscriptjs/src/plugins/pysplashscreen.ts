import type { PyScriptApp } from '../main';
import type { AppConfig } from '../pyconfig';
import { Plugin } from '../plugin';
import { getLogger } from '../logger';

import { PyLoader } from '../components/pyloader';


const logger = getLogger('py-splashscreen');

export class PySplashscreenPlugin extends Plugin {
    app: PyScriptApp;

    constructor(app: PyScriptApp) {
        super();
        this.app = app;
    }

    configure(config: AppConfig) {
    }

    beforeLaunch(config: AppConfig) {
        // add loader to the page body
        logger.info('add py-loader');
        customElements.define('py-loader', PyLoader);
        this.app.loader = <PyLoader>document.createElement('py-loader');
        document.body.append(this.app.loader);
    }

    afterSetup() {
    }
}
