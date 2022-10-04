import { Runtime } from './runtime';
import { getLastPath } from './utils';
import { getLogger } from './logger';
import type { PyodideInterface } from 'pyodide';
// eslint-disable-next-line
// @ts-ignore
import pyscript from './python/pyscript.py';

const logger = getLogger('pyscript/pyodide');

export class PyodideRuntime extends Runtime {
    src: string;
    name?: string;
    lang?: string;
    interpreter: PyodideInterface;
    globals: any;

    constructor(
        config,
        src = 'https://cdn.jsdelivr.net/pyodide/v0.21.2/full/pyodide.js',
        name = 'pyodide-default',
        lang = 'python',
    ) {
        logger.info('Runtime config:', { name, lang, src });
        super(config);
        this.src = src;
        this.name = name;
        this.lang = lang;
    }

    /**
     * Although `loadPyodide` is used below,
     * notice that it is not imported i.e.
     * import { loadPyodide } from 'pyodide';
     * is not used at the top of this file.
     *
     * This is because, if it's used, loadPyodide
     * behaves mischievously i.e. it tries to load
     * `pyodide.asm.js` and `pyodide_py.tar` but
     * with paths that are wrong such as:
     *
     * http://127.0.0.1:8080/build/pyodide_py.tar
     * which results in a 404 since `build` doesn't
     * contain these files and is clearly the wrong
     * path.
     */
    async loadInterpreter(): Promise<void> {
        logger.info('Loading pyodide');
        // eslint-disable-next-line
        // @ts-ignore
        this.interpreter = await loadPyodide({
            stdout: console.log,
            stderr: console.log,
            fullStdLib: false,
        });

        this.globals = this.interpreter.globals;

        // XXX: ideally, we should load micropip only if we actually need it
        await this.loadPackage('micropip');

        logger.info('importing pyscript.py');
        await this.run(pyscript);

        logger.info('pyodide loaded and initialized');
    }

    async run(code: string): Promise<any> {
        return await this.interpreter.runPythonAsync(code);
    }

    registerJsModule(name: string, module: object): void {
        this.interpreter.registerJsModule(name, module);
    }

    async loadPackage(names: string | string[]): Promise<void> {
        logger.info(`pyodide.loadPackage: ${names.toString()}`);
        await this.interpreter.loadPackage(names,
                                           logger.info.bind(logger),
                                           logger.info.bind(logger));
    }

    async installPackage(package_name: string | string[]): Promise<void> {
        if (package_name.length > 0) {
            logger.info(`micropip install ${package_name.toString()}`);
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
                    console.warn("PyScript: Access to local files (using 'paths:' in py-config) is not available when directly opening a HTML file; you must use a webserver to serve the additional files. See https://github.com/pyscript/pyscript/issues/257#issuecomment-1119595062 on starting a simple webserver with Python.")
                    raise(err)
                content = await response.bytes()
                with open("${filename}", "wb") as f:
                    f.write(content)
            `,
        );
    }
}
