import { $ } from 'basic-devtools';

import type { AppConfig } from '../pyconfig';
import type { UserError } from '../exceptions';
import { showWarning } from '../utils';
import { Plugin } from '../plugin';
import { getLogger } from '../logger';
import { InterpreterClient } from '../interpreter_client';

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
    enabled: boolean;

    configure(
        config: AppConfig & { splashscreen?: { autoclose?: boolean; enabled?: boolean }; autoclose_loader?: boolean },
    ) {
        // the officially supported setting is config.splashscreen.autoclose,
        // but we still also support the old config.autoclose_loader (with a
        // deprecation warning)
        this.autoclose = true;
        this.enabled = true;

        if ('autoclose_loader' in config) {
            this.autoclose = config.autoclose_loader;
            showWarning(AUTOCLOSE_LOADER_DEPRECATED, 'html');
        }

        if (config.splashscreen) {
            this.autoclose = config.splashscreen.autoclose ?? true;
            this.enabled = config.splashscreen.enabled ?? true;
        }
    }

    beforeLaunch(_config: AppConfig) {
        if (!this.enabled) {
            return;
        }
        // add the splashscreen to the DOM
        logger.info('add py-splashscreen');
        customElements.define('py-splashscreen', PySplashscreen);
        this.elem = <PySplashscreen>document.createElement('py-splashscreen');
        document.body.append(this.elem);
        document.addEventListener('py-status-message', (e: CustomEvent) => {
            const msg = e.detail as string;
            this.elem.log(msg);
        });
    }

    afterStartup(_interpreter: InterpreterClient) {
        if (this.autoclose && this.enabled) {
            this.elem.close();
        }
    }

    onUserError(_error: UserError) {
        if (this.elem !== undefined && this.enabled) {
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
        this.operation = $('#pyscript-operation', document) as HTMLElement;
        this.details = $('#pyscript-operation-details', document) as HTMLElement;
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
