export interface Stdio {
    stdout_writeline: (msg: string) => void;
    stderr_writeline: (msg: string) => void;
}

/** Default implementation of Stdio: stdout and stderr are both sent to the
 *  console
 */
export const DEFAULT_STDIO: Stdio = {
    stdout_writeline: console.log,
    stderr_writeline: console.log,
};

/** Stdio provider which captures and store the messages.
 *  Useful for tests.
 */
export class CaptureStdio implements Stdio {
    captured_stdout: string;
    captured_stderr: string;

    constructor() {
        this.reset();
    }

    reset() {
        this.captured_stdout = '';
        this.captured_stderr = '';
    }

    stdout_writeline(msg: string) {
        this.captured_stdout += msg + '\n';
    }

    stderr_writeline(msg: string) {
        this.captured_stderr += msg + '\n';
    }
}

/** Redirect stdio streams to multiple listeners
 */
export class StdioMultiplexer implements Stdio {
    _listeners: Stdio[];

    constructor() {
        this._listeners = [];
    }

    addListener(obj: Stdio) {
        this._listeners.push(obj);
    }

    stdout_writeline(msg: string) {
        for (const obj of this._listeners) obj.stdout_writeline(msg);
    }

    stderr_writeline(msg: string) {
        for (const obj of this._listeners) obj.stderr_writeline(msg);
    }
}
