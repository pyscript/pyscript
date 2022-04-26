import { writable } from 'svelte/store';

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
export const scriptsQueue = writable([]);
export const initializers = writable([]);
export const postInitializers = writable([]);

let scriptsQueue_ = [];
let initializers_ = [];
let postInitializers_ = [];

scriptsQueue.subscribe(value => {
    scriptsQueue_ = value;
});

export const addToScriptsQueue = script => {
    scriptsQueue.set([...scriptsQueue_, script]);
};

scriptsQueue.subscribe(value => {
    scriptsQueue_ = value;
});

initializers.subscribe(value => {
    initializers_ = value;
});

export const addInitializer = initializer => {
    console.log('adding initializer', initializer);
    initializers.set([...initializers_, initializer]);
    console.log('adding initializer', initializer);
};

postInitializers.subscribe(value => {
    postInitializers_ = value;
});

export const addPostInitializer = initializer => {
    console.log('adding post initializer', initializer);
    postInitializers.set([...postInitializers_, initializer]);
    console.log('adding post initializer', initializer);
};
