import type { PyScriptApp } from '../main';
import type { AppConfig } from '../pyconfig';
import { Plugin } from '../plugin';
import { UserError, ErrorCode } from '../exceptions';
import { getLogger } from '../logger';
import { type Stdio } from '../stdio';
import { InterpreterClient } from '../interpreter_client';

type AppConfigStyle = AppConfig & { terminal?: boolean | 'auto'; docked?: boolean | 'docked' };

const logger = getLogger('py-terminal');

const validate = (config: AppConfigStyle, name: string, default_: string) => {
    const value = config[name] as undefined | boolean | string;
    if (value !== undefined && value !== true && value !== false && value !== default_) {
        const got = JSON.stringify(value);
        throw new UserError(
            ErrorCode.BAD_CONFIG,
            `Invalid value for config.${name}: the only accepted` +
                `values are true, false and "${default_}", got "${got}".`,
        );
    }
    if (value === undefined) {
        config[name] = default_;
    }
};

export class PyTerminalPlugin extends Plugin {
    app: PyScriptApp;

    constructor(app: PyScriptApp) {
        super();
        this.app = app;
    }

    configure(config: AppConfigStyle) {
        // validate the terminal config and handle default values
        validate(config, 'terminal', 'auto');
        validate(config, 'docked', 'docked');
    }

    beforeLaunch(config: AppConfigStyle) {
        // if config.terminal is "yes" or "auto", let's add a <py-terminal> to
        // the document, unless it's already present.
        const { terminal: t, docked: d } = config;
        const auto = t === true || t === 'auto';
        const docked = d === true || d === 'docked';
        if (auto && document.querySelector('py-terminal') === null) {
            logger.info('No <py-terminal> found, adding one');
            const termElem = document.createElement('py-terminal');
            if (auto) termElem.setAttribute('auto', '');
            if (docked) termElem.setAttribute('docked', '');
            document.body.appendChild(termElem);
        }
    }

    afterSetup(_interpreter: InterpreterClient) {
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

function make_PyTerminal(app: PyScriptApp) {
    /** The <py-terminal> custom element, which automatically register a stdio
     *  listener to capture and display stdout/stderr
     */
    class PyTerminal extends HTMLElement implements Stdio {
        outElem: HTMLElement;
        autoShowOnNextLine: boolean;

        connectedCallback() {
            // should we use a shadowRoot instead? It looks unnecessarily
            // complicated to me, but I'm not really sure about the
            // implications
            this.outElem = document.createElement('pre');
            this.outElem.className = 'py-terminal';
            this.appendChild(this.outElem);

            if (this.isAuto()) {
                this.classList.add('py-terminal-hidden');
                this.autoShowOnNextLine = true;
            } else {
                this.autoShowOnNextLine = false;
            }

            if (this.isDocked()) {
                this.classList.add('py-terminal-docked');
            }

            logger.info('Registering stdio listener');
            app.registerStdioListener(this);
        }

        isAuto() {
            return this.hasAttribute('auto');
        }

        isDocked() {
            return this.hasAttribute('docked');
        }

        // implementation of the Stdio interface
        stdout_writeline(msg: string) {
            this.outElem.innerText += msg + '\n';
            if (this.isDocked()) {
                this.scrollTop = this.scrollHeight;
            }
            if (this.autoShowOnNextLine) {
                this.classList.remove('py-terminal-hidden');
                this.autoShowOnNextLine = false;
            }
        }

        stderr_writeline(msg: string) {
            this.stdout_writeline(msg);
        }
        // end of the Stdio interface
    }

    return PyTerminal;
}
