export function addClasses(element: HTMLElement, classes: string[]) {
    for (const entry of classes) {
        element.classList.add(entry);
    }
}

export function removeClasses(element: HTMLElement, classes: string[]) {
    for (const entry of classes) {
        element.classList.remove(entry);
    }
}

export function getLastPath(str: string): string {
    return str.split('\\').pop().split('/').pop();
}

export function escape(str: string): string {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export function htmlDecode(input: string): string | null {
    const doc = new DOMParser().parseFromString(ltrim(escape(input)), 'text/html');
    return doc.documentElement.textContent;
}

export function ltrim(code: string): string {
    const lines = code.split('\n');
    if (lines.length == 0) return code;

    const lengths = lines
        .filter(line => line.trim().length != 0)
        .map(line => {
            return line.match(/^\s*/)?.pop()?.length;
        });

    const k = Math.min(...lengths);

    return k != 0 ? lines.map(line => line.substring(k)).join('\n') : code;
}

export function guidGenerator(): string {
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
export function showError(msg: string): void {
    const warning = document.createElement('div');
    // XXX: the style should go to css instead of here probably
    warning.className = "py-error";
    warning.style.backgroundColor = 'LightCoral';
    warning.style.alignContent = 'center';
    warning.style.margin = '4px';
    warning.style.padding = '4px';
    warning.innerHTML = msg;
    document.body.prepend(warning);
}

export function handleFetchError(e: Error, singleFile: string) {
    //Should we still export full error contents to console?
    console.warn(`Caught an error in loadPaths:\r\n ${e.toString()}`);
    let errorContent: string;
    if (e.message.includes('TypeError: Failed to fetch')) {
        errorContent = `<p>PyScript: Access to local files
        (using "Paths:" in &lt;py-config&gt;)
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

export function readTextFromPath(path: string) {
    const request = new XMLHttpRequest();
    request.open("GET", path, false);
    request.send();
    const returnValue = request.responseText;

    return returnValue;
}

export function inJest(): boolean {
    return typeof process === 'object' && process.env.JEST_WORKER_ID !== undefined;
}

export function globalExport(name: string, obj: any) {
    // attach the given object to the global object, so that it is globally
    // visible everywhere. Should be used very sparingly!

    // `window` in the browser, `global` in node
    const _global = (window || global);
    _global[name] = obj;
}

export function getAttribute(el:Element, attr:string ):string | null {
    if( el.hasAttribute( attr ) ){
        const value = el.getAttribute(attr);
        if( value ){
            return value;
        }
    }
    return null;
}
