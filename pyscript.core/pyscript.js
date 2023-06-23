Promise.withResolvers || (Promise.withResolvers = function withResolvers() {
  var a, b, c = new this(function (resolve, reject) {
    a = resolve;
    b = reject;
  });
  return {resolve: a, reject: b, promise: c};
});

/**
 * Given a CSS selector, returns the first matching node, if any.
 * @param {string} css the CSS selector to query
 * @param {Document | DocumentFragment | Element} [root] the optional parent node to query
 * @returns {Element?} the found element, if any
 */
const $ = (css, root = document) => root.querySelector(css);

/**
 * Given a CSS selector, returns a list of all matching nodes.
 * @param {string} css the CSS selector to query
 * @param {Document | DocumentFragment | Element} [root] the optional parent node to query
 * @returns {Element[]} a list of found nodes
 */
const $$ = (css, root = document) => [...root.querySelectorAll(css)];

/**
 * Given a XPath selector, returns a list of all matching nodes.
 * @param {string} path the XPath selector to evaluate
 * @param {Document | DocumentFragment | Element} [root] the optional parent node to query
 * @returns {Node[]} a list of found nodes (elements, attributes, text, comments)
 */
const $x = (path, root = document) => {
  const expression = (new XPathEvaluator).createExpression(path);
  const xpath = expression.evaluate(root, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
  const result = [];
  for (let i = 0, {snapshotLength} = xpath; i < snapshotLength; i++)
    result.push(xpath.snapshotItem(i));
  return result;
};

const VOID       = -1;
const PRIMITIVE  = 0;
const ARRAY      = 1;
const OBJECT$1     = 2;
const DATE       = 3;
const REGEXP     = 4;
const MAP        = 5;
const SET$1        = 6;
const ERROR      = 7;
const BIGINT$1     = 8;
// export const SYMBOL = 9;

const env = typeof self === 'object' ? self : globalThis;

const deserializer = ($, _) => {
  const as = (out, index) => {
    $.set(index, out);
    return out;
  };

  const unpair = index => {
    if ($.has(index))
      return $.get(index);

    const [type, value] = _[index];
    switch (type) {
      case PRIMITIVE:
      case VOID:
        return as(value, index);
      case ARRAY: {
        const arr = as([], index);
        for (const index of value)
          arr.push(unpair(index));
        return arr;
      }
      case OBJECT$1: {
        const object = as({}, index);
        for (const [key, index] of value)
          object[unpair(key)] = unpair(index);
        return object;
      }
      case DATE:
        return as(new Date(value), index);
      case REGEXP: {
        const {source, flags} = value;
        return as(new RegExp(source, flags), index);
      }
      case MAP: {
        const map = as(new Map, index);
        for (const [key, index] of value)
          map.set(unpair(key), unpair(index));
        return map;
      }
      case SET$1: {
        const set = as(new Set, index);
        for (const index of value)
          set.add(unpair(index));
        return set;
      }
      case ERROR: {
        const {name, message} = value;
        return as(new env[name](message), index);
      }
      case BIGINT$1:
        return as(BigInt(value), index);
      case 'BigInt':
        return as(Object(BigInt(value)), index);
    }
    return as(new env[type](value), index);
  };

  return unpair;
};

/**
 * @typedef {Array<string,any>} Record a type representation
 */

/**
 * Returns a deserialized value from a serialized array of Records.
 * @param {Record[]} serialized a previously serialized value.
 * @returns {any}
 */
const deserialize = serialized => deserializer(new Map, serialized)(0);

const EMPTY = '';

const {toString} = {};
const {keys} = Object;

const typeOf = value => {
  const type = typeof value;
  if (type !== 'object' || !value)
    return [PRIMITIVE, type];

  const asString = toString.call(value).slice(8, -1);
  switch (asString) {
    case 'Array':
      return [ARRAY, EMPTY];
    case 'Object':
      return [OBJECT$1, EMPTY];
    case 'Date':
      return [DATE, EMPTY];
    case 'RegExp':
      return [REGEXP, EMPTY];
    case 'Map':
      return [MAP, EMPTY];
    case 'Set':
      return [SET$1, EMPTY];
  }

  if (asString.includes('Array'))
    return [ARRAY, asString];

  if (asString.includes('Error'))
    return [ERROR, asString];

  return [OBJECT$1, asString];
};

const shouldSkip = ([TYPE, type]) => (
  TYPE === PRIMITIVE &&
  (type === 'function' || type === 'symbol')
);

const serializer = (strict, json, $, _) => {

  const as = (out, value) => {
    const index = _.push(out) - 1;
    $.set(value, index);
    return index;
  };

  const pair = value => {
    if ($.has(value))
      return $.get(value);

    let [TYPE, type] = typeOf(value);
    switch (TYPE) {
      case PRIMITIVE: {
        let entry = value;
        switch (type) {
          case 'bigint':
            TYPE = BIGINT$1;
            entry = value.toString();
            break;
          case 'function':
          case 'symbol':
            if (strict)
              throw new TypeError('unable to serialize ' + type);
            entry = null;
            break;
          case 'undefined':
            return as([VOID], value);
        }
        return as([TYPE, entry], value);
      }
      case ARRAY: {
        if (type)
          return as([type, [...value]], value);

        const arr = [];
        const index = as([TYPE, arr], value);
        for (const entry of value)
          arr.push(pair(entry));
        return index;
      }
      case OBJECT$1: {
        if (type) {
          switch (type) {
            case 'BigInt':
              return as([type, value.toString()], value);
            case 'Boolean':
            case 'Number':
            case 'String':
              return as([type, value.valueOf()], value);
          }
        }

        if (json && ('toJSON' in value))
          return pair(value.toJSON());

        const entries = [];
        const index = as([TYPE, entries], value);
        for (const key of keys(value)) {
          if (strict || !shouldSkip(typeOf(value[key])))
            entries.push([pair(key), pair(value[key])]);
        }
        return index;
      }
      case DATE:
        return as([TYPE, value.toISOString()], value);
      case REGEXP: {
        const {source, flags} = value;
        return as([TYPE, {source, flags}], value);
      }
      case MAP: {
        const entries = [];
        const index = as([TYPE, entries], value);
        for (const [key, entry] of value) {
          if (strict || !(shouldSkip(typeOf(key)) || shouldSkip(typeOf(entry))))
            entries.push([pair(key), pair(entry)]);
        }
        return index;
      }
      case SET$1: {
        const entries = [];
        const index = as([TYPE, entries], value);
        for (const entry of value) {
          if (strict || !shouldSkip(typeOf(entry)))
            entries.push(pair(entry));
        }
        return index;
      }
    }

    const {message} = value;
    return as([TYPE, {name: type, message}], value);
  };

  return pair;
};

/**
 * @typedef {Array<string,any>} Record a type representation
 */

/**
 * Returns an array of serialized Records.
 * @param {any} value a serializable value.
 * @param {{json?: boolean, lossy?: boolean}?} options an object with a `lossy` or `json` property that,
 *  if `true`, will not throw errors on incompatible types, and behave more
 *  like JSON stringify would behave. Symbol and Function will be discarded.
 * @returns {Record[]}
 */
 const serialize = (value, {json, lossy} = {}) => {
  const _ = [];
  return serializer(!(json || lossy), !!json, new Map, _)(value), _;
};

/*! (c) Andrea Giammarchi - ISC */


const {parse: $parse, stringify: $stringify} = JSON;
const options = {json: true, lossy: true};

/**
 * Revive a previously stringified structured clone.
 * @param {string} str previously stringified data as string.
 * @returns {any} whatever was previously stringified as clone.
 */
const parse$1 = str => deserialize($parse(str));

/**
 * Represent a structured clone value as string.
 * @param {any} any some clone-able value to stringify.
 * @returns {string} the value stringified.
 */
const stringify = any => $stringify(serialize(any, options));

var JSON$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  parse: parse$1,
  stringify: stringify
});

var CHANNEL = 'dba0d233-ff77-488c-8f92-ef0e9cb3e008';

var waitAsyncFallback = buffer => ({
  value: new Promise(onmessage => {
    let w = new Worker('data:application/javascript,' + encodeURIComponent(
      'onmessage=({data:b})=>(Atomics.wait(b,0),postMessage(0))'
    ));
    w.onmessage = onmessage;
    w.postMessage(buffer);
  })
});

/*! (c) Andrea Giammarchi - ISC */


// just minifier friendly for Blob Workers' cases
const {Int32Array, Map: Map$1, SharedArrayBuffer, Uint16Array} = globalThis;

// common constants / utilities for repeated operations
const {BYTES_PER_ELEMENT: I32_BYTES} = Int32Array;
const {BYTES_PER_ELEMENT: UI16_BYTES} = Uint16Array;

const {isArray: isArray$1} = Array;
const {notify, wait, waitAsync} = Atomics;
const {fromCharCode} = String;

// automatically uses sync wait (worker -> main)
// or fallback to async wait (main -> worker)
const waitFor = (isAsync, sb) => isAsync ?
                  (waitAsync || waitAsyncFallback)(sb, 0) :
                  (wait(sb, 0), {value: {then: fn => fn()}});

// retain buffers to transfer
const buffers = new WeakSet;

// retain either main threads or workers global context
const context = new WeakMap;

// used to generate a unique `id` per each worker `postMessage` "transaction"
let uid = 0;

/**
 * Create once a `Proxy` able to orchestrate synchronous `postMessage` out of the box.
 * @param {globalThis | Worker} self the context in which code should run
 * @param {{parse: (serialized: string) => any, stringify: (serializable: any) => string}} [JSON] an optional `JSON` like interface to `parse` or `stringify` content
 * @returns {ProxyHandler<globalThis> | ProxyHandler<Worker>}
 */
const coincident$1 = (self, {parse, stringify} = JSON) => {
  // create a Proxy once for the given context (globalThis or Worker instance)
  if (!context.has(self)) {
    // ensure the CHANNEL and data are posted correctly
    const post = (transfer, ...args) => self.postMessage({[CHANNEL]: args}, {transfer});

    context.set(self, new Proxy(new Map$1, {
      // worker related: get any utility that should be available on the main thread
      get: (_, action) => action === 'then' ? null : ((...args) => {
        // transaction id
        const id = uid++;

        // first contact: just ask for how big the buffer should be
        let sb = new Int32Array(new SharedArrayBuffer(I32_BYTES));

        // if a transfer list has been passed, drop it from args
        let transfer = [];
        if (buffers.has(args.at(-1) || transfer))
          buffers.delete(transfer = args.pop());

        // ask for invoke with arguments and wait for it
        post(transfer, id, sb, action, args);

        // helps deciding how to wait for results
        const isAsync = self instanceof Worker;
        return waitFor(isAsync, sb).value.then(() => {
          // commit transaction using the returned / needed buffer length
          const length = sb[0];

          // filter undefined results
          if (!length) return;

          // calculate the needed ui16 bytes length to store the result string
          const bytes = UI16_BYTES * length;

          // round up to the next amount of bytes divided by 4 to allow i32 operations
          sb = new Int32Array(new SharedArrayBuffer(bytes + (bytes % I32_BYTES)));

          // ask for results and wait for it
          post([], id, sb);
          return waitFor(isAsync, sb).value.then(
            // transform the shared buffer into a string and return it parsed
            () => parse(fromCharCode(...new Uint16Array(sb.buffer).slice(0, length)))
          );
        });
      }),

      // main thread related: react to any utility a worker is asking for
      set(actions, action, callback) {
        // lazy event listener and logic handling, triggered once by setters actions
        if (!actions.size) {
          // maps results by `id` as they are asked for
          const results = new Map$1;
          // add the event listener once (first defined setter, all others work the same)
          self.addEventListener('message', async (event) => {
            // grub the very same library CHANNEL; ignore otherwise
            const details = event.data?.[CHANNEL];
            if (isArray$1(details)) {
              // if early enough, avoid leaking data to other listeners
              event.stopImmediatePropagation();
              const [id, sb, ...rest] = details;
              // action available: it must be defined/known on the main thread
              if (rest.length) {
                const [action, args] = rest;
                if (actions.has(action)) {
                  // await for result either sync or async and serialize it
                  const result = stringify(await actions.get(action)(...args));
                  if (result) {
                    // store the result for "the very next" event listener call
                    results.set(id, result);
                    // communicate the required SharedArrayBuffer length out of the
                    // resulting serialized string
                    sb[0] = result.length;
                  }
                }
                // unknown action should be notified as missing on the main thread
                else {
                  throw new Error(`Unsupported action: ${action}`);
                }
              }
              // no action means: get results out of the well known `id`
              else {
                const result = results.get(id);
                results.delete(id);
                // populate the SaredArrayBuffer with utf-16 chars code
                for (let ui16a = new Uint16Array(sb.buffer), i = 0; i < result.length; i++)
                  ui16a[i] = result.charCodeAt(i);
              }
              // release te worker waiting either the length or the result
              notify(sb, 0);
            }
          });
        }
        // store this action callback allowing the setter in the process
        return !!actions.set(action, callback);
      }
    }));
  }
  return context.get(self);
};

coincident$1.transfer = (...args) => (buffers.add(args), args);

const OBJECT    = 'object';
const FUNCTION  = 'function';
const BOOLEAN   = 'boolean';
const NUMBER    = 'number';
const STRING    = 'string';
const UNDEFINED = 'undefined';
const BIGINT    = 'bigint';
const SYMBOL    = 'symbol';
const NULL      = 'null';

const {
  defineProperty: defineProperty$1,
  getOwnPropertyDescriptor,
  getPrototypeOf,
  isExtensible,
  ownKeys,
  preventExtensions,
  set,
  setPrototypeOf
} = Reflect;

const augment = (descriptor, how) => {
  const {get, set, value} = descriptor;
  if (get) descriptor.get = how(get);
  if (set) descriptor.set = how(set);
  if (value) descriptor.value = how(value);
  return descriptor;
};

const entry = (type, value) => [type, value];

const asEntry = transform => value => {
  const type = typeof value;
  switch (type) {
    case OBJECT:
    if (value == null)
      return entry(NULL, value);
    case FUNCTION:
      return transform(type, value);
    case BOOLEAN:
    case NUMBER:
    case STRING:
    case UNDEFINED:
    case BIGINT:
      return entry(type, value);
    case SYMBOL: {
      if (symbols.has(value))
        return entry(type, symbols.get(value));
    }
  }
  throw new Error(`Unable to handle this ${type} type`);
};

const symbols = new Map(
  ownKeys(Symbol)
    .filter(s => typeof Symbol[s] === SYMBOL)
    .map(s => [Symbol[s], s])
);

const symbol = value => {
  for (const [symbol, name] of symbols) {
    if (name === value)
      return symbol;
  }
};

const APPLY                        = 'apply';
const CONSTRUCT                    = 'construct';
const DEFINE_PROPERTY              = 'defineProperty';
const DELETE_PROPERTY              = 'deleteProperty';
const GET                          = 'get';
const GET_OWN_PROPERTY_DESCRIPTOR  = 'getOwnPropertyDescriptor';
const GET_PROTOTYPE_OF             = 'getPrototypeOf';
const HAS                          = 'has';
const IS_EXTENSIBLE                = 'isExtensible';
const OWN_KEYS                     = 'ownKeys';
const PREVENT_EXTENSION            = 'preventExtensions';
const SET                          = 'set';
const SET_PROTOTYPE_OF             = 'setPrototypeOf';
const DELETE                       = 'delete';

let id$1 = 0;
const ids$1 = new Map;
const values$1 = new Map;
const eventsHandler = new WeakMap;

// patch once main UI tread
if (globalThis.window === globalThis) {
  const {addEventListener} = EventTarget.prototype;
  // this should never be on the way as it's extremely light and fast
  // but it's necessary to allow "preventDefault" or other event invokes at distance
  defineProperty$1(EventTarget.prototype, 'addEventListener', {
    value(type, listener, ...options) {
      if (options.at(0)?.invoke) {
        if (!eventsHandler.has(this))
          eventsHandler.set(this, new Map);
        eventsHandler.get(this).set(type, [].concat(options[0].invoke));
        delete options[0].invoke;
      }
      return addEventListener.call(this, type, listener, ...options);
    }
  });
}

const handleEvent = event => {
  const {currentTarget, target, type} = event;
  for (const method of eventsHandler.get(currentTarget || target)?.get(type) || [])
    event[method]();
};

const result = asEntry((type, value) => {
  if (!ids$1.has(value)) {
    let sid;
    // a bit apocalyptic scenario but if this main runs forever
    // and the id does a whole int32 roundtrip we might have still
    // some reference danglign around
    while (values$1.has(sid = id$1++));
    ids$1.set(value, sid);
    values$1.set(sid, value);
  }
  return entry(type, ids$1.get(value));
});

var main = (thread, MAIN, THREAD) => {
  const {[THREAD]: __thread__} = thread;

  const registry = new FinalizationRegistry(id => {
    __thread__(DELETE, entry(STRING, id));
  });

  const target = ([type, value]) => {
    switch (type) {
      case OBJECT:
        return value == null ? globalThis : (
          typeof value === NUMBER ? values$1.get(value) : value
        );
      case FUNCTION:
        if (typeof value === STRING) {
          if (!values$1.has(value)) {
            const cb = function (...args) {
              if (args.at(0) instanceof Event) handleEvent(...args);
              return __thread__(
                APPLY,
                entry(FUNCTION, value),
                result(this),
                args.map(result)
              );
            };
            const ref = new WeakRef(cb);
            values$1.set(value, ref);
            registry.register(cb, value, ref);
          }
          return values$1.get(value).deref();
        }
        return values$1.get(value);
      case SYMBOL:
        return symbol(value);
    }
    return value;
  };

  const trapsHandler = {
    [APPLY]: (target, thisArg, args) => result(target.apply(thisArg, args)),
    [CONSTRUCT]: (target, args) => result(new target(...args)),
    [DEFINE_PROPERTY]: (target, name, descriptor) => result(defineProperty$1(target, name, descriptor)),
    [DELETE_PROPERTY]: (target, name) => result(delete target[name]),
    [GET_PROTOTYPE_OF]: target => result(getPrototypeOf(target)),
    [GET]: (target, name) => result(target[name]),
    [GET_OWN_PROPERTY_DESCRIPTOR]: (target, name) => {
      const descriptor = getOwnPropertyDescriptor(target, name);
      return descriptor ? entry(OBJECT, augment(descriptor, result)) : entry(UNDEFINED, descriptor);
    },
    [HAS]: (target, name) => result(name in target),
    [IS_EXTENSIBLE]: target => result(isExtensible(target)),
    [OWN_KEYS]: target => entry(OBJECT, ownKeys(target).map(result)),
    [PREVENT_EXTENSION]: target => result(preventExtensions(target)),
    [SET]: (target, name, value) => result(set(target, name, value)),
    [SET_PROTOTYPE_OF]: (target, proto) => result(setPrototypeOf(target, proto)),
    [DELETE](id) {
      ids$1.delete(values$1.get(id));
      values$1.delete(id);
    }
  };

  thread[MAIN] = (trap, entry, ...args) => {
    switch (trap) {
      case APPLY:
        args[0] = target(args[0]);
        args[1] = args[1].map(target);
        break;
      case CONSTRUCT:
        args[0] = args[0].map(target);
        break;
      case DEFINE_PROPERTY: {
        const [name, descriptor] = args;
        args[0] = target(name);
        const {get, set, value} = descriptor;
        if (get) descriptor.get = target(get);
        if (set) descriptor.set = target(set);
        if (value) descriptor.value = target(value);
        break;
      }
      default:
        args = args.map(target);
        break;
    }

    return trapsHandler[trap](target(entry), ...args);
  };

  return {
    proxy: thread,
    window: globalThis,
    isWindowProxy: () => false
  };
};

const bound = target => typeof target === FUNCTION ? target() : target;

const argument = asEntry(
  (type, value) => {
    if (__proxied__ in value)
      return bound(value[__proxied__]);
    if (type === FUNCTION) {
      if (!values.has(value)) {
        let sid;
        // a bit apocalyptic scenario but if this thread runs forever
        // and the id does a whole int32 roundtrip we might have still
        // some reference danglign around
        while (values.has(sid = String(id++)));
        ids.set(value, sid);
        values.set(sid, value);
      }
      return entry(type, ids.get(value));
    }
    return entry(type, value);
  }
);

const __proxied__ = Symbol();

let id = 0;
const ids = new Map;
const values = new Map;

var thread = (main, MAIN, THREAD) => {
  const {[MAIN]: __main__} = main;

  const proxies = new Map;

  const registry = new FinalizationRegistry(id => {
    proxies.delete(id);
    __main__(DELETE, argument(id));
  });

  const register = (entry) => {
    const [type, value] = entry;
    if (!proxies.has(value)) {
      const target = type === FUNCTION ? Bound.bind(entry) : entry;
      const proxy = new Proxy(target, proxyHandler);
      const ref = new WeakRef(proxy);
      proxies.set(value, ref);
      registry.register(proxy, value, ref);
    }
    return proxies.get(value).deref();
  };

  const fromEntry = entry => {
    const [type, value] = entry;
    switch (type) {
      case OBJECT:
        return typeof value === NUMBER ? register(entry) : value;
      case FUNCTION:
        return typeof value === STRING ? values.get(value) : register(entry);
      case SYMBOL:
        return symbol(value);
    }
    return value;
  };

  const result = (TRAP, target, ...args) => fromEntry(__main__(TRAP, bound(target), ...args));

  const proxyHandler = {
    [APPLY]: (target, thisArg, args) => result(APPLY, target, argument(thisArg), args.map(argument)),
    [CONSTRUCT]: (target, args) => result(CONSTRUCT, target, args.map(argument)),
    [DEFINE_PROPERTY]: (target, name, descriptor) => {
      const {get, set, value} = descriptor;
      if (typeof get === FUNCTION) descriptor.get = argument(get);
      if (typeof set === FUNCTION) descriptor.set = argument(set);
      if (typeof value === FUNCTION) descriptor.value = argument(value);
      return result(DEFINE_PROPERTY, target, argument(name), descriptor);
    },
    [DELETE_PROPERTY]: (target, name) => result(DELETE_PROPERTY, target, argument(name)),
    [GET_PROTOTYPE_OF]: target => result(GET_PROTOTYPE_OF, target),
    [GET]: (target, name) => name === __proxied__ ? target : result(GET, target, argument(name)),
    [GET_OWN_PROPERTY_DESCRIPTOR]: (target, name) => {
      const descriptor = result(GET_OWN_PROPERTY_DESCRIPTOR, target, argument(name));
      return descriptor && augment(descriptor, fromEntry);
    },
    [HAS]: (target, name) => name === __proxied__ || result(HAS, target, argument(name)),
    [IS_EXTENSIBLE]: target => result(IS_EXTENSIBLE, target),
    [OWN_KEYS]: target => result(OWN_KEYS, target).map(fromEntry),
    [PREVENT_EXTENSION]: target => result(PREVENT_EXTENSION, target),
    [SET]: (target, name, value) => result(SET, target, argument(name), argument(value)),
    [SET_PROTOTYPE_OF]: (target, proto) => result(SET_PROTOTYPE_OF, target, argument(proto)),
  };

  main[THREAD] = (trap, entry, ctx, args) => {
    switch (trap) {
      case APPLY:
        return fromEntry(entry).apply(fromEntry(ctx), args.map(fromEntry));
      case DELETE: {
        const id = fromEntry(entry);
        ids.delete(values.get(id));
        values.delete(id);
      }
    }
  };

  return {
    proxy: main,
    window: new Proxy([OBJECT, null], proxyHandler),
    isWindowProxy: value => typeof value === OBJECT && !!value && __proxied__ in value,
    // TODO: remove this stuff ASAP
    get global() {
      console.warn('Deprecated: please access `window` field instead');
      return this.window;
    },
    get isGlobal() {
      return function (value) {
        console.warn('Deprecated: please access `isWindowProxy` field instead');
        return this.isWindowProxy(value);
      }.bind(this);
    }
  };
};

function Bound() {
  return this;
}

const MAIN = CHANNEL + 'M';
const THREAD = CHANNEL + 'T';

const proxies = new WeakMap;

/**
 * @typedef {object} Coincident
 * @property {ProxyHandler<globalThis>} proxy
 * @property {ProxyHandler<Window>} window
 * @property {(value: any) => boolean} isWindowProxy
 */

/**
 * Create once a `Proxy` able to orchestrate synchronous `postMessage` out of the box.
 * In workers, returns a `{proxy, window, isWindowProxy}` namespace to reach main globals synchronously.
 * @param {Worker | globalThis} self the context in which code should run
 * @returns {ProxyHandler<Worker> | Coincident}
 */
const coincident = (self, ...args) => {
  const proxy = coincident$1(self, ...args);
  if (!proxies.has(proxy)) {
    const util = self instanceof Worker ? main : thread;
    proxies.set(proxy, util(proxy, MAIN, THREAD));
  }
  return proxies.get(proxy);
};

coincident.transfer = coincident$1.transfer;

/* c8 ignore next */
var xworker$1 = () => new Worker(URL.createObjectURL(new Blob(["const VOID       = -1;\nconst PRIMITIVE  = 0;\nconst ARRAY      = 1;\nconst OBJECT$1     = 2;\nconst DATE       = 3;\nconst REGEXP     = 4;\nconst MAP        = 5;\nconst SET$1        = 6;\nconst ERROR      = 7;\nconst BIGINT$1     = 8;\n// export const SYMBOL = 9;\n\nconst env = typeof self === 'object' ? self : globalThis;\n\nconst deserializer = ($, _) => {\n  const as = (out, index) => {\n    $.set(index, out);\n    return out;\n  };\n\n  const unpair = index => {\n    if ($.has(index))\n      return $.get(index);\n\n    const [type, value] = _[index];\n    switch (type) {\n      case PRIMITIVE:\n      case VOID:\n        return as(value, index);\n      case ARRAY: {\n        const arr = as([], index);\n        for (const index of value)\n          arr.push(unpair(index));\n        return arr;\n      }\n      case OBJECT$1: {\n        const object = as({}, index);\n        for (const [key, index] of value)\n          object[unpair(key)] = unpair(index);\n        return object;\n      }\n      case DATE:\n        return as(new Date(value), index);\n      case REGEXP: {\n        const {source, flags} = value;\n        return as(new RegExp(source, flags), index);\n      }\n      case MAP: {\n        const map = as(new Map, index);\n        for (const [key, index] of value)\n          map.set(unpair(key), unpair(index));\n        return map;\n      }\n      case SET$1: {\n        const set = as(new Set, index);\n        for (const index of value)\n          set.add(unpair(index));\n        return set;\n      }\n      case ERROR: {\n        const {name, message} = value;\n        return as(new env[name](message), index);\n      }\n      case BIGINT$1:\n        return as(BigInt(value), index);\n      case 'BigInt':\n        return as(Object(BigInt(value)), index);\n    }\n    return as(new env[type](value), index);\n  };\n\n  return unpair;\n};\n\n/**\n * @typedef {Array<string,any>} Record a type representation\n */\n\n/**\n * Returns a deserialized value from a serialized array of Records.\n * @param {Record[]} serialized a previously serialized value.\n * @returns {any}\n */\nconst deserialize = serialized => deserializer(new Map, serialized)(0);\n\nconst EMPTY = '';\n\nconst {toString} = {};\nconst {keys} = Object;\n\nconst typeOf = value => {\n  const type = typeof value;\n  if (type !== 'object' || !value)\n    return [PRIMITIVE, type];\n\n  const asString = toString.call(value).slice(8, -1);\n  switch (asString) {\n    case 'Array':\n      return [ARRAY, EMPTY];\n    case 'Object':\n      return [OBJECT$1, EMPTY];\n    case 'Date':\n      return [DATE, EMPTY];\n    case 'RegExp':\n      return [REGEXP, EMPTY];\n    case 'Map':\n      return [MAP, EMPTY];\n    case 'Set':\n      return [SET$1, EMPTY];\n  }\n\n  if (asString.includes('Array'))\n    return [ARRAY, asString];\n\n  if (asString.includes('Error'))\n    return [ERROR, asString];\n\n  return [OBJECT$1, asString];\n};\n\nconst shouldSkip = ([TYPE, type]) => (\n  TYPE === PRIMITIVE &&\n  (type === 'function' || type === 'symbol')\n);\n\nconst serializer = (strict, json, $, _) => {\n\n  const as = (out, value) => {\n    const index = _.push(out) - 1;\n    $.set(value, index);\n    return index;\n  };\n\n  const pair = value => {\n    if ($.has(value))\n      return $.get(value);\n\n    let [TYPE, type] = typeOf(value);\n    switch (TYPE) {\n      case PRIMITIVE: {\n        let entry = value;\n        switch (type) {\n          case 'bigint':\n            TYPE = BIGINT$1;\n            entry = value.toString();\n            break;\n          case 'function':\n          case 'symbol':\n            if (strict)\n              throw new TypeError('unable to serialize ' + type);\n            entry = null;\n            break;\n          case 'undefined':\n            return as([VOID], value);\n        }\n        return as([TYPE, entry], value);\n      }\n      case ARRAY: {\n        if (type)\n          return as([type, [...value]], value);\n  \n        const arr = [];\n        const index = as([TYPE, arr], value);\n        for (const entry of value)\n          arr.push(pair(entry));\n        return index;\n      }\n      case OBJECT$1: {\n        if (type) {\n          switch (type) {\n            case 'BigInt':\n              return as([type, value.toString()], value);\n            case 'Boolean':\n            case 'Number':\n            case 'String':\n              return as([type, value.valueOf()], value);\n          }\n        }\n\n        if (json && ('toJSON' in value))\n          return pair(value.toJSON());\n\n        const entries = [];\n        const index = as([TYPE, entries], value);\n        for (const key of keys(value)) {\n          if (strict || !shouldSkip(typeOf(value[key])))\n            entries.push([pair(key), pair(value[key])]);\n        }\n        return index;\n      }\n      case DATE:\n        return as([TYPE, value.toISOString()], value);\n      case REGEXP: {\n        const {source, flags} = value;\n        return as([TYPE, {source, flags}], value);\n      }\n      case MAP: {\n        const entries = [];\n        const index = as([TYPE, entries], value);\n        for (const [key, entry] of value) {\n          if (strict || !(shouldSkip(typeOf(key)) || shouldSkip(typeOf(entry))))\n            entries.push([pair(key), pair(entry)]);\n        }\n        return index;\n      }\n      case SET$1: {\n        const entries = [];\n        const index = as([TYPE, entries], value);\n        for (const entry of value) {\n          if (strict || !shouldSkip(typeOf(entry)))\n            entries.push(pair(entry));\n        }\n        return index;\n      }\n    }\n\n    const {message} = value;\n    return as([TYPE, {name: type, message}], value);\n  };\n\n  return pair;\n};\n\n/**\n * @typedef {Array<string,any>} Record a type representation\n */\n\n/**\n * Returns an array of serialized Records.\n * @param {any} value a serializable value.\n * @param {{json?: boolean, lossy?: boolean}?} options an object with a `lossy` or `json` property that,\n *  if `true`, will not throw errors on incompatible types, and behave more\n *  like JSON stringify would behave. Symbol and Function will be discarded.\n * @returns {Record[]}\n */\n const serialize = (value, {json, lossy} = {}) => {\n  const _ = [];\n  return serializer(!(json || lossy), !!json, new Map, _)(value), _;\n};\n\n/*! (c) Andrea Giammarchi - ISC */\n\n\nconst {parse: $parse, stringify: $stringify} = JSON;\nconst options = {json: true, lossy: true};\n\n/**\n * Revive a previously stringified structured clone.\n * @param {string} str previously stringified data as string.\n * @returns {any} whatever was previously stringified as clone.\n */\nconst parse$1 = str => deserialize($parse(str));\n\n/**\n * Represent a structured clone value as string.\n * @param {any} any some clone-able value to stringify.\n * @returns {string} the value stringified.\n */\nconst stringify = any => $stringify(serialize(any, options));\n\nvar JSON$1 = /*#__PURE__*/Object.freeze({\n  __proto__: null,\n  parse: parse$1,\n  stringify: stringify\n});\n\nvar CHANNEL = 'dba0d233-ff77-488c-8f92-ef0e9cb3e008';\n\nvar waitAsyncFallback = buffer => ({\n  value: new Promise(onmessage => {\n    let w = new Worker('data:application/javascript,' + encodeURIComponent(\n      'onmessage=({data:b})=>(Atomics.wait(b,0),postMessage(0))'\n    ));\n    w.onmessage = onmessage;\n    w.postMessage(buffer);\n  })\n});\n\n/*! (c) Andrea Giammarchi - ISC */\n\n\n// just minifier friendly for Blob Workers' cases\nconst {Int32Array, Map: Map$1, SharedArrayBuffer: SharedArrayBuffer$1, Uint16Array} = globalThis;\n\n// common constants / utilities for repeated operations\nconst {BYTES_PER_ELEMENT: I32_BYTES} = Int32Array;\nconst {BYTES_PER_ELEMENT: UI16_BYTES} = Uint16Array;\n\nconst {isArray: isArray$1} = Array;\nconst {notify, wait, waitAsync} = Atomics;\nconst {fromCharCode} = String;\n\n// automatically uses sync wait (worker -> main)\n// or fallback to async wait (main -> worker)\nconst waitFor = (isAsync, sb) => isAsync ?\n                  (waitAsync || waitAsyncFallback)(sb, 0) :\n                  (wait(sb, 0), {value: {then: fn => fn()}});\n\n// retain buffers to transfer\nconst buffers = new WeakSet;\n\n// retain either main threads or workers global context\nconst context = new WeakMap;\n\n// used to generate a unique `id` per each worker `postMessage` \"transaction\"\nlet uid = 0;\n\n/**\n * Create once a `Proxy` able to orchestrate synchronous `postMessage` out of the box.\n * @param {globalThis | Worker} self the context in which code should run\n * @param {{parse: (serialized: string) => any, stringify: (serializable: any) => string}} [JSON] an optional `JSON` like interface to `parse` or `stringify` content\n * @returns {ProxyHandler<globalThis> | ProxyHandler<Worker>}\n */\nconst coincident$1 = (self, {parse, stringify} = JSON) => {\n  // create a Proxy once for the given context (globalThis or Worker instance)\n  if (!context.has(self)) {\n    // ensure the CHANNEL and data are posted correctly\n    const post = (transfer, ...args) => self.postMessage({[CHANNEL]: args}, {transfer});\n\n    context.set(self, new Proxy(new Map$1, {\n      // worker related: get any utility that should be available on the main thread\n      get: (_, action) => action === 'then' ? null : ((...args) => {\n        // transaction id\n        const id = uid++;\n\n        // first contact: just ask for how big the buffer should be\n        let sb = new Int32Array(new SharedArrayBuffer$1(I32_BYTES));\n\n        // if a transfer list has been passed, drop it from args\n        let transfer = [];\n        if (buffers.has(args.at(-1) || transfer))\n          buffers.delete(transfer = args.pop());\n\n        // ask for invoke with arguments and wait for it\n        post(transfer, id, sb, action, args);\n\n        // helps deciding how to wait for results\n        const isAsync = self instanceof Worker;\n        return waitFor(isAsync, sb).value.then(() => {\n          // commit transaction using the returned / needed buffer length\n          const length = sb[0];\n\n          // filter undefined results\n          if (!length) return;\n\n          // calculate the needed ui16 bytes length to store the result string\n          const bytes = UI16_BYTES * length;\n\n          // round up to the next amount of bytes divided by 4 to allow i32 operations\n          sb = new Int32Array(new SharedArrayBuffer$1(bytes + (bytes % I32_BYTES)));\n\n          // ask for results and wait for it\n          post([], id, sb);\n          return waitFor(isAsync, sb).value.then(\n            // transform the shared buffer into a string and return it parsed\n            () => parse(fromCharCode(...new Uint16Array(sb.buffer).slice(0, length)))\n          );\n        });\n      }),\n\n      // main thread related: react to any utility a worker is asking for\n      set(actions, action, callback) {\n        // lazy event listener and logic handling, triggered once by setters actions\n        if (!actions.size) {\n          // maps results by `id` as they are asked for\n          const results = new Map$1;\n          // add the event listener once (first defined setter, all others work the same)\n          self.addEventListener('message', async (event) => {\n            // grub the very same library CHANNEL; ignore otherwise\n            const details = event.data?.[CHANNEL];\n            if (isArray$1(details)) {\n              // if early enough, avoid leaking data to other listeners\n              event.stopImmediatePropagation();\n              const [id, sb, ...rest] = details;\n              // action available: it must be defined/known on the main thread\n              if (rest.length) {\n                const [action, args] = rest;\n                if (actions.has(action)) {\n                  // await for result either sync or async and serialize it\n                  const result = stringify(await actions.get(action)(...args));\n                  if (result) {\n                    // store the result for \"the very next\" event listener call\n                    results.set(id, result);\n                    // communicate the required SharedArrayBuffer length out of the\n                    // resulting serialized string\n                    sb[0] = result.length;\n                  }\n                }\n                // unknown action should be notified as missing on the main thread\n                else {\n                  throw new Error(`Unsupported action: ${action}`);\n                }\n              }\n              // no action means: get results out of the well known `id`\n              else {\n                const result = results.get(id);\n                results.delete(id);\n                // populate the SaredArrayBuffer with utf-16 chars code\n                for (let ui16a = new Uint16Array(sb.buffer), i = 0; i < result.length; i++)\n                  ui16a[i] = result.charCodeAt(i);\n              }\n              // release te worker waiting either the length or the result\n              notify(sb, 0);\n            }\n          });\n        }\n        // store this action callback allowing the setter in the process\n        return !!actions.set(action, callback);\n      }\n    }));\n  }\n  return context.get(self);\n};\n\ncoincident$1.transfer = (...args) => (buffers.add(args), args);\n\nconst OBJECT    = 'object';\nconst FUNCTION  = 'function';\nconst BOOLEAN   = 'boolean';\nconst NUMBER    = 'number';\nconst STRING    = 'string';\nconst UNDEFINED = 'undefined';\nconst BIGINT    = 'bigint';\nconst SYMBOL    = 'symbol';\nconst NULL      = 'null';\n\nconst {\n  defineProperty: defineProperty$1,\n  getOwnPropertyDescriptor,\n  getPrototypeOf,\n  isExtensible,\n  ownKeys,\n  preventExtensions,\n  set,\n  setPrototypeOf\n} = Reflect;\n\nconst augment = (descriptor, how) => {\n  const {get, set, value} = descriptor;\n  if (get) descriptor.get = how(get);\n  if (set) descriptor.set = how(set);\n  if (value) descriptor.value = how(value);\n  return descriptor;\n};\n\nconst entry = (type, value) => [type, value];\n\nconst asEntry = transform => value => {\n  const type = typeof value;\n  switch (type) {\n    case OBJECT:\n    if (value == null)\n      return entry(NULL, value);\n    case FUNCTION:\n      return transform(type, value);\n    case BOOLEAN:\n    case NUMBER:\n    case STRING:\n    case UNDEFINED:\n    case BIGINT:\n      return entry(type, value);\n    case SYMBOL: {\n      if (symbols.has(value))\n        return entry(type, symbols.get(value));\n    }\n  }\n  throw new Error(`Unable to handle this ${type} type`);\n};\n\nconst symbols = new Map(\n  ownKeys(Symbol)\n    .filter(s => typeof Symbol[s] === SYMBOL)\n    .map(s => [Symbol[s], s])\n);\n  \nconst symbol = value => {\n  for (const [symbol, name] of symbols) {\n    if (name === value)\n      return symbol;\n  }\n};\n\nconst APPLY                        = 'apply';\nconst CONSTRUCT                    = 'construct';\nconst DEFINE_PROPERTY              = 'defineProperty';\nconst DELETE_PROPERTY              = 'deleteProperty';\nconst GET                          = 'get';\nconst GET_OWN_PROPERTY_DESCRIPTOR  = 'getOwnPropertyDescriptor';\nconst GET_PROTOTYPE_OF             = 'getPrototypeOf';\nconst HAS                          = 'has';\nconst IS_EXTENSIBLE                = 'isExtensible';\nconst OWN_KEYS                     = 'ownKeys';\nconst PREVENT_EXTENSION            = 'preventExtensions';\nconst SET                          = 'set';\nconst SET_PROTOTYPE_OF             = 'setPrototypeOf';\nconst DELETE                       = 'delete';\n\nlet id$1 = 0;\nconst ids$1 = new Map;\nconst values$1 = new Map;\nconst eventsHandler = new WeakMap;\n\n// patch once main UI tread\nif (globalThis.window === globalThis) {\n  const {addEventListener} = EventTarget.prototype;\n  // this should never be on the way as it's extremely light and fast\n  // but it's necessary to allow \"preventDefault\" or other event invokes at distance\n  defineProperty$1(EventTarget.prototype, 'addEventListener', {\n    value(type, listener, ...options) {\n      if (options.at(0)?.invoke) {\n        if (!eventsHandler.has(this))\n          eventsHandler.set(this, new Map);\n        eventsHandler.get(this).set(type, [].concat(options[0].invoke));\n        delete options[0].invoke;\n      }\n      return addEventListener.call(this, type, listener, ...options);\n    }\n  });\n}\n\nconst handleEvent = event => {\n  const {currentTarget, target, type} = event;\n  for (const method of eventsHandler.get(currentTarget || target)?.get(type) || [])\n    event[method]();\n};\n\nconst result = asEntry((type, value) => {\n  if (!ids$1.has(value)) {\n    let sid;\n    // a bit apocalyptic scenario but if this main runs forever\n    // and the id does a whole int32 roundtrip we might have still\n    // some reference danglign around\n    while (values$1.has(sid = id$1++));\n    ids$1.set(value, sid);\n    values$1.set(sid, value);\n  }\n  return entry(type, ids$1.get(value));\n});\n\nvar main = (thread, MAIN, THREAD) => {\n  const {[THREAD]: __thread__} = thread;\n\n  const registry = new FinalizationRegistry(id => {\n    __thread__(DELETE, entry(STRING, id));\n  });\n\n  const target = ([type, value]) => {\n    switch (type) {\n      case OBJECT:\n        return value == null ? globalThis : (\n          typeof value === NUMBER ? values$1.get(value) : value\n        );\n      case FUNCTION:\n        if (typeof value === STRING) {\n          if (!values$1.has(value)) {\n            const cb = function (...args) {\n              if (args.at(0) instanceof Event) handleEvent(...args);\n              return __thread__(\n                APPLY,\n                entry(FUNCTION, value),\n                result(this),\n                args.map(result)\n              );\n            };\n            const ref = new WeakRef(cb);\n            values$1.set(value, ref);\n            registry.register(cb, value, ref);\n          }\n          return values$1.get(value).deref();\n        }\n        return values$1.get(value);\n      case SYMBOL:\n        return symbol(value);\n    }\n    return value;\n  };\n\n  const trapsHandler = {\n    [APPLY]: (target, thisArg, args) => result(target.apply(thisArg, args)),\n    [CONSTRUCT]: (target, args) => result(new target(...args)),\n    [DEFINE_PROPERTY]: (target, name, descriptor) => result(defineProperty$1(target, name, descriptor)),\n    [DELETE_PROPERTY]: (target, name) => result(delete target[name]),\n    [GET_PROTOTYPE_OF]: target => result(getPrototypeOf(target)),\n    [GET]: (target, name) => result(target[name]),\n    [GET_OWN_PROPERTY_DESCRIPTOR]: (target, name) => {\n      const descriptor = getOwnPropertyDescriptor(target, name);\n      return descriptor ? entry(OBJECT, augment(descriptor, result)) : entry(UNDEFINED, descriptor);\n    },\n    [HAS]: (target, name) => result(name in target),\n    [IS_EXTENSIBLE]: target => result(isExtensible(target)),\n    [OWN_KEYS]: target => entry(OBJECT, ownKeys(target).map(result)),\n    [PREVENT_EXTENSION]: target => result(preventExtensions(target)),\n    [SET]: (target, name, value) => result(set(target, name, value)),\n    [SET_PROTOTYPE_OF]: (target, proto) => result(setPrototypeOf(target, proto)),\n    [DELETE](id) {\n      ids$1.delete(values$1.get(id));\n      values$1.delete(id);\n    }\n  };\n\n  thread[MAIN] = (trap, entry, ...args) => {\n    switch (trap) {\n      case APPLY:\n        args[0] = target(args[0]);\n        args[1] = args[1].map(target);\n        break;\n      case CONSTRUCT:\n        args[0] = args[0].map(target);\n        break;\n      case DEFINE_PROPERTY: {\n        const [name, descriptor] = args;\n        args[0] = target(name);\n        const {get, set, value} = descriptor;\n        if (get) descriptor.get = target(get);\n        if (set) descriptor.set = target(set);\n        if (value) descriptor.value = target(value);\n        break;\n      }\n      default:\n        args = args.map(target);\n        break;\n    }\n\n    return trapsHandler[trap](target(entry), ...args);\n  };\n\n  return {\n    proxy: thread,\n    window: globalThis,\n    isWindowProxy: () => false\n  };\n};\n\nconst bound = target => typeof target === FUNCTION ? target() : target;\n\nconst argument = asEntry(\n  (type, value) => {\n    if (__proxied__ in value)\n      return bound(value[__proxied__]);\n    if (type === FUNCTION) {\n      if (!values.has(value)) {\n        let sid;\n        // a bit apocalyptic scenario but if this thread runs forever\n        // and the id does a whole int32 roundtrip we might have still\n        // some reference danglign around\n        while (values.has(sid = String(id++)));\n        ids.set(value, sid);\n        values.set(sid, value);\n      }\n      return entry(type, ids.get(value));\n    }\n    return entry(type, value);\n  }\n);\n\nconst __proxied__ = Symbol();\n\nlet id = 0;\nconst ids = new Map;\nconst values = new Map;\n\nvar thread = (main, MAIN, THREAD) => {\n  const {[MAIN]: __main__} = main;\n\n  const proxies = new Map;\n\n  const registry = new FinalizationRegistry(id => {\n    proxies.delete(id);\n    __main__(DELETE, argument(id));\n  });\n\n  const register = (entry) => {\n    const [type, value] = entry;\n    if (!proxies.has(value)) {\n      const target = type === FUNCTION ? Bound.bind(entry) : entry;\n      const proxy = new Proxy(target, proxyHandler);\n      const ref = new WeakRef(proxy);\n      proxies.set(value, ref);\n      registry.register(proxy, value, ref);\n    }\n    return proxies.get(value).deref();\n  };\n\n  const fromEntry = entry => {\n    const [type, value] = entry;\n    switch (type) {\n      case OBJECT:\n        return typeof value === NUMBER ? register(entry) : value;\n      case FUNCTION:\n        return typeof value === STRING ? values.get(value) : register(entry);\n      case SYMBOL:\n        return symbol(value);\n    }\n    return value;\n  };\n\n  const result = (TRAP, target, ...args) => fromEntry(__main__(TRAP, bound(target), ...args));\n\n  const proxyHandler = {\n    [APPLY]: (target, thisArg, args) => result(APPLY, target, argument(thisArg), args.map(argument)),\n    [CONSTRUCT]: (target, args) => result(CONSTRUCT, target, args.map(argument)),\n    [DEFINE_PROPERTY]: (target, name, descriptor) => {\n      const {get, set, value} = descriptor;\n      if (typeof get === FUNCTION) descriptor.get = argument(get);\n      if (typeof set === FUNCTION) descriptor.set = argument(set);\n      if (typeof value === FUNCTION) descriptor.value = argument(value);\n      return result(DEFINE_PROPERTY, target, argument(name), descriptor);\n    },\n    [DELETE_PROPERTY]: (target, name) => result(DELETE_PROPERTY, target, argument(name)),\n    [GET_PROTOTYPE_OF]: target => result(GET_PROTOTYPE_OF, target),\n    [GET]: (target, name) => name === __proxied__ ? target : result(GET, target, argument(name)),\n    [GET_OWN_PROPERTY_DESCRIPTOR]: (target, name) => {\n      const descriptor = result(GET_OWN_PROPERTY_DESCRIPTOR, target, argument(name));\n      return descriptor && augment(descriptor, fromEntry);\n    },\n    [HAS]: (target, name) => name === __proxied__ || result(HAS, target, argument(name)),\n    [IS_EXTENSIBLE]: target => result(IS_EXTENSIBLE, target),\n    [OWN_KEYS]: target => result(OWN_KEYS, target).map(fromEntry),\n    [PREVENT_EXTENSION]: target => result(PREVENT_EXTENSION, target),\n    [SET]: (target, name, value) => result(SET, target, argument(name), argument(value)),\n    [SET_PROTOTYPE_OF]: (target, proto) => result(SET_PROTOTYPE_OF, target, argument(proto)),\n  };\n\n  main[THREAD] = (trap, entry, ctx, args) => {\n    switch (trap) {\n      case APPLY:\n        return fromEntry(entry).apply(fromEntry(ctx), args.map(fromEntry));\n      case DELETE: {\n        const id = fromEntry(entry);\n        ids.delete(values.get(id));\n        values.delete(id);\n      }\n    }\n  };\n\n  return {\n    proxy: main,\n    window: new Proxy([OBJECT, null], proxyHandler),\n    isWindowProxy: value => typeof value === OBJECT && !!value && __proxied__ in value,\n    // TODO: remove this stuff ASAP\n    get global() {\n      console.warn('Deprecated: please access `window` field instead');\n      return this.window;\n    },\n    get isGlobal() {\n      return function (value) {\n        console.warn('Deprecated: please access `isWindowProxy` field instead');\n        return this.isWindowProxy(value);\n      }.bind(this);\n    }\n  };\n};\n\nfunction Bound() {\n  return this;\n}\n\nconst MAIN = CHANNEL + 'M';\nconst THREAD = CHANNEL + 'T';\n\nconst proxies = new WeakMap;\n\n/**\n * @typedef {object} Coincident\n * @property {ProxyHandler<globalThis>} proxy\n * @property {ProxyHandler<Window>} window\n * @property {(value: any) => boolean} isWindowProxy\n */\n\n/**\n * Create once a `Proxy` able to orchestrate synchronous `postMessage` out of the box.\n * In workers, returns a `{proxy, window, isWindowProxy}` namespace to reach main globals synchronously.\n * @param {Worker | globalThis} self the context in which code should run\n * @returns {ProxyHandler<Worker> | Coincident}\n */\nconst coincident = (self, ...args) => {\n  const proxy = coincident$1(self, ...args);\n  if (!proxies.has(proxy)) {\n    const util = self instanceof Worker ? main : thread;\n    proxies.set(proxy, util(proxy, MAIN, THREAD));\n  }\n  return proxies.get(proxy);\n};\n\ncoincident.transfer = coincident$1.transfer;\n\nconst { isArray } = Array;\n\nconst { assign, create, defineProperties, defineProperty } = Object;\n\nconst { all, resolve: resolve$1 } = new Proxy(Promise, {\n    get: ($, name) => $[name].bind($),\n});\n\nconst absoluteURL = (path, base = location.href) => new URL(path, base).href;\n\nPromise.withResolvers || (Promise.withResolvers = function withResolvers() {\n  var a, b, c = new this(function (resolve, reject) {\n    a = resolve;\n    b = reject;\n  });\n  return {resolve: a, reject: b, promise: c};\n});\n\n/** @param {Response} response */\nconst getBuffer = (response) => response.arrayBuffer();\n\n/** @param {Response} response */\nconst getJSON = (response) => response.json();\n\n/** @param {Response} response */\nconst getText = (response) => response.text();\n\n/**\n * Trim code only if it's a single line that prettier or other tools might have modified.\n * @param {string} code code that might be a single line\n * @returns {string}\n */\nconst clean = (code) =>\n    code.replace(/^[^\\r\\n]+$/, (line) => line.trim());\n\n// REQUIRES INTEGRATION TEST\n/* c8 ignore start */\nconst io$1 = new WeakMap();\nconst stdio = (init) => {\n    const context = init || console;\n    const localIO = {\n        stderr: (context.stderr || console.error).bind(context),\n        stdout: (context.stdout || console.log).bind(context),\n    };\n    return {\n        stderr: (...args) => localIO.stderr(...args),\n        stdout: (...args) => localIO.stdout(...args),\n        async get(engine) {\n            const interpreter = await engine;\n            io$1.set(interpreter, localIO);\n            return interpreter;\n        },\n    };\n};\n/* c8 ignore stop */\n\n// This should be the only helper needed for all Emscripten based FS exports\nconst writeFile$1 = (FS, path, buffer) => {\n    const { parentPath, name } = FS.analyzePath(path, true);\n    FS.mkdirTree(parentPath);\n    return FS.writeFile([parentPath, name].join(\"/\"), new Uint8Array(buffer), {\n        canOwn: true,\n    });\n};\n\n// This is instead a fallback for Lua or others\nconst writeFileShim = (FS, path, buffer) => {\n    path = resolve(FS, path);\n    mkdirTree(FS, dirname(path));\n    return FS.writeFile(path, new Uint8Array(buffer), { canOwn: true });\n};\n\nconst dirname = (path) => {\n    const tree = path.split(\"/\");\n    tree.pop();\n    return tree.join(\"/\");\n};\n\nconst mkdirTree = (FS, path) => {\n    const current = [];\n    for (const branch of path.split(\"/\")) {\n        current.push(branch);\n        if (branch) FS.mkdir(current.join(\"/\"));\n    }\n};\n\nconst resolve = (FS, path) => {\n    const tree = [];\n    for (const branch of path.split(\"/\")) {\n        switch (branch) {\n            case \"\":\n                break;\n            case \".\":\n                break;\n            case \"..\":\n                tree.pop();\n                break;\n            default:\n                tree.push(branch);\n        }\n    }\n    return [FS.cwd()].concat(tree).join(\"/\").replace(/^\\/+/, \"/\");\n};\n\nconst calculateFetchPaths = (config_fetch) => {\n    // REQUIRES INTEGRATION TEST\n    /* c8 ignore start */\n    for (const { files, to_file, from = \"\" } of config_fetch) {\n        if (files !== undefined && to_file !== undefined)\n            throw new Error(\n                `Cannot use 'to_file' and 'files' parameters together!`,\n            );\n        if (files === undefined && to_file === undefined && from.endsWith(\"/\"))\n            throw new Error(\n                `Couldn't determine the filename from the path ${from}, please supply 'to_file' parameter.`,\n            );\n    }\n    /* c8 ignore stop */\n    return config_fetch.flatMap(\n        ({ from = \"\", to_folder = \".\", to_file, files }) => {\n            if (isArray(files))\n                return files.map((file) => ({\n                    url: joinPaths([from, file]),\n                    path: joinPaths([to_folder, file]),\n                }));\n            const filename = to_file || from.slice(1 + from.lastIndexOf(\"/\"));\n            return [{ url: from, path: joinPaths([to_folder, filename]) }];\n        },\n    );\n};\n\nconst joinPaths = (parts) => {\n    const res = parts\n        .map((part) => part.trim().replace(/(^[/]*|[/]*$)/g, \"\"))\n        .filter((p) => p !== \"\" && p !== \".\")\n        .join(\"/\");\n\n    return parts[0].startsWith(\"/\") ? `/${res}` : res;\n};\n\nconst fetchResolved = (config_fetch, url) =>\n    fetch(absoluteURL(url, base.get(config_fetch)));\n\nconst base = new WeakMap();\n\nconst fetchPaths = (module, interpreter, config_fetch) =>\n    all(\n        calculateFetchPaths(config_fetch).map(({ url, path }) =>\n            fetchResolved(config_fetch, url)\n                .then(getBuffer)\n                .then((buffer) => module.writeFile(interpreter, path, buffer)),\n        ),\n    );\n\n// REQUIRES INTEGRATION TEST\n/* c8 ignore start */\nconst run$1 = (interpreter, code) => interpreter.runPython(clean(code));\n\nconst runAsync = (interpreter, code) =>\n    interpreter.runPythonAsync(clean(code));\n\nconst setGlobal = (interpreter, name, value) => {\n    interpreter.globals.set(name, value);\n};\n\nconst deleteGlobal = (interpreter, name) => {\n    interpreter.globals.delete(name);\n};\n\nconst writeFile = ({ FS }, path, buffer) =>\n    writeFile$1(FS, path, buffer);\n/* c8 ignore stop */\n\nconst type$4 = \"micropython\";\n\n// REQUIRES INTEGRATION TEST\n/* c8 ignore start */\nvar micropython = {\n    type: type$4,\n    module: (version = \"1.20.0-253\") =>\n        `https://cdn.jsdelivr.net/npm/@micropython/micropython-webassembly-pyscript@${version}/micropython.mjs`,\n    async engine({ loadMicroPython }, config, url) {\n        const { stderr, stdout, get } = stdio();\n        url = url.replace(/\\.m?js$/, \".wasm\");\n        const runtime = await get(loadMicroPython({ stderr, stdout, url }));\n        if (config.fetch) await fetchPaths(this, runtime, config.fetch);\n        return runtime;\n    },\n    setGlobal,\n    deleteGlobal,\n    run: run$1,\n    runAsync,\n    writeFile,\n};\n/* c8 ignore stop */\n\nconst type$3 = \"pyodide\";\n\n// REQUIRES INTEGRATION TEST\n/* c8 ignore start */\nvar pyodide = {\n    type: type$3,\n    module: (version = \"0.23.2\") =>\n        `https://cdn.jsdelivr.net/pyodide/v${version}/full/pyodide.mjs`,\n    async engine({ loadPyodide }, config, url) {\n        const { stderr, stdout, get } = stdio();\n        const indexURL = url.slice(0, url.lastIndexOf(\"/\"));\n        const interpreter = await get(\n            loadPyodide({ stderr, stdout, indexURL }),\n        );\n        if (config.fetch) await fetchPaths(this, interpreter, config.fetch);\n        if (config.packages) {\n            await interpreter.loadPackage(\"micropip\");\n            const micropip = await interpreter.pyimport(\"micropip\");\n            await micropip.install(config.packages);\n            micropip.destroy();\n        }\n        return interpreter;\n    },\n    setGlobal,\n    deleteGlobal,\n    run: run$1,\n    runAsync,\n    writeFile,\n};\n/* c8 ignore stop */\n\nconst type$2 = \"ruby-wasm-wasi\";\n\n// MISSING:\n//  * there is no VFS apparently or I couldn't reach any\n//  * I've no idea how to override the stderr and stdout\n//  * I've no idea how to import packages\n\n// REQUIRES INTEGRATION TEST\n/* c8 ignore start */\nvar ruby_wasm_wasi = {\n    type: type$2,\n    experimental: true,\n    module: (version = \"2.0.0\") =>\n        `https://cdn.jsdelivr.net/npm/ruby-3_2-wasm-wasi@${version}/dist/browser.esm.js`,\n    async engine({ DefaultRubyVM }, config, url) {\n        const response = await fetch(\n            `${url.slice(0, url.lastIndexOf(\"/\"))}/ruby.wasm`,\n        );\n        const module = await WebAssembly.compile(await response.arrayBuffer());\n        const { vm: interpreter } = await DefaultRubyVM(module);\n        if (config.fetch) await fetchPaths(this, interpreter, config.fetch);\n        return interpreter;\n    },\n    setGlobal(interpreter, name, value) {\n        const id = `__pyscript_ruby_wasm_wasi_${name}`;\n        globalThis[id] = value;\n        this.run(interpreter, `require \"js\";$${name}=JS::eval(\"return ${id}\")`);\n    },\n    deleteGlobal(interpreter, name) {\n        const id = `__pyscript_ruby_wasm_wasi_${name}`;\n        this.run(interpreter, `$${name}=nil`);\n        delete globalThis[id];\n    },\n    run: (interpreter, code) => interpreter.eval(clean(code)),\n    runAsync: (interpreter, code) => interpreter.evalAsync(clean(code)),\n    writeFile: () => {\n        throw new Error(`writeFile is not supported in ${type$2}`);\n    },\n};\n/* c8 ignore stop */\n\nconst type$1 = \"wasmoon\";\n\n// REQUIRES INTEGRATION TEST\n/* c8 ignore start */\nvar wasmoon = {\n    type: type$1,\n    module: (version = \"1.15.0\") =>\n        `https://cdn.jsdelivr.net/npm/wasmoon@${version}/+esm`,\n    async engine({ LuaFactory, LuaLibraries }, config) {\n        const { stderr, stdout, get } = stdio();\n        const interpreter = await get(new LuaFactory().createEngine());\n        interpreter.global.getTable(LuaLibraries.Base, (index) => {\n            interpreter.global.setField(index, \"print\", stdout);\n            interpreter.global.setField(index, \"printErr\", stderr);\n        });\n        if (config.fetch) await fetchPaths(this, interpreter, config.fetch);\n        return interpreter;\n    },\n    setGlobal(interpreter, name, value) {\n        interpreter.global.set(name, value);\n    },\n    deleteGlobal(interpreter, name) {\n        interpreter.global.set(name, void 0);\n    },\n    run: (interpreter, code) => interpreter.doStringSync(clean(code)),\n    runAsync: (interpreter, code) => interpreter.doString(clean(code)),\n    writeFile: (\n        {\n            cmodule: {\n                module: { FS },\n            },\n        },\n        path,\n        buffer,\n    ) => writeFileShim(FS, path, buffer),\n};\n/* c8 ignore stop */\n\nconst type = \"webr\";\n\nconst io = new WeakMap;\n\n// REQUIRES INTEGRATION TEST\n/* c8 ignore start */\nvar webr = {\n    type,\n    module: (version = \"0.1.1\") =>\n        `https://webr.r-wasm.org/v${version}/webr.mjs`,\n    async engine({ WebR }, config) {\n        const { stderr, stdout, get } = stdio();\n        const webR = new WebR();\n        await webR.init();\n        const interpreter = await get(new webR.Shelter());\n        io.set(interpreter, { webR, stderr, stdout });\n        if (config.fetch) await fetchPaths(this, interpreter, config.fetch);\n        return interpreter;\n    },\n    setGlobal() {\n        // UNSUPPORTED\n        // const { webR } = io.get(interpreter);\n        // return webR.objs.globalEnv.bind(name, value);\n    },\n    deleteGlobal() {\n        // UNSUPPORTED\n        // const { webR } = io.get(interpreter);\n        // return webR.objs.globalEnv.bind(name, void 0);\n    },\n    run(interpreter, code) {\n        return this.runAsync(interpreter, code);\n    },\n    async runAsync(interpreter, code) {\n        const ioHandler = io.get(interpreter);\n        const { output, result } = await interpreter.captureR(code);\n        for (const { type, data } of output)\n            ioHandler[type](data);\n        return result;\n    },\n    writeFile: (interpreter, path, buffer) => {\n        const { webR } = io.get(interpreter);\n        return writeFile$1(webR.FS, path, buffer);\n    },\n};\n/* c8 ignore stop */\n\n// ⚠️ Part of this file is automatically generated\n//    The :RUNTIMES comment is a delimiter and no code should be written/changed after\n//    See rollup/build_interpreters.cjs to know more\n\n\n/** @type {Map<string, object>} */\nconst registry = new Map();\n\n/** @type {Map<string, object>} */\nconst configs = new Map();\n\nconst interpreter$1 = new Proxy(new Map(), {\n    get(map, id) {\n        if (!map.has(id)) {\n            const [type, ...rest] = id.split(\"@\");\n            const interpreter = registry.get(type);\n            const url = /^https?:\\/\\//i.test(rest)\n                ? rest.join(\"@\")\n                : interpreter.module(...rest);\n            map.set(id, {\n                url,\n                module: import(url),\n                engine: interpreter.engine.bind(interpreter),\n            });\n        }\n        const { url, module, engine } = map.get(id);\n        return (config, baseURL) =>\n            module.then((module) => {\n                configs.set(id, config);\n                const fetch = config?.fetch;\n                if (fetch) base.set(fetch, baseURL);\n                return engine(module, config, url);\n            });\n    },\n});\n\nconst register = (interpreter) => {\n    for (const type of [].concat(interpreter.type)) {\n        registry.set(type, interpreter);\n    }\n};\nfor (const interpreter of [micropython, pyodide, ruby_wasm_wasi, wasmoon, webr])\n    register(interpreter);\n\n// lazy TOML parser (fast-toml might be a better alternative)\nconst TOML_LIB = `https://cdn.jsdelivr.net/npm/basic-toml@0.3.1/es.js`;\n\n/**\n * @param {string} text TOML text to parse\n * @returns {object} the resulting JS object\n */\nconst parse = async (text) => (await import(TOML_LIB)).parse(text);\n\n/**\n * @param {string} id the interpreter name @ version identifier\n * @param {string} [config] optional config file to parse\n * @returns\n */\nconst getRuntime = (id, config) => {\n    let options = {};\n    if (config) {\n        // REQUIRES INTEGRATION TEST\n        /* c8 ignore start */\n        if (config.endsWith(\".json\")) {\n            options = fetch(config).then(getJSON);\n        } else if (config.endsWith(\".toml\")) {\n            options = fetch(config).then(getText).then(parse);\n        } else {\n            try {\n                options = JSON.parse(config);\n            } catch (_) {\n                options = parse(config);\n            }\n            // make the config a URL to be able to retrieve relative paths from it\n            config = absoluteURL(\"./config.txt\");\n        }\n        /* c8 ignore stop */\n    }\n    return resolve$1(options).then((options) => interpreter$1[id](options, config));\n};\n\n/**\n * @param {string} type the interpreter type\n * @param {string} [version] the optional interpreter version\n * @returns\n */\nconst getRuntimeID = (type, version = \"\") =>\n    `${type}@${version}`.replace(/@$/, \"\");\n\n// ⚠️ This file is used to generate xworker.js\n//    That means if any import is circular or brings in too much\n//    that would be a higher payload for every worker.\n//    Please check via `npm run size` that worker code is not much\n//    bigger than it used to be before any changes is applied to this file.\n\n\n// bails out out of the box with a native/meaningful error\n// in case the SharedArrayBuffer is not available\ntry {\n    new SharedArrayBuffer(4);\n} catch (_) {\n    throw new Error(\n        [\n            \"Unable to use SharedArrayBuffer due insecure environment.\",\n            \"Please read requirements in MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements\",\n        ].join(\"\\n\"),\n    );\n}\n\nlet interpreter, run, interpreterEvent;\nconst add = (type, fn) => {\n    addEventListener(\n        type,\n        fn ||\n            (async (event) => {\n                await interpreter;\n                interpreterEvent = event;\n                run(`xworker.on${type}(xworker.event);`, xworker);\n            }),\n        !!fn && { once: true },\n    );\n};\n\nconst { proxy: sync, window, isWindowProxy } = coincident(self, JSON$1);\n\nconst xworker = {\n    // allows synchronous utilities between this worker and the main thread\n    sync,\n    // allow access to the main thread world\n    window,\n    // allow introspection for foreign (main thread) refrences\n    isWindowProxy,\n    // standard worker related events / features\n    onerror() {},\n    onmessage() {},\n    onmessageerror() {},\n    postMessage: postMessage.bind(self),\n    // this getter exists so that arbitrarily access to xworker.event\n    // would always fail once an event has been dispatched, as that's not\n    // meant to be accessed in the wild, respecting the one-off event nature of JS.\n    // because xworker is a unique well defined globally shared reference,\n    // there's also no need to bother setGlobal and deleteGlobal every single time.\n    get event() {\n        const event = interpreterEvent;\n        if (!event) throw new Error(\"Unauthorized event access\");\n        interpreterEvent = void 0;\n        return event;\n    },\n};\n\nadd(\"message\", ({ data: { options, code, hooks } }) => {\n    interpreter = (async () => {\n        const { type, version, config, async: isAsync } = options;\n        const interpreter = await getRuntime(\n            getRuntimeID(type, version),\n            config,\n        );\n        const details = create(registry.get(type));\n        const name = `run${isAsync ? \"Async\" : \"\"}`;\n\n        if (hooks) {\n            // patch code if needed\n            const { beforeRun, beforeRunAsync, afterRun, afterRunAsync } =\n                hooks;\n\n            const after = afterRun || afterRunAsync;\n            const before = beforeRun || beforeRunAsync;\n\n            // append code that should be executed *after* first\n            if (after) {\n                const method = details[name].bind(details);\n                details[name] = (interpreter, code) =>\n                    method(interpreter, `${code}\\n${after}`);\n            }\n\n            // prepend code that should be executed *before* (so that after is post-patched)\n            if (before) {\n                const method = details[name].bind(details);\n                details[name] = (interpreter, code) =>\n                    method(interpreter, `${before}\\n${code}`);\n            }\n        }\n        // set the `xworker` global reference once\n        await details.setGlobal(interpreter, \"xworker\", xworker);\n        // simplify run calls after possible patches\n        run = details[name].bind(details, interpreter);\n        // execute the content of the worker file\n        await run(code);\n        return interpreter;\n    })();\n    add(\"error\");\n    add(\"message\");\n    add(\"messageerror\");\n});\n"],{type:'application/javascript'})),{type:'module'});

const { isArray } = Array;

const { assign, create, defineProperties, defineProperty } = Object;

const { all, resolve: resolve$1 } = new Proxy(Promise, {
    get: ($, name) => $[name].bind($),
});

const absoluteURL = (path, base = location.href) => new URL(path, base).href;

/** @param {Response} response */
const getBuffer = (response) => response.arrayBuffer();

/** @param {Response} response */
const getJSON = (response) => response.json();

/** @param {Response} response */
const getText = (response) => response.text();

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
const workerHooks = [
    ["beforeRun", "codeBeforeRunWorker"],
    ["beforeRunAsync", "codeBeforeRunWorkerAsync"],
    ["afterRun", "codeAfterRunWorker"],
    ["afterRunAsync", "codeAfterRunWorkerAsync"],
];

class Hook {
    constructor(fields) {
        for (const [key, value] of workerHooks) this[key] = fields[value]?.();
    }
}
/* c8 ignore stop */

/**
 * @typedef {Object} WorkerOptions custom configuration
 * @prop {string} type the interpreter type to use
 * @prop {string} [version] the optional interpreter version to use
 * @prop {string} [config] the optional config to use within such interpreter
 */

var xworker = (...args) =>
    /**
     * A XWorker is a Worker facade able to bootstrap a channel with any desired interpreter.
     * @param {string} url the remote file to evaluate on bootstrap
     * @param {WorkerOptions} [options] optional arguments to define the interpreter to use
     * @returns {Worker}
     */
    function XWorker(url, options) {
        const worker = xworker$1();
        const { postMessage } = worker;
        if (args.length) {
            const [type, version] = args;
            options = assign({}, options || { type, version });
            if (!options.type) options.type = type;
        }
        if (options?.config) options.config = absoluteURL(options.config);
        const bootstrap = fetch(url)
            .then(getText)
            .then((code) => {
                const hooks = this instanceof Hook ? this : void 0;
                postMessage.call(worker, { options, code, hooks });
            });
        return defineProperties(worker, {
            postMessage: {
                value: (data, ...rest) =>
                    bootstrap.then(() =>
                        postMessage.call(worker, data, ...rest),
                    ),
            },
            sync: {
                value: coincident(worker, JSON$1).proxy,
            },
        });
    };

/**
 * Trim code only if it's a single line that prettier or other tools might have modified.
 * @param {string} code code that might be a single line
 * @returns {string}
 */
const clean = (code) =>
    code.replace(/^[^\r\n]+$/, (line) => line.trim());

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
const io$1 = new WeakMap();
const stdio = (init) => {
    const context = init || console;
    const localIO = {
        stderr: (context.stderr || console.error).bind(context),
        stdout: (context.stdout || console.log).bind(context),
    };
    return {
        stderr: (...args) => localIO.stderr(...args),
        stdout: (...args) => localIO.stdout(...args),
        async get(engine) {
            const interpreter = await engine;
            io$1.set(interpreter, localIO);
            return interpreter;
        },
    };
};
/* c8 ignore stop */

// This should be the only helper needed for all Emscripten based FS exports
const writeFile$1 = (FS, path, buffer) => {
    const { parentPath, name } = FS.analyzePath(path, true);
    FS.mkdirTree(parentPath);
    return FS.writeFile([parentPath, name].join("/"), new Uint8Array(buffer), {
        canOwn: true,
    });
};

// This is instead a fallback for Lua or others
const writeFileShim = (FS, path, buffer) => {
    path = resolve(FS, path);
    mkdirTree(FS, dirname(path));
    return FS.writeFile(path, new Uint8Array(buffer), { canOwn: true });
};

const dirname = (path) => {
    const tree = path.split("/");
    tree.pop();
    return tree.join("/");
};

const mkdirTree = (FS, path) => {
    const current = [];
    for (const branch of path.split("/")) {
        current.push(branch);
        if (branch) FS.mkdir(current.join("/"));
    }
};

const resolve = (FS, path) => {
    const tree = [];
    for (const branch of path.split("/")) {
        switch (branch) {
            case "":
                break;
            case ".":
                break;
            case "..":
                tree.pop();
                break;
            default:
                tree.push(branch);
        }
    }
    return [FS.cwd()].concat(tree).join("/").replace(/^\/+/, "/");
};

const calculateFetchPaths = (config_fetch) => {
    // REQUIRES INTEGRATION TEST
    /* c8 ignore start */
    for (const { files, to_file, from = "" } of config_fetch) {
        if (files !== undefined && to_file !== undefined)
            throw new Error(
                `Cannot use 'to_file' and 'files' parameters together!`,
            );
        if (files === undefined && to_file === undefined && from.endsWith("/"))
            throw new Error(
                `Couldn't determine the filename from the path ${from}, please supply 'to_file' parameter.`,
            );
    }
    /* c8 ignore stop */
    return config_fetch.flatMap(
        ({ from = "", to_folder = ".", to_file, files }) => {
            if (isArray(files))
                return files.map((file) => ({
                    url: joinPaths([from, file]),
                    path: joinPaths([to_folder, file]),
                }));
            const filename = to_file || from.slice(1 + from.lastIndexOf("/"));
            return [{ url: from, path: joinPaths([to_folder, filename]) }];
        },
    );
};

const joinPaths = (parts) => {
    const res = parts
        .map((part) => part.trim().replace(/(^[/]*|[/]*$)/g, ""))
        .filter((p) => p !== "" && p !== ".")
        .join("/");

    return parts[0].startsWith("/") ? `/${res}` : res;
};

const fetchResolved = (config_fetch, url) =>
    fetch(absoluteURL(url, base.get(config_fetch)));

const base = new WeakMap();

const fetchPaths = (module, interpreter, config_fetch) =>
    all(
        calculateFetchPaths(config_fetch).map(({ url, path }) =>
            fetchResolved(config_fetch, url)
                .then(getBuffer)
                .then((buffer) => module.writeFile(interpreter, path, buffer)),
        ),
    );

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
const run = (interpreter, code) => interpreter.runPython(clean(code));

const runAsync = (interpreter, code) =>
    interpreter.runPythonAsync(clean(code));

const setGlobal = (interpreter, name, value) => {
    interpreter.globals.set(name, value);
};

const deleteGlobal = (interpreter, name) => {
    interpreter.globals.delete(name);
};

const writeFile = ({ FS }, path, buffer) =>
    writeFile$1(FS, path, buffer);
/* c8 ignore stop */

const type$4 = "micropython";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
var micropython = {
    type: type$4,
    module: (version = "1.20.0-253") =>
        `https://cdn.jsdelivr.net/npm/@micropython/micropython-webassembly-pyscript@${version}/micropython.mjs`,
    async engine({ loadMicroPython }, config, url) {
        const { stderr, stdout, get } = stdio();
        url = url.replace(/\.m?js$/, ".wasm");
        const runtime = await get(loadMicroPython({ stderr, stdout, url }));
        if (config.fetch) await fetchPaths(this, runtime, config.fetch);
        return runtime;
    },
    setGlobal,
    deleteGlobal,
    run,
    runAsync,
    writeFile,
};
/* c8 ignore stop */

const type$3 = "pyodide";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
var pyodide = {
    type: type$3,
    module: (version = "0.23.2") =>
        `https://cdn.jsdelivr.net/pyodide/v${version}/full/pyodide.mjs`,
    async engine({ loadPyodide }, config, url) {
        const { stderr, stdout, get } = stdio();
        const indexURL = url.slice(0, url.lastIndexOf("/"));
        const interpreter = await get(
            loadPyodide({ stderr, stdout, indexURL }),
        );
        if (config.fetch) await fetchPaths(this, interpreter, config.fetch);
        if (config.packages) {
            await interpreter.loadPackage("micropip");
            const micropip = await interpreter.pyimport("micropip");
            await micropip.install(config.packages);
            micropip.destroy();
        }
        return interpreter;
    },
    setGlobal,
    deleteGlobal,
    run,
    runAsync,
    writeFile,
};
/* c8 ignore stop */

const type$2 = "ruby-wasm-wasi";

// MISSING:
//  * there is no VFS apparently or I couldn't reach any
//  * I've no idea how to override the stderr and stdout
//  * I've no idea how to import packages

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
var ruby_wasm_wasi = {
    type: type$2,
    experimental: true,
    module: (version = "2.0.0") =>
        `https://cdn.jsdelivr.net/npm/ruby-3_2-wasm-wasi@${version}/dist/browser.esm.js`,
    async engine({ DefaultRubyVM }, config, url) {
        const response = await fetch(
            `${url.slice(0, url.lastIndexOf("/"))}/ruby.wasm`,
        );
        const module = await WebAssembly.compile(await response.arrayBuffer());
        const { vm: interpreter } = await DefaultRubyVM(module);
        if (config.fetch) await fetchPaths(this, interpreter, config.fetch);
        return interpreter;
    },
    setGlobal(interpreter, name, value) {
        const id = `__pyscript_ruby_wasm_wasi_${name}`;
        globalThis[id] = value;
        this.run(interpreter, `require "js";$${name}=JS::eval("return ${id}")`);
    },
    deleteGlobal(interpreter, name) {
        const id = `__pyscript_ruby_wasm_wasi_${name}`;
        this.run(interpreter, `$${name}=nil`);
        delete globalThis[id];
    },
    run: (interpreter, code) => interpreter.eval(clean(code)),
    runAsync: (interpreter, code) => interpreter.evalAsync(clean(code)),
    writeFile: () => {
        throw new Error(`writeFile is not supported in ${type$2}`);
    },
};
/* c8 ignore stop */

const type$1 = "wasmoon";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
var wasmoon = {
    type: type$1,
    module: (version = "1.15.0") =>
        `https://cdn.jsdelivr.net/npm/wasmoon@${version}/+esm`,
    async engine({ LuaFactory, LuaLibraries }, config) {
        const { stderr, stdout, get } = stdio();
        const interpreter = await get(new LuaFactory().createEngine());
        interpreter.global.getTable(LuaLibraries.Base, (index) => {
            interpreter.global.setField(index, "print", stdout);
            interpreter.global.setField(index, "printErr", stderr);
        });
        if (config.fetch) await fetchPaths(this, interpreter, config.fetch);
        return interpreter;
    },
    setGlobal(interpreter, name, value) {
        interpreter.global.set(name, value);
    },
    deleteGlobal(interpreter, name) {
        interpreter.global.set(name, void 0);
    },
    run: (interpreter, code) => interpreter.doStringSync(clean(code)),
    runAsync: (interpreter, code) => interpreter.doString(clean(code)),
    writeFile: (
        {
            cmodule: {
                module: { FS },
            },
        },
        path,
        buffer,
    ) => writeFileShim(FS, path, buffer),
};
/* c8 ignore stop */

const type = "webr";

const io = new WeakMap;

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
var webr = {
    type,
    module: (version = "0.1.1") =>
        `https://webr.r-wasm.org/v${version}/webr.mjs`,
    async engine({ WebR }, config) {
        const { stderr, stdout, get } = stdio();
        const webR = new WebR();
        await webR.init();
        const interpreter = await get(new webR.Shelter());
        io.set(interpreter, { webR, stderr, stdout });
        if (config.fetch) await fetchPaths(this, interpreter, config.fetch);
        return interpreter;
    },
    setGlobal() {
        // UNSUPPORTED
        // const { webR } = io.get(interpreter);
        // return webR.objs.globalEnv.bind(name, value);
    },
    deleteGlobal() {
        // UNSUPPORTED
        // const { webR } = io.get(interpreter);
        // return webR.objs.globalEnv.bind(name, void 0);
    },
    run(interpreter, code) {
        return this.runAsync(interpreter, code);
    },
    async runAsync(interpreter, code) {
        const ioHandler = io.get(interpreter);
        const { output, result } = await interpreter.captureR(code);
        for (const { type, data } of output)
            ioHandler[type](data);
        return result;
    },
    writeFile: (interpreter, path, buffer) => {
        const { webR } = io.get(interpreter);
        return writeFile$1(webR.FS, path, buffer);
    },
};
/* c8 ignore stop */

// ⚠️ Part of this file is automatically generated
//    The :RUNTIMES comment is a delimiter and no code should be written/changed after
//    See rollup/build_interpreters.cjs to know more


/** @type {Map<string, object>} */
const registry$1 = new Map();

/** @type {Map<string, object>} */
const configs = new Map();

/** @type {string[]} */
const selectors = [];

/** @type {string[]} */
const prefixes = [];

const interpreter = new Proxy(new Map(), {
    get(map, id) {
        if (!map.has(id)) {
            const [type, ...rest] = id.split("@");
            const interpreter = registry$1.get(type);
            const url = /^https?:\/\//i.test(rest)
                ? rest.join("@")
                : interpreter.module(...rest);
            map.set(id, {
                url,
                module: import(url),
                engine: interpreter.engine.bind(interpreter),
            });
        }
        const { url, module, engine } = map.get(id);
        return (config, baseURL) =>
            module.then((module) => {
                configs.set(id, config);
                const fetch = config?.fetch;
                if (fetch) base.set(fetch, baseURL);
                return engine(module, config, url);
            });
    },
});

const register = (interpreter) => {
    for (const type of [].concat(interpreter.type)) {
        registry$1.set(type, interpreter);
        selectors.push(`script[type="${type}"]`);
        prefixes.push(`${type}-`);
    }
};
for (const interpreter of [micropython, pyodide, ruby_wasm_wasi, wasmoon, webr])
    register(interpreter);

// lazy TOML parser (fast-toml might be a better alternative)
const TOML_LIB = `https://cdn.jsdelivr.net/npm/basic-toml@0.3.1/es.js`;

/**
 * @param {string} text TOML text to parse
 * @returns {object} the resulting JS object
 */
const parse = async (text) => (await import(TOML_LIB)).parse(text);

/**
 * @param {string} id the interpreter name @ version identifier
 * @param {string} [config] optional config file to parse
 * @returns
 */
const getRuntime = (id, config) => {
    let options = {};
    if (config) {
        // REQUIRES INTEGRATION TEST
        /* c8 ignore start */
        if (config.endsWith(".json")) {
            options = fetch(config).then(getJSON);
        } else if (config.endsWith(".toml")) {
            options = fetch(config).then(getText).then(parse);
        } else {
            try {
                options = JSON.parse(config);
            } catch (_) {
                options = parse(config);
            }
            // make the config a URL to be able to retrieve relative paths from it
            config = absoluteURL("./config.txt");
        }
        /* c8 ignore stop */
    }
    return resolve$1(options).then((options) => interpreter[id](options, config));
};

/**
 * @param {string} type the interpreter type
 * @param {string} [version] the optional interpreter version
 * @returns
 */
const getRuntimeID = (type, version = "") =>
    `${type}@${version}`.replace(/@$/, "");

const getRoot = (script) => {
    let parent = script;
    while (parent.parentNode) parent = parent.parentNode;
    return parent;
};

const queryTarget = (script, idOrSelector) => {
    const root = getRoot(script);
    return root.getElementById(idOrSelector) || $(idOrSelector, root);
};

const targets = new WeakMap();
const targetDescriptor = {
    get() {
        let target = targets.get(this);
        if (!target) {
            target = document.createElement(`${this.type}-script`);
            targets.set(this, target);
            handle(this);
        }
        return target;
    },
    set(target) {
        if (typeof target === "string")
            targets.set(this, queryTarget(this, target));
        else {
            targets.set(this, target);
            handle(this);
        }
    },
};

const handled = new WeakMap();

const interpreters = new Map();

const execute = async (script, source, XWorker, isAsync) => {
    const module = registry$1.get(script.type);
    /* c8 ignore next */
    if (module.experimental)
        console.warn(`The ${script.type} interpreter is experimental`);
    const [interpreter, content] = await all([
        handled.get(script).interpreter,
        source,
    ]);
    try {
        // temporarily override inherited document.currentScript in a non writable way
        // but it deletes it right after to preserve native behavior (as it's sync: no trouble)
        defineProperty(document, "currentScript", {
            configurable: true,
            get: () => script,
        });
        await module.setGlobal(interpreter, "XWorker", XWorker);
        return await module[isAsync ? "runAsync" : "run"](interpreter, content);
    } finally {
        delete document.currentScript;
        await module.deleteGlobal(interpreter, "XWorker");
    }
};

const getValue = (ref, prefix) => {
    const value = ref?.value;
    return value ? prefix + value : "";
};

const getDetails = (type, id, name, version, config) => {
    if (!interpreters.has(id)) {
        const details = {
            interpreter: getRuntime(name, config),
            queue: resolve$1(),
            XWorker: xworker(type, version),
        };
        interpreters.set(id, details);
        // enable sane defaults when single interpreter *of kind* is used in the page
        // this allows `xxx-*` attributes to refer to such interpreter without `env` around
        if (!interpreters.has(type)) interpreters.set(type, details);
    }
    return interpreters.get(id);
};

/**
 * @param {HTMLScriptElement} script a special type of <script>
 */
const handle = async (script) => {
    // known node, move its companion target after
    // vDOM or other use cases where the script is a tracked element
    if (handled.has(script)) {
        const { target } = script;
        if (target) {
            // if the script is in the head just append target to the body
            if (script.closest("head")) document.body.append(target);
            // in any other case preserve the script position
            else script.after(target);
        }
    }
    // new script to handle ... allow newly created scripts to work
    // just exactly like any other script would
    else {
        // allow a shared config among scripts, beside interpreter,
        // and/or source code with different config or interpreter
        const {
            attributes: { async: isAsync, config, env, target, version },
            src,
            type,
        } = script;
        const versionValue = version?.value;
        const name = getRuntimeID(type, versionValue);
        const targetValue = getValue(target, "");
        let configValue = getValue(config, "|");
        const id = getValue(env, "") || `${name}${configValue}`;
        configValue = configValue.slice(1);
        if (configValue) configValue = absoluteURL(configValue);
        const details = getDetails(type, id, name, versionValue, configValue);

        handled.set(
            defineProperty(script, "target", targetDescriptor),
            details,
        );

        if (targetValue) targets.set(script, queryTarget(script, targetValue));

        // start fetching external resources ASAP
        const source = src ? fetch(src).then(getText) : script.textContent;
        details.queue = details.queue.then(() =>
            execute(script, source, details.XWorker, !!isAsync),
        );
    }
};

// TODO: this is ugly; need to find a better way
defineProperty(globalThis, "pyscript", {
    value: {
        env: new Proxy(create(null), {
            get: (_, name) => awaitInterpreter(name),
        }),
    },
});

/* c8 ignore start */ // attributes are tested via integration / e2e
// ensure both interpreter and its queue are awaited then returns the interpreter
const awaitInterpreter = async (key) => {
    if (interpreters.has(key)) {
        const { interpreter, queue } = interpreters.get(key);
        return (await all([interpreter, queue]))[0];
    }

    const available = interpreters.size
        ? `Available interpreters are: ${[...interpreters.keys()]
              .map((r) => `"${r}"`)
              .join(", ")}.`
        : `There are no interpreters in this page.`;

    throw new Error(`The interpreter "${key}" was not found. ${available}`);
};

const listener = async (event) => {
    const { type, currentTarget } = event;
    for (let { name, value, ownerElement: el } of $x(
        `./@*[${prefixes.map((p) => `name()="${p}${type}"`).join(" or ")}]`,
        currentTarget,
    )) {
        name = name.slice(0, -(type.length + 1));
        const interpreter = await awaitInterpreter(
            el.getAttribute(`${name}-env`) || name,
        );
        const handler = registry$1.get(name);
        const run = () => handler.run(interpreter, value);
        try {
            const promise = handler.setGlobal(interpreter, "event", event);
            if (promise) {
                await promise();
                await run();
            }
            else run();
        } finally {
            await handler.deleteGlobal(interpreter, "event");
        }
    }
};

/**
 * Look for known prefixes and add related listeners.
 * @param {Document | Element} root
 */
const addAllListeners = (root) => {
    for (let { name, ownerElement: el } of $x(
        `.//@*[${prefixes
            .map((p) => `starts-with(name(),"${p}")`)
            .join(" or ")}]`,
        root,
    )) {
        name = name.slice(name.lastIndexOf("-") + 1);
        if (name !== "env") el.addEventListener(name, listener);
    }
};
/* c8 ignore stop */

const CUSTOM_SELECTORS = [];

/**
 * @typedef {Object} Runtime custom configuration
 * @prop {object} interpreter the bootstrapped interpreter
 * @prop {(url:string, options?: object) => Worker} XWorker an XWorker constructor that defaults to same interpreter on the Worker.
 * @prop {object} config a cloned config used to bootstrap the interpreter
 * @prop {(code:string) => any} run an utility to run code within the interpreter
 * @prop {(code:string) => Promise<any>} runAsync an utility to run code asynchronously within the interpreter
 * @prop {(path:string, data:ArrayBuffer) => void} writeFile an utility to write a file in the virtual FS, if available
 */

const types = new Map();
const waitList = new Map();

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
/**
 * @param {Element} node any DOM element registered via define.
 */
const handleCustomType = (node) => {
    for (const selector of CUSTOM_SELECTORS) {
        if (node.matches(selector)) {
            const type = types.get(selector);
            const { resolve } = waitList.get(type);
            const { options, known } = registry.get(type);
            if (!known.has(node)) {
                known.add(node);
                const {
                    interpreter: runtime,
                    version,
                    config,
                    env,
                    onRuntimeReady,
                } = options;
                const name = getRuntimeID(runtime, version);
                const id = env || `${name}${config ? `|${config}` : ""}`;
                const { interpreter: engine, XWorker: Worker } = getDetails(
                    runtime,
                    id,
                    name,
                    version,
                    config,
                );
                engine.then(async (interpreter) => {
                    const module = create(registry$1.get(runtime));

                    const {
                        onBeforeRun,
                        onBeforeRunAsync,
                        onAfterRun,
                        onAfterRunAsync,
                    } = options;

                    const hooks = new Hook(options);

                    const XWorker = function XWorker(...args) {
                        return Worker.apply(hooks, args);
                    };

                    // These two loops mimic a `new Map(arrayContent)` without needing
                    // the new Map overhead so that [name, [before, after]] can be easily destructured
                    // and new sync or async patches become easy to add (when the logic is the same).

                    // patch sync
                    for (const [name, [before, after]] of [
                        ["run", [onBeforeRun, onAfterRun]],
                    ]) {
                        const method = module[name];
                        module[name] = function (interpreter, code) {
                            if (before) before.call(this, resolved, node);
                            const result = method.call(this, interpreter, code);
                            if (after) after.call(this, resolved, node);
                            return result;
                        };
                    }

                    // patch async
                    for (const [name, [before, after]] of [
                        ["runAsync", [onBeforeRunAsync, onAfterRunAsync]],
                    ]) {
                        const method = module[name];
                        module[name] = async function (interpreter, code) {
                            if (before) await before.call(this, resolved, node);
                            const result = await method.call(
                                this,
                                interpreter,
                                code,
                            );
                            if (after) await after.call(this, resolved, node);
                            return result;
                        };
                    }

                    await module.setGlobal(interpreter, "XWorker", XWorker);

                    const resolved = {
                        type,
                        interpreter,
                        XWorker,
                        io: io$1.get(interpreter),
                        config: structuredClone(configs.get(name)),
                        run: module.run.bind(module, interpreter),
                        runAsync: module.runAsync.bind(module, interpreter),
                    };

                    resolve(resolved);

                    onRuntimeReady?.(resolved, node);
                });
            }
        }
    }
};

/**
 * @type {Map<string, {options:object, known:WeakSet<Element>}>}
 */
const registry = new Map();

/**
 * @typedef {Object} PluginOptions custom configuration
 * @prop {'pyodide' | 'micropython' | 'wasmoon' | 'ruby-wasm-wasi'} interpreter the interpreter to use
 * @prop {string} [version] the optional interpreter version to use
 * @prop {string} [config] the optional config to use within such interpreter
 * @prop {(environment: object, node: Element) => void} [onRuntimeReady] the callback that will be invoked once
 */

/**
 * Allows custom types and components on the page to receive interpreters to execute any code
 * @param {string} type the unique `<script type="...">` identifier
 * @param {PluginOptions} options the custom type configuration
 */
const define = (type, options) => {
    if (registry$1.has(type) || registry.has(type))
        throw new Error(`<script type="${type}"> already registered`);

    if (!registry$1.has(options?.interpreter))
        throw new Error(`Unspecified interpreter`);

    // allows reaching out the interpreter helpers on events
    registry$1.set(type, registry$1.get(options?.interpreter));

    // ensure a Promise can resolve once a custom type has been bootstrapped
    whenDefined(type);

    // allows selector -> registry by type
    const selectors = [`script[type="${type}"]`, `${type}-script`];
    for (const selector of selectors) types.set(selector, type);

    CUSTOM_SELECTORS.push(...selectors);
    prefixes.push(`${type}-`);

    // ensure always same env for this custom type
    registry.set(type, {
        options: assign({ env: type }, options),
        known: new WeakSet(),
    });

    addAllListeners(document);
    $$(selectors.join(",")).forEach(handleCustomType);
};

/**
 * Resolves whenever a defined custom type is bootstrapped on the page
 * @param {string} type the unique `<script type="...">` identifier
 * @returns {Promise<object>}
 */
const whenDefined = (type) => {
    if (!waitList.has(type)) waitList.set(type, Promise.withResolvers());
    return waitList.get(type).promise;
};
/* c8 ignore stop */

const INTERPRETER_SELECTORS = selectors.join(",");

const mo = new MutationObserver((records) => {
    for (const { type, target, attributeName, addedNodes } of records) {
        // attributes are tested via integration / e2e
        /* c8 ignore next 17 */
        if (type === "attributes") {
            const i = attributeName.lastIndexOf("-") + 1;
            if (i) {
                const prefix = attributeName.slice(0, i);
                for (const p of prefixes) {
                    if (prefix === p) {
                        const type = attributeName.slice(i);
                        if (type !== "env") {
                            const method = target.hasAttribute(attributeName)
                                ? "add"
                                : "remove";
                            target[`${method}EventListener`](type, listener);
                        }
                        break;
                    }
                }
            }
            continue;
        }
        for (const node of addedNodes) {
            if (node.nodeType === 1) {
                addAllListeners(node);
                if (node.matches(INTERPRETER_SELECTORS)) handle(node);
                else {
                    $$(INTERPRETER_SELECTORS, node).forEach(handle);
                    if (!CUSTOM_SELECTORS.length) continue;
                    handleCustomType(node);
                    $$(CUSTOM_SELECTORS.join(","), node).forEach(
                        handleCustomType,
                    );
                }
            }
        }
    }
});

const observe = (root) => {
    mo.observe(root, { childList: true, subtree: true, attributes: true });
    return root;
};

const { attachShadow } = Element.prototype;
assign(Element.prototype, {
    attachShadow(init) {
        return observe(attachShadow.call(this, init));
    },
});

addAllListeners(observe(document));
$$(INTERPRETER_SELECTORS, document).forEach(handle);

/**
 * These error codes are used to identify the type of error that occurred.
 * @see https://docs.pyscript.net/latest/reference/exceptions.html?highlight=errors
 */
const ErrorCode = {
    GENERIC: "PY0000", // Use this only for development then change to a more specific error code
    FETCH_ERROR: "PY0001",
    FETCH_NAME_ERROR: "PY0002",
    // Currently these are created depending on error code received from fetching
    FETCH_UNAUTHORIZED_ERROR: "PY0401",
    FETCH_FORBIDDEN_ERROR: "PY0403",
    FETCH_NOT_FOUND_ERROR: "PY0404",
    FETCH_SERVER_ERROR: "PY0500",
    FETCH_UNAVAILABLE_ERROR: "PY0503",
    BAD_CONFIG: "PY1000",
    MICROPIP_INSTALL_ERROR: "PY1001",
    BAD_PLUGIN_FILE_EXTENSION: "PY2000",
    NO_DEFAULT_EXPORT: "PY2001",
    TOP_LEVEL_AWAIT: "PY9000",
};

class UserError extends Error {
    constructor(errorCode, message = "", messageType = "text") {
        super(`(${errorCode}): ${message}`);
        this.errorCode = errorCode;
        this.messageType = messageType;
        this.name = "UserError";
    }
}

class FetchError extends UserError {
    constructor(errorCode, message) {
        super(errorCode, message);
        this.name = "FetchError";
    }
}

/**
 * This is a fetch wrapper that handles any non 200 responses and throws a
 * FetchError with the right ErrorCode. This is useful because our FetchError
 * will automatically create an alert banner.
 *
 * @param {string} url - URL to fetch
 * @param {Request} [options] - options to pass to fetch
 * @returns {Promise<Response>}
 */
async function robustFetch(url, options) {
    let response;

    // Note: We need to wrap fetch into a try/catch block because fetch
    // throws a TypeError if the URL is invalid such as http://blah.blah
    try {
        response = await fetch(url, options);
    } catch (err) {
        const error = err;
        let errMsg;
        if (url.startsWith("http")) {
            errMsg =
                `Fetching from URL ${url} failed with error ` +
                `'${error.message}'. Are your filename and path correct?`;
        } else {
            errMsg = `PyScript: Access to local files
        (using [[fetch]] configurations in &lt;py-config&gt;)
        is not available when directly opening a HTML file;
        you must use a webserver to serve the additional files.
        See <a style="text-decoration: underline;" href="https://github.com/pyscript/pyscript/issues/257#issuecomment-1119595062">this reference</a>
        on starting a simple webserver with Python.
            `;
        }
        throw new FetchError(ErrorCode.FETCH_ERROR, errMsg);
    }

    // Note that response.ok is true for 200-299 responses
    if (!response.ok) {
        const errorMsg = `Fetching from URL ${url} failed with error ${response.status} (${response.statusText}). Are your filename and path correct?`;
        switch (response.status) {
            case 404:
                throw new FetchError(ErrorCode.FETCH_NOT_FOUND_ERROR, errorMsg);
            case 401:
                throw new FetchError(
                    ErrorCode.FETCH_UNAUTHORIZED_ERROR,
                    errorMsg,
                );
            case 403:
                throw new FetchError(ErrorCode.FETCH_FORBIDDEN_ERROR, errorMsg);
            case 500:
                throw new FetchError(ErrorCode.FETCH_SERVER_ERROR, errorMsg);
            case 503:
                throw new FetchError(
                    ErrorCode.FETCH_UNAVAILABLE_ERROR,
                    errorMsg,
                );
            default:
                throw new FetchError(ErrorCode.FETCH_ERROR, errorMsg);
        }
    }
    return response;
}

// append ASAP CSS to avoid showing content
document.head.appendChild(document.createElement("style")).textContent = `
  py-script, py-config {
    display: none;
  }
`;

(async () => {
    // create a unique identifier when/if needed
    let id = 0;
    const getID = (prefix = "py") => `${prefix}-${id++}`;

    // find the shared config for all py-script elements
    let config;
    let pyConfig = $("py-config");
    if (pyConfig) config = pyConfig.getAttribute("src") || pyConfig.textContent;
    else {
        pyConfig = $('script[type="py"]');
        config = pyConfig?.getAttribute("config");
    }

    if (/^https?:\/\//.test(config)) config = await robustFetch(config).then(getText);

    // generic helper to disambiguate between custom element and script
    const isScript = (element) => element.tagName === "SCRIPT";

    // helper for all script[type="py"] out there
    const before = (script) => {
        defineProperty(document, "currentScript", {
            configurable: true,
            get: () => script,
        });
    };

    const after = () => {
        delete document.currentScript;
    };

    /**
     * Given a generic DOM Element, tries to fetch the 'src' attribute, if present.
     * It either throws an error if the 'src' can't be fetched or it returns a fallback
     * content as source.
     */
    const fetchSource = async (tag) => {
        if (tag.hasAttribute("src")) {
            try {
                const response = await robustFetch(tag.getAttribute("src"));
                return response.then(getText);
            } catch (error) {
                // TODO _createAlertBanner(err) instead ?
                alert(error.message);
                throw error;
            }
        }
        return tag.textContent;
    };

    // common life-cycle handlers for any node
    const bootstrapNodeAndPlugins = (pyodide, element, callback, hook) => {
        if (isScript(element)) callback(element);
        for (const fn of hooks[hook]) fn(pyodide, element);
    };

    const addDisplay = (element) => {
        const id = isScript(element) ? element.target.id : element.id;
        return `
            # this code is just for demo purpose but the basics work
            def _display(what, target="${id}", append=True):
                from js import document
                element = document.getElementById(target)
                element.textContent = what
            display = _display
        `;
    };

    // define the module as both `<script type="py">` and `<py-script>`
    define("py", {
        config,
        env: "py-script",
        interpreter: "pyodide",
        codeBeforeRunWorker() {
            return [...hooks.codeBeforeRunWorker].join("\n");
        },
        codeAfterRunWorker() {
            return [...hooks.codeAfterRunWorker].join("\n");
        },
        onBeforeRun(pyodide, element) {
            bootstrapNodeAndPlugins(pyodide, element, before, "onBeforeRun");
            pyodide.interpreter.runPython(addDisplay(element));
        },
        onBeforeRunAync(pyodide, element) {
            pyodide.interpreter.runPython(addDisplay(element));
            bootstrapNodeAndPlugins(
                pyodide,
                element,
                before,
                "onBeforeRunAync",
            );
        },
        onAfterRun(pyodide, element) {
            bootstrapNodeAndPlugins(pyodide, element, after, "onAfterRun");
        },
        onAfterRunAsync(pyodide, element) {
            bootstrapNodeAndPlugins(pyodide, element, after, "onAfterRunAsync");
        },
        async onRuntimeReady(pyodide, element) {
            // allows plugins to do whatever they want with the element
            // before regular stuff happens in here
            for (const callback of hooks.onRuntimeReady)
                callback(pyodide, element);
            if (isScript(element)) {
                const {
                    attributes: { async: isAsync, target },
                } = element;
                const hasTarget = !!target?.value;
                const show = hasTarget
                    ? queryTarget(target.value)
                    : document.createElement("script-py");

                if (!hasTarget) element.after(show);
                if (!show.id) show.id = getID();

                // allows the code to retrieve the target element via
                // document.currentScript.target if needed
                defineProperty(element, "target", { value: show });

                pyodide[`run${isAsync ? "Async" : ""}`](
                    await fetchSource(element),
                );
            } else {
                // resolve PyScriptElement to allow connectedCallback
                element._pyodide.resolve(pyodide);
            }
        },
    });

    class PyScriptElement extends HTMLElement {
        constructor() {
            if (!super().id) this.id = getID();
            this._pyodide = Promise.withResolvers();
            this.srcCode = "";
            this.executed = false;
        }
        async connectedCallback() {
            if (!this.executed) {
                this.executed = true;
                const { run } = await this._pyodide.promise;
                this.srcCode = await fetchSource(this);
                this.textContent = "";
                const result = run(this.srcCode);
                if (!this.textContent && result) this.textContent = result;
                this.style.display = "block";
            }
        }
    }

    customElements.define("py-script", PyScriptElement);
})();

const hooks = {
    /** @type {Set<function>} */
    onBeforeRun: new Set(),
    /** @type {Set<function>} */
    onBeforeRunAync: new Set(),
    /** @type {Set<function>} */
    onAfterRun: new Set(),
    /** @type {Set<function>} */
    onAfterRunAsync: new Set(),
    /** @type {Set<function>} */
    onRuntimeReady: new Set(),

    /** @type {Set<string>} */
    codeBeforeRunWorker: new Set(),
    /** @type {Set<string>} */
    codeBeforeRunWorkerAsync: new Set(),
    /** @type {Set<string>} */
    codeAfterRunWorker: new Set(),
    /** @type {Set<string>} */
    codeAfterRunWorkerAsync: new Set(),
};

export { hooks };
