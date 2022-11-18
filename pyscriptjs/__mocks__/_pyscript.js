/**
 * this file mocks the `src/python/pyscript.py` file
 * since importing of `.py` files isn't usually supported
 * inside JS/TS files.
 *
 * It sets the value of whatever is imported from
 * `src/python/pyscript.py` the contents of that file
 *
 * This is needed since the imported object is further
 * passed to a function which only accepts a string.
 */

const fs = require('fs');
module.exports = fs.readFileSync('./src/python/pyscript.py', 'utf8');
