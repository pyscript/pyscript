import { escape, showWarning } from "./utils";

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

/** Stdio provider for sending output to DOM element
 *  specified by ID. Used with "output" keyword.
 *
 */
export class TargetedStdio implements Stdio{

    target_id: string;

    constructor(target_id: string) {
        this.target_id = target_id;
    }

    stdout_writeline (msg: string) {
        // Elements are identified by ID at write-time, not
        // when constructed, in case the running script changes element IDs
        const target = document.getElementById(this.target_id)
        console.log(target)
        if (target === null) { // No matching ID

            //Show each output warning banner pnce per ID
            const banners = document.getElementsByClassName('alert-banner py-warning');
            let bannerCount = 0;
            for (const banner of banners) {
                if (banner.innerHTML.includes(`Output = "${this.target_id}"`)) {
                    bannerCount++;
                }
            }
            if (bannerCount == 0) {
                showWarning(`Output = "${this.target_id}" does not match the id of any element on the page.`)
            }

        }
        else {
            msg = escape(msg).replace("\n", "<br>")
            if (!msg.endsWith("<br/>") && !msg.endsWith("<br>")){
                msg = msg + "<br>"
            }
            target.innerHTML += msg
        }

    }

    stderr_writeline (msg: string) {
        this.stdout_writeline(msg);
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

    removeListener(obj: Stdio) {
        const index = this._listeners.indexOf(obj)
        if (index > -1){
            this._listeners.splice(index, 1)
        }
    }

    stdout_writeline(msg: string) {
        for (const obj of this._listeners) obj.stdout_writeline(msg);
    }

    stderr_writeline(msg: string) {
        for (const obj of this._listeners) obj.stderr_writeline(msg);
    }
}
