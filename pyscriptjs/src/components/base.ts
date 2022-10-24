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

    constructor() {
        super();

        // attach shadow so we can preserve the element original innerHtml content
        this.shadow = this.attachShadow({ mode: 'open' });
        this.wrapper = document.createElement('slot');
        this.shadow.appendChild(this.wrapper);
    }

}
