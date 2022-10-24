// XXX this should be eventually killed.
// The only remaining class which inherit from BaseEvalElement is PyRepl: we
// should merge the two classes together, do a refactoing of how PyRepl to use
// the new pyExec and in general clean up the unnecessary code.

import { ensureUniqueId, addClasses, removeClasses, getAttribute } from '../utils';
import type { Runtime } from '../runtime';
import { getLogger } from '../logger';

const logger = getLogger('pyscript/base');

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


}
