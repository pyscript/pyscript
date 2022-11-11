import { getAttribute, addClasses, htmlDecode, ensureUniqueId } from '../utils';
import { getLogger } from '../logger';
import type { Runtime } from '../runtime';

const logger = getLogger('py-button');

export function make_PyButton(runtime: Runtime) {
    class PyButton extends HTMLElement {
        widths: string[] = [];
        label: string | undefined = undefined;
        class: string[];
        defaultClass: string[];
        mount_name: string | undefined = undefined;
        code: string;

        constructor() {
            super();

            this.defaultClass = ['py-button'];

            const label = getAttribute(this, 'label');
            if (label) {
                this.label = label;
            }

            // Styling does the same thing as class in normal HTML. Using the name "class" makes the style to malfunction
            const styling = getAttribute(this, 'styling');
            if (styling) {
                const klass = styling.trim();
                if (klass === '') {
                    this.class = this.defaultClass;
                } else {
                    // trim each element to remove unnecessary spaces which makes the button style to malfunction
                    this.class = klass
                        .split(' ')
                        .map(x => x.trim())
                        .filter(x => x !== '');
                }
            } else {
                this.class = this.defaultClass;
            }
        }

        async connectedCallback() {
            ensureUniqueId(this);
            this.code = htmlDecode(this.innerHTML);
            this.mount_name = this.id.split('-').join('_');
            this.innerHTML = '';

            const mainDiv = document.createElement('button');
            if (this.label) {
                mainDiv.innerHTML = this.label;
            }
            addClasses(mainDiv, this.class);

            mainDiv.id = this.id;
            this.id = `${this.id}-container`;

            this.appendChild(mainDiv);
            this.code = this.code.split('self').join(this.mount_name);
            let registrationCode = `from pyodide.ffi import create_proxy`;
            registrationCode += `\n${this.mount_name} = Element("${mainDiv.id}")`;
            if (this.code.includes('def on_focus')) {
                this.code = this.code.replace('def on_focus', `def on_focus_${this.mount_name}`);
                registrationCode += `\n${this.mount_name}.element.addEventListener('focus', create_proxy(on_focus_${this.mount_name}))`;
            }

            if (this.code.includes('def on_click')) {
                this.code = this.code.replace('def on_click', `def on_click_${this.mount_name}`);
                registrationCode += `\n${this.mount_name}.element.addEventListener('click', create_proxy(on_click_${this.mount_name}))`;
            }

            // now that we appended and the element is attached, lets connect with the event handlers
            // defined for this widget
            await runtime.runButDontRaise(this.code);
            await runtime.runButDontRaise(registrationCode);
            logger.debug('py-button connected');
        }
    }

    return PyButton;
}
