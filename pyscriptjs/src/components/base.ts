import { runtimeLoaded } from '../stores';
import { guidGenerator, addClasses, removeClasses } from '../utils';

import type { Runtime } from '../runtime';
import { getLogger } from '../logger';

const logger = getLogger('pyscript/base');

// Global `Runtime` that implements the generic runtimes API
let runtime: Runtime;
let Element;

runtimeLoaded.subscribe(value => {
    runtime = value;
});

export class BaseEvalElement extends HTMLElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    code: string;
    source: string;
    btnConfig: HTMLElement;
    btnRun: HTMLElement;
    outputElement: HTMLElement;
    errorElement: HTMLElement;
    theme: string;
    appendOutput: boolean;

    constructor() {
        super();

        // attach shadow so we can preserve the element original innerHtml content
        this.shadow = this.attachShadow({ mode: 'open' });
        this.wrapper = document.createElement('slot');
        this.shadow.appendChild(this.wrapper);
        this.setOutputMode("append");
    }

    addToOutput(s: string) {
        this.outputElement.innerHTML += '<div>' + s + '</div>';
        this.outputElement.hidden = false;
    }

    setOutputMode(defaultMode = "append") {
        const mode = this.hasAttribute('output-mode') ? this.getAttribute('output-mode') : defaultMode;

        switch (mode) {
            case "append":
                this.appendOutput = true;
                break;
            case "replace":
                this.appendOutput = false;
                break;
            default:
                logger.warn(`${this.id}: custom output-modes are currently not implemented`);
        }
    }

    // subclasses should overwrite this method to define custom logic
    // before code gets evaluated
    preEvaluate(): void {
        return null;
    }

    // subclasses should overwrite this method to define custom logic
    // after code has been evaluated
    postEvaluate(): void {
        return null;
    }

    checkId() {
        if (!this.id) this.id = 'py-' + guidGenerator();
    }

    getSourceFromElement(): string {
        return '';
    }

    async getSourceFromFile(s: string): Promise<string> {
        const response = await fetch(s);
        this.code = await response.text();
        return this.code;
    }

    protected async _register_esm(runtime: Runtime): Promise<void> {
        const imports: { [key: string]: unknown } = {};
        const nodes = document.querySelectorAll("script[type='importmap']");
        const importmaps: Array<any> = [];
        nodes.forEach( node =>
            {
                let importmap;
                try {
                    importmap = JSON.parse(node.textContent);
                    if (importmap?.imports == null) return;
                    importmaps.push(importmap);
                } catch {
                    return;
                }
            }
        )
        for (const importmap of importmaps){
            for (const [name, url] of Object.entries(importmap.imports)) {
                if (typeof name != 'string' || typeof url != 'string') continue;

                try {
                    // XXX: pyodide doesn't like Module(), failing with
                    // "can't read 'name' of undefined" at import time
                    imports[name] = { ...(await import(url)) };
                } catch {
                    logger.error(`failed to fetch '${url}' for '${name}'`);
                }
            }
        }

        runtime.registerJsModule('esm', imports);
    }

    async evaluate(): Promise<void> {
        this.preEvaluate();

        let source: string;
        try {
            source = this.source ? await this.getSourceFromFile(this.source)
                                 : this.getSourceFromElement();
            this._register_esm(runtime);

            <string>await runtime.run(`set_current_display_target(element="${this.id}")`);
            <string>await runtime.run(source);

            removeClasses(this.errorElement, ['py-error']);
            this.postEvaluate();
        } catch (err) {
            logger.error(err);
            try{
                if (Element === undefined) {
                    Element = <Element>runtime.globals.get('Element');
                }
                const out = Element(this.errorElement.id);

                addClasses(this.errorElement, ['py-error']);
                out.write.callKwargs(err.toString(), { append: this.appendOutput });
                if (this.errorElement.children.length === 0){
                    this.errorElement.setAttribute('error', '');
                }else{
                    this.errorElement.children[this.errorElement.children.length - 1].setAttribute('error', '');
                }

                this.errorElement.hidden = false;
                this.errorElement.style.display = 'block';
                this.errorElement.style.visibility = 'visible';
            } catch (internalErr){
                logger.error("Unnable to write error to error element in page.")
            }

        }
    } // end evaluate

    async eval(source: string): Promise<void> {
        try {
            const output = await runtime.run(source);
            if (output !== undefined) {
                logger.info(output);
            }
        } catch (err) {
            logger.error(err);
        }
    } // end eval

    runAfterRuntimeInitialized(callback: () => Promise<void>) {
        runtimeLoaded.subscribe(value => {
            if ('run' in value) {
                setTimeout(() => {
                    void callback();
                }, 100);
            }
        });
    }
}

function createWidget(name: string, code: string, klass: string) {
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
            // TODO: we are calling with a 2secs delay to allow pyodide to load
            //       ideally we can just wait for it to load and then run. To do
            //       so we need to replace using the promise and actually using
            //       the interpreter after it loads completely
            // setTimeout(() => {
            //     void (async () => {
            //         await this.eval(this.code);
            //         this.proxy = this.proxyClass(this);
            //         console.log('proxy', this.proxy);
            //         this.proxy.connect();
            //         this.registerWidget();
            //     })();
            // }, 2000);
            runtimeLoaded.subscribe(value => {
                if ('run' in value) {
                    runtime = value;
                    setTimeout(() => {
                        void (async () => {
                            await this.eval(this.code);
                            this.proxy = this.proxyClass(this);
                            this.proxy.connect();
                            this.registerWidget();
                        })();
                    }, 1000);
                }
            });
        }

        registerWidget() {
            logger.info('new widget registered:', this.name);
            runtime.globals.set(this.id, this.proxy);
        }

        async eval(source: string): Promise<void> {
            try {
                const output = await runtime.run(source);
                this.proxyClass = runtime.globals.get(this.klass);
                if (output !== undefined) {
                    logger.info('CustomWidget.eval: ', output);
                }
            } catch (err) {
                logger.error('CustomWidget.eval: ', err);
            }
        }
    }
    const xPyWidget = customElements.define(name, CustomWidget);
}

export class PyWidget extends HTMLElement {
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
        createWidget(this.name, this.code, this.klass);
    }

    async getSourceFromFile(s: string): Promise<string> {
        const response = await fetch(s);
        return await response.text();
    }

    async eval(source: string): Promise<void> {
        try {
            const output = await runtime.run(source);
            if (output !== undefined) {
                logger.info('PyWidget.eval: ', output);
            }
        } catch (err) {
            logger.error('PyWidget.eval: ', err);
        }
    }
}
