import { basicSetup, EditorState, EditorView } from '@codemirror/basic-setup';
import { python } from '@codemirror/lang-python';
import { Compartment, StateCommand } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { oneDarkTheme } from '@codemirror/theme-one-dark';

import { componentDetailsNavOpen, loadedEnvironments, mode, pyodideLoaded } from '../stores';
import { addClasses } from '../utils';
import { BaseEvalElement } from './base';

// Premise used to connect to the first available pyodide interpreter

let pyodideReadyPromise;
let environments;
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

function createCmdHandler(el) {
    // Creates a codemirror cmd handler that calls the el.evaluate when an event
    // triggers that specific cmd
    const toggleCheckbox: StateCommand = ({ state, dispatch }) => {
        return el.evaluate(state);
    };
    return toggleCheckbox;
}

let initialTheme;
function getEditorTheme(el: BaseEvalElement): string {
    if (initialTheme) {
        return initialTheme;
    }

    return initialTheme = el.getAttribute('theme');
}

export class PyRepl extends BaseEvalElement {
    editor: EditorView;
    editorNode: HTMLElement;

    constructor() {
        super();

        // add an extra div where we can attach the codemirror editor
        this.editorNode = document.createElement('div');
        addClasses(this.editorNode, ['editor-box', 'border', 'border-gray-300', 'group', 'relative']);
        this.shadow.appendChild(this.wrapper);
    }

    connectedCallback() {
        this.checkId();
        this.code = this.innerHTML;
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
        addClasses(mainDiv, ['parentBox', 'flex', 'flex-col', 'mt-2', 'mx-8', 'relative']);

        // add Editor to main PyScript div
        mainDiv.appendChild(this.editorNode);

        // Play Button
        this.btnRun = document.createElement('button');
        this.btnRun.innerHTML =
            '<svg id="" class="svelte-fa svelte-ps5qeg" style="height:20px;width:20px;vertical-align:-.125em;transform-origin:center;overflow:visible;color:green" viewBox="0 0 384 512" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg"><g transform="translate(192 256)" transform-origin="96 0"><g transform="translate(0,0) scale(1,1)"><path d="M361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215z" fill="currentColor" transform="translate(-192 -256)"></path></g></g></svg>';
        addClasses(this.btnRun, ['absolute', 'right-1', 'bottom-3', 'opacity-0', 'group-hover:opacity-100']);
        this.editorNode.appendChild(this.btnRun);

        this.btnRun.onclick = wrap(this);

        function wrap(el: any) {
            function evaluatePython() {
                el.evaluate();
            }
            return evaluatePython;
        }

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

            // in this case, the default output-mode is append, if hasn't been specified
            if (!this.hasAttribute('output-mode')) {
                this.setAttribute('output-mode', 'append');
            }
        } else {
            if (this.hasAttribute('std-out')) {
                this.outputElement = document.getElementById(this.getAttribute('std-out'));
            } else {
                // In this case neither output or std-out have been provided so we need
                // to create a new output div to output to
                this.outputElement = document.createElement('div');
                this.outputElement.classList.add('output', 'font-mono', 'ml-8', 'text-sm');
                this.outputElement.hidden = true;
                this.outputElement.id = this.id + '-' + this.getAttribute('exec-id');

                // add the output div id if there's not output pre-defined
                mainDiv.appendChild(this.outputElement);
            }

            if (this.hasAttribute('std-err')) {
                this.errorElement = document.getElementById(this.getAttribute('std-err'));
            } else {
                this.errorElement = this.outputElement;
            }
        }

        this.appendChild(mainDiv);
        this.editor.focus();
        console.log('connected');
    }

    addToOutput(s: string): void {
        this.outputElement.innerHTML += '<div>' + s + '</div>';
        this.outputElement.hidden = false;
    }

    postEvaluate(): void {
        this.outputElement.hidden = false;
        this.outputElement.style.display = 'block';

        if (this.hasAttribute('auto-generate')) {
            const nextExecId = parseInt(this.getAttribute('exec-id')) + 1;
            const newPyRepl = document.createElement('py-repl');

            newPyRepl.setAttribute('root', this.getAttribute('root'));
            newPyRepl.id = this.getAttribute('root') + '-' + nextExecId.toString();
            newPyRepl.setAttribute('auto-generate', null);

            if (this.hasAttribute('output')) {
                newPyRepl.setAttribute('output', this.getAttribute('output'));
            }

            if (this.hasAttribute('std-out')) {
                newPyRepl.setAttribute('std-out', this.getAttribute('std-out'));
            }

            if (this.hasAttribute('std-err')) {
                newPyRepl.setAttribute('std-err', this.getAttribute('std-err'));
            }

            newPyRepl.setAttribute('exec-id', nextExecId.toString());
            this.parentElement.appendChild(newPyRepl);
        }
    }

    getSourceFromElement(): string {
        const sourceStrings = [
            `output_manager.change("` + this.outputElement.id + `")`,
            ...this.editor.state.doc.toString().split('\n'),
        ];
        return sourceStrings.join('\n');
    }

    render() {
        console.log('rendered');
    }
}
