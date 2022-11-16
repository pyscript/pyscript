import { getAttribute, addClasses, htmlDecode, ensureUniqueId, createDeprecationWarning } from '../utils';
import { getLogger } from '../logger';
import type { Runtime } from '../runtime';

const logger = getLogger('py-inputbox');

export function make_PyInputBox(runtime: Runtime) {
    class PyInputBox extends HTMLElement {
        widths: string[] = [];
        label: string | undefined = undefined;
        mount_name: string | undefined = undefined;
        code: string;

        constructor() {
            super();

            const label = getAttribute(this, 'label');
            if (label) {
                this.label = label;
            }
        }

        connectedCallback() {
            const deprecationMessage = (
                'The element <py-input> is deprecated, ' +
                'use <input class="py-input"> instead.'
            )
            createDeprecationWarning(deprecationMessage, "py-input")
            ensureUniqueId(this);
            this.code = htmlDecode(this.innerHTML);
            this.mount_name = this.id.split('-').join('_');
            this.innerHTML = '';

            const mainDiv = document.createElement('input');
            mainDiv.type = 'text';
            addClasses(mainDiv, ['py-input']);

            mainDiv.id = this.id;
            this.id = `${this.id}-container`;
            this.appendChild(mainDiv);

            // now that we appended and the element is attached, lets connect with the event handlers
            // defined for this widget
            this.appendChild(mainDiv);
            this.code = this.code.split('self').join(this.mount_name);
            let registrationCode = `from pyodide.ffi import create_proxy`;
            registrationCode += `\n${this.mount_name} = Element("${mainDiv.id}")`;
            if (this.code.includes('def on_keypress')) {
                this.code = this.code.replace('def on_keypress', `def on_keypress_${this.mount_name}`);
                registrationCode += `\n${this.mount_name}.element.addEventListener('keypress', create_proxy(on_keypress_${this.mount_name}))`;
            }

            runtime.runButDontRaise(this.code);
            runtime.runButDontRaise(registrationCode);
            logger.debug('py-inputbox connected');
        }
    }

    return PyInputBox;
}
