import type { AppConfig } from './pyconfig';
import { getLogger } from './logger';
import { Stdio } from './stdio';
import { InstallError, ErrorCode } from './exceptions';
import { robustFetch } from './fetch';
import type { loadPyodide as loadPyodideDeclaration, PyodideInterface, PyProxy } from 'pyodide';

declare const loadPyodide: typeof loadPyodideDeclaration;
const logger = getLogger('pyscript/pyodide');

interface Micropip extends PyProxy {
    install: (packageName: string | string[]) => Promise<void>;
    destroy: () => void;
}

export class RemoteInterpreter extends Object {
    src: string;
    interface: PyodideInterface;
    globals: PyProxy;
    // TODO: Remove this once `runtimes` is removed!
    interpreter: PyodideInterface;

    constructor(
        src = 'https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js'
    ) {
        super();
        this.src = src;
    }

    async loadInterpreter(config: AppConfig, stdio: Stdio): Promise<void> {
        this.interface = await loadPyodide({
            stdout: (msg: string) => {
                stdio.stdout_writeline(msg);
            },
            stderr: (msg: string) => {
                stdio.stderr_writeline(msg);
            },
            fullStdLib: false,
        });

        // TODO: Remove this once `runtimes` is removed!
        this.interpreter = this.interface;

        this.globals = this.interface.globals;

        if (config.packages) {
            await this.loadPackage('micropip');
        }
        await this.run('print("Python initialization complete")');
    }

    async run(code: string): Promise<{result: any}> {
        return { result: this.interface.runPython(code) };
    }

    registerJsModule(name: string, module: object): void {
        this.interface.registerJsModule(name, module);
    }

    async loadPackage(names: string | string[]): Promise<void> {
        const pyodide_version = (await this.run("import sys; sys.modules['pyodide'].__version__")).result.toString();
        if (pyodide_version.startsWith("0.22")) {
            await this.interface.loadPackage(names, { messageCallback: logger.info.bind(logger), errorCallback: logger.info.bind(logger) });
        }
        else {
            await this.interface.loadPackage(names, logger.info.bind(logger), logger.info.bind(logger));
        }
    }

    async installPackage(package_name: string | string[]): Promise<void> {
        if (package_name.length > 0) {
            logger.info(`micropip install ${package_name.toString()}`);

            const micropip = this.interface.pyimport('micropip') as Micropip;
            try {
                await micropip.install(package_name);
                micropip.destroy();
            } catch (e) {
                let exceptionMessage = `Unable to install package(s) '` + package_name + `'.`;

                // If we can't fetch `package_name` micropip.install throws a huge
                // Python traceback in `e.message` this logic is to handle the
                // error and throw a more sensible error message instead of the
                // huge traceback.
                if (e.message.includes("Can't find a pure Python 3 wheel")) {
                    exceptionMessage +=
                        ` Reason: Can't find a pure Python 3 Wheel for package(s) '` +
                        package_name +
                        `'. See: https://pyodide.org/en/stable/usage/faq.html#micropip-can-t-find-a-pure-python-wheel ` +
                        `for more information.`;
                } else if (e.message.includes("Can't fetch metadata")) {
                    exceptionMessage +=
                        ' Unable to find package in PyPI. ' +
                        'Please make sure you have entered a correct package name.';
                } else {
                    exceptionMessage +=
                        ` Reason: ${e.message as string}. Please open an issue at ` +
                        `https://github.com/pyscript/pyscript/issues/new if you require help or ` +
                        `you think it's a bug.`;
                }

                logger.error(e);

                throw new InstallError(ErrorCode.MICROPIP_INSTALL_ERROR, exceptionMessage);
            }
        }
    }

    /**
     *
     * @param path : the path in the filesystem
     * @param fetch_path : the path to be fetched
     *
     * Given a file available at `fetch_path` URL (eg: `http://dummy.com/hi.py`),
     * the function downloads the file and saves it to the `path` (eg: `a/b/c/foo.py`)
     * on the FS.
     *
     * Example usage:
     * await loadFromFile(`a/b/c/foo.py`, `http://dummy.com/hi.py`)
     *
     * Nested paths are iteratively analysed and each part is created
     * if it doesn't exist.
     *
     * The analysis returns if the part exists and if it's parent directory exists
     * Due to the manner in which we proceed, the parent will ALWAYS exist.
     *
     * The iteration proceeds in the following manner for `a/b/c/foo.py`:
     *
     * - `a` doesn't exist but it's parent i.e. `root` exists --> create `a`
     * - `a/b` doesn't exist but it's parent i.e. `a` exists --> create `a/b`
     * - `a/b/c` doesn't exist but it's parent i.e. `a/b` exists --> create `a/b/c`
     *
     * Finally, write content of `http://dummy.com/hi.py` to `a/b/c/foo.py`
     *
     * NOTE: The `path` parameter expects to have the `filename` in it i.e.
     * `a/b/c/foo.py` is valid while `a/b/c` (i.e. only the folders) are incorrect.
     */
    async loadFromFile(path: string, fetch_path: string): Promise<void> {
        const pathArr = path.split('/');
        const filename = pathArr.pop();
        for (let i = 0; i < pathArr.length; i++) {
            // iteratively calculates parts of the path i.e. `a`, `a/b`, `a/b/c` for `a/b/c/foo.py`
            const eachPath = pathArr.slice(0, i + 1).join('/');

            // analyses `eachPath` and returns if it exists along with if its parent directory exists or not
            const { exists, parentExists } = this.interface.FS.analyzePath(eachPath);

            // due to the iterative manner in which we proceed, the parent directory should ALWAYS exist
            if (!parentExists) {
                throw new Error(`'INTERNAL ERROR! cannot create ${path}, this should never happen'`);
            }

            // creates `eachPath` if it doesn't exist
            if (!exists) {
                this.interface.FS.mkdir(eachPath);
            }
        }

        // `robustFetch` checks for failures in getting a response
        const response = await robustFetch(fetch_path);
        const buffer = await response.arrayBuffer();
        const data = new Uint8Array(buffer);

        pathArr.push(filename);
        // opens a file descriptor for the file at `path`
        const stream = this.interface.FS.open(pathArr.join('/'), 'w');
        this.interface.FS.write(stream, data, 0, data.length, 0);
        this.interface.FS.close(stream);
    }

    invalidate_module_path_cache(): void {
        const importlib = this.interface.pyimport('importlib');
        importlib.invalidate_caches();
    }
}
