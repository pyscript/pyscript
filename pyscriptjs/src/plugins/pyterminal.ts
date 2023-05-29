import { $ } from 'basic-devtools';

import type { PyScriptApp } from '../main';
import type { AppConfig } from '../pyconfig';
import { Plugin, validateConfigParameterFromArray } from '../plugin';
import { getLogger } from '../logger';
import { type Stdio } from '../stdio';
import { InterpreterClient } from '../interpreter_client';
import { Terminal as TerminalType } from 'xterm';

const knownPyTerminalTags: WeakSet<HTMLElement> = new WeakSet();

type AppConfigStyle = AppConfig & {
    terminal?: boolean | 'auto';
    docked?: boolean | 'docked';
    xterm?: boolean | 'xterm';
};

const logger = getLogger('py-terminal');

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
        validateConfigParameterFromArray({
            config: config,
            name: 'xterm',
            possibleValues: [true, false, 'xterm'],
            defaultValue: false,
        });
    }

    beforeLaunch(config: AppConfigStyle) {
        // if config.terminal is "yes" or "auto", let's add a <py-terminal> to
        // the document, unless it's already present.
        const { terminal: t, docked: d, xterm: x } = config;
        const auto = t === true || t === 'auto';
        const docked = d === true || d === 'docked';
        const xterm = x === true || x === 'xterm';
        if (auto && $('py-terminal', document) === null) {
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
        //   1. define the "py-terminal" custom element, either a <pre> element
        //      or using xterm.js
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
            this.outElem.classList.add('py-terminal');
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

function make_PyTerminal_xterm(app: PyScriptApp) {
    /** The <py-terminal> custom element, which automatically register a stdio
     *  listener to capture and display stdout/stderr
     */
    class PyTerminalXterm extends PyTerminalBaseClass {
        outElem: HTMLDivElement;
        _moduleResolved: boolean;
        xtermReady: Promise<TerminalType>;
        xterm: TerminalType;
        cachedStdOut: Array<string>;
        cachedStdErr: Array<string>;
        _xterm_cdn_base_url = 'https://cdn.jsdelivr.net/npm/xterm@5.1.0';

        constructor() {
            super();
            this.cachedStdOut = [];
            this.cachedStdErr = [];

            // While this is false, store writes to stdout/stderr to a buffer
            // when the xterm.js is actually ready, we will "replay" those writes
            // and set this to true
            this._moduleResolved = false;

            //Required to make xterm appear properly
            this.style.width = '100%';
            this.style.height = '100%';
        }

        async connectedCallback() {
            //guard against initializing a tag twice
            if (knownPyTerminalTags.has(this)) return;
            knownPyTerminalTags.add(this);

            this.outElem = document.createElement('div');
            //this.outElem.className = 'py-terminal';
            this.appendChild(this.outElem);

            this.setupPosition(app);

            this.xtermReady = this._setupXterm();
            await this.xtermReady;
        }

        /**
         * Fetch the xtermjs library from CDN an initialize it.
         * @private
         * @returns the associated xterm.js Terminal
         */
        async _setupXterm() {
            if (this.xterm == undefined) {
                //need to initialize the Terminal for this element

                // eslint-disable-next-line
                // @ts-ignore
                if (globalThis.Terminal == undefined) {
                    //load xterm module from cdn
                    //eslint-disable-next-line
                    //@ts-ignore
                    await import(this._xterm_cdn_base_url + '/lib/xterm.js');

                    const cssTag = document.createElement('link');
                    cssTag.type = 'text/css';
                    cssTag.rel = 'stylesheet';
                    cssTag.href = this._xterm_cdn_base_url + '/css/xterm.css';
                    document.head.appendChild(cssTag);
                }

                //Create xterm, add addons
                this.xterm = new Terminal({ screenReaderMode: true, cols: 80 });

                // xterm must only 'open' into a visible DOM element
                // If terminal is still hidden, open during first write
                if (!this.autoShowOnNextLine) this.xterm.open(this);

                this._moduleResolved = true;

                //Write out any messages output while xterm was loading
                this.cachedStdOut.forEach((value: string): void => this.stdout_writeline(value));
                this.cachedStdErr.forEach((value: string): void => this.stderr_writeline(value));
            } else {
                this._moduleResolved = true;
            }
            return this.xterm;
        }

        // implementation of the Stdio interface
        stdout_writeline(msg: string) {
            if (this._moduleResolved) {
                this.xterm.writeln(msg);
                //this.outElem.innerText += msg + '\n';

                if (this.isDocked()) {
                    this.scrollTop = this.scrollHeight;
                }
                if (this.autoShowOnNextLine) {
                    this.classList.remove('py-terminal-hidden');
                    this.autoShowOnNextLine = false;
                    this.xterm.open(this);
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
