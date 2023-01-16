import { Interpreter } from '../../src/interpreter';
import type { PyodideInterface } from 'pyodide';

export class FakeInterpreter extends Interpreter {
    src: string;
    name?: string;
    lang?: string;
    interface: PyodideInterface;
    globals: any;

    constructor() {
        super(null);
    }

    async run(code: string) {
        /* don't do anything */
    }

    async loadInterpreter() {
        throw new Error('not implemented');
    }

    registerJsModule(name: string, module: object) {
        throw new Error('not implemented');
    }

    async loadPackage(names: string | string[]) {
        throw new Error('not implemented');
    }

    async installPackage(package_name: string | string[]) {
        throw new Error('not implemented');
    }

    async loadFromFile(path: string, fetch_path: string) {
        throw new Error('not implemented');
    }

    invalidate_module_path_cache(): void {
        throw new Error('not implemented');
    }
}
