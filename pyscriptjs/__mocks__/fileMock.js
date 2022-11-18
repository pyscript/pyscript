/**
 * this file mocks python files that are not explicitly
 * match by a regex in jest.config.js importing of
 * `.py` files isn't usually supported inside JS/TS files.
 *
 * It sets the value of whatever is import from that
 * python file to ""
 *
 * This is needed since the imported object is further
 * passed to a function which only accepts a string.
 */

 console.warn(`.py files that are not explicitly mocked in \
 jest.config.js and /__mocks__/ are mocked as empty strings`)

 module.exports = ""
