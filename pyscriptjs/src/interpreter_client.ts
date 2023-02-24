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
    globals: PyProxyDict;
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
     * */
    async initializeRemote(): Promise<void> {
        await this._remote.loadInterpreter(this.config, this.stdio);
        this.globals = await this._remote.globals as PyProxyDict;
    }

    /**
     * delegates the code to be run to the underlying interface of
     * the remote interpreter.
     * Python exceptions are turned into JS exceptions.
     * */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async run(code: string): Promise<{ result: any }> {
        return await this._remote.run(code);
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

    async pyimport(mod_name: string): Promise<PyProxy> {
        return await this._remote.pyimport(mod_name);
    }

    async mkdirTree(path: string) {
        await this._remote.mkdirTree(path);
    }

    async writeFile(path: string, content: string) {
        await this._remote.writeFile(path, content);
    }
}
