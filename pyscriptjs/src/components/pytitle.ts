import { addClasses, htmlDecode, ensureUniqueId } from '../utils';

export class PyTitle extends HTMLElement {
    widths: string[];
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

        addClasses(mainDiv, ['py-title']);
        divContent.innerHTML = this.label;

        mainDiv.id = this.id;
        this.id = `${this.id}-container`;
        mainDiv.appendChild(divContent);
        this.appendChild(mainDiv);
    }
}
