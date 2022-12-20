import { Plugin } from "../plugin";
import { TargettedStdio, StdioMultiplexer } from "../stdio";

export class StdoutDirector extends Plugin {
    _stdioMultiplexer: StdioMultiplexer;

    constructor(stdio: StdioMultiplexer) {
        super()
        this._stdioMultiplexer = stdio
    }

    beforePyScriptExec(runtime: any, src: any, PyScriptTag): void {
        if (PyScriptTag.hasAttribute("output")){
            const target_id = PyScriptTag.getAttribute("output")

            const targetted_io = new TargettedStdio(target_id)
            PyScriptTag.stdout_manager = targetted_io
            this._stdioMultiplexer.addListener(targetted_io)
        }


    }

    afterPyScriptExec(runtime: any, src: any, PyScriptTag: any, result: any): void {
        if (PyScriptTag.stdout_manager != null){
            this._stdioMultiplexer.removeListener(PyScriptTag.stdout_manager)
            PyScriptTag.stdout_manager = null
        }
    }
}
