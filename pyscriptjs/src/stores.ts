import { writable } from 'svelte/store';
import type { PyLoader } from './components/pyloader';
import type { PyScript } from './components/pyscript';
import type { Runtime } from './runtime';
import type { AppConfig } from './pyconfig';
import { getLogger } from './logger';


export const navBarOpen = writable(false);
export const componentsNavOpen = writable(false);
export const componentDetailsNavOpen = writable(false);
export const mainDiv = writable(null);
export const currentComponentDetails = writable([]);
export const scriptsQueue = writable<PyScript[]>([]);
export const globalLoader = writable<PyLoader | undefined>();

export const addToScriptsQueue = (script: PyScript) => {
    scriptsQueue.update(scriptsQueue => [...scriptsQueue, script]);
};
