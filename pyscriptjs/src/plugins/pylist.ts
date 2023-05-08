import { getLogger } from '../logger';
import type { PyProxy, PyProxyCallable } from 'pyodide';
import { robustFetch } from '../fetch';
import type { Remote } from 'synclink';
import { InterpreterClient } from '../interpreter_client';
import { Plugin } from '../plugin';

const logger = getLogger('py-list');

function make_PyList(interpreter: InterpreterClient) {
    class PyList extends HTMLElement {
        name: string = "py-list"
        src: string
        code: string
        klass: string = "PyList"
        wrapper: HTMLElement;
        proxy: Remote<PyProxy & { connect(): void }>;
        proxyClass: Remote<PyProxyCallable>;

        constructor() {
            super()
            this.wrapper = document.createElement('slot');
            this.attachShadow({ mode: 'open' }).appendChild(this.wrapper);
            this.src = this.getAttribute('src');
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
            logger.debug('PyList: reading source', this.src);
            const response = await robustFetch(this.src);
            if (!response.ok) {
                return;
            }
            this.code = await response.text();
            await interpreter.runButDontRaise(this.code);
            this.proxyClass = (await interpreter.globals.get(this.klass)) as Remote<PyProxyCallable>;
            this.proxy = (await this.proxyClass(this)) as Remote<PyProxy & { connect(): void }>;
            await this.proxy.connect();
            await interpreter.globals.set(this.id, this.proxy);
        }
    }

    return PyList;
}

export class PyListPlugin extends Plugin {
    afterStartup(runtime: InterpreterClient) {
        const PyList = make_PyList(runtime);
        customElements.define('py-list', PyList);
    }
}
