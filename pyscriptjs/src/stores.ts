import { writable } from 'svelte/store';
import type { PyScript } from './components/pyscript';

type Initializer = () => Promise<void>;

export const pyodideLoaded = writable({
    loaded: false,
    premise: null,
});

export const loadedEnvironments = writable([{}]);
export const DEFAULT_MODE = 'play';

export const navBarOpen = writable(false);
export const componentsNavOpen = writable(false);
export const componentDetailsNavOpen = writable(false);
export const mainDiv = writable(null);
export const currentComponentDetails = writable([]);
export const mode = writable(DEFAULT_MODE);
export const scriptsQueue = writable<PyScript[]>([]);
export const initializers = writable<Initializer[]>([]);
export const postInitializers = writable<Initializer[]>([]);
export const globalLoader = writable();
export const appConfig = writable();

let scriptsQueue_: PyScript[] = [];
let initializers_: Initializer[] = [];
let postInitializers_: Initializer[] = [];

scriptsQueue.subscribe(value => {
    scriptsQueue_ = value;
});

export const addToScriptsQueue = (script: PyScript) => {
    scriptsQueue.set([...scriptsQueue_, script]);
};

initializers.subscribe(value => {
    initializers_ = value;
});

export const addInitializer = (initializer: Initializer) => {
    console.log('adding initializer', initializer);
    initializers.set([...initializers_, initializer]);
    console.log('adding initializer', initializer);
};

postInitializers.subscribe(value => {
    postInitializers_ = value;
});

export const addPostInitializer = (initializer: Initializer) => {
    console.log('adding post initializer', initializer);
    postInitializers.set([...postInitializers_, initializer]);
    console.log('adding post initializer', initializer);
};
