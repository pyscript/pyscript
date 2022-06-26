import { getLastPath } from './utils';
import type { PyodideInterface } from './pyodide';
// eslint-disable-next-line
// @ts-ignore
import pyscript from './pyscript.py';

let pyodideReadyPromise;
let pyodide;

const loadInterpreter = async function (indexUrl: string): Promise<PyodideInterface> {
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
    await pyodide.runPythonAsync(pyscript);

    console.log('done setting up environment');
    return pyodide;
};

const loadPackage = async function (package_name: string[] | string, runtime: PyodideInterface): Promise<void> {
    if (package_name.length > 0){
        const micropip = pyodide.globals.get('micropip');
        await micropip.install(package_name);
        micropip.destroy();
    }
};

const loadFromFile = async function (s: string, runtime: PyodideInterface): Promise<void> {
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
