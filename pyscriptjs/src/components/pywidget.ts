import type { Runtime } from '../runtime';
import type { PyProxy } from 'pyodide';
import { getLogger } from '../logger';
import { robustFetch } from '../fetch';

const logger = getLogger('py-register-widget');

function createWidget(runtime: Runtime, name: string, code: string, klass: string) {
    class CustomWidget extends HTMLElement {
        shadow: ShadowRoot;
        wrapper: HTMLElement;

        name: string = name;
        klass: string = klass;
        code: string = code;
        proxy: PyProxy;
        proxyClass: any;

        constructor() {
            super();

            // attach shadow so we can preserve the element original innerHtml content
            this.shadow = this.attachShadow({ mode: 'open' });

            this.wrapper = document.createElement('slot');
            this.shadow.appendChild(this.wrapper);
        }

        connectedCallback() {
            runtime.runButDontRaise(this.code);
            this.proxyClass = runtime.globals.get(this.klass);
            this.proxy = this.proxyClass(this);
            this.proxy.connect();
            this.registerWidget();
        }

        registerWidget() {
            logger.info('new widget registered:', this.name);
            runtime.globals.set(this.id, this.proxy);
        }
    }
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const xPyWidget = customElements.define(name, CustomWidget);
    /* eslint-enable @typescript-eslint/no-unused-vars */
}

export function make_PyWidget(runtime: Runtime) {
    class PyWidget extends HTMLElement {
        shadow: ShadowRoot;
        name: string;
        klass: string;
        outputElement: HTMLElement;
        errorElement: HTMLElement;
        wrapper: HTMLElement;
        theme: string;
        source: string;
        code: string;

        constructor() {
            super();

            // attach shadow so we can preserve the element original innerHtml content
            this.shadow = this.attachShadow({ mode: 'open' });

            this.wrapper = document.createElement('slot');
            this.shadow.appendChild(this.wrapper);

            this.addAttributes('src', 'name', 'klass');
        }

        addAttributes(...attrs: string[]) {
            for (const each of attrs) {
                const property = each === 'src' ? 'source' : each;
                if (this.hasAttribute(each)) {
                    this[property] = this.getAttribute(each);
                }
            }
        }

        async connectedCallback() {
            if (this.id === undefined) {
                throw new ReferenceError(
                    `No id specified for component. Components must have an explicit id. Please use id="" to specify your component id.`,
                );
            }

            const mainDiv = document.createElement('div');
            mainDiv.id = this.id + '-main';
            this.appendChild(mainDiv);
            logger.debug('PyWidget: reading source', this.source);
            this.code = await this.getSourceFromFile(this.source);
            createWidget(runtime, this.name, this.code, this.klass);
        }

        async getSourceFromFile(s: string): Promise<string> {
            const response = await robustFetch(s);
            return await response.text();
        }
    }

    return PyWidget;
}
