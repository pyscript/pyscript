import { Plugin } from "../plugin";

export class StdoutPlugin extends Plugin {
    beforePyScriptExec(runtime: any, src: any, PyScriptTag: any): void {
        console.log("BEFORE!")
        console.log(PyScriptTag)
        console.log(src)
    }

    afterPyScriptExec(runtime: any, src: any, PyScriptTag: any, result: any): void {
        console.log("AFTER PYSCRIPT EXEC")
        console.log(PyScriptTag)
        console.log(src)
    }
}
