// @ts-nocheck
// @ts-ignore
let pyodideReadyPromise;


let loadInterpreter = async function(): any {
    /* @ts-ignore */
    let pyodide = await loadPyodide({ 
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.19.0/full/",
        }); 
    /* @ts-ignore */
    return pyodide;
}

export {loadInterpreter, pyodideReadyPromise}