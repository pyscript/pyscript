/**
 * this file mocks python files that are not explicitly
 * matched by a regex in jest.config.js, since importing of
 * `.py` files isn't usually supported inside JS/TS files.
 *
 * This is needed since the imported object is further
 * passed to a function which only accepts a string.
 *
 * The mocked contents of the `.py` file will be "", e.g.
 * nothing.
 */

 console.warn(`.py files that are not explicitly mocked in \
 jest.config.js and /__mocks__/ are mocked as empty strings`);

 module.exports = "";
