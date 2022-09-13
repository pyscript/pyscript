import { BaseEvalElement } from './base';
import { getLogger } from '../logger';

const logger = getLogger('py-loader');

export class PyLoader extends BaseEvalElement {
    widths: Array<string>;
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
        // loader messages are showed both in the HTML and in the console
        logger.info(msg);
        const newLog = document.createElement('p');
        newLog.innerText = msg;
        this.details.appendChild(newLog);
    }

    close() {
        logger.info('Closing');
        this.remove();
    }
}
