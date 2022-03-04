import { promisable } from 'svelte-promisable-stores';
import { loadInterpreter } from "./interpreter";
import { writable } from 'svelte/store';


export const pyodideLoaded = writable({
	loaded: false,
	premise: null
});

export const pyodideReadyPromise = promisable(
    loadInterpreter,
    // shouldRefreshPromise, // optional, but recommended
  );
  