/*! (c) PyScript Development Team */

const { stringify } = JSON;
const { create, entries } = Object;

/**
 * Transform a list of keys into a Python dictionary.
 * `['a', 'b']` => `{ "a": a, "b": b }`
 * @param {Iterable<string>} keys
 * @returns {string}
 */
const dictionary = keys => {
  const fields = [];
  for (const key of keys)
    fields.push(`${stringify(key)}: ${key}`);
  return `{ ${fields.join(',')} }`;
};

/**
 * Resolve properly config files relative URLs.
 * @param {string|Object} config - The configuration to normalize.
 * @param {string} base - The base URL to resolve relative URLs against.
 * @returns {string} - The JSON serialized config.
 */
const normalize = async (config, base) => {
  if (typeof config === 'string') {
    base = config;
    config = await fetch(config).then(res => res.json());
  }
  if (typeof config.files === 'object') {
    const files = {};
    for (const [key, value] of entries(config.files)) {
      files[key.startsWith('{') ? key : new URL(key, base)] = value;
    }
    config.files = files;
  }
  return stringify(config);
};

// this logic is based on a 3 levels cache ...
const cache = new Map;

/**
 * Return a bridge to a Python module via a `.js` file that has a `.py` alter ego.
 * @param {string} url - The URL of the JS module that has a Python counterpart.
 * @param {Object} options - The options for the bridge.
 * @param {string} [options.type='py'] - The `py` or `mpy` interpreter type, `py` by default.
 * @param {boolean} [options.worker=true] - Whether to use a worker, `true` by default.
 * @param {string|Object} [options.config=null] - The configuration for the bridge, `null` by default.
 * @param {string} [options.env=null] - The optional shared environment to use.
 * @param {string} [options.serviceWorker=null] - The optional service worker to use as fallback.
 * @returns {Object} - The bridge to the Python module.
 */
export default (url, {
  type = 'py',
  worker = true,
  config = null,
  env = null,
  serviceWorker = null,
} = {}) => {
  const { protocol, host, pathname } = new URL(url);
  const py = pathname.replace(/\.m?js(?:\/\+\w+)?$/, '.py');
  const file = `${protocol}//${host}${py}`;

  // the first cache is about the desired file in the wild ...
  if (!cache.has(file)) {
    // the second cache is about all fields one needs to access out there
    const exports = new Map;
    let python;

    cache.set(file, new Proxy(create(null), {
      get(_, field) {
        if (!exports.has(field)) {
          // create an async callback once and always return the same later on
          exports.set(field, async (...args) => {
            // the third cache is about reaching lazily the code only once
            // augmenting its content with exports once and drop it on done
            if (!python) {
              // do not await or multiple calls will fetch multiple times
              // just assign the fetch `Promise` once and return it
              python = fetch(file).then(async response => {
                const code = await response.text();
                // create a unique identifier for the Python context
                const identifier = pathname.replace(/[^a-zA-Z0-9_]/g, '');
                const name = `__pyscript_${identifier}${Date.now()}`;
                // create a Python dictionary with all accessed fields
                const detail = `{"detail":${dictionary(exports.keys())}}`;
                // create the arguments for the `dispatchEvent` call
                const eventArgs = `${stringify(name)},${name}to_ts(${detail})`;
                // bootstrap the script element type and its attributes
                const script = document.createElement('script');
                script.type = type;

                // if config is provided it needs to be a worker to avoid
                // conflicting with main config on the main thread (just like always)
                script.toggleAttribute('worker', !!config || !!worker);
                if (config) {
                  const attribute = await normalize(config, file);
                  script.setAttribute('config', attribute);
                }

                if (env) script.setAttribute('env', env);
                if (serviceWorker) script.setAttribute('service-worker', serviceWorker);

                // augment the code with the previously accessed fields at the end
                script.textContent = [
                  '\n', code, '\n',
                  // this is to avoid local scope name clashing
                  `from pyscript import window as ${name}`,
                  `from pyscript.ffi import to_js as ${name}to_ts`,
                  `${name}.dispatchEvent(${name}.CustomEvent.new(${eventArgs}))`,
                  // remove these references even if non-clashing to keep
                  // the local scope clean from undesired entries
                  `del ${name}`,
                  `del ${name}to_ts`,
                ].join('\n');

                // let PyScript resolve and execute this script
                document.body.appendChild(script);

                // intercept once the unique event identifier with all exports
                globalThis.addEventListener(
                  name,
                  event => {
                    resolve(event.detail);
                    script.remove();
                  },
                  { once: true }
                );

                // return a promise that will resolve only once the event
                // has been emitted and the interpreter evaluated the code
                const { promise, resolve } = Promise.withResolvers();

                // ⚠️ This is just a *fallback* !!!
                //     Please always use an explicit PyScript release !!!
                if (!(Symbol.for('@pyscript/core') in globalThis)) {
                  // bring in PyScript via the `npm` developers' channel
                  const cdn = 'https://cdn.jsdelivr.net/npm/@pyscript/core/dist';
                  document.head.appendChild(
                    Object.assign(
                      document.createElement('link'),
                      {
                        rel: 'stylesheet',
                        href: `${cdn}/core.css`,
                      }
                    )
                  );
                  try { await import(`${cdn}/core.js`) }
                  catch {}
                }
                return promise;
              });
            }

            // return the `Promise` that will after invoke the exported field
            return python.then(foreign => foreign[field](...args));
          });
        }

        // return the lazily to be resolved once callback to invoke
        return exports.get(field);
      }
    }));
  }

  return cache.get(file);
};
