import * as jsyaml from 'js-yaml';
import { BaseEvalElement } from './base';
import { appConfig } from '../stores';

let appConfig_;

appConfig.subscribe(value => {
    appConfig_ = value;
});

export type AppConfig = {
    autoclose_loader: boolean;
    name?: string;
    version?: string;
  };

export class PyConfig extends BaseEvalElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    theme: string;
    widths: Array<string>;
    label: string;
    mount_name: string;
    details: HTMLElement;
    operation: HTMLElement;
    code: string;
    values: AppConfig;
    constructor() {
        super();
    }

    connectedCallback() {
        this.code = this.innerHTML;
        this.innerHTML = '';

        this.values = jsyaml.load(this.code);
        if (this.values === undefined){
            this.values = {
                autoclose_loader: true,
            };
        }
        appConfig.set(this.values);
        console.log("config set", this.values);
    }

    log(msg: string){
        const newLog = document.createElement('p');
        newLog.innerText = msg;
        this.details.appendChild(newLog);
    }

    close() {
        this.remove();
    }
}
