import * as jsyaml from 'js-yaml';
import { BaseEvalElement } from './base';
import { initializers, loadedEnvironments, mode, postInitializers, pyodideLoaded, scriptsQueue, globalLoader, appConfig, Initializer }  from '../stores';
import { loadInterpreter } from '../interpreter';
import type { PyScript } from './pyscript';


const DEFAULT_RUNTIME = {
    src: "https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js",
    name: "pyodide-default",
    lang: "python"
}

export type Runtime = {
    src: string;
    name?: string;
    lang?: string;
};

export type AppConfig = {
    autoclose_loader: boolean;
    name?: string;
    version?: string;
    runtimes?: Array<Runtime>;
};

let appConfig_: AppConfig = {
    autoclose_loader: true,
};

appConfig.subscribe( (value:AppConfig) => {
    if (value){
        appConfig_ = value;
    }
    console.log("config set!")
});

let initializers_: Initializer[];
initializers.subscribe( (value:Initializer[]) => {
    initializers_ = value;
    console.log("initializers set")
});

let postInitializers_: Initializer[];
postInitializers.subscribe( (value:Initializer[]) => {
    postInitializers_ = value;
    console.log("post initializers set")
});

let scriptsQueue_: PyScript[];
scriptsQueue.subscribe( (value: PyScript[]) => {
    scriptsQueue_ = value;
    console.log("post initializers set")
});

let mode_: string;
mode.subscribe( (value:string) => {
    mode_ = value;
    console.log("post initializers set")
});


let pyodideReadyPromise;
let loader;


globalLoader.subscribe(value => {
    loader = value;
});


export class PyodideRuntime extends Object{
    src: string;

    constructor(url:string) {
        super();
        this.src = url;
    }

    async initialize(){
        loader.log("Loading runtime...")
    pyodideReadyPromise = loadInterpreter(this.src);
    const pyodide = await pyodideReadyPromise;
    const newEnv = {
        id: 'a',
        promise: pyodideReadyPromise,
        runtime: pyodide,
        state: 'loading',
    };
    pyodideLoaded.set(pyodide);

    // Inject the loader into the runtime namespace
    pyodide.globals.set("pyscript_loader", loader);

    loader.log("Runtime created...")
    loadedEnvironments.update((value: any): any => {
        value[newEnv['id']] = newEnv;
    });

    // now we call all initializers before we actually executed all page scripts
    loader.log("Initializing components...")
    for (const initializer of initializers_) {
        await initializer();
    }

    // now we can actually execute the page scripts if we are in play mode
    loader.log("Initializing scripts...")
    if (mode_ == 'play') {
        for (const script of scriptsQueue_) {
            script.evaluate();
        }
        scriptsQueue.set([]);
    }

    // now we call all post initializers AFTER we actually executed all page scripts
    loader.log("Running post initializers...");

    if (appConfig_ && appConfig_.autoclose_loader) {
        loader.close();
        console.log("------ loader closed ------");
    }

    setTimeout(() => {
        for (const initializer of postInitializers_) {
            initializer();
        }
    }, 3000);
    }
}


export class PyConfig extends BaseEvalElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    theme: string;
    widths: Array<string>;
    label: string;
    mount_name: string;
    details: HTMLElement;
    operation: HTMLElement;
    code: string;
    values: AppConfig;
    constructor() {
        super();
    }

    connectedCallback() {
        this.code = this.innerHTML;
        this.innerHTML = '';

        const loadedValues = jsyaml.load(this.code);
        if (loadedValues === undefined){
            this.values = {
                autoclose_loader: true,
            };
        }else{
            this.values = Object.assign({}, ...loadedValues);
        }
        if (this.values.runtimes === undefined){
            this.values.runtimes = [DEFAULT_RUNTIME];
        }
        appConfig.set(this.values);
        console.log("config set", this.values);

        this.loadRuntimes();
    }

    log(msg: string){
        const newLog = document.createElement('p');
        newLog.innerText = msg;
        this.details.appendChild(newLog);
    }

    close() {
        this.remove();
    }

    loadRuntimes(){
        console.log("Initializing runtimes...")
        for (const runtime of this.values.runtimes) {
            const script = document.createElement("script");  // create a script DOM node
            const runtimeSpec = new PyodideRuntime(runtime.src);
            script.src = runtime.src;  // set its src to the provided URL
            script.onload = () => {
                runtimeSpec.initialize();
            }
            document.head.appendChild(script);
        }
    }
}
