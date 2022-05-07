import { addClasses } from '../utils';

export class PyBox extends HTMLElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    theme: string;
    widths: Array<string>;

    constructor() {
        super();

        // attach shadow so we can preserve the element original innerHtml content
        this.shadow = this.attachShadow({ mode: 'open' });

        this.wrapper = document.createElement('slot');
        this.shadow.appendChild(this.wrapper);
    }

    connectedCallback() {
        const mainDiv = document.createElement('div');
        addClasses(mainDiv, ['flex', 'mx-8']);

        // Hack: for some reason when moving children, the editor box duplicates children
        // meaning that we end up with 2 editors, if there's a <py-repl> inside the <py-box>
        // so, if we have more than 2 children with the cm-editor class, we remove one of them
        while (this.childNodes.length > 0) {
            console.log(this.firstChild);
            if (this.firstChild.nodeName == 'PY-REPL') {
                // in this case we need to remove the child and create a new one from scratch
                const replDiv = document.createElement('div');
                // we need to put the new repl inside a div so that if the repl has auto-generate true
                // it can replicate itself inside that constrained div
                replDiv.appendChild(this.firstChild.cloneNode());
                mainDiv.appendChild(replDiv);
                this.firstChild.remove();
            } else {
                if (this.firstChild.nodeName != '#text') {
                    mainDiv.appendChild(this.firstChild);
                } else {
                    this.firstChild.remove();
                }
            }
        }

        // now we need to set widths
        this.widths = [];
        if (this.hasAttribute('widths')) {
            for (const w of this.getAttribute('widths').split(';')) {
                this.widths.push(`w-${w}`);
            }
        } else {
            this.widths = [...this.widths, ...[`w-1/${mainDiv.childNodes.length}`]];
        }

        this.widths.forEach((width, index) => {
            const node: ChildNode = mainDiv.childNodes[index];
            addClasses(node as HTMLElement, [width, 'mx-1']);
        });

        this.appendChild(mainDiv);
        console.log('py-box connected');
    }
}
