import { promisable } from 'svelte-promisable-stores';
import { loadInterpreter } from "./interpreter";
import { writable } from 'svelte/store';


export const pyodideLoaded = writable({
	loaded: false,
	premise: null
});

export const loadedEnvironments = writable([{}])


export const pyodideReadyPromise = promisable(
    loadInterpreter,
    // shouldRefreshPromise, // optional, but recommended
  );

export const navBarOpen = writable(false);
export const componentsNavOpen = writable(false);
export const componentDetailsNavOpen = writable(false);
export const mainDiv = writable(null);
export const currentComponentDetails = writable([]);