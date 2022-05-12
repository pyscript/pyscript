import { getLastPath } from './utils';

let pyodideReadyPromise;
let pyodide;

const loadInterpreter = async function (indexUrl: string): Promise<any> {
    console.log('creating pyodide runtime');
    // eslint-disable-next-line
    // @ts-ignore
    pyodide = await loadPyodide({
        // indexURL: indexUrl,
        stdout: console.log,
        stderr: console.log,
        fullStdLib: false,
    });

    // now that we loaded, add additional convenience functions
    console.log('loading micropip');
    await pyodide.loadPackage('micropip');

    console.log('loading pyscript...');

    // let's get the full path of where PyScript is running from so we can load the pyscript.py
    // file from the same location
    const loadedScript: HTMLScriptElement = document.querySelector(`script[src$='pyscript.js']`);
    const scriptPath = loadedScript.src.substr(0, loadedScript.src.lastIndexOf('/'));
    await pyodide.runPythonAsync(await (await fetch(`${scriptPath}/pyscript.py`)).text());

    console.log(scriptPath);

    console.log('done setting up environment');
    return pyodide;
};

const loadPackage = async function (package_name: string[] | string, runtime: any): Promise<any> {
    const micropip = pyodide.globals.get('micropip');
    await micropip.install(package_name);
    micropip.destroy();
};

const loadFromFile = async function (s: string, runtime: any): Promise<any> {
    const filename = getLastPath(s);
    await runtime.runPythonAsync(
        `
            from pyodide.http import pyfetch
            from js import console

            try:
                response = await pyfetch("` +
            s +
            `")
            except Exception as err:
                console.warn("PyScript: Access to local files (using 'Paths:' in py-env) is not available when directly opening a HTML file; you must use a webserver to serve the additional files. See https://github.com/pyscript/pyscript/issues/257#issuecomment-1119595062 on starting a simple webserver with Python.")
                raise(err)
            content = await response.bytes()
            with open("` +
            filename +
            `", "wb") as f:
                f.write(content)
        `,
    );
};

export { loadInterpreter, pyodideReadyPromise, loadPackage, loadFromFile };
