import { loadedEnvironments, mode, pyodideLoaded, type Environment } from '../stores';
import { guidGenerator, addClasses, removeClasses } from '../utils';
import type { PyodideInterface } from '../pyodide';
// Premise used to connect to the first available pyodide interpreter
let runtime;
let environments: Record<Environment['id'], Environment> = {};
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
                console.log(`${this.id}: custom output-modes are currently not implemented`);
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
        this.preEvaluate();

        const pyodide = runtime;
        let source: string;
        let output;
        try {
            source = this.source ? await this.getSourceFromFile(this.source)
                                 : this.getSourceFromElement();
            const is_async = source.includes('asyncio')

            await this._register_esm(pyodide);
            if (is_async) {
                await pyodide.runPythonAsync(
                    `output_manager.change(out="${this.outputElement.id}", err="${this.errorElement.id}", append=${this.appendOutput ? 'True' : 'False'})`,
                );
                output = await pyodide.runPythonAsync(source);
            } else {
                output = pyodide.runPython(
                    `output_manager.change(out="${this.outputElement.id}", err="${this.errorElement.id}", append=${this.appendOutput ? 'True' : 'False'})`,
                );
                output = pyodide.runPython(source);
            }

            if (output !== undefined) {
                if (Element === undefined) {
                    Element = pyodide.globals.get('Element');
                }
                const out = Element(this.outputElement.id);
                out.write.callKwargs(output, { append: this.appendOutput });

                this.outputElement.hidden = false;
                this.outputElement.style.display = 'block';
            }

            is_async ? await pyodide.runPythonAsync(`output_manager.revert()`)
                     : await pyodide.runPython(`output_manager.revert()`);

            // check if this REPL contains errors, delete them and remove error classes
            const errorElements = document.querySelectorAll(`div[id^='${this.errorElement.id}'][error]`);
            if (errorElements.length > 0) {
                for (const errorElement of errorElements) {
                    errorElement.classList.add('hidden');
                    if (this.hasAttribute('std-err')) {
                        this.errorElement.hidden = true;
                        this.errorElement.style.removeProperty('display');
                    }
                }
            }
            removeClasses(this.errorElement, ['bg-red-200', 'p-2']);

            this.postEvaluate();
        } catch (err) {
            if (Element === undefined) {
                Element = pyodide.globals.get('Element');
            }
            const out = Element(this.errorElement.id);

            addClasses(this.errorElement, ['bg-red-200', 'p-2']);
            out.write.callKwargs(err, { append: this.appendOutput });

            this.errorElement.children[this.errorElement.children.length - 1].setAttribute('error', '');
            this.errorElement.hidden = false;
            this.errorElement.style.display = 'block';
            this.errorElement.style.visibility = 'visible';
        }
    } // end evaluate

    async eval(source: string): Promise<void> {
        const pyodide = runtime;

        try {
            const output = await pyodide.runPythonAsync(source);
            if (output !== undefined) {
                console.log(output);
            }
        } catch (err) {
            console.log(err);
        }
    } // end eval

    runAfterRuntimeInitialized(callback: () => Promise<void>){
        pyodideLoaded.subscribe(value => {
            if ('runPythonAsync' in value) {
                setTimeout(async () => {
                    await callback();
                }, 100);
            }
        });
    }
}
