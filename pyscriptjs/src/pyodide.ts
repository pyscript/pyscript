import { Runtime } from './runtime';
import { getLastPath, inJest } from './utils';
import type { PyodideInterface } from 'pyodide';
import { loadPyodide } from 'pyodide';
// eslint-disable-next-line
// @ts-ignore
import pyscript from './python/pyscript.py';

export class PyodideRuntime extends Runtime {
    src: string;
    name?: string;
    lang?: string;
    interpreter: PyodideInterface;
    globals: any;

    constructor(
        src = 'https://cdn.jsdelivr.net/pyodide/v0.21.1/full/pyodide.js',
        name = 'pyodide-default',
        lang = 'python',
    ) {
        super();
        this.src = src;
        this.name = name;
        this.lang = lang;
    }

    async loadInterpreter(): Promise<void> {
        console.log('creating pyodide runtime');
        let indexURL: string = this.src.substring(0, this.src.length - '/pyodide.js'.length);
        if (typeof process === 'object' && inJest()) {
            indexURL = [process.cwd(), 'node_modules', 'pyodide'].join('/');
        }
        this.interpreter = await loadPyodide({
            stdout: console.log,
            stderr: console.log,
            fullStdLib: false,
            indexURL,
        });

        this.globals = this.interpreter.globals;

        // now that we loaded, add additional convenience functions
        console.log('loading micropip');
        await this.loadPackage('micropip');

        console.log('loading pyscript...');
        const output = await this.run(pyscript);
        if (output !== undefined) {
            console.log(output);
        }

        console.log('done setting up environment');
    }

    async run(code: string): Promise<any> {
        return await this.interpreter.runPythonAsync(code);
    }

    registerJsModule(name: string, module: object): void {
        this.interpreter.registerJsModule(name, module);
    }

    async loadPackage(names: string | string[]): Promise<void> {
        await this.interpreter.loadPackage(names);
    }

    async installPackage(package_name: string | string[]): Promise<void> {
        if (package_name.length > 0) {
            const micropip = this.globals.get('micropip');
            await micropip.install(package_name);
            micropip.destroy();
        }
    }

    async loadFromFile(path: string): Promise<void> {
        const filename = getLastPath(path);
        await this.run(
            `
                from pyodide.http import pyfetch
                from js import console

                try:
                    response = await pyfetch("${path}")
                except Exception as err:
                    console.warn("PyScript: Access to local files (using 'paths:' in py-env) is not available when directly opening a HTML file; you must use a webserver to serve the additional files. See https://github.com/pyscript/pyscript/issues/257#issuecomment-1119595062 on starting a simple webserver with Python.")
                    raise(err)
                content = await response.bytes()
                with open("${filename}", "wb") as f:
                    f.write(content)
            `,
        );
    }
}
