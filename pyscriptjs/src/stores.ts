import { writable } from 'svelte/store';
import type { PyLoader } from './components/pyloader';
import type { PyScript } from './components/pyscript';
import type { PyodideInterface } from './pyodide';

export type Initializer = () => Promise<void>;

export type Environment = {
    id: string;
    promise: Promise<PyodideInterface>;
    runtime: PyodideInterface;
    state: string;
};

export const pyodideLoaded = writable({
    loaded: false,
    premise: null,
});

export const loadedEnvironments = writable<Record<Environment['id'], Environment>>({});
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
export const globalLoader = writable<PyLoader | undefined>();
export const appConfig = writable();

export const addToScriptsQueue = (script: PyScript) => {
    scriptsQueue.update(scriptsQueue => [...scriptsQueue, script]);
};

export const addInitializer = (initializer: Initializer) => {
    console.log('adding initializer', initializer);
    initializers.update(initializers => [...initializers, initializer]);
    console.log('added initializer', initializer);
};

export const addPostInitializer = (initializer: Initializer) => {
    console.log('adding post initializer', initializer);
    postInitializers.update(postInitializers => [...postInitializers, initializer]);
    console.log('added post initializer', initializer);
};
