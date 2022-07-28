import {
    addToPluginsQueue,
    pyodideLoaded
} from '../stores';

let runtime;
pyodideLoaded.subscribe(value => {
    runtime = value;
});

export class PyPlugin extends HTMLElement {
    // currently only 'pyimport' is supported, meaning that the plugin is in a
    // python package which will be imported.
    // In the future, we might want to support more, e.g. 'jsimport' or 'url'
    pyimport: string;

    async connectedCallback() {
        if (!this.hasAttribute('pyimport')) {
            console.log('ERROR: <py-plugin> without a pyimport', this);
            return;
        }
        this.pyimport = this.attributes.pyimport.textContent;
        console.log(`py-plugin ${name} connected, adding to queue`);
        addToPluginsQueue(this);
    }

    load() {
        // if we are here, we know for sure that pyodide has been loaded, so
        // 'runtime' is available
        const pyodide = runtime;
        // XXX: display nice error messages if anything goes wrong
        let x = this.pyimport;
        console.log(`Loading plugin ${x}`)
        pyodide.runPython(`import ${x}; ${x}.pyscript_init_plugin()`);
    }
}


function registerCustomWidget(tag: string, pyclass: any) {

    class CustomWidget extends HTMLElement {
        tag: string = tag;
        pyclass: any = pyclass;
        pyinstance: any;
        shadow: ShadowRoot;

        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
        }

        connectedCallback() {
            this.pyinstance = this.pyclass(this);
            this.pyinstance.connect();
            this.registerWidget();
        }

        registerWidget() {
            const pyodide = runtime;
            console.log('new widget registered:', this.tag);
            pyodide.globals.set(this.id, this.pyinstance);
        }
    }

    const xCustomWidget = customElements.define(tag, CustomWidget);
}


// XXX: there must be better ways to export a "public JS API"
window.pyscript_registerCustomWidget = registerCustomWidget
