import type { AppConfig } from '../pyconfig';
import type { UserError } from '../exceptions';
import type { Runtime } from '../runtime';
import { showWarning } from '../utils';
import { Plugin } from '../plugin';
import { getLogger } from '../logger';

const logger = getLogger('py-splashscreen');

const AUTOCLOSE_LOADER_DEPRECATED = `
The setting autoclose_loader is deprecated. Please use the
following instead:<br>
<pre>
&lt;py-config&gt;
[splashscreen]
autoclose = false
&lt;/py-config&gt;
</pre>`;

export class SplashscreenPlugin extends Plugin {
    elem: PySplashscreen;
    autoclose: boolean;

    configure(config: AppConfig) {
        // the officially supported setting is config.splashscreen.autoclose,
        // but we still also support the old config.autoclose_loader (with a
        // deprecation warning)
        this.autoclose = true;

        if ('autoclose_loader' in config) {
            this.autoclose = config.autoclose_loader;
            showWarning(AUTOCLOSE_LOADER_DEPRECATED, "html");
        }

        if (config.splashscreen) {
            this.autoclose = config.splashscreen.autoclose ?? true;
        }
    }

    beforeLaunch(config: AppConfig) {
        // add the splashscreen to the DOM
        logger.info('add py-splashscreen');
        customElements.define('py-splashscreen', PySplashscreen);
        this.elem = <PySplashscreen>document.createElement('py-splashscreen');
        document.body.append(this.elem);
        document.addEventListener("py-status-message", (e: CustomEvent) => {
            const msg = e.detail;
            this.elem.log(msg);
        });
    }

    afterStartup(runtime: Runtime) {
        if (this.autoclose) {
            this.elem.close();
        }
    }

    onUserError(error: UserError) {
        if (this.elem !== undefined) {
            // Remove the splashscreen so users can see the banner better
            this.elem.close();
        }
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
