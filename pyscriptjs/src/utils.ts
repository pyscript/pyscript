import { _createAlertBanner } from './exceptions';

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

export function showWarning(msg: string, messageType: 'text' | 'html' = 'text'): void {
    _createAlertBanner(msg, 'warning', messageType);
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
    const res = parts
        .map(function (part) {
            return part.trim().replace(/(^[/]*|[/]*$)/g, '');
        })
        .filter(p => p !== '')
        .join(separator || '/');
    if (parts[0].startsWith('/')) {
        return '/' + res;
    }
    return res;
}

export function createDeprecationWarning(msg: string, elementName: string): void {
    createSingularWarning(msg, elementName);
}

/** Adds a warning banner with content {msg} at the top of the page if
 *  and only if no banner containing the {sentinelText} already exists.
 *  If sentinelText is null, the full text of {msg} is used instead
 *
 * @param msg {string} The full text content of the warning banner to be displayed
 * @param sentinelText {string} [null] The text to match against existing warning banners.
 *                     If null, the full text of 'msg' is used instead.
 */
export function createSingularWarning(msg: string, sentinelText: string | null = null): void {
    const banners = document.getElementsByClassName('alert-banner py-warning');
    let bannerCount = 0;
    for (const banner of banners) {
        if (banner.innerHTML.includes(sentinelText ? sentinelText : msg)) {
            bannerCount++;
        }
    }
    if (bannerCount == 0) {
        _createAlertBanner(msg, 'warning');
    }
}

/**
 * @returns A new asynchronous lock
 * @private
 */
export function createLock() {
    // This is a promise that is resolved when the lock is open, not resolved when lock is held.
    let _lock = Promise.resolve();

    /**
     * Acquire the async lock
     * @returns A zero argument function that releases the lock.
     * @private
     */
    async function acquireLock() {
        const old_lock = _lock;
        let releaseLock: () => void;
        _lock = new Promise(resolve => (releaseLock = resolve));
        await old_lock;
        return releaseLock;
    }
    return acquireLock;
}
