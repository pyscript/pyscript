// XXX this should be eventually killed.
// The only remaining class which inherit from BaseEvalElement is PyRepl: we
// should merge the two classes together, do a refactoing of how PyRepl to use
// the new pyExec and in general clean up the unnecessary code.

import { ensureUniqueId, addClasses, removeClasses, getAttribute } from '../utils';
import type { Runtime } from '../runtime';
import { getLogger } from '../logger';
import { pyExecDontHandleErrors } from '../pyexec';

const logger = getLogger('pyscript/base');

let Element;

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

    setOutputMode(defaultMode = "append") {
        const mode = getAttribute(this,'output-mode') || defaultMode;

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
        ensureUniqueId(this);
    }

    getSourceFromElement(): string {
        return '';
    }

    async getSourceFromFile(s: string): Promise<string> {
        const response = await fetch(s);
        this.code = await response.text();
        return this.code;
    }

    async evaluate(runtime: Runtime): Promise<void> {
        this.preEvaluate();

        let source: string;
        try {
            source = this.source ? await this.getSourceFromFile(this.source)
                                 : this.getSourceFromElement();

            // XXX we should use pyExec and let it display the errors
            await pyExecDontHandleErrors(runtime, source, this);

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
}
