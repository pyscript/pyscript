import { createSingularWarning, escape } from "./utils";

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

    source_element: HTMLElement;
    source_attribute: string;
    capture_stdout: boolean;
    capture_stderr: boolean;

    constructor(source_element: HTMLElement, source_attribute: string, capture_stdout = true, capture_stderr = true) {
        this.source_element = source_element;
        this.source_attribute = source_attribute;
        this.capture_stdout = capture_stdout;
        this.capture_stderr = capture_stderr;
    }

    /** Writes the given msg to an element with a given ID. The ID is the value an attribute
     *  of the source_element specified by source_attribute.
     *  Both the element to be targeted and the ID of the element to write to
     *  are determined at write-time, not when the TargetdStdio object is
     *  created. This way, if either the 'output' attribute of the HTML tag
     *  or the ID of the target element changes during execution of the Python
     *  code, the output is still routed (or not) as expected
     *
     * @param msg The output to be written
     */
    writeline_by_attribute(msg:string){
            const target_id = this.source_element.getAttribute(this.source_attribute)
            const target = document.getElementById(target_id)
            if (target === null) { // No matching ID
                createSingularWarning(`${this.source_attribute} = "${target_id}" does not match the id of any element on the page.`)
            }
            else {
                msg = escape(msg).replace("\n", "<br>")
                if (!msg.endsWith("<br/>") && !msg.endsWith("<br>")){
                    msg = msg + "<br>"
                }
                target.innerHTML += msg
            }
    }

    stdout_writeline (msg: string) {
        if (this.capture_stdout){
            this.writeline_by_attribute(msg)
        }

    }

    stderr_writeline (msg: string) {
        if (this.capture_stderr){
            this.writeline_by_attribute(msg)
        }
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
