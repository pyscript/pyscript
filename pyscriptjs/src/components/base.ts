import { loadedEnvironments, mode, pyodideLoaded } from '../stores';
import { guidGenerator, addClasses } from '../utils';
// Premise used to connect to the first available pyodide interpreter
let runtime;
let environments;
let currentMode;
let Element;

pyodideLoaded.subscribe(value => {
    runtime = value;
});
loadedEnvironments.subscribe(value => {
    environments = value;
});

mode.subscribe(value => {
    currentMode = value;
});

// TODO: use type declaractions
type PyodideInterface = {
    registerJsModule(name: string, module: object): void;
};

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

    constructor() {
        super();

        // attach shadow so we can preserve the element original innerHtml content
        this.shadow = this.attachShadow({ mode: 'open' });
        this.wrapper = document.createElement('slot');
        this.shadow.appendChild(this.wrapper);
    }

    addToOutput(s: string) {
        this.outputElement.innerHTML += '<div>' + s + '</div>';
        this.outputElement.hidden = false;
    }

    // subclasses should overwrite this method to define custom logic
    // after code has been evaluated
    postEvaluate() {
        return null;
    }

    checkId() {
        if (!this.id) this.id = this.constructor.name + '-' + guidGenerator();
    }

    getSourceFromElement(): string {
        return '';
    }

    async getSourceFromFile(s: string): Promise<string> {
        const pyodide = runtime;
        const response = await fetch(s);
        this.code = await response.text();
        return this.code;
    }

    protected async _register_esm(pyodide: PyodideInterface): Promise<void> {
        const imports: { [key: string]: unknown } = {};

        for (const node of document.querySelectorAll("script[type='importmap']")) {
            const importmap = (() => {
                try {
                    return JSON.parse(node.textContent);
                } catch {
                    return null;
                }
            })();

            if (importmap?.imports == null) continue;

            for (const [name, url] of Object.entries(importmap.imports)) {
                if (typeof name != 'string' || typeof url != 'string') continue;

                try {
                    // XXX: pyodide doesn't like Module(), failing with
                    // "can't read 'name' of undefined" at import time
                    imports[name] = { ...(await import(url)) };
                } catch {
                    console.error(`failed to fetch '${url}' for '${name}'`);
                }
            }
        }

        pyodide.registerJsModule('esm', imports);
    }

    async evaluate(): Promise<void> {
        console.log('evaluate');
        const pyodide = runtime;
        let source: string;
        let output;
        try {
            if (this.source) {
                source = await this.getSourceFromFile(this.source);
            } else {
                source = this.getSourceFromElement();
            }

            await this._register_esm(pyodide);

            if (source.includes('asyncio')) {
                await pyodide.runPythonAsync(
                    `output_manager.change("` + this.outputElement.id + `", "` + this.errorElement.id + `")`,
                );
                output = await pyodide.runPythonAsync(source);
                await pyodide.runPythonAsync(`output_manager.revert()`);
            } else {
                output = pyodide.runPython(
                    `output_manager.change("` + this.outputElement.id + `", "` + this.errorElement.id + `")`,
                );
                output = pyodide.runPython(source);
                pyodide.runPython(`output_manager.revert()`);
            }

            if (output !== undefined) {
                if (Element === undefined) {
                    Element = pyodide.globals.get('Element');
                }
                const out = Element(this.outputElement.id);
                out.write.callKwargs(output, { append: true });

                this.outputElement.hidden = false;
                this.outputElement.style.display = 'block';
            }

            this.postEvaluate();
        } catch (err) {
            if (Element === undefined) {
                Element = pyodide.globals.get('Element');
            }
            const out = Element(this.errorElement.id);

            addClasses(this.errorElement, ['bg-red-200', 'p-2']);
            out.write.callKwargs(err, { append: true });
            this.errorElement.hidden = false;
            this.errorElement.style.display = 'block';
        }
    } // end evaluate

    async eval(source: string): Promise<void> {
        let output;
        const pyodide = runtime;

        try {
            output = await pyodide.runPythonAsync(source);
            if (output !== undefined) {
                console.log(output);
            }
        } catch (err) {
            console.log(err);
        }
    } // end eval
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
            // setTimeout(async () => {
            //     await this.eval(this.code);
            //     this.proxy = this.proxyClass(this);
            //     console.log('proxy', this.proxy);
            //     this.proxy.connect();
            //     this.registerWidget();
            // }, 2000);
            pyodideLoaded.subscribe(value => {
                console.log('RUNTIME READY', value);
                if ('runPythonAsync' in value) {
                    runtime = value;
                    setTimeout(async () => {
                        await this.eval(this.code);
                        this.proxy = this.proxyClass(this);
                        console.log('proxy', this.proxy);
                        this.proxy.connect();
                        this.registerWidget();
                    }, 1000);
                }
            });
        }

        registerWidget() {
            const pyodide = runtime;
            console.log('new widget registered:', this.name);
            pyodide.globals.set(this.id, this.proxy);
        }

        async eval(source: string): Promise<void> {
            let output;
            const pyodide = runtime;
            try {
                output = await pyodide.runPythonAsync(source);
                this.proxyClass = pyodide.globals.get(this.klass);
                if (output !== undefined) {
                    console.log(output);
                }
            } catch (err) {
                console.log(err);
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

        if (this.hasAttribute('src')) {
            this.source = this.getAttribute('src');
        }

        if (this.hasAttribute('name')) {
            this.name = this.getAttribute('name');
        }

        if (this.hasAttribute('klass')) {
            this.klass = this.getAttribute('klass');
        }
    }

    async connectedCallback() {
        if (this.id === undefined) {
            throw new ReferenceError(
                `No id specified for component. Components must have an explicit id. Please use id="" to specify your component id.`,
            );
            return;
        }

        const mainDiv = document.createElement('div');
        mainDiv.id = this.id + '-main';
        this.appendChild(mainDiv);
        console.log('reading source');
        this.code = await this.getSourceFromFile(this.source);
        createWidget(this.name, this.code, this.klass);
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
                this.outputElement = document.getElementById(this.getAttribute('std-err'));
            } else {
                this.errorElement = this.outputElement;
            }
        }
    }

    async getSourceFromFile(s: string): Promise<string> {
        const pyodide = runtime;
        const response = await fetch(s);
        return await response.text();
    }

    async eval(source: string): Promise<void> {
        let output;
        const pyodide = runtime;
        try {
            output = await pyodide.runPythonAsync(source);
            if (output !== undefined) {
                console.log(output);
            }
        } catch (err) {
            console.log(err);
        }
    }
}
