import { writable } from 'svelte/store';
import type { PyLoader } from './components/pyloader';
import type { PyScript } from './components/pyscript';
import type { Runtime } from './runtime';
import type { AppConfig } from './pyconfig';
import { getLogger } from './logger';

export const scriptsQueue = writable<PyScript[]>([]);

export const addToScriptsQueue = (script: PyScript) => {
    scriptsQueue.update(scriptsQueue => [...scriptsQueue, script]);
};
