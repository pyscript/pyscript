/** @type {any} The PyScript configuration parsed from the JSON or TOML object*. May be any of the return types of JSON.parse() ( {number | string | boolean | null | object | Array} */
declare let parsed: any;
/** @type {Promise<any> | undefined} A Promise wrapping any plugins which should be loaded. */
export let plugins: Promise<any> | undefined;
/** @type {SyntaxError | undefined} The error thrown when parsing the PyScript config, if any.*/
export let error: SyntaxError | undefined;
export { parsed as config };
