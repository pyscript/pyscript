import type { PyScriptApp } from '../main';
import type { AppConfig } from '../pyconfig';
import type { UserError } from '../exceptions';
import type { Runtime } from '../runtime';
import { Plugin } from '../plugin';
import { getLogger } from '../logger';

const logger = getLogger('py-splashscreen');

export class SplashscreenPlugin extends Plugin {
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
        customElements.define('py-splashscreen', PySplashscreen);
        this.app.loader = <PyLoader>document.createElement('py-splashscreen');
        document.body.append(this.app.loader);

        document.addEventListener("py-status-message", (e: CustomEvent) => {
            const msg = e.detail;
            this.app.loader.log(msg);
        });
    }

    afterStartup(runtime: Runtime) {
        if (runtime.config.autoclose_loader) {
            this.app.loader.close();
        }
    }

    onUserError(error: UserError) {
        // Remove the splashscreen so users can see the banner better
        this.app.loader.close();
    }
}

export class PySplashscreen extends HTMLElement {
    widths: string[];
    label: string;
    mount_name: string;
    details: HTMLElement;
    operation: HTMLElement;
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `<div id="pyscript_loading_splash" class="py-overlay">
        <div class="py-pop-up">
        <div class="smooth spinner"></div>
        <div id="pyscript-loading-label" class="label">
          <div id="pyscript-operation-details">
          </div>
        </div>
        </div>
      </div>`;
        this.mount_name = this.id.split('-').join('_');
        this.operation = document.getElementById('pyscript-operation');
        this.details = document.getElementById('pyscript-operation-details');
    }

    log(msg: string) {
        const newLog = document.createElement('p');
        newLog.innerText = msg;
        this.details.appendChild(newLog);
    }

    close() {
        logger.info('Closing');
        this.remove();
    }
}
