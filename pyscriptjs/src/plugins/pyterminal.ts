import type { PyScriptApp } from '../main';
import { getLogger } from '../logger';
import { type Stdio } from '../stdio';

const logger = getLogger('py-terminal');

export class PyTerminalPlugin {
    app: PyScriptApp;

    constructor(app: PyScriptApp) {
        this.app = app;
    }

    setupComplete() {
        // the Python interpreter has been initialized and we are ready to
        // execute user code:
        //
        //   1. define the "py-terminal" custom element
        //
        //   2. if there is a <py-terminal> tag on the page, it will register
        //      a Stdio listener just before the user code executes, ensuring
        //      that we capture all the output
        //
        //   3. everything which was written to stdout BEFORE this moment will
        //      NOT be shown on the py-terminal; in particular, pyodide
        //      startup messages will not be shown (but they will go to the
        //      console as usual). This is by design, else we would display
        //      e.g. "Python initialization complete" on every page, which we
        //      don't want.
        //
        //   4. (in the future we might want to add an option to start the
        //      capture earlier, but I don't think it's important now).
        const PyTerminal = make_PyTerminal(this.app);
        customElements.define('py-terminal', PyTerminal);
    }
}

/** A Stdio provider which appends messages to an HTMLElement
 */
class ElementStdio implements Stdio {
    el: HTMLElement;

    constructor(el: HTMLElement) {
        this.el = el;
    }

    stdout_writeline(msg: string) {
        this.el.innerText += msg + "\n";
    }

    stderr_writeline(msg: string) {
        this.stdout_writeline(msg);
    }

}

function make_PyTerminal(app: PyScriptApp) {

    /** The <py-terminal> custom element, which automatically register a stdio
     *  listener to capture and display stdout/stderr
     */
    class PyTerminal extends HTMLElement {
        constructor() {
            super();
        }

        connectedCallback() {
            const outElem = document.createElement('pre');
            outElem.className = 'py-terminal';
            this.appendChild(outElem);
            const stdio = new ElementStdio(outElem);
            logger.info('Registering stdio listener');
            app.registerStdioListener(stdio);
        }
    }

    return PyTerminal;
}
