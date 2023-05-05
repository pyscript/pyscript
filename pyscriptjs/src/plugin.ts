import type { PyScriptApp } from './main';
import type { AppConfig } from './pyconfig';
import { UserError, ErrorCode } from './exceptions';
import { getLogger } from './logger';
import { make_PyScript } from './components/pyscript';
import { InterpreterClient } from './interpreter_client';

const logger = getLogger('plugin');
type PyScriptTag = InstanceType<ReturnType<typeof make_PyScript>>;

export class Plugin {
    /** Validate the configuration of the plugin and handle default values.
     *
     * Individual plugins are expected to check that the config keys/sections
     * which are relevant to them contains valid values, and to raise an error
     * if they contains unknown keys.
     *
     * This is also a good place where set default values for those keys which
     * are not specified by the user.
     *
     * This hook should **NOT** contain expensive operations, else it delays
     * the download of the python interpreter which is initiated later.
     */
    configure(_config: AppConfig) {
        /* empty */
    }

    /** The preliminary initialization phase is complete and we are about to
     * download and launch the Python interpreter.
     *
     * We can assume that the page is already shown to the user and that the
     * DOM content has been loaded. This is a good place where to add tags to
     * the DOM, if needed.
     *
     * This hook should **NOT** contain expensive operations, else it delays
     * the download of the python interpreter which is initiated later.
     */
    beforeLaunch(_config: AppConfig) {
        /* empty */
    }

    /** The Python interpreter has been launched, the virtualenv has been
     * installed and we are ready to execute user code.
     *
     * The <py-script> tags will be executed after this hook.
     */
    afterSetup(_interpreter: InterpreterClient) {
        /* empty */
    }

    /** The source of a <py-script>> tag has been fetched, and we're about
     * to evaluate that source using the provided interpreter.
     *
     * @param options.interpreter The Interpreter object that will be used to evaluate the Python source code
     * @param options.src {string} The Python source code to be evaluated
     * @param options.pyScriptTag The <py-script> HTML tag that originated the evaluation
     */
    beforePyScriptExec(_options: { interpreter: InterpreterClient; src: string; pyScriptTag: PyScriptTag }) {
        /* empty */
    }

    /** The Python in a <py-script> has just been evaluated, but control
     * has not been ceded back to the JavaScript event loop yet
     *
     * @param options.interpreter The Interpreter object that will be used to evaluate the Python source code
     * @param options.src {string} The Python source code to be evaluated
     * @param options.pyScriptTag The <py-script> HTML tag that originated the evaluation
     * @param options.result The returned result of evaluating the Python (if any)
     */
    afterPyScriptExec(_options: {
        interpreter: InterpreterClient;
        src: string;
        pyScriptTag: PyScriptTag;
        result: any;
    }) {
        /* empty */
    }

    /** The source of the <py-repl> tag has been fetched and its output-element determined;
     * we're about to evaluate the source using the provided interpreter
     *
     * @param options.interpreter The interpreter object that will be used to evaluated the Python source code
     * @param options.src {string} The Python source code to be evaluated
     * @param options.outEl The element that the result of the REPL evaluation will be output to.
     * @param options.pyReplTag The <py-repl> HTML tag the originated the evaluation
     */
    beforePyReplExec(options: { interpreter: InterpreterClient; src: string; outEl: HTMLElement; pyReplTag: any }) {
        /* empty */
    }

    /**
     *
     * @param options.interpreter  The interpreter object that will be used to evaluated the Python source code
     * @param options.src  {string} The Python source code to be evaluated
     * @param options.outEl  The element that the result of the REPL evaluation will be output to.
     * @param options.pyReplTag  The <py-repl> HTML tag the originated the evaluation
     * @param options.result The result of evaluating the Python (if any)
     */
    afterPyReplExec(options: {
        interpreter: InterpreterClient;
        src: string;
        outEl: HTMLElement;
        pyReplTag: HTMLElement;
        result: any;
    }) {
        /* empty */
    }

    /** Startup complete. The interpreter is initialized and ready, user
     * scripts have been executed: the main initialization logic ends here and
     * the page is ready to accept user interactions.
     */
    afterStartup(_interpreter: InterpreterClient) {
        /* empty */
    }

    /** Called when an UserError is raised
     */
    onUserError(_error: UserError) {
        /* empty */
    }
}

export type PythonPlugin = {
    init(app: PyScriptApp): void;
    configure?: (config: AppConfig) => Promise<void>;
    afterSetup?: (interpreter: InterpreterClient) => Promise<void>;
    afterStartup?: (interpreter: InterpreterClient) => Promise<void>;
    beforePyScriptExec?: { callKwargs: (options: any) => Promise<void> };
    afterPyScriptExec?: { callKwargs: (options: any) => Promise<void> };
    beforePyReplExec?: { callKwargs: (options: any) => Promise<void> };
    afterPyReplExec?: { callKwargs: (options: any) => Promise<void> };
    onUserError?: (error: UserError) => Promise<void>;
};

export class PluginManager {
    _plugins: Plugin[];
    _pythonPlugins: PythonPlugin[];

    constructor() {
        this._plugins = [];
        this._pythonPlugins = [];
    }

    add(...plugins: Plugin[]) {
        this._plugins.push(...plugins);
    }

    addPythonPlugin(plugin: PythonPlugin) {
        this._pythonPlugins.push(plugin);
    }

    async configure(config: AppConfig) {
        for (const p of this._plugins) p.configure?.(config);

        for (const p of this._pythonPlugins) await p.configure?.(config);
    }

    beforeLaunch(config: AppConfig) {
        for (const p of this._plugins) {
            try {
                p?.beforeLaunch?.(config);
            } catch (e) {
                logger.error(`Error while calling beforeLaunch hook of plugin ${p.constructor.name}`, e);
            }
        }
    }

    async afterSetup(interpreter: InterpreterClient) {
        for (const p of this._plugins) {
            try {
                p.afterSetup?.(interpreter);
            } catch (e) {
                logger.error(`Error while calling afterSetup hook of plugin ${p.constructor.name}`, e);
            }
        }

        for (const p of this._pythonPlugins) await p.afterSetup?.(interpreter);
    }

    async afterStartup(interpreter: InterpreterClient) {
        for (const p of this._plugins) p.afterStartup?.(interpreter);

        for (const p of this._pythonPlugins) await p.afterStartup?.(interpreter);
    }

    async beforePyScriptExec(options: { interpreter: InterpreterClient; src: string; pyScriptTag: PyScriptTag }) {
        for (const p of this._plugins) p.beforePyScriptExec?.(options);

        for (const p of this._pythonPlugins) await p.beforePyScriptExec.callKwargs(options);
    }

    async afterPyScriptExec(options: {
        interpreter: InterpreterClient;
        src: string;
        pyScriptTag: PyScriptTag;
        result: any;
    }) {
        for (const p of this._plugins) p.afterPyScriptExec?.(options);

        for (const p of this._pythonPlugins) await p.afterPyScriptExec.callKwargs(options);
    }

    async beforePyReplExec(options: {
        interpreter: InterpreterClient;
        src: string;
        outEl: HTMLElement;
        pyReplTag: any;
    }) {
        for (const p of this._plugins) p.beforePyReplExec?.(options);

        for (const p of this._pythonPlugins) await p.beforePyReplExec?.callKwargs(options);
    }

    async afterPyReplExec(options: { interpreter: InterpreterClient; src: string; outEl; pyReplTag; result }) {
        for (const p of this._plugins) p.afterPyReplExec?.(options);

        for (const p of this._pythonPlugins) await p.afterPyReplExec?.callKwargs(options);
    }

    async onUserError(error: UserError) {
        for (const p of this._plugins) p.onUserError?.(error);

        for (const p of this._pythonPlugins) await p.onUserError?.(error);
    }
}

type PyElementInstance = { connect(): void };
type PyElementClass = (htmlElement: HTMLElement) => PyElementInstance;

/**
 * Defines a new CustomElement (via customElement.defines) with `tag`,
 * where the new CustomElement is a proxy that delegates the logic to
 * pyPluginClass.
 *
 * @param tag - tag that will be used to define the new CustomElement (i.e: "py-script")
 * @param pyPluginClass - class that will be used to create instance to be
 *                        used as CustomElement logic handler. Any DOM event
 *                        received by the newly created CustomElement will be
 *                        delegated to that instance.
 */
export function define_custom_element(tag: string, pyElementClass: PyElementClass): any {
    logger.info(`creating plugin: ${tag}`);
    class ProxyCustomElement extends HTMLElement {
        wrapper: HTMLElement;
        pyElementInstance: PyElementInstance;
        originalInnerHTML: string;

        constructor() {
            logger.debug(`creating ${tag} plugin instance`);
            super();

            this.wrapper = document.createElement('slot');
            this.attachShadow({ mode: 'open' }).appendChild(this.wrapper);
            this.originalInnerHTML = this.innerHTML;
            this.pyElementInstance = pyElementClass(this);
        }

        connectedCallback() {
            const innerHTML = this.pyElementInstance.connect();
            if (typeof innerHTML === 'string') this.innerHTML = innerHTML;
        }
    }

    customElements.define(tag, ProxyCustomElement);
}

// Members of py-config in plug that we want to validate must be one of these types
type BaseConfigObject = string | boolean | number | undefined;

/**
 * Validate that parameter the user provided to py-config conforms to the specified validation function;
 * if not, throw an error explaining the bad value. If no value is provided, set the parameter
 * to the provided default value
 * This is the most generic validation function; other validation functions for common situations follow
 * @param options.config - The (extended) AppConfig object from py-config
 * @param {string} options.name - The name of the key in py-config to be checked
 * @param {(b:BaseConfigObject) => boolean} options.validator - the validation function used to test the user-supplied value
 * @param {BaseConfigObject} options.defaultValue - The default value for this parameter, if none is provided
 * @param {string} [options.hintMessage] - The message to show in a user error if the supplied value isn't valid
 */
export function validateConfigParameter(options: {
    config: AppConfig;
    name: string;
    validator: (b: BaseConfigObject) => boolean;
    defaultValue: BaseConfigObject;
    hintMessage?: string;
}) {
    //Validate that the default value is acceptable, at runtime
    if (!options.validator(options.defaultValue)) {
        throw Error(
            `Default value ${JSON.stringify(options.defaultValue)} for ${options.name} is not a valid argument, ` +
                `according to the provided validator function. ${options.hintMessage ? options.hintMessage : ''}`,
        );
    }

    const value = options.config[options.name] as BaseConfigObject;
    if (value !== undefined && !options.validator(value)) {
        //Use default hint message if none is provided:
        const hintOutput = `Invalid value ${JSON.stringify(value)} for config.${options.name}. ${
            options.hintMessage ? options.hintMessage : ''
        }`;
        throw new UserError(ErrorCode.BAD_CONFIG, hintOutput);
    }
    if (value === undefined) {
        options.config[options.name] = options.defaultValue;
    }
}

/**
 * Validate that parameter the user provided to py-config is one of the acceptable values in
 * the given Array; if not, throw an error explaining the bad value. If no value is provided,
 * set the parameter to the provided default value
 * @param options.config - The (extended) AppConfig object from py-config
 * @param {string} options.name - The name of the key in py-config to be checked
 * @param {Array<BaseConfigObject>} options.possibleValues: The acceptable values for this parameter
 * @param {BaseConfigObject} options.defaultValue: The default value for this parameter, if none is provided
 */
export function validateConfigParameterFromArray(options: {
    config: AppConfig;
    name: string;
    possibleValues: Array<BaseConfigObject>;
    defaultValue: BaseConfigObject;
}) {
    const validator = (b: BaseConfigObject) => options.possibleValues.includes(b);
    const hint = `The only accepted values are: [${options.possibleValues
        .map(item => JSON.stringify(item))
        .join(', ')}]`;

    validateConfigParameter({
        config: options.config,
        name: options.name,
        validator: validator,
        defaultValue: options.defaultValue,
        hintMessage: hint,
    });
}
