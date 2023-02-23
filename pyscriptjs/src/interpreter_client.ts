import type { AppConfig } from './pyconfig';
import { RemoteInterpreter } from './remote_interpreter';
import type {  PyProxy } from 'pyodide';
import { getLogger } from './logger';
import type { Stdio } from './stdio';

const logger = getLogger('pyscript/interpreter');

export class InterpreterClient extends Object {

    _remote: RemoteInterpreter;
    config: AppConfig;
    globals: PyProxy;
    stdio: Stdio;

    constructor(config: AppConfig, stdio: Stdio) {
        super();
        this.config = config;
        this._remote = new RemoteInterpreter(this.config.interpreters[0].src);
        this.stdio = stdio;
    }

    async initializeRemote(): Promise<void> {
        await this._remote.loadInterpreter(this.config, this.stdio);
        this.globals = this._remote.globals;
    }

    async run(code: string): Promise<{result: any}> {
        return await this._remote.run(code);
    }

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