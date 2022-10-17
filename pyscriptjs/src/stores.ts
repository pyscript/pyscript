import { writable } from 'svelte/store';
import type { PyScript } from './components/pyscript';

export const scriptsQueue = writable<PyScript[]>([]);

export const addToScriptsQueue = (script: PyScript) => {
    scriptsQueue.update(scriptsQueue => [...scriptsQueue, script]);
};
