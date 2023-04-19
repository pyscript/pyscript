import type { AppConfig } from './pyconfig';
import { version } from './version';
import { getLogger } from './logger';
import { Stdio } from './stdio';
import { InstallError, ErrorCode } from './exceptions';
import { robustFetch } from './fetch';
import type { loadPyodide as loadPyodideDeclaration, PyodideInterface, PyProxy, PyProxyDict } from 'pyodide';
import type { ProxyMarked } from 'synclink';
import * as Synclink from 'synclink';
import { showWarning } from './utils';
import { define_custom_element } from './plugin';

import { python_package } from './python_package';

declare const loadPyodide: typeof loadPyodideDeclaration;
const logger = getLogger('pyscript/pyodide');

export type InterpreterInterface = (PyodideInterface & ProxyMarked) | null;

interface Micropip extends PyProxy {
    install(packageName: string | string[]): Promise<void>;
}

type FSInterface = {
    writeFile(path: string, data: Uint8Array | string, options?: { canOwn?: boolean; encoding?: string }): void;
    mkdirTree(path: string): void;
    mkdir(path: string): void;
} & ProxyMarked;

type PATHFSInterface = {
    resolve(path: string): string;
} & ProxyMarked;

type PATHInterface = {
    dirname(path: string): string;
} & ProxyMarked;

type PyScriptInternalModule = ProxyMarked & {
    set_version_info(ver: string): void;
    uses_top_level_await(code: string): boolean;
    run_pyscript(code: string, display_target_id?: string): { result: any };
    install_pyscript_loop(): void;
    start_loop(): void;
    schedule_deferred_tasks(): void;
};

/*
RemoteInterpreter class is responsible to process requests from the
`InterpreterClient` class -- these can be requests for installation of
a package, executing code, etc.

Currently, the only interpreter available is Pyodide as indicated by the
`InterpreterInterface` type above. This serves as a Union of types of
different interpreters which will be added in near future.

Methods available handle loading of the interpreter, initialization,
running code, loading and installation of packages, loading from files etc.

The class will be turned `abstract` in future, to support more runtimes
such as MicroPython.
 */
export class RemoteInterpreter extends Object {
    src: string;
    interface: InterpreterInterface;
    FS: FSInterface;
    PATH: PATHInterface;
    PATH_FS: PATHFSInterface;
    pyscript_internal: PyScriptInternalModule;

    globals: PyProxyDict & ProxyMarked;
    // TODO: Remove this once `runtimes` is removed!
    interpreter: InterpreterInterface & ProxyMarked;

    constructor(src = './micropython.js') {
        super();
        this.src = src;
    }

    /**
     * loads the interface for the interpreter and saves an instance of it
     * in the `this.interface` property along with calling of other
     * additional convenience functions.
     * */

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
    async loadInterpreter(config: AppConfig, stdio: Synclink.Remote<Stdio & ProxyMarked>): Promise<void> {
        // TODO: move this to "main thread"!
        const _pyscript_js_main = { define_custom_element, showWarning };

        this.interface = Synclink.proxy(
            await loadMicroPython({
                stdout: (msg: string) => {
                    stdio.stdout_writeline(msg).syncify();
                },
                stderr: (msg: string) => {
                    stdio.stderr_writeline(msg).syncify();
                },
                fullStdLib: false,
            }),
        );
        this.interface.registerComlink(Synclink);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.FS = this.interface.FS;
        this.FS.mkdirTree('/home/pyodide/');
        this.interface.runPython("import sys; sys.path.append('/home/pyodide/')");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.PATH = (this.interface as any)._module.PATH;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.PATH_FS = (this.interface as any)._module.PATH_FS;

        // TODO: Remove this once `runtimes` is removed!
        this.interpreter = this.interface;
        this.interface.registerJsModule('_pyscript_js', _pyscript_js_main);

        // Write pyscript package into file system
        for (const dir of python_package.dirs) {
            this.FS.mkdir('/home/pyodide/' + dir);
        }
        for (const [path, value] of python_package.files) {
            this.FS.writeFile('/home/pyodide/' + path, value);
        }
        //Refresh the module cache so Python consistently finds pyscript module
        this.invalidate_module_path_cache();

        this.globals = Synclink.proxy(this.interface.globals as PyProxyDict);
        logger.info('importing pyscript');
        this.pyscript_internal = Synclink.proxy(this.interface.pyimport('pyscript._internal')) as PyProxy &
            typeof this.pyscript_internal;
        this.pyscript_internal.set_version_info(version);
        this.pyscript_internal.install_pyscript_loop();

        if (config.packages.length > 0) {
            logger.info('Found packages in configuration to install. Loading micropip...');
            await this.loadPackage('micropip');
        }
        // import some carefully selected names into the global namespace
        this.interface.runPython(`
        import js
        import pyscript
        from pyscript import Element, display, HTML
        `);

        logger.info('pyodide loaded and initialized');
    }

    /**
     * delegates the registration of JS modules to
     * the underlying interface.
     * */
    registerJsModule(name: string, module: object): void {
        this.interface.registerJsModule(name, module);
    }

    /**
     * delegates the loading of packages to
     * the underlying interface.
     * */
    async loadPackage(names: string | string[]): Promise<void> {
        logger.info(`pyodide.loadPackage: ${names.toString()}`);
        // the new way in v0.22.1 is to pass it as a dict of options i.e.
        // { messageCallback: logger.info.bind(logger), errorCallback: logger.info.bind(logger) }
        // but one of our tests tries to use a locally downloaded older version of pyodide
        // for which the signature of `loadPackage` accepts the above params as args i.e.
        // the call uses `logger.info.bind(logger), logger.info.bind(logger)`.
        const messageCallback = logger.info.bind(logger) as typeof logger.info;
        if (this.interpreter.version.startsWith('0.22')) {
            await this.interface.loadPackage(names, {
                messageCallback,
                errorCallback: messageCallback,
            });
        } else {
            // @ts-expect-error Types don't include this deprecated call signature
            await this.interface.loadPackage(names, messageCallback, messageCallback);
        }
    }

    /**
     * delegates the installation of packages
     * (using a package manager, which can be specific to
     * the interface) to the underlying interface.
     *
     * For Pyodide, we use `micropip`
     * */
    async installPackage(package_name: string | string[]): Promise<void> {
        if (package_name.length > 0) {
            logger.info(`micropip install ${package_name.toString()}`);

            const micropip = this.interface.pyimport('micropip') as Micropip;
            try {
                await micropip.install(package_name);
                micropip.destroy();
            } catch (err) {
                const e = err as Error;
                let fmt_names: string;
                if (Array.isArray(package_name)) {
                    fmt_names = package_name.join(', ');
                } else {
                    fmt_names = package_name;
                }
                let exceptionMessage = `Unable to install package(s) '${fmt_names}'.`;

                // If we can't fetch `package_name` micropip.install throws a huge
                // Python traceback in `e.message` this logic is to handle the
                // error and throw a more sensible error message instead of the
                // huge traceback.
                if (e.message.includes("Can't find a pure Python 3 wheel")) {
                    exceptionMessage +=
                        ` Reason: Can't find a pure Python 3 Wheel for package(s) '${fmt_names}'.` +
                        `See: https://pyodide.org/en/stable/usage/faq.html#micropip-can-t-find-a-pure-python-wheel ` +
                        `for more information.`;
                } else if (e.message.includes("Can't fetch metadata")) {
                    exceptionMessage +=
                        ' Unable to find package in PyPI. ' +
                        'Please make sure you have entered a correct package name.';
                } else {
                    exceptionMessage +=
                        ` Reason: ${e.message}. Please open an issue at ` +
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
     * @param url : the url to be fetched
     *
     * Given a file available at `url` URL (eg: `http://dummy.com/hi.py`), the
     * function downloads the file and saves it to the `path` (eg:
     * `a/b/c/foo.py`) on the FS.
     *
     * Example usage: await loadFromFile(`a/b/c/foo.py`,
     * `http://dummy.com/hi.py`)
     *
     * Write content of `http://dummy.com/hi.py` to `a/b/c/foo.py`
     *
     * NOTE: The `path` parameter expects to have the `filename` in it i.e.
     * `a/b/c/foo.py` is valid while `a/b/c` (i.e. only the folders) are
     * incorrect.
     *
     * The path will be resolved relative to the current working directory,
     * which is initially `/home/pyodide`. So by default `a/b.py` will be placed
     * in `/home/pyodide/a/b.py`, `../a/b.py` will be placed into `/home/a/b.py`
     * and `/a/b.py` will be placed into `/a/b.py`.
     */
    async loadFileFromURL(path: string, url: string): Promise<void> {
        path = this.PATH_FS.resolve(path);
        const dir: string = this.PATH.dirname(path);
        this.FS.mkdirTree(dir);

        // `robustFetch` checks for failures in getting a response
        const response = await robustFetch(url);
        const buffer = await response.arrayBuffer();
        const data = new Uint8Array(buffer);

        this.FS.writeFile(path, data, { canOwn: true });
    }

    /**
     * delegates clearing importlib's module path
     * caches to the underlying interface
     */
    invalidate_module_path_cache(): void {
        const importlib = this.interface.pyimport('importlib') as PyProxy & { invalidate_caches(): void };
        importlib.invalidate_caches();
    }

    pyimport(mod_name: string): PyProxy & Synclink.ProxyMarked {
        return Synclink.proxy(this.interface.pyimport(mod_name));
    }

    setHandler(func_name: string, handler: any): void {
        const pyscript_module = this.interface.pyimport('pyscript');
        pyscript_module[func_name] = handler;
    }
}
