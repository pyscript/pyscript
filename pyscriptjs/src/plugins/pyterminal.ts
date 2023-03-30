import type { PyScriptApp } from '../main';
import type { AppConfig } from '../pyconfig';
import { Plugin, validateConfigParameterFromArray } from '../plugin';
import { getLogger } from '../logger';
import { type Stdio } from '../stdio';
import { InterpreterClient } from '../interpreter_client';
import type { Terminal as TerminalType } from 'xterm';
import type { WebLinksAddon as WebLinksAddonType } from 'xterm-addon-web-links';

type AppConfigStyle = AppConfig & {
    terminal?: boolean | 'auto';
    docked?: boolean | 'docked';
    xterm?: boolean | 'xterm';
};

const logger = getLogger('py-terminal');

const validate = (config: AppConfigStyle, name: string, default_: string) => {
    const value = config[name] as undefined | boolean | string;
    if (value !== undefined && value !== true && value !== false && default_ !== null && value !== default_) {
        const got = JSON.stringify(value);

        let msg: string;
        if (default_ == null) {
            msg = `Invalid value for config.${name}: the only accepted` + `values are true and false, got "${got}".`;
        } else {
            msg =
                `Invalid value for config.${name}: the only accepted` +
                `values are true, false and "${default_}", got "${got}".`;
        }

        throw new UserError(ErrorCode.BAD_CONFIG, msg);
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
        validateConfigParameterFromArray({
            config: config,
            name: 'terminal',
            possibleValues: [true, false, 'auto'],
            defaultValue: 'auto',
        });
        validateConfigParameterFromArray({
            config: config,
            name: 'docked',
            possibleValues: [true, false, 'docked'],
            defaultValue: 'docked',
        });
        validate(config, 'xterm', null);
    }

    beforeLaunch(config: AppConfigStyle) {
        // if config.terminal is "yes" or "auto", let's add a <py-terminal> to
        // the document, unless it's already present.
        const { terminal: t, docked: d, xterm: x } = config;
        const auto = t === true || t === 'auto';
        const docked = d === true || d === 'docked';
        const xterm = x === true || x === 'xterm';
        if (auto && document.querySelector('py-terminal') === null) {
            logger.info('No <py-terminal> found, adding one');
            const termElem = document.createElement('py-terminal');
            if (auto) termElem.setAttribute('auto', '');
            if (docked) termElem.setAttribute('docked', '');
            if (xterm) termElem.setAttribute('xterm', '');
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
        //      console as usual).
        //
        //   4. (in the future we might want to add an option to start the
        //      capture earlier, but I don't think it's important now).
        const PyTerminal = _interpreter.config.xterm ? make_PyTerminal_xterm(this.app) : make_PyTerminal_pre(this.app);
        customElements.define('py-terminal', PyTerminal);
    }
}

abstract class PyTerminalBaseClass extends HTMLElement implements Stdio {
    autoShowOnNextLine: boolean;

    isAuto() {
        return this.hasAttribute('auto');
    }

    isDocked() {
        return this.hasAttribute('docked');
    }

    setupPosition(app: PyScriptApp) {
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

    abstract stdout_writeline(msg: string): void;
    abstract stderr_writeline(msg: string): void;
}

function make_PyTerminal_pre(app: PyScriptApp) {
    /** The <py-terminal> custom element, which automatically register a stdio
     *  listener to capture and display stdout/stderr
     */
    class PyTerminalPre extends PyTerminalBaseClass {
        outElem: HTMLElement;

        connectedCallback() {
            // should we use a shadowRoot instead? It looks unnecessarily
            // complicated to me, but I'm not really sure about the
            // implications
            this.outElem = document.createElement('pre');
            this.outElem.className = 'py-terminal';
            this.appendChild(this.outElem);

            this.setupPosition(app);
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

    return PyTerminalPre;
}

declare const Terminal: typeof TerminalType;
declare const WebLinksAddon: { WebLinksAddon: typeof WebLinksAddonType };

function make_PyTerminal_xterm(app: PyScriptApp) {
    /** The <py-terminal> custom element, which automatically register a stdio
     *  listener to capture and display stdout/stderr
     */
    class PyTerminalXterm extends PyTerminalBaseClass {
        outElem: HTMLDivElement;
        moduleResolved: boolean;
        term: TerminalType;
        cachedStdOut: Array<string>;
        cachedStdErr: Array<string>;

        constructor() {
            super();
            this.moduleResolved = false;
            this.cachedStdOut = [];
            this.cachedStdErr = [];

            //Required to make xterm appear properly
            this.style.width = '100%';
            this.style.height = '100%';
        }

        async connectedCallback() {
            this.outElem = document.createElement('div');
            //this.outElem.className = 'py-terminal';
            this.appendChild(this.outElem);

            this.setupPosition(app);

            // eslint-disable-next-line
            // @ts-ignore
            if (globalThis.Terminal == undefined) {
                //xterm module proper
                //eslint-disable-next-line
                //@ts-ignore
                await import('https://cdn.jsdelivr.net/npm/xterm@5.1.0/lib/xterm.js');
                //Things formatted 'like URLs' are clickable links
                //eslint-disable-next-line
                //@ts-ignore
                await import('https://cdn.jsdelivr.net/npm/xterm-addon-web-links@0.8.0/lib/xterm-addon-web-links.js');

                const cssTag = document.createElement('link');
                cssTag.type = 'text/css';
                cssTag.rel = 'stylesheet';
                cssTag.href = 'https://cdn.jsdelivr.net/npm/xterm@5.1.0/css/xterm.css';
                document.head.appendChild(cssTag);

                //Create xterm, add addons
                this.term = new Terminal({ screenReaderMode: true, cols: 80 });
                this.term.loadAddon(new WebLinksAddon.WebLinksAddon());
                this.term.open(this);

                this.moduleResolved = true;

                //Write out any messages output while xterm was loading
                this.cachedStdOut.forEach((value: string): void => this.stdout_writeline(value));
                this.cachedStdErr.forEach((value: string): void => this.stderr_writeline(value));
            } else {
                this.moduleResolved = true;
            }
        }

        // implementation of the Stdio interface
        stdout_writeline(msg: string) {
            if (this.moduleResolved) {
                console.log(`Writing ${msg} to xterm`);
                this.term.writeln(msg);
                //this.outElem.innerText += msg + '\n';

                if (this.isDocked()) {
                    this.scrollTop = this.scrollHeight;
                }
                if (this.autoShowOnNextLine) {
                    this.classList.remove('py-terminal-hidden');
                    this.autoShowOnNextLine = false;
                }
            } else {
                //if xtermjs not loaded, cache messages
                this.cachedStdOut.push(msg);
            }
        }

        stderr_writeline(msg: string) {
            this.stdout_writeline(msg);
        }
        // end of the Stdio interface
    }

    return PyTerminalXterm;
}
