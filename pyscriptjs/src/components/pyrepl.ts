import { basicSetup, EditorView } from 'codemirror';
import { python } from '@codemirror/lang-python';
import { indentUnit } from '@codemirror/language'
import { Compartment, StateCommand } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { oneDarkTheme } from '@codemirror/theme-one-dark';
import { getAttribute, addClasses, removeClasses,
         ensureUniqueId, htmlDecode } from '../utils';
import type { Runtime } from '../runtime';
import { pyExec, pyDisplay } from '../pyexec';
import { getLogger } from '../logger';

const logger = getLogger('py-repl');

let Element;

export function make_PyRepl(runtime: Runtime) {

    function createCmdHandler(el: PyRepl): StateCommand {
        // Creates a codemirror cmd handler that calls the el.evaluate when an event
        // triggers that specific cmd
        return () => {
            void el.evaluate(runtime);
            return true;
        };
    }

    /* High level structore of py-repl DOM, and their JS names
           this             <py-repl>
             .shadow          #shadow-root
             .boxDiv            <div class='py-repl-box'>
                                  <label>...</label>
             .editorDiv           <div class="py-repl-editor"></div>
             .outDiv              <div class="py-repl-output"></div>
                                </div>
                            </py-repl>
    */
    class PyRepl extends HTMLElement {
        shadow: ShadowRoot;
        wrapper: HTMLElement;
        code: string;
        outDiv: HTMLElement;
        editor: EditorView;

        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
            this.wrapper = document.createElement('slot');
            this.shadow.appendChild(this.wrapper);
        }

        connectedCallback() {
            ensureUniqueId(this);
            this.code = htmlDecode(this.innerHTML);
            this.innerHTML = '';

            if (!this.hasAttribute('exec-id')) {
                this.setAttribute('exec-id', '1');
            }
            if (!this.hasAttribute('root')) {
                this.setAttribute('root', this.id);
            }

            this.editor = this.makeEditor();
            const editorDiv = this.makeEditorDiv();
            const boxDiv = this.makeBoxDiv();
            this.outDiv = this.makeOutDiv();
            boxDiv.appendChild(this.outDiv);

            this.appendChild(boxDiv);
            this.editor.focus();
            logger.debug(`element ${this.id} successfully connected`);
        }

        /** Create and configure the codemirror editor
         */
        makeEditor(): EditorView {
            const languageConf = new Compartment();
            const extensions = [
                indentUnit.of("    "),
                basicSetup,
                languageConf.of(python()),
                keymap.of([
                    ...defaultKeymap,
                    { key: 'Ctrl-Enter', run: createCmdHandler(this) },
                    { key: 'Shift-Enter', run: createCmdHandler(this) },
                ]),
            ];

            if (getAttribute(this, 'theme') === 'dark') {
                extensions.push(oneDarkTheme);
            }

            return new EditorView({
                doc: this.code.trim(),
                extensions,
            });
        }

        makeEditorDiv(): HTMLElement {
            const editorDiv = document.createElement('div');
            editorDiv.id = 'code-editor';
            editorDiv.className = 'py-repl-editor';
            editorDiv.appendChild(this.editor.dom);
            return editorDiv;
        }

        makeRunButton(): HTMLElement {
            const runButton = document.createElement('button');
            runButton.id = 'runButton';
            runButton.className = 'absolute py-repl-run-button';
            // XXX I'm sure there is a better way to embed svn into typescript
            runButton.innerHTML =
                '<svg id="" style="height:20px;width:20px;vertical-align:-.125em;transform-origin:center;overflow:visible;color:green" viewBox="0 0 384 512" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg"><g transform="translate(192 256)" transform-origin="96 0"><g transform="translate(0,0) scale(1,1)"><path d="M361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215z" fill="currentColor" transform="translate(-192 -256)"></path></g></g></svg>';
            runButton.addEventListener('click', () => {
                void this.evaluate(runtime);
            });
            return runButton;
        }

        makeLabel(text: string, elementFor: HTMLElement): HTMLElement {
            ensureUniqueId(elementFor);
            const lbl = document.createElement('label');
            lbl.innerHTML = text;
            lbl.htmlFor = elementFor.id;
            // XXX this should be a CSS class
            // Styles that we use to hide the labels whilst also keeping it accessible for screen readers
            const labelStyle = 'overflow:hidden; display:block; width:1px; height:1px';
            lbl.setAttribute('style', labelStyle);
            return lbl;
        }

        makeBoxDiv(): HTMLElement {
            const boxDiv = document.createElement('div');
            boxDiv.className = 'py-repl-box';

            const editorDiv = this.makeEditorDiv();
            const editorLabel = this.makeLabel('Python Script Area', editorDiv);
            boxDiv.append(editorLabel);
            boxDiv.appendChild(editorDiv);

            const runButton = this.makeRunButton();
            const runLabel = this.makeLabel('Python Script Run Button', runButton);

            editorDiv.appendChild(runLabel);
            editorDiv.appendChild(runButton);
            return boxDiv;
        }

        makeOutDiv(): HTMLElement {
            const outDiv = document.createElement('div');
            outDiv.className = 'py-repl-output';
            outDiv.id = this.id + '-' + this.getAttribute('exec-id');
            return outDiv;
        }

        async evaluate(runtime: Runtime): Promise<void> {
            const pySrc = this.getSourceFromElement();

            // determine the output element
            const outEl = this.getOutputElement();
            if (outEl === undefined) {
                // this happens if we specified output="..." but we couldn't
                // find the ID. We already displayed an error message inside
                // getOutputElement, stop the execution.
                return;
            }

            // clear the old output before executing the new code
            outEl.innerHTML = '';

            // execute the python code
            const pyResult = await pyExec(runtime, pySrc, outEl);

            // display the value of the last evaluated expression (REPL-style)
            if (pyResult !== undefined) {
                pyDisplay(runtime, pyResult, { target: outEl.id });
            }
        }

        getOutputElement(): HTMLElement {
            const outputID = getAttribute(this, "output");
            if (outputID !== null) {
                const el = document.getElementById(outputID);
                if (el === null) {
                    const err = `py-repl ERROR: cannot find the output element #${outputID} in the DOM`
                    this.outDiv.innerText = err;
                    return undefined;
                }
                return el;
            }
            else {
                return this.outDiv;
            }
        }


        autogenerateMaybe(): void {
            if (this.hasAttribute('auto-generate')) {
                const allPyRepls = document.querySelectorAll(`py-repl[root='${this.getAttribute('root')}'][exec-id]`);
                const lastRepl = allPyRepls[allPyRepls.length - 1];
                const lastExecId = lastRepl.getAttribute('exec-id');
                const nextExecId = parseInt(lastExecId) + 1;

                const newPyRepl = document.createElement('py-repl');
                newPyRepl.setAttribute('root', this.getAttribute('root'));
                newPyRepl.id = this.getAttribute('root') + '-' + nextExecId.toString();

                if(this.hasAttribute('auto-generate')) {
                    newPyRepl.setAttribute('auto-generate', '');
                    this.removeAttribute('auto-generate');
                }

                const outputMode = getAttribute( this, 'output-mode')
                if(outputMode) {
                    newPyRepl.setAttribute('output-mode', outputMode);
                }

                const addReplAttribute = (attribute: string) => {
                    const attr = getAttribute( this, attribute)
                    if(attr) {
                        newPyRepl.setAttribute(attribute, attr);
                    }
                };

                addReplAttribute('output');

                newPyRepl.setAttribute('exec-id', nextExecId.toString());
                if( this.parentElement ){
                    this.parentElement.appendChild(newPyRepl);
                }
            }
        }

        getSourceFromElement(): string {
            return this.editor.state.doc.toString();
        }
    }

    return PyRepl
}
