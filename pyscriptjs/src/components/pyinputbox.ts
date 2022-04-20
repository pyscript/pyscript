import { BaseEvalElement } from './base';
import { addClasses, ltrim, htmlDecode } from '../utils';

export class PyInputBox extends BaseEvalElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    theme: string;
    widths: Array<string>;
    label: string;
    mount_name: string;
    constructor() {
        super();
  
        // attach shadow so we can preserve the element original innerHtml content
        // this.shadow = this.attachShadow({ mode: 'open'});
  
        // this.wrapper = document.createElement('slot');
        // this.shadow.appendChild(this.wrapper);
        if (this.hasAttribute('label')) {
          this.label = this.getAttribute('label');
        }
      }


      connectedCallback() {
        this.label = htmlDecode(this.innerHTML);
        this.mount_name  = this.id.split("-").join("_");
        this.innerHTML = '';
        
        let mainDiv = document.createElement('input');
        mainDiv.type = "text";
        addClasses(mainDiv, ["border", "flex-1", "w-full", "mr-3", "border-gray-300", "p-2", "rounded"]);
          
        mainDiv.id = this.id;
        this.id = `${this.id}-container`;
        this.appendChild(mainDiv);
      
      // now that we appended and the element is attached, lets connect with the event handlers
      // defined for this widget
      this.code = `${this.mount_name} = Element("${ mainDiv.id }")`;
      setTimeout(() => { 
        this.eval(this.code).then(() => {
          console.log('registered handlers');
        });
       }, 4000);
          
        console.log('py-title connected');
      }
  }

  