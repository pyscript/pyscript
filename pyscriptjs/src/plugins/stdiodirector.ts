import { Plugin } from '../plugin';
import { TargetedStdio, StdioMultiplexer } from '../stdio';
import { make_PyScript } from '../components/pyscript';
import { InterpreterClient } from '../interpreter_client';
import { createSingularWarning } from '../utils'
import { pyDisplay } from '../pyexec'

type PyScriptTag = InstanceType<ReturnType<typeof make_PyScript>>;

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
        super();
        this._stdioMultiplexer = stdio;
    }

    /** Prior to a <py-script> tag being evaluated, if that tag itself has
     * an 'output' attribute, a new TargetedStdio object is created and added
     * to the stdioMultiplexer to route sys.stdout and sys.stdout to the DOM object
     * with that ID for the duration of the evaluation.
     *
     */
    beforePyScriptExec(options: { interpreter: InterpreterClient; src: string; pyScriptTag: PyScriptTag }): void {
        if (options.pyScriptTag.hasAttribute('output')) {
            const targeted_io = new TargetedStdio(options.pyScriptTag, 'output', true, true);
            options.pyScriptTag.stdout_manager = targeted_io;
            this._stdioMultiplexer.addListener(targeted_io);
        }
        if (options.pyScriptTag.hasAttribute('stderr')) {
            const targeted_io = new TargetedStdio(options.pyScriptTag, 'stderr', false, true);
            options.pyScriptTag.stderr_manager = targeted_io;
            this._stdioMultiplexer.addListener(targeted_io);
        }
    }

    /** After a <py-script> tag is evaluated, if that tag has a 'stdout_manager'
     *  (presumably TargetedStdio, or some other future IO handler), it is removed.
     */
    afterPyScriptExec(options: {
        interpreter: InterpreterClient;
        src: string;
        pyScriptTag: PyScriptTag;
        result: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }): void {
        if (options.pyScriptTag.stdout_manager != null) {
            this._stdioMultiplexer.removeListener(options.pyScriptTag.stdout_manager);
            options.pyScriptTag.stdout_manager = null;
        }
        if (options.pyScriptTag.stderr_manager != null) {
            this._stdioMultiplexer.removeListener(options.pyScriptTag.stderr_manager);
            options.pyScriptTag.stderr_manager = null;
        }
    }

    beforePyReplExec(options: {interpreter: Interpreter, src: string, outEl: HTMLElement, pyReplTag: any}): void {
        //Handle 'output-mode' attribute (removed in PR #881/f9194cc8, restored here)
        if (options.pyReplTag.getAttribute('output-mode') != 'append'){
            options.outEl.innerHTML = ''
        }

        // Handle 'output' attribute; defaults to writing stdout to the existing outEl
        // If 'output' attribute is used, the DOM element with the specified ID receives
        // -both- sys.stdout and sys.stderr
        let output_targeted_io;
        if (options.pyReplTag.hasAttribute("output")){
            output_targeted_io = new TargetedStdio(options.pyReplTag, "output", true, true);
        }
        else {
            output_targeted_io = new TargetedStdio(options.pyReplTag.outDiv, "id", true, true);
        }
        options.pyReplTag.stdout_manager = output_targeted_io;
        this._stdioMultiplexer.addListener(output_targeted_io);

        //Handle 'stderr' attribute;
        if (options.pyReplTag.hasAttribute("stderr")){
            const stderr_targeted_io = new TargetedStdio(options.pyReplTag, "stderr", false, true);
            options.pyReplTag.stderr_manager = stderr_targeted_io;
            this._stdioMultiplexer.addListener(stderr_targeted_io);
        }

    }

    afterPyReplExec(options: {interpreter: any, src: any, outEl: any, pyReplTag: any, result: any}): void {
        // display the value of the last evaluated expression (REPL-style)
        if (options.result !== undefined) {

            
            const outputId =  options.pyReplTag.getAttribute("output")
            if (outputId) { 
                // 'output' attribute also used as location to send
                // result of REPL
                if (document.getElementById(outputId)){
                    pyDisplay(options.interpreter, options.result, { target: outputId });
                } 
                else { //no matching element on page
                    createSingularWarning(`output = "${outputId}" does not match the id of any element on the page.`)
                }
                
            }
            else {
                // 'otuput atribuite not provided
                pyDisplay(options.interpreter, options.result, { target: options.outEl.id });
            }
        }

        if (options.pyReplTag.stdout_manager != null){
            this._stdioMultiplexer.removeListener(options.pyReplTag.stdout_manager)
            options.pyReplTag.stdout_manager = null
        }
        if (options.pyReplTag.stderr_manager != null){
            this._stdioMultiplexer.removeListener(options.pyReplTag.stderr_manager)
            options.pyReplTag.stderr_manager = null
        }
    }
}
