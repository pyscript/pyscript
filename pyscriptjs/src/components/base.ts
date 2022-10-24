// XXX this should be eventually killed.
// The only remaining class which inherit from BaseEvalElement is PyRepl: we
// should merge the two classes together, do a refactoing of how PyRepl to use
// the new pyExec and in general clean up the unnecessary code.

import { ensureUniqueId, addClasses, removeClasses, getAttribute } from '../utils';
import type { Runtime } from '../runtime';
import { getLogger } from '../logger';

const logger = getLogger('pyscript/base');

export class BaseEvalElement extends HTMLElement {
    code: string;
    source: string;
    btnConfig: HTMLElement;
    btnRun: HTMLElement;
    outputElement: HTMLElement;
    errorElement: HTMLElement;
    theme: string;

    constructor() {
        super();
    }

}
