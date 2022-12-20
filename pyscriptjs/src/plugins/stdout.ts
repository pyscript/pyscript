import { Plugin } from "../plugin";
import { TargettedStdio, StdioMultiplexer } from "../stdio";

export class StdoutPlugin extends Plugin {
    _stdioMultiplexer: StdioMultiplexer;

    constructor(stdio: StdioMultiplexer) {
        super()
        this._stdioMultiplexer = stdio
    }

    beforePyScriptExec(runtime: any, src: any, PyScriptTag): void {
        if (PyScriptTag.hasAttribute("output")){
            const target_id = PyScriptTag.getAttribute("output")

            const displayer = new TargettedStdio(target_id)
            PyScriptTag.stdout_display_manager = displayer
            this._stdioMultiplexer.addListener(displayer)
        }


    }

    afterPyScriptExec(runtime: any, src: any, PyScriptTag: any, result: any): void {
        if (PyScriptTag.stdout_display_manager != null){
            this._stdioMultiplexer.removeListener(PyScriptTag.stdout_display_manager)
            PyScriptTag.stdout_display_manager = null
        }
    }
}
