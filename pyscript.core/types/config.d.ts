/** @type {any} The configuration parsed as a JSON object or similar. (Return type of JSON.parse is something like {number | string | boolean | null | object | Array}; TS by default gives up and says 'any')*/
declare let parsed: any;
/** @type {Promise<any> | undefined} A Promise wrapping any plugins which should be loaded */
export let plugins: Promise<any> | undefined;
/** @type {SyntaxError | undefined} The error thrown when parsing the config, if any.*/
export let error: SyntaxError | undefined;
export { parsed as config };
