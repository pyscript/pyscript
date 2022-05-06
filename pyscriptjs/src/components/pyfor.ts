import { addToScriptsQueue, pyodideLoaded } from '../stores';
import { BaseEvalElement } from './base';

let runtime;

pyodideLoaded.subscribe(value => {
    runtime = value;
});


export class PyFor extends BaseEvalElement {
    code: string;

    constructor() {
        super();
    }

    connectedCallback() {
        this.code = this.innerHTML;
        this.innerHTML = '';
        this.validateAttribute();
        addToScriptsQueue(this);
    }

    async evaluate(): Promise<void> {
        const pyodide = runtime;
        const indent_spaces = ' '.repeat(8);
        const expressions = this.getExpressions();
        const expression_string = expressions.map(m =>
            `${indent_spaces}_map["""${m}"""] = ${m}`).join('\n');

        const pyCode = `
import asyncio
async def _main():
    _iter = []
    _items = []
    if asyncio.iscoroutine(${this.getAttribute('iterator')}):
        _iter = await ${this.getAttribute('iterator')}
    else:
        _iter = ${this.getAttribute('iterator')}

    for ${this.getAttribute('variable')} in _iter : 
        _map = {}
${expression_string}
        _items.append(_map)
    return _items
await _main()
`;
        const pydata = await pyodide.runPythonAsync(pyCode);
        const result: Map<string, string>[] = pydata.toJs();
        this.renderItems(result);
    }

    validateAttribute() {
        if (!this.hasAttribute('variable')) {
            throw new Error('"variable" attribute is mandatory');
        }
        if (!this.hasAttribute('iterator')) {
            throw new Error('"iterator" attribute is mandatory');
        }
    }

    getExpressions(): string[] {
        const matches: string[] = [];
        const regExp = new RegExp('({#\\s*\\S+\\s*#})', 'gm');
        let match = regExp.exec(this.code);
        while (match != null) {
            matches.push(match[0].substring(2, match[0].length - 2).trim());
            match = regExp.exec(this.code);
        }
        return matches;
    }

    renderItems(result: Map<string, string>[]) {
        const code = this.code;
        const divs = result.map(m => this.mapItem(code, m));
        divs.map(m => {
            const el = this.getChildElement(m);
            this.appendChild(el);
        });
    }

    getChildElement(html: string) {
        const div = document.createElement('div');
        div.innerHTML = html.trim();
        if (div.childNodes.length == 1 && div.childNodes[0].nodeType !== Node.TEXT_NODE) {
            return <HTMLScriptElement>div.childNodes[0].cloneNode(true);
        }
        return div;
    }

    mapItem(code: string, itemMap: Map<string, string>) {
        let replaced_string = code;
        for (const [key, value] of itemMap.entries()) {
            const escapedKey = this.escapeRegex(key);
            const regex = new RegExp(`({#\\s*${escapedKey}+\\s*#})`, 'gm');

            replaced_string = replaced_string.replace(regex, value);
        }
        return replaced_string;
    }

    escapeRegex(key): string {
        return key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
}