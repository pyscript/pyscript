import { $ } from 'basic-devtools';
import { WSet } from 'not-so-weak';

// weakly retain shadow root nodes in an iterable way
// so that it's possible to query these and find elements by ID
export const shadowRoots: WSet<ShadowRoot> = new WSet();

// returns an element by ID if present within any of the live shadow roots
const findInShadowRoots = (selector: string): Element | null => {
    for (const shadowRoot of shadowRoots) {
        const element = $(selector, shadowRoot);
        if (element) return element;
    }
    return null;
};

// find an element by ID either via document or via any live shadow root
export const deepQuerySelector = (selector: string) => $(selector, document) || findInShadowRoots(selector);
