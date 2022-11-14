import { addClasses, htmlDecode, createDeprecationWarning } from '../utils';

export class PyTitle extends HTMLElement {
    widths: string[];
    label: string;
    mount_name: string;
    constructor() {
        super();
    }

    connectedCallback() {
        const deprecationMessage = (
            '<p>The element &lt;py-title&gt; is deprecated, please use an  &lt;h1&gt; tag instead.</p>'
        )
        createDeprecationWarning(deprecationMessage, "py-title")
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
