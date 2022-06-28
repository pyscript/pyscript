import { basicSetup, EditorState, EditorView } from '@codemirror/basic-setup';
import { python } from '@codemirror/lang-python';
import { Compartment, StateCommand } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { oneDarkTheme } from '@codemirror/theme-one-dark';

import { componentDetailsNavOpen, loadedEnvironments, mode, pyodideLoaded, type Environment } from '../stores';
import { addClasses, htmlDecode } from '../utils';
import { BaseEvalElement } from './base';

// Premise used to connect to the first available pyodide interpreter

let pyodideReadyPromise;
let environments: Record<Environment['id'], Environment> = {};
let currentMode;

pyodideLoaded.subscribe(value => {
    pyodideReadyPromise = value;
});

loadedEnvironments.subscribe(value => {
    environments = value;
});

let propertiesNavOpen;
componentDetailsNavOpen.subscribe(value => {
    propertiesNavOpen = value;
});

mode.subscribe(value => {
    currentMode = value;
});

function createCmdHandler(el: PyRepl): StateCommand {
    // Creates a codemirror cmd handler that calls the el.evaluate when an event
    // triggers that specific cmd
    return () => {
        void el.evaluate();
        return true;
    };
}

let initialTheme: string;
function getEditorTheme(el: BaseEvalElement): string {
    return initialTheme || (initialTheme = el.getAttribute('theme'));
}

export class PyRepl extends BaseEvalElement {
    editor: EditorView;
    editorNode: HTMLElement;

    constructor() {
        super();

        // add an extra div where we can attach the codemirror editor
        this.editorNode = document.createElement('div');
        addClasses(this.editorNode, ['editor-box']);
        this.shadow.appendChild(this.wrapper);
    }

    connectedCallback() {
        this.checkId();
        this.code = htmlDecode(this.innerHTML);
        this.innerHTML = '';
        const languageConf = new Compartment();

        const extensions = [
            basicSetup,
            languageConf.of(python()),
            keymap.of([
                ...defaultKeymap,
                { key: 'Ctrl-Enter', run: createCmdHandler(this) },
                { key: 'Shift-Enter', run: createCmdHandler(this) },
            ]),
        ];

        if (getEditorTheme(this) === 'dark') {
            extensions.push(oneDarkTheme);
        }

        this.editor = new EditorView({
            state: EditorState.create({
                doc: this.code.trim(),
                extensions,
            }),
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
            '<svg id="" class="svelte-fa svelte-ps5qeg" style="height:20px;width:20px;vertical-align:-.125em;transform-origin:center;overflow:visible;color:green" viewBox="0 0 384 512" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg"><g transform="translate(192 256)" transform-origin="96 0"><g transform="translate(0,0) scale(1,1)"><path d="M361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215z" fill="currentColor" transform="translate(-192 -256)"></path></g></g></svg>';
        addClasses(this.btnRun, ['absolute', 'repl-play-button']);

        // Play Button Label
        const btnLabel = document.createElement('label');
        btnLabel.innerHTML = 'Python Script Run Button';
        btnLabel.setAttribute('style', labelStyle);
        btnLabel.htmlFor = 'btnRun';

        this.editorNode.appendChild(btnLabel);
        this.editorNode.appendChild(this.btnRun);

        this.btnRun.addEventListener('click', () => {
            void this.evaluate();
        });

        if (!this.id) {
            console.log(
                "WARNING: <pyrepl> define with an id. <pyrepl> should always have an id. More than one <pyrepl> on a page won't work otherwise!",
            );
        }

        if (!this.hasAttribute('exec-id')) {
            this.setAttribute('exec-id', '1');
        }

        if (!this.hasAttribute('root')) {
            this.setAttribute('root', this.id);
        }

        if (this.hasAttribute('output')) {
            this.errorElement = this.outputElement = document.getElementById(this.getAttribute('output'));
        } else {
            if (this.hasAttribute('std-out')) {
                this.outputElement = document.getElementById(this.getAttribute('std-out'));
            } else {
                // In this case neither output or std-out have been provided so we need
                // to create a new output div to output to
                this.outputElement = document.createElement('div');
                this.outputElement.classList.add('output');
                this.outputElement.hidden = true;
                this.outputElement.id = this.id + '-' + this.getAttribute('exec-id');

                // add the output div id if there's not output pre-defined
                mainDiv.appendChild(this.outputElement);
            }

            this.errorElement = this.hasAttribute('std-err')
                ? document.getElementById(this.getAttribute('std-err'))
                : this.outputElement;
        }

        this.appendChild(mainDiv);
        this.editor.focus();
        console.log('connected');
    }

    addToOutput(s: string): void {
        this.outputElement.innerHTML += '<div>' + s + '</div>';
        this.outputElement.hidden = false;
    }

    preEvaluate(): void {
        this.setOutputMode("replace");
        if(!this.appendOutput) {
            this.outputElement.innerHTML = '';
        }
    }

    postEvaluate(): void {
        this.outputElement.hidden = false;
        this.outputElement.style.display = 'block';

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

            if(this.hasAttribute('output-mode')) {
                newPyRepl.setAttribute('output-mode', this.getAttribute('output-mode'));
            }

            const addReplAttribute = (attribute: string) => {
                if (this.hasAttribute(attribute)) {
                    newPyRepl.setAttribute(attribute, this.getAttribute(attribute));
                }
            };

            addReplAttribute('output');
            addReplAttribute('std-out');
            addReplAttribute('std-err');

            newPyRepl.setAttribute('exec-id', nextExecId.toString());
            this.parentElement.appendChild(newPyRepl);
        }
    }

    getSourceFromElement(): string {
        const sourceStrings = [
            `output_manager.change(out="${this.outputElement.id}", append=True)`,
            ...this.editor.state.doc.toString().split('\n'),
        ];

        return sourceStrings.join('\n');
    }

    render() {
        console.log('rendered');
    }
}
