import { Plugin } from "../plugin";
import { TargetedStdio, StdioMultiplexer } from "../stdio";

export class StdioDirector extends Plugin {
    _stdioMultiplexer: StdioMultiplexer;

    constructor(stdio: StdioMultiplexer) {
        super()
        this._stdioMultiplexer = stdio
    }

    beforePyScriptExec(runtime: any, src: any, PyScriptTag): void {
        if (PyScriptTag.hasAttribute("output")){
            const target_id = PyScriptTag.getAttribute("output")

            const targeted_io = new TargetedStdio(target_id)
            PyScriptTag.stdout_manager = targeted_io
            this._stdioMultiplexer.addListener(targeted_io)
        }
    }

    afterPyScriptExec(runtime: any, src: any, PyScriptTag: any, result: any): void {
        if (PyScriptTag.stdout_manager != null){
            this._stdioMultiplexer.removeListener(PyScriptTag.stdout_manager)
            PyScriptTag.stdout_manager = null
        }
    }
}
