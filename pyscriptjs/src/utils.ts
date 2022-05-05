function addClasses(element: HTMLElement, classes: Array<string>) {
    for (const entry of classes) {
        element.classList.add(entry);
    }
}

function getLastPath(str: string): string {
    return str.split('\\').pop().split('/').pop();
}

function htmlDecode(input: string): string {
    const doc = new DOMParser().parseFromString(ltrim(input), 'text/html');
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

    if (k != 0) return lines.map(line => line.substring(k)).join('\n');
    else return code;
}

function guidGenerator(): string {
    const S4 = function (): string {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
}

export { addClasses, getLastPath, ltrim, htmlDecode, guidGenerator };
