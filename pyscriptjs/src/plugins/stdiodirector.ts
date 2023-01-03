import { Plugin } from "../plugin";
import { TargetedStdio, StdioMultiplexer } from "../stdio";


/**
 * The StdioDirector plugin captures the output to Python's sys.stdio and
 * sys.stderr and writes it to a specific element in the DOM. It does this by
 * creating a new TargetedStdio manager and adding it to the global stdioMultiplexer's
 * list of listeners prior to executing the Python in a specific tag. Following
 * execution of the Python in that tag, it removes the TargetedStdio as a listener
 *
 */
export class StdioDirector extends Plugin {
    _stdioMultiplexer: StdioMultiplexer;

    constructor(stdio: StdioMultiplexer) {
        super()
        this._stdioMultiplexer = stdio
    }

    /** Prior to a <py-script> tag being evaluated, if that tag itself has
     * an 'output' attribute, a new TargetedStdio object is created and added
     * to the stdioMultiplexer to route sys.stdout and sys.stdout to the DOM object
     * with that ID for the duration of the evaluation.
     *
     */
    beforePyScriptExec(runtime: any, src: any, PyScriptTag): void {
        if (PyScriptTag.hasAttribute("output")){
            const targeted_io = new TargetedStdio(PyScriptTag, "output")
            PyScriptTag.stdout_manager = targeted_io
            this._stdioMultiplexer.addListener(targeted_io)
        }
    }

    /** After a <py-script> tag is evaluated, if that tag has a 'stdout_manager'
     *  (presumably TargetedStdio, or some other future IO handler), it is removed.
     */
    afterPyScriptExec(runtime: any, src: any, PyScriptTag: any, result: any): void {
        if (PyScriptTag.stdout_manager != null){
            this._stdioMultiplexer.removeListener(PyScriptTag.stdout_manager)
            PyScriptTag.stdout_manager = null
        }
    }
}
