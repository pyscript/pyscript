import { BaseEvalElement } from './base';
import { addClasses, htmlDecode } from '../utils';

export class PyTitle extends BaseEvalElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    theme: string;
    widths: Array<string>;
    label: string;
    mount_name: string;
    constructor() {
        super();
    }

    connectedCallback() {
        this.label = htmlDecode(this.innerHTML);
        this.mount_name = this.id.split('-').join('_');
        this.innerHTML = '';

        const mainDiv = document.createElement('div');
        const divContent = document.createElement('h1');

        addClasses(mainDiv, ['text-center', 'w-full', 'mb-8']);
        addClasses(divContent, ['text-3xl', 'font-bold', 'text-gray-800', 'uppercase', 'tracking-tight']);
        divContent.innerHTML = this.label;

        mainDiv.id = this.id;
        this.id = `${this.id}-container`;
        mainDiv.appendChild(divContent);
        this.appendChild(mainDiv);
    }
}
