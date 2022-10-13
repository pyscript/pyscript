import { runtimeLoaded } from '../stores';
import { guidGenerator, addClasses, removeClasses } from '../utils';

import type { Runtime } from '../runtime';
import { getLogger } from '../logger';

const logger = getLogger('pyscript/base');

// Global `Runtime` that implements the generic runtimes API
let globalRuntime: Runtime;
let Element;

runtimeLoaded.subscribe(value => {
    globalRuntime = value;
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
        let output: string;
        try {
            source = this.source ? await this.getSourceFromFile(this.source)
                                 : this.getSourceFromElement();

            this._register_esm(globalRuntime);
            <string>await globalRuntime.run(
                `output_manager.change(out="${this.outputElement.id}", err="${this.errorElement.id}", append=${this.appendOutput ? 'True' : 'False'})`,
            );
            output = <string>await globalRuntime.run(source);

            if (output !== undefined) {
                if (Element === undefined) {
                    Element = <Element>globalRuntime.globals.get('Element');
                }
                const out = Element(this.outputElement.id);
                out.write.callKwargs(output, { append: this.appendOutput });

                this.outputElement.hidden = false;
                this.outputElement.style.display = 'block';
            }

            await globalRuntime.run(`output_manager.revert()`);

            // check if this REPL contains errors, delete them and remove error classes
            const errorElements = document.querySelectorAll(`div[id^='${this.errorElement.id}'][error]`);
            if (errorElements.length > 0) {
                errorElements.forEach( errorElement =>
                    {
                        errorElement.classList.add('hidden');
                        if (this.hasAttribute('std-err')) {
                            this.errorElement.hidden = true;
                            this.errorElement.style.removeProperty('display');
                        }
                    }
                )
            }
            removeClasses(this.errorElement, ['bg-red-200', 'p-2']);

            this.postEvaluate();
        } catch (err) {
            logger.error(err);
            try{
                if (Element === undefined) {
                    Element = <Element>globalRuntime.globals.get('Element');
                }
                const out = Element(this.errorElement.id);

                addClasses(this.errorElement, ['bg-red-200', 'p-2']);
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
}
