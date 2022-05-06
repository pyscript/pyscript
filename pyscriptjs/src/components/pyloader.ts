import { BaseEvalElement } from './base';

export class PyLoader extends BaseEvalElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    theme: string;
    widths: Array<string>;
    label: string;
    mount_name: string;
    details: HTMLElement;
    operation: HTMLElement;
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `<div id="pyscript_loading_splash" class="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-gray-600 opacity-75 flex flex-col items-center justify-center">
        <span class="smooth spinner"></span>
        <div id="pyscript-loading-label" class="label">
          <p id="pyscript-operation">Loading..</p>
          <div id="pyscript-operation-details">
            <p>Smooth Spinner 3</p>
          </div>
        </div>
      </div>`;
        this.mount_name = this.id.split('-').join('_');
        this.operation = document.getElementById('pyscript-operation');
        this.details = document.getElementById('pyscript-operation-details');
    }

    close() {
        this.remove();
    }
}
