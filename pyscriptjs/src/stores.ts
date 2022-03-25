import { promisable } from 'svelte-promisable-stores';
import { loadInterpreter } from "./interpreter";
import { writable } from 'svelte/store';


export const pyodideLoaded = writable({
	loaded: false,
	premise: null
});

export const loadedEnvironments = writable([{}])
export const DEFAULT_MODE = 'play';

export const pyodideReadyPromise = promisable(
    loadInterpreter,
    // shouldRefreshPromise, // optional, but recommended
  );

export const navBarOpen = writable(false);
export const componentsNavOpen = writable(false);
export const componentDetailsNavOpen = writable(false);
export const mainDiv = writable(null);
export const currentComponentDetails = writable([]);
export const mode = writable(DEFAULT_MODE)
export const scriptsQueue = writable([])
export const initializers = writable([])

let scriptsQueue_ = [];
let initializers_ = [];

scriptsQueue.subscribe(value => {
  scriptsQueue_ = value;
});

export const addToScriptsQueue = (script) => {
  scriptsQueue.set([...scriptsQueue_, script]);
};

scriptsQueue.subscribe(value => {
  scriptsQueue_ = value;
});

export const addInitializer = (initializer) => {
  initializers.set([...initializers_, initializer]);
};
