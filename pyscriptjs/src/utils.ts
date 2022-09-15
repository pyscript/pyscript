import type { AppConfig } from "./runtime";
// eslint-disable-next-line
// @ts-ignore
import defaultConfig from './pyscript.json';

function addClasses(element: HTMLElement, classes: Array<string>) {
    for (const entry of classes) {
        element.classList.add(entry);
    }
}

function removeClasses(element: HTMLElement, classes: Array<string>) {
    for (const entry of classes) {
        element.classList.remove(entry);
    }
}

function getLastPath(str: string): string {
    return str.split('\\').pop().split('/').pop();
}

function escape(str: string): string {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function htmlDecode(input: string): string {
    const doc = new DOMParser().parseFromString(ltrim(escape(input)), 'text/html');
    return doc.documentElement.textContent;
}

function ltrim(code: string): string {
    const lines = code.split('\n');
    if (lines.length == 0) return code;

    const lengths = lines
        .filter(line => line.trim().length != 0)
        .map(line => {
            const [prefix] = line.match(/^\s*/);
            return prefix.length;
        });

    const k = Math.min(...lengths);

    return k != 0 ? lines.map(line => line.substring(k)).join('\n')
                  : code;
}

function guidGenerator(): string {
    const S4 = function (): string {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
}

/*
 *  Display a page-wide error message to show that something has gone wrong with
 *  PyScript or Pyodide during loading. Probably not be used for issues that occur within
 *  Python scripts, since stderr can be routed to somewhere in the DOM
 */
function showError(msg: string): void {
    const warning = document.createElement('div');
    warning.style.backgroundColor = 'LightCoral';
    warning.style.alignContent = 'center';
    warning.style.margin = '4px';
    warning.style.padding = '4px';
    warning.innerHTML = msg;
    document.body.prepend(warning);
}

function handleFetchError(e: Error, singleFile: string) {
    //Should we still export full error contents to console?
    console.warn(`Caught an error in loadPaths:\r\n ${e.toString()}`);
    let errorContent: string;
    if (e.message.includes('TypeError: Failed to fetch')) {
        errorContent = `<p>PyScript: Access to local files
        (using "Paths:" in &lt;py-env&gt;)
        is not available when directly opening a HTML file;
        you must use a webserver to serve the additional files.
        See <a style="text-decoration: underline;" href="https://github.com/pyscript/pyscript/issues/257#issuecomment-1119595062">this reference</a>
        on starting a simple webserver with Python.</p>`;
    } else if (e.message.includes('404')) {
        errorContent =
            `<p>PyScript: Loading from file <u>` +
            singleFile +
            `</u> failed with error 404 (File not Found). Are your filename and path are correct?</p>`;
    } else {
        errorContent = '<p>PyScript encountered an error while loading from file: ' + e.message + '</p>';
    }
    showError(errorContent);
}

function readTextFromPath(path: string) {
    const request = new XMLHttpRequest();
    request.open("GET", path, false);
    request.send();
    const returnValue = request.responseText;

    return returnValue;
}

function inJest(): boolean {
    return typeof process === 'object' && process.env.JEST_WORKER_ID !== undefined;
}

function mergeConfig(inlineConfig: AppConfig, externalConfig: AppConfig): AppConfig {
    if (Object.keys(inlineConfig).length === 0 && Object.keys(externalConfig).length === 0)
    {
        return JSON.parse(defaultConfig);
    }
    else if (Object.keys(inlineConfig).length === 0)
    {
        return externalConfig;
    }
    else if(Object.keys(externalConfig).length === 0)
    {
        return inlineConfig;
    }
    else
    {
        const name = inlineConfig.name || externalConfig.name;
        const description = inlineConfig.description || externalConfig.description;
        const version = inlineConfig.version || externalConfig.version;
        const type = inlineConfig.type || externalConfig.type;
        const author_name = inlineConfig.author_name || externalConfig.author_name;
        const author_email = inlineConfig.author_email || externalConfig.author_email;
        const license = inlineConfig.license || externalConfig.license;
        const autoclose_loader = (typeof inlineConfig.autoclose_loader !== "undefined") ? inlineConfig.autoclose_loader : externalConfig.autoclose_loader;
        const runtimes = inlineConfig.runtimes || externalConfig.runtimes;
        const packages = inlineConfig.packages || externalConfig.packages;
        const paths = inlineConfig.paths || externalConfig.paths;
        const plugins = inlineConfig.plugins || externalConfig.plugins;
        const merged: AppConfig = {
            name,
            description,
            version,
            type,
            author_name,
            author_email,
            license,
            autoclose_loader,
            runtimes,
            packages,
            paths,
            plugins
        };

        return merged;
    }
}

function validateConfig(configText: string) {
    let config: object;
    try {
        config = JSON.parse(configText);
    }
    catch (err) {
        showError(`<p>config supplied: ${configText} is invalid and cannot be parsed: ${err.message}</p>`);
    }

    const finalConfig: AppConfig = {}
    const allKeys = {
        "string": ["name", "description", "version", "type", "author_name", "author_email", "license"],
        "boolean": ["autoclose_loader"],
        "array": ["runtimes", "packages", "paths", "plugins"]
    };

    for (const keyType in allKeys)
    {
        const keys = allKeys[keyType];
        keys.forEach(function(item: string){
            if (validateParamInConfig(item, keyType, config))
            {
                if (item === "runtimes")
                {
                    finalConfig[item] = [];
                    const runtimes = config[item];
                    runtimes.forEach(function(eachRuntime: object){
                        const runtimeConfig: object = {};
                        for (const eachRuntimeParam in eachRuntime)
                        {
                            if (validateParamInConfig(eachRuntimeParam, "string", eachRuntime))
                            {
                                runtimeConfig[eachRuntimeParam] = eachRuntime[eachRuntimeParam];
                            }
                        }
                        finalConfig[item].push(runtimeConfig);
                    });
                }
                else
                {
                    finalConfig[item] = config[item];
                }
            }
        });
    }

    return finalConfig;
}

function validateParamInConfig(paramName: string, paramType: string, config: object): boolean {
    if (paramName in config)
    {
        return paramType === "array" ? Array.isArray(config[paramName]) : typeof config[paramName] === paramType;
    }
    return false;
}

export { addClasses, removeClasses, getLastPath, ltrim, htmlDecode, guidGenerator, showError, handleFetchError, readTextFromPath, inJest, mergeConfig, validateConfig };
