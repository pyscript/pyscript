import type { AppConfig } from './pyconfig';
import { RemoteInterpreter } from './remote_interpreter';
import type { PyProxy } from 'pyodide';
import { getLogger } from './logger';
import type { Stdio } from './stdio';

const logger = getLogger('pyscript/interpreter');

/*
InterpreterClient class is responsible to request code execution
(among other things) from a `RemoteInterpreter`
*/
export class InterpreterClient extends Object {
    _remote: RemoteInterpreter;
    config: AppConfig;
    /**
     * global symbols table for the underlying interface.
     * */
    globals: PyProxy;
    stdio: Stdio;

    constructor(config: AppConfig, stdio: Stdio) {
        super();
        this.config = config;
        this._remote = new RemoteInterpreter(this.config.interpreters[0].src);
        this.stdio = stdio;
    }

    /**
     * initializes the remote interpreter, which further loads the underlying
     * interface.
     * */
    async initializeRemote(): Promise<void> {
        await this._remote.loadInterpreter(this.config, this.stdio);
        this.globals = this._remote.globals;
    }

    /**
     * delegates the code to be run to the underlying interface of
     * the remote interpreter.
     * Python exceptions are turned into JS exceptions.
     * */
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
}
