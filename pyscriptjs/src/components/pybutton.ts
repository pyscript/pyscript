import { BaseEvalElement } from './base';
import { addClasses, htmlDecode } from '../utils';

export class PyButton extends BaseEvalElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    theme: string;
    widths: Array<string>;
    label: string;
    class: Array<string>;
    defaultClass: Array<string>;
    mount_name: string;
    constructor() {
        super();
        this.defaultClass = ['p-2', 'text-white', 'bg-blue-600', 'border', 'border-blue-600','rounded']
        if (this.hasAttribute('label')) {
            this.label = this.getAttribute('label');
        }
    
        // Styling does the same thing as class in normal HTML. Using the name "class" makes the style to malfunction
        if (this.hasAttribute('styling')) {
             let klass = this.getAttribute('styling');
            if (klass.trim() == ''){
                this.class = this.defaultClass
            }else{
                klass = klass.trim()
                let newClassArray = klass.split(' ');
                // trim each element to remove unecessary spaces which makes the button style to malfunction
                this.class = (() => {let concatenatedString = []; for (let i = 0; i < newClassArray.length; i++) {if (newClassArray[i].trim() !== '')(concatenatedString.push(newClassArray[i].trim()));} return concatenatedString;})();
            }
        }
        else {
            this.class = this.defaultClass
        }
    }

    connectedCallback() {
        this.code = htmlDecode(this.innerHTML);
        this.mount_name = this.id.split('-').join('_');
        this.innerHTML = '';

        const mainDiv = document.createElement('button');
        mainDiv.innerHTML = this.label;
        addClasses(mainDiv, this.class);

        mainDiv.id = this.id;
        this.id = `${this.id}-container`;

        this.appendChild(mainDiv);
        this.code = this.code.split('self').join(this.mount_name);
        let registrationCode = `${this.mount_name} = Element("${mainDiv.id}")`;
        if (this.code.includes('def on_focus')) {
            this.code = this.code.replace('def on_focus', `def on_focus_${this.mount_name}`);
            registrationCode += `\n${this.mount_name}.element.onfocus = on_focus_${this.mount_name}`;
        }

        if (this.code.includes('def on_click')) {
            this.code = this.code.replace('def on_click', `def on_click_${this.mount_name}`);
            registrationCode += `\n${this.mount_name}.element.onclick = on_click_${this.mount_name}`;
        }

        // now that we appended and the element is attached, lets connect with the event handlers
        // defined for this widget
        setTimeout(() => {
            this.eval(this.code).then(() => {
                this.eval(registrationCode).then(() => {
                    console.log('registered handlers');
                });
            });
        }, 4000);

        console.log('py-button connected');
    }
}
