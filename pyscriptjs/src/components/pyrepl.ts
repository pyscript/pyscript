import { $, $$ } from 'basic-devtools';

import { basicSetup, EditorView } from 'codemirror';
import { python } from '@codemirror/lang-python';
import { indentUnit } from '@codemirror/language';
import { Compartment } from '@codemirror/state';
import { keymap, Command } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { oneDarkTheme } from '@codemirror/theme-one-dark';

import { ensureUniqueId, htmlDecode } from '../utils';
import { pyExec } from '../pyexec';
import { getLogger } from '../logger';
import { InterpreterClient } from '../interpreter_client';
import type { PyScriptApp } from '../main';
import { Stdio } from '../stdio';
import { robustFetch } from '../fetch';
import { _createAlertBanner } from '../exceptions';

const logger = getLogger('py-repl');
const RUNBUTTON = `<svg style="height:20px;width:20px;vertical-align:-.125em;transform-origin:center;overflow:visible;color:green" viewBox="0 0 384 512" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg"><g transform="translate(192 256)" transform-origin="96 0"><g transform="translate(0,0) scale(1,1)"><path d="M361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215z" fill="currentColor" transform="translate(-192 -256)"></path></g></g></svg>`;

export function make_PyRepl(interpreter: InterpreterClient, app: PyScriptApp) {
    /* High level structure of py-repl DOM, and the corresponding JS names.

           this             <py-repl>
           boxDiv               <div class='py-repl-box'>
           editorDiv                <div class="py-repl-editor"></div>
           outDiv                   <div class="py-repl-output"></div>
                                </div>
                            </py-repl>
    */
    class PyRepl extends HTMLElement {
        outDiv: HTMLElement;
        editor: EditorView;
        stdout_manager: Stdio | null;
        stderr_manager: Stdio | null;
        static observedAttributes = ['src'];
        connectedCallback() {
            ensureUniqueId(this);

            if (!this.hasAttribute('exec-id')) {
                this.setAttribute('exec-id', '0');
            }
            if (!this.hasAttribute('root')) {
                this.setAttribute('root', this.id);
            }

            const pySrc = htmlDecode(this.innerHTML).trim();
            this.innerHTML = '';
            const boxDiv = this.makeBoxDiv();
            const shadowRoot = $('.py-repl-editor > div', boxDiv).attachShadow({ mode: 'open' });
            // avoid inheriting styles from the outer component
            shadowRoot.innerHTML = `<style> :host { all: initial; }</style>`;
            this.appendChild(boxDiv);
            this.editor = this.makeEditor(pySrc, shadowRoot);
            this.editor.focus();
            logger.debug(`element ${this.id} successfully connected`);
        }

        get src() {
            return this.getAttribute('src');
        }

        set src(value) {
            this.setAttribute('src', value);
        }

        attributeChangedCallback(name: string, oldVal: string, newVal: string) {
            if (name === 'src' && newVal !== oldVal) {
                void this.loadReplSrc();
            }
        }

        /**
         * Fetch url from src attribute of py-repl tags and
         * preload the code from fetch response into the Corresponding py-repl tag,
         * but please note that they will not be pre-run unless you click the runbotton.
         */
        async loadReplSrc() {
            try {
                const response = await robustFetch(this.src);
                if (!response.ok) {
                    return;
                }
                const cmcontentElement = $('div.cm-content', this.editor.dom);
                const { lastElementChild } = cmcontentElement;
                cmcontentElement.replaceChildren(lastElementChild);
                lastElementChild.textContent = await response.text();
                logger.info(`loading code from ${this.src} to repl...success`);
            } catch (err) {
                const e = err as Error;
                _createAlertBanner(e.message);
            }
        }

        /** Create and configure the codemirror editor
         */
        makeEditor(pySrc: string, parent: ShadowRoot): EditorView {
            const languageConf = new Compartment();
            const extensions = [
                indentUnit.of('    '),
                basicSetup,
                languageConf.of(python()),
                keymap.of([
                    ...defaultKeymap,
                    { key: 'Ctrl-Enter', run: this.execute.bind(this) as Command, preventDefault: true },
                    { key: 'Shift-Enter', run: this.execute.bind(this) as Command, preventDefault: true },
                ]),
            ];

            if (this.getAttribute('theme') === 'dark') {
                extensions.push(oneDarkTheme);
            }

            return new EditorView({
                doc: pySrc,
                extensions,
                parent,
            });
        }

        // ******** main entry point for py-repl DOM building **********
        //
        // The following functions are written in a top-down, depth-first
        // order (so that the order of code roughly matches the order of
        // execution)
        makeBoxDiv(): HTMLElement {
            const boxDiv = document.createElement('div');
            boxDiv.className = 'py-repl-box';

            const editorDiv = this.makeEditorDiv();
            this.outDiv = this.makeOutDiv();

            boxDiv.appendChild(editorDiv);
            boxDiv.appendChild(this.outDiv);

            return boxDiv;
        }

        makeEditorDiv(): HTMLElement {
            const editorDiv = document.createElement('div');
            editorDiv.className = 'py-repl-editor';
            editorDiv.setAttribute('aria-label', 'Python Script Area');

            const runButton = this.makeRunButton();
            const editorShadowContainer = document.createElement('div');

            // avoid outer elements intercepting key events (reveal as example)
            editorShadowContainer.addEventListener('keydown', event => {
                event.stopPropagation();
            });

            editorDiv.append(editorShadowContainer, runButton);

            return editorDiv;
        }

        makeRunButton(): HTMLElement {
            const runButton = document.createElement('button');
            runButton.className = 'absolute py-repl-run-button';
            runButton.innerHTML = RUNBUTTON;
            runButton.setAttribute('aria-label', 'Python Script Run Button');
            runButton.addEventListener('click', this.execute.bind(this) as (e: MouseEvent) => void);
            return runButton;
        }

        makeOutDiv(): HTMLElement {
            const outDiv = document.createElement('div');
            outDiv.className = 'py-repl-output';
            outDiv.id = this.id + '-repl-output';
            return outDiv;
        }

        //  ********************* execution logic *********************

        /** Execute the python code written in the editor, and automatically
         *  display() the last evaluated expression
         */
        async execute(): Promise<void> {
            const pySrc = this.getPySrc();
            const outEl = this.outDiv;

            // execute the python code
            await app.plugins.beforePyReplExec({ interpreter: interpreter, src: pySrc, outEl: outEl, pyReplTag: this });
            const { result } = await pyExec(interpreter, pySrc, outEl);
            await app.plugins.afterPyReplExec({
                interpreter: interpreter,
                src: pySrc,
                outEl: outEl,
                pyReplTag: this,
                result,
            });

            this.autogenerateMaybe();
        }

        getPySrc(): string {
            return this.editor.state.doc.toString();
        }

        // XXX the autogenerate logic is very messy. We should redo it, and it
        // should be the default.
        autogenerateMaybe(): void {
            if (this.hasAttribute('auto-generate')) {
                const allPyRepls = $$(`py-repl[root='${this.getAttribute('root')}'][exec-id]`, document);
                const lastRepl = allPyRepls[allPyRepls.length - 1];
                const lastExecId = lastRepl.getAttribute('exec-id');
                const nextExecId = parseInt(lastExecId) + 1;

                const newPyRepl = document.createElement('py-repl');

                //Attributes to be copied from old REPL to auto-generated REPL
                for (const attribute of ['root', 'output-mode', 'output', 'stderr']) {
                    const attr = this.getAttribute(attribute);
                    if (attr) {
                        newPyRepl.setAttribute(attribute, attr);
                    }
                }

                newPyRepl.id = this.getAttribute('root') + '-' + nextExecId.toString();

                if (this.hasAttribute('auto-generate')) {
                    newPyRepl.setAttribute('auto-generate', '');
                    this.removeAttribute('auto-generate');
                }

                newPyRepl.setAttribute('exec-id', nextExecId.toString());
                if (this.parentElement) {
                    this.parentElement.appendChild(newPyRepl);
                }
            }
        }
    }

    return PyRepl;
}
