import { BaseEvalElement } from "./base";
import { pyodideLoaded } from '../stores';

let pyodide;

pyodideLoaded.subscribe(value => {
    pyodide = value;
});

export class PyUpload extends BaseEvalElement {
  constructor() {
    super();
  }

  override async evaluate() {
    await pyodide.runPythonAsync(this.code);
    return true;
  }

  connectedCallback() {
    this.checkId();
    
    const uploadElement = document.createElement('input');
    uploadElement.id = this.id;
    uploadElement.type = 'file';

    const loaderElement = document.createElement('div');
    loaderElement.id = `${this.id}-loader`;
    loaderElement.classList.add('lds-dual-ring');
    loaderElement.style.display = 'none';
    
    this.id = `${this.id}-container`;
    this.appendChild(loaderElement);
    this.appendChild(uploadElement);

    if(this.hasAttribute('multiple')) {
      uploadElement.setAttribute('multiple', '');
    }

    uploadElement.onchange = async () => {
      const files = uploadElement.files;

      loaderElement.style.display = 'inline-block';

      const filePromises = Array.from(files).map((file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
      
          reader.onload = async (e) => {
            try {
              const fileURL = e.target.result;
                
              const code = `
                import asyncio
      
                from pyodide.http import pyfetch
                response = await pyfetch("${fileURL}")
                total_size_bytes = (int(${file.size}))
                if response.status == 200:
                  with open("/${file.name}", "wb") as f:
                    f.write(await response.bytes())
                file_manager.add_file("${file.name}")
              `;
      
              this.code = code;
      
              await this.evaluate();
              resolve(file.name);
            } catch(err) {
              reject(err);
            }
          };

          reader.onprogress = (e) => {
            console.log(e.total / e.loaded);
          };

          reader.onerror = (error) => {
            reject (error);
          };
          
          reader.readAsDataURL(file);
        });
      });

      const fileNames = await Promise.all(filePromises);
      
      loaderElement.style.display = 'none';

      const uploadEvent = new CustomEvent('upload', { detail: fileNames });
      this.dispatchEvent(uploadEvent);
    }
  }
}