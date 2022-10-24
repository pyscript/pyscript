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
import { pyExecDontHandleErrors } from '../pyexec';
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

    class PyRepl extends HTMLElement {
        shadow: ShadowRoot;
        wrapper: HTMLElement;
        code: string;
        outputElement: HTMLElement;
        btnRun: HTMLElement;
        editor: EditorView;
        editorNode: HTMLElement;

        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
            this.wrapper = document.createElement('slot');
            this.shadow.appendChild(this.wrapper);

            // add an extra div where we can attach the codemirror editor
            this.editorNode = document.createElement('div');
            addClasses(this.editorNode, ['editor-box']);
            this.shadow.appendChild(this.wrapper);
        }

        getEditorTheme(): string {
            return getAttribute(this, 'theme');
        }


        connectedCallback() {
            ensureUniqueId(this);
            this.code = htmlDecode(this.innerHTML);
            this.innerHTML = '';
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

            if (this.getEditorTheme() === 'dark') {
                extensions.push(oneDarkTheme);
            }

            this.editor = new EditorView({
                doc: this.code.trim(),
                extensions,
                parent: this.editorNode,
            });

            const mainDiv = document.createElement('div');
            addClasses(mainDiv, ['py-repl-box']);

            // Styles that we use to hide the labels whilst also keeping it accessible for screen readers
            const labelStyle = 'overflow:hidden; display:block; width:1px; height:1px';

            // Code editor Label
            this.editorNode.id = 'code-editor';
            const editorLabel = document.createElement('label');
            editorLabel.innerHTML = 'Python Script Area';
            editorLabel.setAttribute('style', labelStyle);
            editorLabel.htmlFor = 'code-editor';

            mainDiv.append(editorLabel);

            // add Editor to main PyScript div
            mainDiv.appendChild(this.editorNode);

            // Play Button
            this.btnRun = document.createElement('button');
            this.btnRun.id = 'btnRun';
            this.btnRun.innerHTML =
                '<svg id="" style="height:20px;width:20px;vertical-align:-.125em;transform-origin:center;overflow:visible;color:green" viewBox="0 0 384 512" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg"><g transform="translate(192 256)" transform-origin="96 0"><g transform="translate(0,0) scale(1,1)"><path d="M361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215z" fill="currentColor" transform="translate(-192 -256)"></path></g></g></svg>';
            addClasses(this.btnRun, ['absolute', 'repl-play-button']);

            // Play Button Label
            const btnLabel = document.createElement('label');
            btnLabel.innerHTML = 'Python Script Run Button';
            btnLabel.setAttribute('style', labelStyle);
            btnLabel.htmlFor = 'btnRun';

            this.editorNode.appendChild(btnLabel);
            this.editorNode.appendChild(this.btnRun);

            this.btnRun.addEventListener('click', () => {
                void this.evaluate(runtime);
            });

            if (!this.hasAttribute('exec-id')) {
                this.setAttribute('exec-id', '1');
            }

            if (!this.hasAttribute('root')) {
                this.setAttribute('root', this.id);
            }

            const output = getAttribute(this, "output")
            if (output) {
                const el = document.getElementById(output);
                if(el){
                    this.outputElement = el
                }
            } else {
                // to create a new output div to output to
                this.outputElement = document.createElement('div');
                this.outputElement.classList.add('py-output');
                this.outputElement.hidden = true;
                this.outputElement.id = this.id + '-' + this.getAttribute('exec-id');

                // add the output div id if there's not output pre-defined
                mainDiv.appendChild(this.outputElement);
            }

            this.appendChild(mainDiv);
            this.editor.focus();
            logger.debug(`element ${this.id} successfully connected`);
        }

        async evaluate(runtime: Runtime): Promise<void> {
            this.outputElement.innerHTML = '';

            let source: string;
            try {
                source = this.getSourceFromElement();

                // XXX we should use pyExec and let it display the errors
                await pyExecDontHandleErrors(runtime, source, this.outputElement);

                removeClasses(this.outputElement, ['py-error']);
                this.outputElement.hidden = false;
                this.outputElement.style.display = 'block';
                this.autogenerateMaybe();
            } catch (err) {
                logger.error(err);
                try{
                    if (Element === undefined) {
                        Element = <Element>runtime.globals.get('Element');
                    }
                    const out = Element(this.outputElement.id);

                    addClasses(this.outputElement, ['py-error']);
                    out.write.callKwargs(err.toString(), { append: false });
                    if (this.outputElement.children.length === 0){
                        this.outputElement.setAttribute('error', '');
                    }else{
                        this.outputElement.children[this.outputElement.children.length - 1].setAttribute('error', '');
                    }

                    this.outputElement.hidden = false;
                    this.outputElement.style.display = 'block';
                    this.outputElement.style.visibility = 'visible';
                } catch (internalErr){
                    logger.error("Unnable to write error to error element in page.")
                }

            }
        } // end evaluate

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
