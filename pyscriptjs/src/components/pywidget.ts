import type { PyProxy, PyProxyCallable } from 'pyodide';
import { getLogger } from '../logger';
import { robustFetch } from '../fetch';
import { InterpreterClient } from '../interpreter_client';
import type { Remote } from 'synclink';

const logger = getLogger('py-register-widget');

function createWidget(interpreter: InterpreterClient, name: string, code: string, klass: string) {
    class CustomWidget extends HTMLElement {
        shadow: ShadowRoot;
        wrapper: HTMLElement;

        name: string = name;
        klass: string = klass;
        code: string = code;
        proxy: Remote<PyProxy & { connect(): void }>;
        proxyClass: Remote<PyProxyCallable>;

        constructor() {
            super();

            // attach shadow so we can preserve the element original innerHtml content
            this.shadow = this.attachShadow({ mode: 'open' });

            this.wrapper = document.createElement('slot');
            this.shadow.appendChild(this.wrapper);
        }

        async connectedCallback() {
            await interpreter.runButDontRaise(this.code);
            this.proxyClass = (await interpreter.globals.get(this.klass)) as Remote<PyProxyCallable>;
            this.proxy = (await this.proxyClass(this)) as Remote<PyProxy & { connect(): void }>;
            await this.proxy.connect();
            await this.registerWidget();
        }

        async registerWidget() {
            logger.info('new widget registered:', this.name);
            await interpreter.globals.set(this.id, this.proxy);
        }
    }
    customElements.define(name, CustomWidget);
}

export function make_PyWidget(interpreter: InterpreterClient) {
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
            createWidget(interpreter, this.name, this.code, this.klass);
        }

        async getSourceFromFile(s: string): Promise<string> {
            const response = await robustFetch(s);
            return await response.text();
        }
    }

    return PyWidget;
}
