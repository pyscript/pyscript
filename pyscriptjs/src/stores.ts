import { writable } from 'svelte/store';
import type { PyLoader } from './components/pyloader';
import type { PyScript } from './components/pyscript';
import type { Runtime } from './runtime';

export type Initializer = () => Promise<void>;

export type Environment = {
    id: string;
    runtime: Runtime;
    state: string;
};

/*
A store for Runtime which can encompass any
runtime, but currently only has Pyodide as its offering.
*/
export const runtimeLoaded = writable<Runtime>();

export const loadedEnvironments = writable<Record<Environment['id'], Environment>>({});

export const navBarOpen = writable(false);
export const componentsNavOpen = writable(false);
export const componentDetailsNavOpen = writable(false);
export const mainDiv = writable(null);
export const currentComponentDetails = writable([]);
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
