import type { Runtime } from '../runtime';
import { getLogger } from '../logger';

const logger = getLogger('py-register-widget');


function createWidget(runtime: Runtime, name: string, code: string, klass: string) {
    class CustomWidget extends HTMLElement {
        shadow: ShadowRoot;
        wrapper: HTMLElement;

        name: string = name;
        klass: string = klass;
        code: string = code;
        proxy: any;
        proxyClass: any;

        constructor() {
            super();

            // attach shadow so we can preserve the element original innerHtml content
            this.shadow = this.attachShadow({ mode: 'open' });

            this.wrapper = document.createElement('slot');
            this.shadow.appendChild(this.wrapper);
        }

        connectedCallback() {
            setTimeout(() => {
                void (async () => {
                    await runtime.runButDontRaise(this.code);
                    this.proxyClass = runtime.globals.get(this.klass);
                    this.proxy = this.proxyClass(this);
                    this.proxy.connect();
                    this.registerWidget();
                })();
            }, 1000);
        }

        registerWidget() {
            logger.info('new widget registered:', this.name);
            runtime.globals.set(this.id, this.proxy);
        }
    }
    const xPyWidget = customElements.define(name, CustomWidget);
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

            this.addAttributes('src','name','klass');
        }

        addAttributes(...attrs:string[]){
            for (const each of attrs){
                const property = each === "src" ? "source" : each;
                if (this.hasAttribute(each)) {
                  this[property]=this.getAttribute(each);
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

        initOutErr(): void {
            if (this.hasAttribute('output')) {
                this.errorElement = this.outputElement = document.getElementById(this.getAttribute('output'));

                // in this case, the default output-mode is append, if hasn't been specified
                if (!this.hasAttribute('output-mode')) {
                    this.setAttribute('output-mode', 'append');
                }
            } else {
                if (this.hasAttribute('std-out')) {
                    this.outputElement = document.getElementById(this.getAttribute('std-out'));
                } else {
                    // In this case neither output or std-out have been provided so we need
                    // to create a new output div to output to
                    this.outputElement = document.createElement('div');
                    this.outputElement.classList.add('output');
                    this.outputElement.hidden = true;
                    this.outputElement.id = this.id + '-' + this.getAttribute('exec-id');
                }

                if (this.hasAttribute('std-err')) {
                    this.errorElement = document.getElementById(this.getAttribute('std-err'));
                } else {
                    this.errorElement = this.outputElement;
                }
            }
        }

        async getSourceFromFile(s: string): Promise<string> {
            const response = await fetch(s);
            return await response.text();
        }
    }

    return PyWidget;
}
