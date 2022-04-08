import * as jsyaml from 'js-yaml';

import { pyodideLoaded, loadedEnvironments, mode, addInitializer } from '../stores';
import { loadPackage } from '../interpreter';

// Premise used to connect to the first available pyodide interpreter
let pyodideReadyPromise;
let environments;
let currentMode;

pyodideLoaded.subscribe(value => {
  pyodideReadyPromise = value;
});

loadedEnvironments.subscribe(value => {
  environments = value;
});

mode.subscribe(value => {
  currentMode = value;
});

export class PyEnv extends HTMLElement {
  shadow: ShadowRoot;
  wrapper: HTMLElement;
  code: string;
  environment: any;

  constructor() {
    super();

    this.shadow = this.attachShadow({ mode: 'open'});
    this.wrapper = document.createElement('slot');
  }

  connectedCallback() {
    this.code = this.innerHTML;
    this.innerHTML = '';

    let env = this.environment = jsyaml.load(this.code);
    async function loadEnv() {
      let pyodide = await pyodideReadyPromise;
      await loadPackage(env, pyodide);
      console.log("enviroment loaded")
    }
    addInitializer(loadEnv);
    console.log("enviroment loading...", env)
  }
}
