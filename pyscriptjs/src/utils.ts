import { _createAlertBanner, UserError } from "./exceptions"

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

export function escape(str: string): string {
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

let _uniqueIdCounter = 0;
export function ensureUniqueId(el: HTMLElement) {
    if (el.id === '') el.id = `py-internal-${_uniqueIdCounter++}`;
}

export function showWarning(msg: string, messageType: "text" | "html" = "text"): void {
    _createAlertBanner(msg, "warning", messageType);
}

export function handleFetchError(e: Error, singleFile: string) {
    //Should we still export full error contents to console?
    // XXX: What happens if I make a typo? i.e. a web server is being used but a file
    // that doesn't exist is being accessed. We should cover this case as well.
    console.warn(`Caught an error in fetchPaths:\r\n ${e.toString()}`);
    let errorContent: string;
    if (e.message.includes('Failed to fetch')) {
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
        errorContent = `<p>PyScript encountered an error while loading from file: ${e.message} </p>`;
    }
    // We need to create the banner because `handleFetchError` is called before we
    // use withUserErrorHandler in main.js we are also disabling the log message
    // because it will be logged by the uncaught exception in promise.
    _createAlertBanner(errorContent, "error", "html", false)
    throw new UserError(errorContent)
}

export function readTextFromPath(path: string) {
    const request = new XMLHttpRequest();
    request.open('GET', path, false);
    request.send();
    const returnValue = request.responseText;

    return returnValue;
}

export function inJest(): boolean {
    return typeof process === 'object' && process.env.JEST_WORKER_ID !== undefined;
}

export function globalExport(name: string, obj: object) {
    // attach the given object to the global object, so that it is globally
    // visible everywhere. Should be used very sparingly!

    globalThis[name] = obj;
}

export function getAttribute(el: Element, attr: string): string | null {
    if (el.hasAttribute(attr)) {
        const value = el.getAttribute(attr);
        if (value) {
            return value;
        }
    }
    return null;
}

export function joinPaths(parts: string[], separator = '/') {
    const res = parts.map(function(part) { return part.trim().replace(/(^[/]*|[/]*$)/g, ''); }).filter(p => p!== "").join(separator || '/');
    if (parts[0].startsWith('/'))
    {
        return '/'+res;
    }
    return res;
}
