import type { AppConfig } from './pyconfig';
import { RemoteInterpreter } from './remote_interpreter';
import type { PyProxyDict, PyProxy } from 'pyodide';
import { getLogger } from './logger';
import type { Stdio } from './stdio';
import * as Synclink from 'synclink';

const logger = getLogger('pyscript/interpreter');

/*
InterpreterClient class is responsible to request code execution
(among other things) from a `RemoteInterpreter`
*/
export class InterpreterClient extends Object {
    _remote: Synclink.Remote<RemoteInterpreter>;
    config: AppConfig;
    /**
     * global symbols table for the underlying interface.
     * */
    globals: Synclink.Remote<PyProxyDict>;
    stdio: Stdio;

    constructor(config: AppConfig, stdio: Stdio, remote: Synclink.Remote<RemoteInterpreter>) {
        super();
        this.config = config;
        this._remote = remote;
        this.stdio = stdio;
    }

    /**
     * initializes the remote interpreter, which further loads the underlying
     * interface.
     */
    async initializeRemote(): Promise<void> {
        await this._remote.loadInterpreter(this.config, Synclink.proxy(this.stdio));
        this.globals = this._remote.globals;
    }

    /**
     * Run user Python code. See also the _run_pyscript docstring.
     *
     * The result is wrapped in an object to avoid accidentally awaiting a
     * Python Task or Future returned as the result of the computation.
     *
     * @param code the code to run
     * @param id The id for the default display target (or undefined if no
     * default display target).
     * @returns Either:
     * 1. An Object of the form {result: the_result} if the result is
     *    serializable (or transferable), or
     * 2. a Synclink Proxy wrapping an object of this if the result is not
     *    serializable.
     */
    async run(code: string, id?: string): Promise<{ result: any }> {
        return this._remote.pyscript_internal.run_pyscript(code, id);
    }

    /**
     * Same as run, but Python exceptions are not propagated: instead, they
     * are logged to the console.
     *
     * This is a bad API and should be killed/refactored/changed eventually,
     * but for now we have code which relies on it.
     * */
    async runButDontRaise(code: string): Promise<unknown> {
        let result: unknown;
        try {
            result = (await this.run(code)).result;
        } catch (error: unknown) {
            logger.error('Error:', error);
        }
        return result;
    }

    async pyimport(mod_name: string): Promise<Synclink.Remote<PyProxy>> {
        return this._remote.pyimport(mod_name);
    }

    async mkdir(path: string) {
        await this._remote.FS.mkdir(path);
    }

    async writeFile(path: string, content: string) {
        await this._remote.FS.writeFile(path, content, { encoding: 'utf8' });
    }
}
