const { isArray } = Array;

const { assign, create, defineProperty } = Object;

const { all, resolve } = new Proxy(Promise, {
    get: ($, name) => $[name].bind($),
});

const absoluteURL = (path, base = location.href) => new URL(path, base).href;

export { isArray, assign, create, defineProperty, all, resolve, absoluteURL };
