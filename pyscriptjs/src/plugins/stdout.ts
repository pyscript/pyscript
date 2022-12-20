import { Plugin } from "../plugin";
import { StdioDisplayer, StdioMultiplexer } from "../stdio";

export class StdoutPlugin extends Plugin {
    _stdioMultiplexer: StdioMultiplexer;

    constructor(stdio: StdioMultiplexer) {
        super()
        this._stdioMultiplexer = stdio
        console.log("Created new StdoutPlugin")
    }

    beforePyScriptExec(runtime: any, PyScriptTag, src: any,): void {
        console.log("BEFORE!")
        //console.log(typeof PyScriptTag)
        //console.log(PyScriptTag)
        //console.log(src)
        if (PyScriptTag.hasAttribute("output")){
            const target_id = PyScriptTag.getAttribute("output")
            //console.log(`Output target id: ${target_id}`)

            const displayer = new StdioDisplayer(target_id)
            PyScriptTag.stdout_display_manager = displayer
            this._stdioMultiplexer.addListener(displayer)
        }


    }

    afterPyScriptExec(runtime: any, PyScriptTag: any, src: any, result: any): void {
        if (PyScriptTag.stdout_display_manager != null){
            this._stdioMultiplexer.removeListener(PyScriptTag.stdout_display_manager)
            PyScriptTag.stdout_display_manager = null
        }
        console.log("AFTER PYSCRIPT EXEC")
        console.log(PyScriptTag)
        console.log(src)
    }
}
