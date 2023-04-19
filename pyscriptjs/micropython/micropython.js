
var _createMicropythonModule = (() => {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  if (typeof __filename !== 'undefined') _scriptDir = _scriptDir || __filename;
  return (
function(config) {
  var _createMicropythonModule = config || {};



// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof _createMicropythonModule != 'undefined' ? _createMicropythonModule : {};

// See https://caniuse.com/mdn-javascript_builtins_object_assign

// See https://caniuse.com/mdn-javascript_builtins_bigint64array

// Set up the promise that indicates the Module is initialized
var readyPromiseResolve, readyPromiseReject;
Module['ready'] = new Promise(function(resolve, reject) {
  readyPromiseResolve = resolve;
  readyPromiseReject = reject;
});
["_mp_js_init","_mp_js_init_repl","_mp_js_do_str","_mp_js_process_char","_mp_hal_get_interrupt_char","_mp_sched_keyboard_interrupt","_mp_obj_new_str","_mp_obj_new_int","_mp_obj_new_float","_mp_obj_int_from_bytes_impl","_malloc","_free","_raise_js_exception","_record_traceback","__js2python_none","__js2python_true","__js2python_false","_JsProxy_new","_pyimport","_pyproxy_getflags","__pyproxy_repr","__pyproxy_type","__pyproxy_hasattr","__pyproxy_getattr","__pyproxy_setattr","__pyproxy_delattr","__pyproxy_getitem","__pyproxy_setitem","__pyproxy_delitem","__pyproxy_contains","__pyproxy_ownKeys","__pyproxy_apply","_pyproxy_decref","_fflush","onRuntimeInitialized"].forEach((prop) => {
  if (!Object.getOwnPropertyDescriptor(Module['ready'], prop)) {
    Object.defineProperty(Module['ready'], prop, {
      get: () => abort('You are getting ' + prop + ' on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'),
      set: () => abort('You are setting ' + prop + ' on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'),
    });
  }
});

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
const Hiwire = {};
const Tests = {};
const API = {};
Module.hiwire = Hiwire;
API.fatal_error = function (e) {
  console.warn("fatal error!");
  throw e;
};
Module.API = API;
const getTypeTag = (x) => Object.prototype.toString.call(x);

const _whitespace_only_re = /^[ \t]+$/gm;
const _leading_whitespace_re = /(^[ \t]*)(?:[^ \t\n])/gm;
/*
Remove any common leading whitespace from every line in `text`.

This can be used to make triple-quoted strings line up with the left
edge of the display, while still presenting them in the source code
in indented form.

Note that tabs and spaces are both treated as whitespace, but they
are not equal: the lines "  hello" and "\\thello" are
considered to have no common leading whitespace.

Entirely blank lines are normalized to a newline character.
*/
API.dedent = function (text) {
  // Look for the longest leading string of spaces and tabs common to
  // all lines.
  let margin;
  text = text.replaceAll(_whitespace_only_re, "");
  for (let [_, indent] of text.matchAll(_leading_whitespace_re)) {
    if (margin === undefined) {
      margin = indent;
      continue;
    }
    if (indent.startsWith(margin)) {
      // Current line more deeply indented than previous winner:
      // no change (previous winner is still on top).
      continue;
    }
    if (margin.startsWith(indent)) {
      // Current line consistent with and no deeper than previous winner:
      // it's the new winner.
      margin = indent;
      continue;
    }
    // Find the largest common whitespace between current line and previous
    // winner.
    for (let i = 0; i < margin.length; i++) {
      if (margin[i] != indent[i]) {
        margin = margin.slice(0, i);
        break;
      }
    }
  }
  if (margin) {
    text = text.replaceAll(RegExp("^" + margin, "mg"), "");
  }
  return text;
};

class PythonError extends Error {}

function setName(errClass) {
  Object.defineProperty(errClass.prototype, "name", {
    value: errClass.name,
  });
}
setName(PythonError);

function throw_if_error() {
  const python_tb = API.python_tb;
  API.python_tb = undefined;
  if (python_tb) {
    throw new PythonError(python_tb);
  }
}
API.throw_if_error = throw_if_error;

API.handle_js_error = function (e) {
  const name_utf8 = stringToNewUTF8(e.name);
  const message_utf8 = stringToNewUTF8(e.message);
  const stack_utf8 = stringToNewUTF8(e.stack);
  try {
    _raise_js_exception(name_utf8, message_utf8, stack_utf8);
  } finally {
    _free(name_utf8);
    _free(message_utf8);
    _free(stack_utf8);
  }
};

const IN_NODE = false;
/**
 * We call refreshStreams at the end of every update method, but refreshStreams
 * won't work until initializeStreams is called. So when INITIALIZED is false,
 * refreshStreams is a no-op.
 * @private
 */
let INITIALIZED = false;
// These can't be used until they are initialized by initializeStreams.
const ttyout_ops = {};
const ttyerr_ops = {};
const isattys = {};
/**
 * This is called at the end of loadPyodide to set up the streams. If
 * loadPyodide has been given stdin, stdout, stderr arguments they are provided
 * here. Otherwise, we set the default behaviors. This also fills in the global
 * state in this file.
 * @param stdin
 * @param stdout
 * @param stderr
 * @private
 */
API.initializeStreams = function (stdin, stdout, stderr) {
  setStdin({ stdin: stdin });
  if (stdout) {
    setStdout({ batched: stdout });
  } else {
    setDefaultStdout();
  }
  if (stderr) {
    setStderr({ batched: stderr });
  } else {
    setDefaultStderr();
  }
  // 5.0 and 6.0 are the device numbers that Emscripten uses (see library_fs.js).
  // These haven't changed in ~10 years. If we used different ones nothing would
  // break.
  var ttyout_dev = FS.makedev(5, 0);
  var ttyerr_dev = FS.makedev(6, 0);
  TTY.register(ttyout_dev, ttyout_ops);
  TTY.register(ttyerr_dev, ttyerr_ops);
  INITIALIZED = true;
  refreshStreams();
};
const textencoder = new TextEncoder();
const textdecoder = new TextDecoder();

function refreshStreams() {
  if (!INITIALIZED) {
    return;
  }
  FS.unlink("/dev/stdin");
  FS.unlink("/dev/stdout");
  FS.unlink("/dev/stderr");
  if (isattys.stdin) {
    FS.symlink("/dev/tty", "/dev/stdin");
  } else {
    FS.createDevice("/dev", "stdin", ttyout_ops.get_char);
  }
  if (isattys.stdout) {
    FS.symlink("/dev/tty", "/dev/stdout");
  } else {
    FS.createDevice(
      "/dev",
      "stdout",
      null,
      ttyout_ops.put_char.bind(undefined, undefined)
    );
  }
  if (isattys.stderr) {
    FS.symlink("/dev/tty", "/dev/stderr");
  } else {
    FS.createDevice(
      "/dev",
      "stderr",
      null,
      ttyerr_ops.put_char.bind(undefined, undefined)
    );
  }
  // Refresh std streams so they use our new versions
  FS.closeStream(0 /* stdin */);
  FS.closeStream(1 /* stdout */);
  FS.closeStream(2 /* stderr */);
  FS.open("/dev/stdin", 0 /* write only */);
  FS.open("/dev/stdout", 1 /* read only */);
  FS.open("/dev/stderr", 1 /* read only */);
}
/**
 * Sets the default stdin. If in node, stdin will read from `process.stdin`
 * and isatty(stdin) will be set to tty.isatty(process.stdin.fd).
 * If in a browser, this calls setStdinError.
 */
function setDefaultStdin() {
  if (IN_NODE) {
    var BUFSIZE_1 = 256;
    var buf_1 = Buffer.alloc(BUFSIZE_1);
    var fs_1 = require("fs");
    var tty = require("tty");
    var stdin = function () {
      var bytesRead;
      try {
        bytesRead = fs_1.readSync(process.stdin.fd, buf_1, 0, BUFSIZE_1, -1);
      } catch (e) {
        // Platform differences: on Windows, reading EOF throws an exception,
        // but on other OSes, reading EOF returns 0. Uniformize behavior by
        // catching the EOF exception and returning 0.
        if (e.toString().includes("EOF")) {
          bytesRead = 0;
        } else {
          throw e;
        }
      }
      if (bytesRead === 0) {
        return null;
      }
      return buf_1.subarray(0, bytesRead);
    };
    var isatty = tty.isatty(process.stdin.fd);
    setStdin({ stdin: stdin, isatty: isatty });
  } else {
    setStdinError();
  }
}
/**
 * Sets isatty(stdin) to false and makes reading from stdin always set an EIO
 * error.
 */
function setStdinError() {
  isattys.stdin = false;
  var get_char = function () {
    throw 0;
  };
  ttyout_ops.get_char = get_char;
  ttyerr_ops.get_char = get_char;
  refreshStreams();
}
/**
 * Set a stdin handler.
 *
 * The stdin handler is called with zero arguments whenever stdin is read and
 * the current input buffer is exhausted. It should return one of:
 *
 * - :js:data:`null` or :js:data:`undefined`: these are interpreted as end of file.
 * - a number
 * - a string
 * - an :js:class:`ArrayBuffer` or :js:class:`TypedArray` with
 *   :js:data:`~TypedArray.BYTES_PER_ELEMENT` equal to 1.
 *
 * If a number is returned, it is interpreted as a single character code. The
 * number should be between 0 and 255.
 *
 * If a string is returned, a new line is appended if one is not present and the
 * resulting string is turned into a :js:class:`Uint8Array` using
 * :js:class:`TextEncoder`.
 *
 * Returning a buffer is more efficient and allows returning partial lines of
 * text.
 *
 * @param options.stdin The stdin handler.
 * @param options.error If this is set to ``true``, attempts to read from stdin
 * will always set an IO error.
 * @param options.isatty Should :py:func:`isatty(stdin) <os.isatty>` be ``true``
 * or ``false`` (default ``false``).
 * @param options.autoEOF Insert an EOF automatically after each string or
 * buffer? (default ``true``).
 */
function setStdin(options) {
  if (options === void 0) {
    options = {};
  }
  if (options.stdin && options.error) {
    throw new TypeError(
      "Both a stdin handler provided and the error argument was set"
    );
  }
  if (options.error) {
    setStdinError();
    return;
  }
  if (options.stdin) {
    var autoEOF = options.autoEOF;
    autoEOF = autoEOF === undefined ? true : autoEOF;
    isattys.stdin = !!options.isatty;
    var get_char = make_get_char(options.stdin, autoEOF);
    ttyout_ops.get_char = get_char;
    ttyerr_ops.get_char = get_char;
    refreshStreams();
    return;
  }
  setDefaultStdin();
}
API.setStdin = setStdin;

/**
 * If in node, sets stdout to write directly to process.stdout and sets isatty(stdout)
 * to tty.isatty(process.stdout.fd).
 * If in a browser, sets stdout to write to console.log and sets isatty(stdout) to false.
 */
function setDefaultStdout() {
  if (IN_NODE) {
    var tty = require("tty");
    var raw = function (x) {
      return process.stdout.write(Buffer.from([x]));
    };
    var isatty = tty.isatty(process.stdout.fd);
    setStdout({ raw: raw, isatty: isatty });
  } else {
    setStdout({
      batched: function (x) {
        return console.log(x);
      },
    });
  }
}
/**
 * Sets the standard out handler. A batched handler or a raw handler can be
 * provided (both not both). If neither is provided, we restore the default
 * handler.
 *
 * @param options.batched A batched handler is called with a string whenever a
 * newline character is written is written or stdout is flushed. In the former
 * case, the received line will end with a newline, in the latter case it will
 * not.
 * @param options.raw A raw handler is called with the handler is called with a
 * `number` for each byte of the output to stdout.
 * @param options.isatty Should :py:func:`isatty(stdout) <os.isatty>` return
 * ``true`` or ``false``. Can only be set to ``true`` if a raw handler is
 * provided (default ``false``).
 */
function setStdout(options) {
  if (options === void 0) {
    options = {};
  }
  if (options.raw && options.batched) {
    throw new TypeError("Both a batched handler and a raw handler provided");
  }
  if (!options.raw && options.isatty) {
    throw new TypeError(
      "Cannot set isatty to true unless a raw handler is provided"
    );
  }
  if (options.raw) {
    isattys.stdout = !!options.isatty;
    Object.assign(ttyout_ops, make_unbatched_put_char(options.raw));
    refreshStreams();
    return;
  }
  if (options.batched) {
    isattys.stdout = false;
    Object.assign(ttyout_ops, make_batched_put_char(options.batched));
    refreshStreams();
    return;
  }
  setDefaultStdout();
}
API.setStdout = setStdout;

/**
 * If in node, sets stderr to write directly to process.stderr and sets isatty(stderr)
 * to tty.isatty(process.stderr.fd).
 * If in a browser, sets stderr to write to console.warn and sets isatty(stderr) to false.
 */
function setDefaultStderr() {
  if (IN_NODE) {
    var tty = require("tty");
    var raw = function (x) {
      return process.stderr.write(Buffer.from([x]));
    };
    var isatty = tty.isatty(process.stderr.fd);
    setStderr({ raw: raw, isatty: isatty });
  } else {
    setStderr({
      batched: function (x) {
        return console.warn(x);
      },
    });
  }
}
/**
 * Sets the standard error handler. A batched handler or a raw handler can be
 * provided (both not both). If neither is provided, we restore the default
 * handler.
 *
 * @param options.batched A batched handler is called with a string whenever a
 * newline character is written is written or stderr is flushed. In the former
 * case, the received line will end with a newline, in the latter case it will
 * not. isatty(stderr) is set to false (when using a batched handler, stderr is
 * buffered so it is impossible to make a tty with it).
 * @param options.raw A raw handler is called with the handler is called with a
 * `number` for each byte of the output to stderr.
 * @param options.isatty Should :py:func:`isatty(stderr) <os.isatty>` return
 * ``true`` or ``false``. Can only be set to ``true`` if a raw handler is
 * provided (default ``false``).
 */
function setStderr(options) {
  if (options === void 0) {
    options = {};
  }
  if (options.raw && options.batched) {
    throw new TypeError("Both a batched handler and a raw handler provided");
  }
  if (!options.raw && options.isatty) {
    throw new TypeError(
      "Cannot set isatty to true unless a raw handler is provided"
    );
  }
  if (options.raw) {
    isattys.stderr = !!options.isatty;
    Object.assign(ttyerr_ops, make_unbatched_put_char(options.raw));
    refreshStreams();
    return;
  }
  if (options.batched) {
    isattys.stderr = false;
    Object.assign(ttyerr_ops, make_batched_put_char(options.batched));
    refreshStreams();
    return;
  }
  setDefaultStderr();
}
API.setStderr = setStderr;


function make_get_char(infunc, autoEOF) {
  var index = 0;
  var buf = new Uint8Array(0);
  var insertEOF = false;
  // get_char has 3 particular return values:
  // a.) the next character represented as an integer
  // b.) undefined to signal that no data is currently available
  // c.) null to signal an EOF
  return function get_char() {
    try {
      if (index >= buf.length) {
        if (insertEOF) {
          insertEOF = false;
          return null;
        }
        var input = infunc();
        if (input === undefined || input === null) {
          return null;
        }
        if (typeof input === "number") {
          return input;
        } else if (typeof input === "string") {
          if (!input.endsWith("\n")) {
            input += "\n";
          }
          buf = textencoder.encode(input);
        } else if (ArrayBuffer.isView(input)) {
          if (input.BYTES_PER_ELEMENT !== 1) {
            throw new Error("Expected BYTES_PER_ELEMENT to be 1");
          }
          buf = input;
        } else if (
          Object.prototype.toString.call(input) === "[object ArrayBuffer]"
        ) {
          buf = new Uint8Array(input);
        } else {
          throw new Error(
            "Expected result to be undefined, null, string, array buffer, or array buffer view"
          );
        }
        if (buf.length === 0) {
          return null;
        }
        if (autoEOF) {
          insertEOF = true;
        }
        index = 0;
      }
      return buf[index++];
    } catch (e) {
      // emscripten will catch this and set an IOError which is unhelpful for
      // debugging.
      console.error("Error thrown in stdin:");
      console.error(e);
      throw e;
    }
  };
}
function make_unbatched_put_char(out) {
  return {
    put_char: function (tty, val) {
      out(val);
    },
    fsync: function () {},
  };
}
function make_batched_put_char(out) {
  var output = [];
  return {
    // get_char has 3 particular return values:
    // a.) the next character represented as an integer
    // b.) undefined to signal that no data is currently available
    // c.) null to signal an EOF,
    put_char: function (tty, val) {
      if (val === null || val === 10 /* charCode('\n') */) {
        let end;
        if(output[output.length - 1] == 13 /* charCode('\r') */) {
            end = -1;
        }
        out(textdecoder.decode((new Uint8Array(output)).subarray(0, end)));
        output = [];
      } else {
        if (val !== 0) {
          output.push(val); // val == 0 would cut text output off in the middle.
        }
      }
    },
    fsync: function (tty) {
      if (output && output.length > 0) {
        out(textdecoder.decode(new Uint8Array(output)));
        output = [];
      }
    },
  };
}

const pylibManifest = {
  dirs: ["pyodide", "pyodide/ffi"],
  files: [
    [
      "textwrap.py",
      "# micropython regex are kinda useless so we implement in JavaScript\nimport pyodide_js\n\ndedent = pyodide_js._module.API.dedent\n",
    ],
    [
      "datetime.py",
      '"""Concrete date/time and related types.\n\nSee http://www.iana.org/time-zones/repository/tz-link.html for\ntime zone and DST data sources.\n"""\n\n__all__ = (\n    "date",\n    "datetime",\n    "time",\n    "timedelta",\n    "timezone",\n    "tzinfo",\n    "MINYEAR",\n    "MAXYEAR",\n    "UTC",\n)\n\n\nimport time as _time\nimport math as _math\nimport sys\n\n\ndef _index(a):\n    return a\n\n\ndef _cmp(x, y):\n    return 0 if x == y else 1 if x > y else -1\n\n\nMINYEAR = 1\nMAXYEAR = 9999\n_MAXORDINAL = 3652059  # date.max.toordinal()\n\n# Utility functions, adapted from Python\'s Demo/classes/Dates.py, which\n# also assumes the current Gregorian calendar indefinitely extended in\n# both directions.  Difference:  Dates.py calls January 1 of year 0 day\n# number 1.  The code here calls January 1 of year 1 day number 1.  This is\n# to match the definition of the "proleptic Gregorian" calendar in Dershowitz\n# and Reingold\'s "Calendrical Calculations", where it\'s the base calendar\n# for all computations.  See the book for algorithms for converting between\n# proleptic Gregorian ordinals and many other calendar systems.\n\n# -1 is a placeholder for indexing purposes.\n_DAYS_IN_MONTH = [-1, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]\n\n_DAYS_BEFORE_MONTH = [-1]  # -1 is a placeholder for indexing purposes.\ndbm = 0\nfor dim in _DAYS_IN_MONTH[1:]:\n    _DAYS_BEFORE_MONTH.append(dbm)\n    dbm += dim\ndel dbm, dim\n\n\ndef _is_leap(year):\n    "year -> 1 if leap year, else 0."\n    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)\n\n\ndef _days_before_year(year):\n    "year -> number of days before January 1st of year."\n    y = year - 1\n    return y * 365 + y // 4 - y // 100 + y // 400\n\n\ndef _days_in_month(year, month):\n    "year, month -> number of days in that month in that year."\n    assert 1 <= month <= 12, month\n    if month == 2 and _is_leap(year):\n        return 29\n    return _DAYS_IN_MONTH[month]\n\n\ndef _days_before_month(year, month):\n    "year, month -> number of days in year preceding first day of month."\n    assert 1 <= month <= 12, "month must be in 1..12"\n    return _DAYS_BEFORE_MONTH[month] + (month > 2 and _is_leap(year))\n\n\ndef _ymd2ord(year, month, day):\n    "year, month, day -> ordinal, considering 01-Jan-0001 as day 1."\n    assert 1 <= month <= 12, "month must be in 1..12"\n    dim = _days_in_month(year, month)\n    assert 1 <= day <= dim, "day must be in 1..%d" % dim\n    return _days_before_year(year) + _days_before_month(year, month) + day\n\n\n_DI400Y = _days_before_year(401)  # number of days in 400 years\n_DI100Y = _days_before_year(101)  #    "    "   "   " 100   "\n_DI4Y = _days_before_year(5)  #    "    "   "   "   4   "\n\n# A 4-year cycle has an extra leap day over what we\'d get from pasting\n# together 4 single years.\nassert _DI4Y == 4 * 365 + 1\n\n# Similarly, a 400-year cycle has an extra leap day over what we\'d get from\n# pasting together 4 100-year cycles.\nassert _DI400Y == 4 * _DI100Y + 1\n\n# OTOH, a 100-year cycle has one fewer leap day than we\'d get from\n# pasting together 25 4-year cycles.\nassert _DI100Y == 25 * _DI4Y - 1\n\n\ndef _ord2ymd(n):\n    "ordinal -> (year, month, day), considering 01-Jan-0001 as day 1."\n\n    # n is a 1-based index, starting at 1-Jan-1.  The pattern of leap years\n    # repeats exactly every 400 years.  The basic strategy is to find the\n    # closest 400-year boundary at or before n, then work with the offset\n    # from that boundary to n.  Life is much clearer if we subtract 1 from\n    # n first -- then the values of n at 400-year boundaries are exactly\n    # those divisible by _DI400Y:\n    #\n    #     D  M   Y            n              n-1\n    #     -- --- ----        ----------     ----------------\n    #     31 Dec -400        -_DI400Y       -_DI400Y -1\n    #      1 Jan -399         -_DI400Y +1   -_DI400Y      400-year boundary\n    #     ...\n    #     30 Dec  000        -1             -2\n    #     31 Dec  000         0             -1\n    #      1 Jan  001         1              0            400-year boundary\n    #      2 Jan  001         2              1\n    #      3 Jan  001         3              2\n    #     ...\n    #     31 Dec  400         _DI400Y        _DI400Y -1\n    #      1 Jan  401         _DI400Y +1     _DI400Y      400-year boundary\n    n -= 1\n    n400, n = divmod(n, _DI400Y)\n    year = n400 * 400 + 1  # ..., -399, 1, 401, ...\n\n    # Now n is the (non-negative) offset, in days, from January 1 of year, to\n    # the desired date.  Now compute how many 100-year cycles precede n.\n    # Note that it\'s possible for n100 to equal 4!  In that case 4 full\n    # 100-year cycles precede the desired day, which implies the desired\n    # day is December 31 at the end of a 400-year cycle.\n    n100, n = divmod(n, _DI100Y)\n\n    # Now compute how many 4-year cycles precede it.\n    n4, n = divmod(n, _DI4Y)\n\n    # And now how many single years.  Again n1 can be 4, and again meaning\n    # that the desired day is December 31 at the end of the 4-year cycle.\n    n1, n = divmod(n, 365)\n\n    year += n100 * 100 + n4 * 4 + n1\n    if n1 == 4 or n100 == 4:\n        assert n == 0\n        return year - 1, 12, 31\n\n    # Now the year is correct, and n is the offset from January 1.  We find\n    # the month via an estimate that\'s either exact or one too large.\n    leapyear = n1 == 3 and (n4 != 24 or n100 == 3)\n    assert leapyear == _is_leap(year)\n    month = (n + 50) >> 5\n    preceding = _DAYS_BEFORE_MONTH[month] + (month > 2 and leapyear)\n    if preceding > n:  # estimate is too large\n        month -= 1\n        preceding -= _DAYS_IN_MONTH[month] + (month == 2 and leapyear)\n    n -= preceding\n    assert 0 <= n < _days_in_month(year, month)\n\n    # Now the year and month are correct, and n is the offset from the\n    # start of that month:  we\'re done!\n    return year, month, n + 1\n\n\n# Month and day names.  For localized versions, see the calendar module.\n_MONTHNAMES = [\n    None,\n    "Jan",\n    "Feb",\n    "Mar",\n    "Apr",\n    "May",\n    "Jun",\n    "Jul",\n    "Aug",\n    "Sep",\n    "Oct",\n    "Nov",\n    "Dec",\n]\n_DAYNAMES = [None, "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]\n\n\ndef _build_struct_time(y, m, d, hh, mm, ss, dstflag):\n    wday = (_ymd2ord(y, m, d) + 6) % 7\n    dnum = _days_before_month(y, m) + d\n    return _time.struct_time((y, m, d, hh, mm, ss, wday, dnum, dstflag))\n\n\ndef _format_time(hh, mm, ss, us, timespec="auto"):\n    specs = {\n        "hours": "{:02d}",\n        "minutes": "{:02d}:{:02d}",\n        "seconds": "{:02d}:{:02d}:{:02d}",\n        "milliseconds": "{:02d}:{:02d}:{:02d}.{:03d}",\n        "microseconds": "{:02d}:{:02d}:{:02d}.{:06d}",\n    }\n\n    if timespec == "auto":\n        # Skip trailing microseconds when us==0.\n        timespec = "microseconds" if us else "seconds"\n    elif timespec == "milliseconds":\n        us //= 1000\n    try:\n        fmt = specs[timespec]\n    except KeyError:\n        raise ValueError("Unknown timespec value")\n    else:\n        return fmt.format(hh, mm, ss, us)\n\n\ndef _format_offset(off):\n    s = ""\n    if off is not None:\n        if off.days < 0:\n            sign = "-"\n            off = -off\n        else:\n            sign = "+"\n        hh, mm = divmod(off, timedelta(hours=1))\n        mm, ss = divmod(mm, timedelta(minutes=1))\n        s += "%s%02d:%02d" % (sign, hh, mm)\n        if ss or ss.microseconds:\n            s += ":%02d" % ss.seconds\n\n            if ss.microseconds:\n                s += ".%06d" % ss.microseconds\n    return s\n\n\n# Correctly substitute for %z and %Z escapes in strftime formats.\ndef _wrap_strftime(object, format, timetuple):\n    # Don\'t call utcoffset() or tzname() unless actually needed.\n    freplace = None  # the string to use for %f\n    zreplace = None  # the string to use for %z\n    Zreplace = None  # the string to use for %Z\n\n    # Scan format for %z and %Z escapes, replacing as needed.\n    newformat = []\n    push = newformat.append\n    i, n = 0, len(format)\n    while i < n:\n        ch = format[i]\n        i += 1\n        if ch == "%":\n            if i < n:\n                ch = format[i]\n                i += 1\n                if ch == "f":\n                    if freplace is None:\n                        freplace = "%06d" % getattr(object, "microsecond", 0)\n                    newformat.append(freplace)\n                elif ch == "z":\n                    if zreplace is None:\n                        zreplace = ""\n                        if hasattr(object, "utcoffset"):\n                            offset = object.utcoffset()\n                            if offset is not None:\n                                sign = "+"\n                                if offset.days < 0:\n                                    offset = -offset\n                                    sign = "-"\n                                h, rest = divmod(offset, timedelta(hours=1))\n                                m, rest = divmod(rest, timedelta(minutes=1))\n                                s = rest.seconds\n                                u = offset.microseconds\n                                if u:\n                                    zreplace = "%c%02d%02d%02d.%06d" % (\n                                        sign,\n                                        h,\n                                        m,\n                                        s,\n                                        u,\n                                    )\n                                elif s:\n                                    zreplace = "%c%02d%02d%02d" % (sign, h, m, s)\n                                else:\n                                    zreplace = "%c%02d%02d" % (sign, h, m)\n                    assert "%" not in zreplace\n                    newformat.append(zreplace)\n                elif ch == "Z":\n                    if Zreplace is None:\n                        Zreplace = ""\n                        if hasattr(object, "tzname"):\n                            s = object.tzname()\n                            if s is not None:\n                                # strftime is going to have at this: escape %\n                                Zreplace = s.replace("%", "%%")\n                    newformat.append(Zreplace)\n                else:\n                    push("%")\n                    push(ch)\n            else:\n                push("%")\n        else:\n            push(ch)\n    newformat = "".join(newformat)\n    return _time.strftime(newformat, timetuple)\n\n\n# Helpers for parsing the result of isoformat()\ndef _is_ascii_digit(c):\n    return c in "0123456789"\n\n\ndef _find_isoformat_datetime_separator(dtstr):\n    # See the comment in _datetimemodule.c:_find_isoformat_datetime_separator\n    len_dtstr = len(dtstr)\n    if len_dtstr == 7:\n        return 7\n\n    assert len_dtstr > 7\n    date_separator = "-"\n    week_indicator = "W"\n\n    if dtstr[4] == date_separator:\n        if dtstr[5] == week_indicator:\n            if len_dtstr < 8:\n                raise ValueError("Invalid ISO string")\n            if len_dtstr > 8 and dtstr[8] == date_separator:\n                if len_dtstr == 9:\n                    raise ValueError("Invalid ISO string")\n                if len_dtstr > 10 and _is_ascii_digit(dtstr[10]):\n                    # This is as far as we need to resolve the ambiguity for\n                    # the moment - if we have YYYY-Www-##, the separator is\n                    # either a hyphen at 8 or a number at 10.\n                    #\n                    # We\'ll assume it\'s a hyphen at 8 because it\'s way more\n                    # likely that someone will use a hyphen as a separator than\n                    # a number, but at this point it\'s really best effort\n                    # because this is an extension of the spec anyway.\n                    # TODO(pganssle): Document this\n                    return 8\n                return 10\n            else:\n                # YYYY-Www (8)\n                return 8\n        else:\n            # YYYY-MM-DD (10)\n            return 10\n    else:\n        if dtstr[4] == week_indicator:\n            # YYYYWww (7) or YYYYWwwd (8)\n            idx = 7\n            while idx < len_dtstr:\n                if not _is_ascii_digit(dtstr[idx]):\n                    break\n                idx += 1\n\n            if idx < 9:\n                return idx\n\n            if idx % 2 == 0:\n                # If the index of the last number is even, it\'s YYYYWwwd\n                return 7\n            else:\n                return 8\n        else:\n            # YYYYMMDD (8)\n            return 8\n\n\ndef _parse_isoformat_date(dtstr):\n    # It is assumed that this is an ASCII-only string of lengths 7, 8 or 10,\n    # see the comment on Modules/_datetimemodule.c:_find_isoformat_datetime_separator\n    assert len(dtstr) in (7, 8, 10)\n    year = int(dtstr[0:4])\n    has_sep = dtstr[4] == "-"\n\n    pos = 4 + has_sep\n    if dtstr[pos : pos + 1] == "W":\n        # YYYY-?Www-?D?\n        pos += 1\n        weekno = int(dtstr[pos : pos + 2])\n        pos += 2\n\n        dayno = 1\n        if len(dtstr) > pos:\n            if (dtstr[pos : pos + 1] == "-") != has_sep:\n                raise ValueError("Inconsistent use of dash separator")\n\n            pos += has_sep\n\n            dayno = int(dtstr[pos : pos + 1])\n\n        return list(_isoweek_to_gregorian(year, weekno, dayno))\n    else:\n        month = int(dtstr[pos : pos + 2])\n        pos += 2\n        if (dtstr[pos : pos + 1] == "-") != has_sep:\n            raise ValueError("Inconsistent use of dash separator")\n\n        pos += has_sep\n        day = int(dtstr[pos : pos + 2])\n\n        return [year, month, day]\n\n\n_FRACTION_CORRECTION = [100000, 10000, 1000, 100, 10]\n\n\ndef _parse_hh_mm_ss_ff(tstr):\n    # Parses things of the form HH[:?MM[:?SS[{.,}fff[fff]]]]\n    len_str = len(tstr)\n\n    time_comps = [0, 0, 0, 0]\n    pos = 0\n    for comp in range(0, 3):\n        if (len_str - pos) < 2:\n            raise ValueError("Incomplete time component")\n\n        time_comps[comp] = int(tstr[pos : pos + 2])\n\n        pos += 2\n        next_char = tstr[pos : pos + 1]\n\n        if comp == 0:\n            has_sep = next_char == ":"\n\n        if not next_char or comp >= 2:\n            break\n\n        if has_sep and next_char != ":":\n            raise ValueError("Invalid time separator: %c" % next_char)\n\n        pos += has_sep\n\n    if pos < len_str:\n        if tstr[pos] not in ".,":\n            raise ValueError("Invalid microsecond component")\n        else:\n            pos += 1\n\n            len_remainder = len_str - pos\n\n            if len_remainder >= 6:\n                to_parse = 6\n            else:\n                to_parse = len_remainder\n\n            time_comps[3] = int(tstr[pos : (pos + to_parse)])\n            if to_parse < 6:\n                time_comps[3] *= _FRACTION_CORRECTION[to_parse - 1]\n            if len_remainder > to_parse and not all(\n                map(_is_ascii_digit, tstr[(pos + to_parse) :])\n            ):\n                raise ValueError("Non-digit values in unparsed fraction")\n\n    return time_comps\n\n\ndef _parse_isoformat_time(tstr):\n    # Format supported is HH[:MM[:SS[.fff[fff]]]][+HH:MM[:SS[.ffffff]]]\n    len_str = len(tstr)\n    if len_str < 2:\n        raise ValueError("Isoformat time too short")\n\n    # This is equivalent to re.search(\'[+-Z]\', tstr), but faster\n    tz_pos = tstr.find("-") + 1 or tstr.find("+") + 1 or tstr.find("Z") + 1\n    timestr = tstr[: tz_pos - 1] if tz_pos > 0 else tstr\n\n    time_comps = _parse_hh_mm_ss_ff(timestr)\n\n    tzi = None\n    if tz_pos == len_str and tstr[-1] == "Z":\n        tzi = timezone.utc\n    elif tz_pos > 0:\n        tzstr = tstr[tz_pos:]\n\n        # Valid time zone strings are:\n        # HH                  len: 2\n        # HHMM                len: 4\n        # HH:MM               len: 5\n        # HHMMSS              len: 6\n        # HHMMSS.f+           len: 7+\n        # HH:MM:SS            len: 8\n        # HH:MM:SS.f+         len: 10+\n\n        if len(tzstr) in (0, 1, 3):\n            raise ValueError("Malformed time zone string")\n\n        tz_comps = _parse_hh_mm_ss_ff(tzstr)\n\n        if all(x == 0 for x in tz_comps):\n            tzi = timezone.utc\n        else:\n            tzsign = -1 if tstr[tz_pos - 1] == "-" else 1\n\n            td = timedelta(\n                hours=tz_comps[0],\n                minutes=tz_comps[1],\n                seconds=tz_comps[2],\n                microseconds=tz_comps[3],\n            )\n\n            tzi = timezone(tzsign * td)\n\n    time_comps.append(tzi)\n\n    return time_comps\n\n\n# tuple[int, int, int] -> tuple[int, int, int] version of date.fromisocalendar\ndef _isoweek_to_gregorian(year, week, day):\n    # Year is bounded this way because 9999-12-31 is (9999, 52, 5)\n    if not MINYEAR <= year <= MAXYEAR:\n        raise ValueError(f"Year is out of range: {year}")\n\n    if not 0 < week < 53:\n        out_of_range = True\n\n        if week == 53:\n            # ISO years have 53 weeks in them on years starting with a\n            # Thursday and leap years starting on a Wednesday\n            first_weekday = _ymd2ord(year, 1, 1) % 7\n            if first_weekday == 4 or (first_weekday == 3 and _is_leap(year)):\n                out_of_range = False\n\n        if out_of_range:\n            raise ValueError(f"Invalid week: {week}")\n\n    if not 0 < day < 8:\n        raise ValueError(f"Invalid weekday: {day} (range is [1, 7])")\n\n    # Now compute the offset from (Y, 1, 1) in days:\n    day_offset = (week - 1) * 7 + (day - 1)\n\n    # Calculate the ordinal day for monday, week 1\n    day_1 = _isoweek1monday(year)\n    ord_day = day_1 + day_offset\n\n    return _ord2ymd(ord_day)\n\n\n# Just raise TypeError if the arg isn\'t None or a string.\ndef _check_tzname(name):\n    if name is not None and not isinstance(name, str):\n        raise TypeError(\n            "tzinfo.tzname() must return None or string, " "not \'%s\'" % type(name)\n        )\n\n\n# name is the offset-producing method, "utcoffset" or "dst".\n# offset is what it returned.\n# If offset isn\'t None or timedelta, raises TypeError.\n# If offset is None, returns None.\n# Else offset is checked for being in range.\n# If it is, its integer value is returned.  Else ValueError is raised.\ndef _check_utc_offset(name, offset):\n    assert name in ("utcoffset", "dst")\n    if offset is None:\n        return\n    if not isinstance(offset, timedelta):\n        raise TypeError(\n            "tzinfo.%s() must return None "\n            "or timedelta, not \'%s\'" % (name, type(offset))\n        )\n    if not -timedelta(1) < offset < timedelta(1):\n        raise ValueError(\n            "%s()=%s, must be strictly between "\n            "-timedelta(hours=24) and timedelta(hours=24)" % (name, offset)\n        )\n\n\ndef _check_date_fields(year, month, day):\n    year = _index(year)\n    month = _index(month)\n    day = _index(day)\n    if not MINYEAR <= year <= MAXYEAR:\n        raise ValueError("year must be in %d..%d" % (MINYEAR, MAXYEAR), year)\n    if not 1 <= month <= 12:\n        raise ValueError("month must be in 1..12", month)\n    dim = _days_in_month(year, month)\n    if not 1 <= day <= dim:\n        raise ValueError("day must be in 1..%d" % dim, day)\n    return year, month, day\n\n\ndef _check_time_fields(hour, minute, second, microsecond, fold):\n    hour = _index(hour)\n    minute = _index(minute)\n    second = _index(second)\n    microsecond = _index(microsecond)\n    if not 0 <= hour <= 23:\n        raise ValueError("hour must be in 0..23", hour)\n    if not 0 <= minute <= 59:\n        raise ValueError("minute must be in 0..59", minute)\n    if not 0 <= second <= 59:\n        raise ValueError("second must be in 0..59", second)\n    if not 0 <= microsecond <= 999999:\n        raise ValueError("microsecond must be in 0..999999", microsecond)\n    if fold not in (0, 1):\n        raise ValueError("fold must be either 0 or 1", fold)\n    return hour, minute, second, microsecond, fold\n\n\ndef _check_tzinfo_arg(tz):\n    if tz is not None and not isinstance(tz, tzinfo):\n        raise TypeError("tzinfo argument must be None or of a tzinfo subclass")\n\n\ndef _cmperror(x, y):\n    raise TypeError("can\'t compare \'%s\' to \'%s\'" % (type(x).__name__, type(y).__name__))\n\n\ndef _divide_and_round(a, b):\n    """divide a by b and round result to the nearest integer\n\n    When the ratio is exactly half-way between two integers,\n    the even integer is returned.\n    """\n    # Based on the reference implementation for divmod_near\n    # in Objects/longobject.c.\n    q, r = divmod(a, b)\n    # round up if either r / b > 0.5, or r / b == 0.5 and q is odd.\n    # The expression r / b > 0.5 is equivalent to 2 * r > b if b is\n    # positive, 2 * r < b if b negative.\n    r *= 2\n    greater_than_half = r > b if b > 0 else r < b\n    if greater_than_half or r == b and q % 2 == 1:\n        q += 1\n\n    return q\n\n\nclass timedelta:\n    """Represent the difference between two datetime objects.\n\n    Supported operators:\n\n    - add, subtract timedelta\n    - unary plus, minus, abs\n    - compare to timedelta\n    - multiply, divide by int\n\n    In addition, datetime supports subtraction of two datetime objects\n    returning a timedelta, and addition or subtraction of a datetime\n    and a timedelta giving a datetime.\n\n    Representation: (days, seconds, microseconds).  Why?  Because I\n    felt like it.\n    """\n\n    __slots__ = "_days", "_seconds", "_microseconds", "_hashcode"\n\n    def __new__(\n        cls,\n        days=0,\n        seconds=0,\n        microseconds=0,\n        milliseconds=0,\n        minutes=0,\n        hours=0,\n        weeks=0,\n    ):\n        # Doing this efficiently and accurately in C is going to be difficult\n        # and error-prone, due to ubiquitous overflow possibilities, and that\n        # C double doesn\'t have enough bits of precision to represent\n        # microseconds over 10K years faithfully.  The code here tries to make\n        # explicit where go-fast assumptions can be relied on, in order to\n        # guide the C implementation; it\'s way more convoluted than speed-\n        # ignoring auto-overflow-to-long idiomatic Python could be.\n\n        # XXX Check that all inputs are ints or floats.\n\n        # Final values, all integer.\n        # s and us fit in 32-bit signed ints; d isn\'t bounded.\n        d = s = us = 0\n\n        # Normalize everything to days, seconds, microseconds.\n        days += weeks * 7\n        seconds += minutes * 60 + hours * 3600\n        microseconds += milliseconds * 1000\n\n        # Get rid of all fractions, and normalize s and us.\n        # Take a deep breath <wink>.\n        if isinstance(days, float):\n            dayfrac, days = _math.modf(days)\n            daysecondsfrac, daysecondswhole = _math.modf(dayfrac * (24.0 * 3600.0))\n            assert daysecondswhole == int(daysecondswhole)  # can\'t overflow\n            s = int(daysecondswhole)\n            assert days == int(days)\n            d = int(days)\n        else:\n            daysecondsfrac = 0.0\n            d = days\n        assert isinstance(daysecondsfrac, float)\n        assert abs(daysecondsfrac) <= 1.0\n        assert isinstance(d, int)\n        assert abs(s) <= 24 * 3600\n        # days isn\'t referenced again before redefinition\n\n        if isinstance(seconds, float):\n            secondsfrac, seconds = _math.modf(seconds)\n            assert seconds == int(seconds)\n            seconds = int(seconds)\n            secondsfrac += daysecondsfrac\n            assert abs(secondsfrac) <= 2.0\n        else:\n            secondsfrac = daysecondsfrac\n        # daysecondsfrac isn\'t referenced again\n        assert isinstance(secondsfrac, float)\n        assert abs(secondsfrac) <= 2.0\n\n        assert isinstance(seconds, int)\n        days, seconds = divmod(seconds, 24 * 3600)\n        d += days\n        s += int(seconds)  # can\'t overflow\n        assert isinstance(s, int)\n        assert abs(s) <= 2 * 24 * 3600\n        # seconds isn\'t referenced again before redefinition\n\n        usdouble = secondsfrac * 1e6\n        assert abs(usdouble) < 2.1e6  # exact value not critical\n        # secondsfrac isn\'t referenced again\n\n        if isinstance(microseconds, float):\n            microseconds = round(microseconds + usdouble)\n            seconds, microseconds = divmod(microseconds, 1000000)\n            days, seconds = divmod(seconds, 24 * 3600)\n            d += days\n            s += seconds\n        else:\n            microseconds = int(microseconds)\n            seconds, microseconds = divmod(microseconds, 1000000)\n            days, seconds = divmod(seconds, 24 * 3600)\n            d += days\n            s += seconds\n            microseconds = round(microseconds + usdouble)\n        assert isinstance(s, int)\n        assert isinstance(microseconds, int)\n        assert abs(s) <= 3 * 24 * 3600\n        assert abs(microseconds) < 3.1e6\n\n        # Just a little bit of carrying possible for microseconds and seconds.\n        seconds, us = divmod(microseconds, 1000000)\n        s += seconds\n        days, s = divmod(s, 24 * 3600)\n        d += days\n\n        assert isinstance(d, int)\n        assert isinstance(s, int) and 0 <= s < 24 * 3600\n        assert isinstance(us, int) and 0 <= us < 1000000\n\n        if abs(d) > 999999999:\n            raise OverflowError("timedelta # of days is too large: %d" % d)\n\n        self = object.__new__(cls)\n        self._days = d\n        self._seconds = s\n        self._microseconds = us\n        self._hashcode = -1\n        return self\n\n    def __repr__(self):\n        args = []\n        if self._days:\n            args.append("days=%d" % self._days)\n        if self._seconds:\n            args.append("seconds=%d" % self._seconds)\n        if self._microseconds:\n            args.append("microseconds=%d" % self._microseconds)\n        if not args:\n            args.append("0")\n        return "%s.%s(%s)" % (\n            self.__class__.__module__,\n            self.__class__.__qualname__,\n            ", ".join(args),\n        )\n\n    def __str__(self):\n        mm, ss = divmod(self._seconds, 60)\n        hh, mm = divmod(mm, 60)\n        s = "%d:%02d:%02d" % (hh, mm, ss)\n        if self._days:\n\n            def plural(n):\n                return n, abs(n) != 1 and "s" or ""\n\n            s = ("%d day%s, " % plural(self._days)) + s\n        if self._microseconds:\n            s = s + ".%06d" % self._microseconds\n        return s\n\n    def total_seconds(self):\n        """Total seconds in the duration."""\n        return (\n            (self.days * 86400 + self.seconds) * 10**6 + self.microseconds\n        ) / 10**6\n\n    # Read-only field accessors\n    @property\n    def days(self):\n        """days"""\n        return self._days\n\n    @property\n    def seconds(self):\n        """seconds"""\n        return self._seconds\n\n    @property\n    def microseconds(self):\n        """microseconds"""\n        return self._microseconds\n\n    def __add__(self, other):\n        if isinstance(other, timedelta):\n            # for CPython compatibility, we cannot use\n            # our __class__ here, but need a real timedelta\n            return timedelta(\n                self._days + other._days,\n                self._seconds + other._seconds,\n                self._microseconds + other._microseconds,\n            )\n        return NotImplemented\n\n    __radd__ = __add__\n\n    def __sub__(self, other):\n        if isinstance(other, timedelta):\n            # for CPython compatibility, we cannot use\n            # our __class__ here, but need a real timedelta\n            return timedelta(\n                self._days - other._days,\n                self._seconds - other._seconds,\n                self._microseconds - other._microseconds,\n            )\n        return NotImplemented\n\n    def __rsub__(self, other):\n        if isinstance(other, timedelta):\n            return -self + other\n        return NotImplemented\n\n    def __neg__(self):\n        # for CPython compatibility, we cannot use\n        # our __class__ here, but need a real timedelta\n        return timedelta(-self._days, -self._seconds, -self._microseconds)\n\n    def __pos__(self):\n        return self\n\n    def __abs__(self):\n        if self._days < 0:\n            return -self\n        else:\n            return self\n\n    def __mul__(self, other):\n        if isinstance(other, int):\n            # for CPython compatibility, we cannot use\n            # our __class__ here, but need a real timedelta\n            return timedelta(\n                self._days * other, self._seconds * other, self._microseconds * other\n            )\n        if isinstance(other, float):\n            usec = self._to_microseconds()\n            a, b = other.as_integer_ratio()\n            return timedelta(0, 0, _divide_and_round(usec * a, b))\n        return NotImplemented\n\n    __rmul__ = __mul__\n\n    def _to_microseconds(self):\n        return (self._days * (24 * 3600) + self._seconds) * 1000000 + self._microseconds\n\n    def __floordiv__(self, other):\n        if not isinstance(other, (int, timedelta)):\n            return NotImplemented\n        usec = self._to_microseconds()\n        if isinstance(other, timedelta):\n            return usec // other._to_microseconds()\n        if isinstance(other, int):\n            return timedelta(0, 0, usec // other)\n\n    def __truediv__(self, other):\n        if not isinstance(other, (int, float, timedelta)):\n            return NotImplemented\n        usec = self._to_microseconds()\n        if isinstance(other, timedelta):\n            return usec / other._to_microseconds()\n        if isinstance(other, int):\n            return timedelta(0, 0, _divide_and_round(usec, other))\n        if isinstance(other, float):\n            a, b = other.as_integer_ratio()\n            return timedelta(0, 0, _divide_and_round(b * usec, a))\n\n    def __mod__(self, other):\n        if isinstance(other, timedelta):\n            r = self._to_microseconds() % other._to_microseconds()\n            return timedelta(0, 0, r)\n        return NotImplemented\n\n    def __divmod__(self, other):\n        if isinstance(other, timedelta):\n            q, r = divmod(self._to_microseconds(), other._to_microseconds())\n            return q, timedelta(0, 0, r)\n        return NotImplemented\n\n    # Comparisons of timedelta objects with other.\n\n    def __eq__(self, other):\n        if isinstance(other, timedelta):\n            return self._cmp(other) == 0\n        else:\n            return NotImplemented\n\n    def __le__(self, other):\n        if isinstance(other, timedelta):\n            return self._cmp(other) <= 0\n        else:\n            return NotImplemented\n\n    def __lt__(self, other):\n        if isinstance(other, timedelta):\n            return self._cmp(other) < 0\n        else:\n            return NotImplemented\n\n    def __ge__(self, other):\n        if isinstance(other, timedelta):\n            return self._cmp(other) >= 0\n        else:\n            return NotImplemented\n\n    def __gt__(self, other):\n        if isinstance(other, timedelta):\n            return self._cmp(other) > 0\n        else:\n            return NotImplemented\n\n    def _cmp(self, other):\n        assert isinstance(other, timedelta)\n        return _cmp(self._getstate(), other._getstate())\n\n    def __hash__(self):\n        if self._hashcode == -1:\n            self._hashcode = hash(self._getstate())\n        return self._hashcode\n\n    def __bool__(self):\n        return self._days != 0 or self._seconds != 0 or self._microseconds != 0\n\n    # Pickle support.\n\n    def _getstate(self):\n        return (self._days, self._seconds, self._microseconds)\n\n    def __reduce__(self):\n        return (self.__class__, self._getstate())\n\n\ntimedelta.min = timedelta(-999999999)\ntimedelta.max = timedelta(\n    days=999999999, hours=23, minutes=59, seconds=59, microseconds=999999\n)\ntimedelta.resolution = timedelta(microseconds=1)\n\n\nclass date:\n    """Concrete date type.\n\n    Constructors:\n\n    __new__()\n    fromtimestamp()\n    today()\n    fromordinal()\n\n    Operators:\n\n    __repr__, __str__\n    __eq__, __le__, __lt__, __ge__, __gt__, __hash__\n    __add__, __radd__, __sub__ (add/radd only with timedelta arg)\n\n    Methods:\n\n    timetuple()\n    toordinal()\n    weekday()\n    isoweekday(), isocalendar(), isoformat()\n    ctime()\n    strftime()\n\n    Properties (readonly):\n    year, month, day\n    """\n\n    __slots__ = "_year", "_month", "_day", "_hashcode"\n\n    def __new__(cls, year, month=None, day=None):\n        """Constructor.\n\n        Arguments:\n\n        year, month, day (required, base 1)\n        """\n        if (\n            month is None\n            and isinstance(year, (bytes, str))\n            and len(year) == 4\n            and 1 <= ord(year[2:3]) <= 12\n        ):\n            # Pickle support\n            if isinstance(year, str):\n                try:\n                    year = year.encode("latin1")\n                except UnicodeEncodeError:\n                    # More informative error message.\n                    raise ValueError(\n                        "Failed to encode latin1 string when unpickling "\n                        "a date object. "\n                        "pickle.load(data, encoding=\'latin1\') is assumed."\n                    )\n            self = object.__new__(cls)\n            self.__setstate(year)\n            self._hashcode = -1\n            return self\n        year, month, day = _check_date_fields(year, month, day)\n        self = object.__new__(cls)\n        self._year = year\n        self._month = month\n        self._day = day\n        self._hashcode = -1\n        return self\n\n    # Additional constructors\n\n    @classmethod\n    def fromtimestamp(cls, t):\n        "Construct a date from a POSIX timestamp (like time.time())."\n        y, m, d, hh, mm, ss, weekday, jday, dst = _time.localtime(t)\n        return cls(y, m, d)\n\n    @classmethod\n    def today(cls):\n        "Construct a date from time.time()."\n        t = _time.time()\n        return cls.fromtimestamp(t)\n\n    @classmethod\n    def fromordinal(cls, n):\n        """Construct a date from a proleptic Gregorian ordinal.\n\n        January 1 of year 1 is day 1.  Only the year, month and day are\n        non-zero in the result.\n        """\n        y, m, d = _ord2ymd(n)\n        return cls(y, m, d)\n\n    @classmethod\n    def fromisoformat(cls, date_string):\n        """Construct a date from a string in ISO 8601 format."""\n        if not isinstance(date_string, str):\n            raise TypeError("fromisoformat: argument must be str")\n\n        if len(date_string) not in (7, 8, 10):\n            raise ValueError(f\'Invalid isoformat string: "{date_string}"\')\n\n        try:\n            return cls(*_parse_isoformat_date(date_string))\n        except Exception:\n            raise ValueError(f\'Invalid isoformat string: "{date_string}"\')\n\n    @classmethod\n    def fromisocalendar(cls, year, week, day):\n        """Construct a date from the ISO year, week number and weekday.\n\n        This is the inverse of the date.isocalendar() function"""\n        return cls(*_isoweek_to_gregorian(year, week, day))\n\n    # Conversions to string\n\n    def __repr__(self):\n        """Convert to formal string, for repr().\n\n        >>> dt = datetime(2010, 1, 1)\n        >>> repr(dt)\n        \'datetime.datetime(2010, 1, 1, 0, 0)\'\n\n        >>> dt = datetime(2010, 1, 1, tzinfo=timezone.utc)\n        >>> repr(dt)\n        \'datetime.datetime(2010, 1, 1, 0, 0, tzinfo=datetime.timezone.utc)\'\n        """\n        return "%s.%s(%d, %d, %d)" % (\n            self.__class__.__module__,\n            self.__class__.__qualname__,\n            self._year,\n            self._month,\n            self._day,\n        )\n\n    # XXX These shouldn\'t depend on time.localtime(), because that\n    # clips the usable dates to [1970 .. 2038).  At least ctime() is\n    # easily done without using strftime() -- that\'s better too because\n    # strftime("%c", ...) is locale specific.\n\n    def ctime(self):\n        "Return ctime() style string."\n        weekday = self.toordinal() % 7 or 7\n        return "%s %s %2d 00:00:00 %04d" % (\n            _DAYNAMES[weekday],\n            _MONTHNAMES[self._month],\n            self._day,\n            self._year,\n        )\n\n    def strftime(self, fmt):\n        """\n        Format using strftime().\n\n        Example: "%d/%m/%Y, %H:%M:%S"\n        """\n        return _wrap_strftime(self, fmt, self.timetuple())\n\n    def __format__(self, fmt):\n        if not isinstance(fmt, str):\n            raise TypeError("must be str, not %s" % type(fmt).__name__)\n        if len(fmt) != 0:\n            return self.strftime(fmt)\n        return str(self)\n\n    def isoformat(self):\n        """Return the date formatted according to ISO.\n\n        This is \'YYYY-MM-DD\'.\n\n        References:\n        - http://www.w3.org/TR/NOTE-datetime\n        - http://www.cl.cam.ac.uk/~mgk25/iso-time.html\n        """\n        return "%04d-%02d-%02d" % (self._year, self._month, self._day)\n\n    __str__ = isoformat\n\n    # Read-only field accessors\n    @property\n    def year(self):\n        """year (1-9999)"""\n        return self._year\n\n    @property\n    def month(self):\n        """month (1-12)"""\n        return self._month\n\n    @property\n    def day(self):\n        """day (1-31)"""\n        return self._day\n\n    # Standard conversions, __eq__, __le__, __lt__, __ge__, __gt__,\n    # __hash__ (and helpers)\n\n    def timetuple(self):\n        "Return local time tuple compatible with time.localtime()."\n        return _build_struct_time(self._year, self._month, self._day, 0, 0, 0, -1)\n\n    def toordinal(self):\n        """Return proleptic Gregorian ordinal for the year, month and day.\n\n        January 1 of year 1 is day 1.  Only the year, month and day values\n        contribute to the result.\n        """\n        return _ymd2ord(self._year, self._month, self._day)\n\n    def replace(self, year=None, month=None, day=None):\n        """Return a new date with new values for the specified fields."""\n        if year is None:\n            year = self._year\n        if month is None:\n            month = self._month\n        if day is None:\n            day = self._day\n        return type(self)(year, month, day)\n\n    # Comparisons of date objects with other.\n\n    def __eq__(self, other):\n        if isinstance(other, date):\n            return self._cmp(other) == 0\n        return NotImplemented\n\n    def __le__(self, other):\n        if isinstance(other, date):\n            return self._cmp(other) <= 0\n        return NotImplemented\n\n    def __lt__(self, other):\n        if isinstance(other, date):\n            return self._cmp(other) < 0\n        return NotImplemented\n\n    def __ge__(self, other):\n        if isinstance(other, date):\n            return self._cmp(other) >= 0\n        return NotImplemented\n\n    def __gt__(self, other):\n        if isinstance(other, date):\n            return self._cmp(other) > 0\n        return NotImplemented\n\n    def _cmp(self, other):\n        assert isinstance(other, date)\n        y, m, d = self._year, self._month, self._day\n        y2, m2, d2 = other._year, other._month, other._day\n        return _cmp((y, m, d), (y2, m2, d2))\n\n    def __hash__(self):\n        "Hash."\n        if self._hashcode == -1:\n            self._hashcode = hash(self._getstate())\n        return self._hashcode\n\n    # Computations\n\n    def __add__(self, other):\n        "Add a date to a timedelta."\n        if isinstance(other, timedelta):\n            o = self.toordinal() + other.days\n            if 0 < o <= _MAXORDINAL:\n                return type(self).fromordinal(o)\n            raise OverflowError("result out of range")\n        return NotImplemented\n\n    __radd__ = __add__\n\n    def __sub__(self, other):\n        """Subtract two dates, or a date and a timedelta."""\n        if isinstance(other, timedelta):\n            return self + timedelta(-other.days)\n        if isinstance(other, date):\n            days1 = self.toordinal()\n            days2 = other.toordinal()\n            return timedelta(days1 - days2)\n        return NotImplemented\n\n    def weekday(self):\n        "Return day of the week, where Monday == 0 ... Sunday == 6."\n        return (self.toordinal() + 6) % 7\n\n    # Day-of-the-week and week-of-the-year, according to ISO\n\n    def isoweekday(self):\n        "Return day of the week, where Monday == 1 ... Sunday == 7."\n        # 1-Jan-0001 is a Monday\n        return self.toordinal() % 7 or 7\n\n    def isocalendar(self):\n        """Return a named tuple containing ISO year, week number, and weekday.\n\n        The first ISO week of the year is the (Mon-Sun) week\n        containing the year\'s first Thursday; everything else derives\n        from that.\n\n        The first week is 1; Monday is 1 ... Sunday is 7.\n\n        ISO calendar algorithm taken from\n        http://www.phys.uu.nl/~vgent/calendar/isocalendar.htm\n        (used with permission)\n        """\n        year = self._year\n        week1monday = _isoweek1monday(year)\n        today = _ymd2ord(self._year, self._month, self._day)\n        # Internally, week and day have origin 0\n        week, day = divmod(today - week1monday, 7)\n        if week < 0:\n            year -= 1\n            week1monday = _isoweek1monday(year)\n            week, day = divmod(today - week1monday, 7)\n        elif week >= 52:\n            if today >= _isoweek1monday(year + 1):\n                year += 1\n                week = 0\n        return _IsoCalendarDate(year, week + 1, day + 1)\n\n    # Pickle support.\n\n    def _getstate(self):\n        yhi, ylo = divmod(self._year, 256)\n        return (bytes([yhi, ylo, self._month, self._day]),)\n\n    def __setstate(self, string):\n        yhi, ylo, self._month, self._day = string\n        self._year = yhi * 256 + ylo\n\n    def __reduce__(self):\n        return (self.__class__, self._getstate())\n\n\n_date_class = date  # so functions w/ args named "date" can get at the class\n\ndate.min = date(1, 1, 1)\ndate.max = date(9999, 12, 31)\ndate.resolution = timedelta(days=1)\n\n\nclass tzinfo:\n    """Abstract base class for time zone info classes.\n\n    Subclasses must override the name(), utcoffset() and dst() methods.\n    """\n\n    __slots__ = ()\n\n    def tzname(self, dt):\n        "datetime -> string name of time zone."\n        raise NotImplementedError("tzinfo subclass must override tzname()")\n\n    def utcoffset(self, dt):\n        "datetime -> timedelta, positive for east of UTC, negative for west of UTC"\n        raise NotImplementedError("tzinfo subclass must override utcoffset()")\n\n    def dst(self, dt):\n        """datetime -> DST offset as timedelta, positive for east of UTC.\n\n        Return 0 if DST not in effect.  utcoffset() must include the DST\n        offset.\n        """\n        raise NotImplementedError("tzinfo subclass must override dst()")\n\n    def fromutc(self, dt):\n        "datetime in UTC -> datetime in local time."\n\n        if not isinstance(dt, datetime):\n            raise TypeError("fromutc() requires a datetime argument")\n        if dt.tzinfo is not self:\n            raise ValueError("dt.tzinfo is not self")\n\n        dtoff = dt.utcoffset()\n        if dtoff is None:\n            raise ValueError("fromutc() requires a non-None utcoffset() " "result")\n\n        # See the long comment block at the end of this file for an\n        # explanation of this algorithm.\n        dtdst = dt.dst()\n        if dtdst is None:\n            raise ValueError("fromutc() requires a non-None dst() result")\n        delta = dtoff - dtdst\n        if delta:\n            dt += delta\n            dtdst = dt.dst()\n            if dtdst is None:\n                raise ValueError(\n                    "fromutc(): dt.dst gave inconsistent " "results; cannot convert"\n                )\n        return dt + dtdst\n\n    # Pickle support.\n\n    def __reduce__(self):\n        getinitargs = getattr(self, "__getinitargs__", None)\n        if getinitargs:\n            args = getinitargs()\n        else:\n            args = ()\n        return (self.__class__, args, self.__getstate__())\n\n\nclass IsoCalendarDate(tuple):\n    def __new__(cls, year, week, weekday):\n        return super().__new__(cls, (year, week, weekday))\n\n    @property\n    def year(self):\n        return self[0]\n\n    @property\n    def week(self):\n        return self[1]\n\n    @property\n    def weekday(self):\n        return self[2]\n\n    def __reduce__(self):\n        # This code is intended to pickle the object without making the\n        # class public. See https://bugs.python.org/msg352381\n        return (tuple, (tuple(self),))\n\n    def __repr__(self):\n        return f"{self.__class__.__name__}(year={self[0]}, week={self[1]}, weekday={self[2]})"\n\n\n_IsoCalendarDate = IsoCalendarDate\ndel IsoCalendarDate\n_tzinfo_class = tzinfo\n\n\nclass time:\n    """Time with time zone.\n\n    Constructors:\n\n    __new__()\n\n    Operators:\n\n    __repr__, __str__\n    __eq__, __le__, __lt__, __ge__, __gt__, __hash__\n\n    Methods:\n\n    strftime()\n    isoformat()\n    utcoffset()\n    tzname()\n    dst()\n\n    Properties (readonly):\n    hour, minute, second, microsecond, tzinfo, fold\n    """\n\n    __slots__ = (\n        "_hour",\n        "_minute",\n        "_second",\n        "_microsecond",\n        "_tzinfo",\n        "_hashcode",\n        "_fold",\n    )\n\n    def __new__(cls, hour=0, minute=0, second=0, microsecond=0, tzinfo=None, *, fold=0):\n        """Constructor.\n\n        Arguments:\n\n        hour, minute (required)\n        second, microsecond (default to zero)\n        tzinfo (default to None)\n        fold (keyword only, default to zero)\n        """\n        if (\n            isinstance(hour, (bytes, str))\n            and len(hour) == 6\n            and ord(hour[0:1]) & 0x7F < 24\n        ):\n            # Pickle support\n            if isinstance(hour, str):\n                try:\n                    hour = hour.encode("latin1")\n                except UnicodeEncodeError:\n                    # More informative error message.\n                    raise ValueError(\n                        "Failed to encode latin1 string when unpickling "\n                        "a time object. "\n                        "pickle.load(data, encoding=\'latin1\') is assumed."\n                    )\n            self = object.__new__(cls)\n            self.__setstate(hour, minute or None)\n            self._hashcode = -1\n            return self\n        hour, minute, second, microsecond, fold = _check_time_fields(\n            hour, minute, second, microsecond, fold\n        )\n        _check_tzinfo_arg(tzinfo)\n        self = object.__new__(cls)\n        self._hour = hour\n        self._minute = minute\n        self._second = second\n        self._microsecond = microsecond\n        self._tzinfo = tzinfo\n        self._hashcode = -1\n        self._fold = fold\n        return self\n\n    # Read-only field accessors\n    @property\n    def hour(self):\n        """hour (0-23)"""\n        return self._hour\n\n    @property\n    def minute(self):\n        """minute (0-59)"""\n        return self._minute\n\n    @property\n    def second(self):\n        """second (0-59)"""\n        return self._second\n\n    @property\n    def microsecond(self):\n        """microsecond (0-999999)"""\n        return self._microsecond\n\n    @property\n    def tzinfo(self):\n        """timezone info object"""\n        return self._tzinfo\n\n    @property\n    def fold(self):\n        return self._fold\n\n    # Standard conversions, __hash__ (and helpers)\n\n    # Comparisons of time objects with other.\n\n    def __eq__(self, other):\n        if isinstance(other, time):\n            return self._cmp(other, allow_mixed=True) == 0\n        else:\n            return NotImplemented\n\n    def __le__(self, other):\n        if isinstance(other, time):\n            return self._cmp(other) <= 0\n        else:\n            return NotImplemented\n\n    def __lt__(self, other):\n        if isinstance(other, time):\n            return self._cmp(other) < 0\n        else:\n            return NotImplemented\n\n    def __ge__(self, other):\n        if isinstance(other, time):\n            return self._cmp(other) >= 0\n        else:\n            return NotImplemented\n\n    def __gt__(self, other):\n        if isinstance(other, time):\n            return self._cmp(other) > 0\n        else:\n            return NotImplemented\n\n    def _cmp(self, other, allow_mixed=False):\n        assert isinstance(other, time)\n        mytz = self._tzinfo\n        ottz = other._tzinfo\n        myoff = otoff = None\n\n        if mytz is ottz:\n            base_compare = True\n        else:\n            myoff = self.utcoffset()\n            otoff = other.utcoffset()\n            base_compare = myoff == otoff\n\n        if base_compare:\n            return _cmp(\n                (self._hour, self._minute, self._second, self._microsecond),\n                (other._hour, other._minute, other._second, other._microsecond),\n            )\n        if myoff is None or otoff is None:\n            if allow_mixed:\n                return 2  # arbitrary non-zero value\n            else:\n                raise TypeError("cannot compare naive and aware times")\n        myhhmm = self._hour * 60 + self._minute - myoff // timedelta(minutes=1)\n        othhmm = other._hour * 60 + other._minute - otoff // timedelta(minutes=1)\n        return _cmp(\n            (myhhmm, self._second, self._microsecond),\n            (othhmm, other._second, other._microsecond),\n        )\n\n    def __hash__(self):\n        """Hash."""\n        if self._hashcode == -1:\n            if self.fold:\n                t = self.replace(fold=0)\n            else:\n                t = self\n            tzoff = t.utcoffset()\n            if not tzoff:  # zero or None\n                self._hashcode = hash(t._getstate()[0])\n            else:\n                h, m = divmod(\n                    timedelta(hours=self.hour, minutes=self.minute) - tzoff,\n                    timedelta(hours=1),\n                )\n                assert not m % timedelta(minutes=1), "whole minute"\n                m //= timedelta(minutes=1)\n                if 0 <= h < 24:\n                    self._hashcode = hash(time(h, m, self.second, self.microsecond))\n                else:\n                    self._hashcode = hash((h, m, self.second, self.microsecond))\n        return self._hashcode\n\n    # Conversion to string\n\n    def _tzstr(self):\n        """Return formatted timezone offset (+xx:xx) or an empty string."""\n        off = self.utcoffset()\n        return _format_offset(off)\n\n    def __repr__(self):\n        """Convert to formal string, for repr()."""\n        if self._microsecond != 0:\n            s = ", %d, %d" % (self._second, self._microsecond)\n        elif self._second != 0:\n            s = ", %d" % self._second\n        else:\n            s = ""\n        s = "%s.%s(%d, %d%s)" % (\n            self.__class__.__module__,\n            self.__class__.__qualname__,\n            self._hour,\n            self._minute,\n            s,\n        )\n        if self._tzinfo is not None:\n            assert s[-1:] == ")"\n            s = s[:-1] + ", tzinfo=%r" % self._tzinfo + ")"\n        if self._fold:\n            assert s[-1:] == ")"\n            s = s[:-1] + ", fold=1)"\n        return s\n\n    def isoformat(self, timespec="auto"):\n        """Return the time formatted according to ISO.\n\n        The full format is \'HH:MM:SS.mmmmmm+zz:zz\'. By default, the fractional\n        part is omitted if self.microsecond == 0.\n\n        The optional argument timespec specifies the number of additional\n        terms of the time to include. Valid options are \'auto\', \'hours\',\n        \'minutes\', \'seconds\', \'milliseconds\' and \'microseconds\'.\n        """\n        s = _format_time(\n            self._hour, self._minute, self._second, self._microsecond, timespec\n        )\n        tz = self._tzstr()\n        if tz:\n            s += tz\n        return s\n\n    __str__ = isoformat\n\n    @classmethod\n    def fromisoformat(cls, time_string):\n        """Construct a time from a string in one of the ISO 8601 formats."""\n        if not isinstance(time_string, str):\n            raise TypeError("fromisoformat: argument must be str")\n\n        # The spec actually requires that time-only ISO 8601 strings start with\n        # T, but the extended format allows this to be omitted as long as there\n        # is no ambiguity with date strings.\n        time_string = time_string.removeprefix("T")\n\n        try:\n            return cls(*_parse_isoformat_time(time_string))\n        except Exception:\n            raise ValueError(f\'Invalid isoformat string: "{time_string}"\')\n\n    def strftime(self, fmt):\n        """Format using strftime().  The date part of the timestamp passed\n        to underlying strftime should not be used.\n        """\n        # The year must be >= 1000 else Python\'s strftime implementation\n        # can raise a bogus exception.\n        timetuple = (1900, 1, 1, self._hour, self._minute, self._second, 0, 1, -1)\n        return _wrap_strftime(self, fmt, timetuple)\n\n    def __format__(self, fmt):\n        if not isinstance(fmt, str):\n            raise TypeError("must be str, not %s" % type(fmt).__name__)\n        if len(fmt) != 0:\n            return self.strftime(fmt)\n        return str(self)\n\n    # Timezone functions\n\n    def utcoffset(self):\n        """Return the timezone offset as timedelta, positive east of UTC\n        (negative west of UTC)."""\n        if self._tzinfo is None:\n            return None\n        offset = self._tzinfo.utcoffset(None)\n        _check_utc_offset("utcoffset", offset)\n        return offset\n\n    def tzname(self):\n        """Return the timezone name.\n\n        Note that the name is 100% informational -- there\'s no requirement that\n        it mean anything in particular. For example, "GMT", "UTC", "-500",\n        "-5:00", "EDT", "US/Eastern", "America/New York" are all valid replies.\n        """\n        if self._tzinfo is None:\n            return None\n        name = self._tzinfo.tzname(None)\n        _check_tzname(name)\n        return name\n\n    def dst(self):\n        """Return 0 if DST is not in effect, or the DST offset (as timedelta\n        positive eastward) if DST is in effect.\n\n        This is purely informational; the DST offset has already been added to\n        the UTC offset returned by utcoffset() if applicable, so there\'s no\n        need to consult dst() unless you\'re interested in displaying the DST\n        info.\n        """\n        if self._tzinfo is None:\n            return None\n        offset = self._tzinfo.dst(None)\n        _check_utc_offset("dst", offset)\n        return offset\n\n    def replace(\n        self,\n        hour=None,\n        minute=None,\n        second=None,\n        microsecond=None,\n        tzinfo=True,\n        *,\n        fold=None,\n    ):\n        """Return a new time with new values for the specified fields."""\n        if hour is None:\n            hour = self.hour\n        if minute is None:\n            minute = self.minute\n        if second is None:\n            second = self.second\n        if microsecond is None:\n            microsecond = self.microsecond\n        if tzinfo is True:\n            tzinfo = self.tzinfo\n        if fold is None:\n            fold = self._fold\n        return type(self)(hour, minute, second, microsecond, tzinfo, fold=fold)\n\n    # Pickle support.\n\n    def _getstate(self, protocol=3):\n        us2, us3 = divmod(self._microsecond, 256)\n        us1, us2 = divmod(us2, 256)\n        h = self._hour\n        if self._fold and protocol > 3:\n            h += 128\n        basestate = bytes([h, self._minute, self._second, us1, us2, us3])\n        if self._tzinfo is None:\n            return (basestate,)\n        else:\n            return (basestate, self._tzinfo)\n\n    def __setstate(self, string, tzinfo):\n        if tzinfo is not None and not isinstance(tzinfo, _tzinfo_class):\n            raise TypeError("bad tzinfo state arg")\n        h, self._minute, self._second, us1, us2, us3 = string\n        if h > 127:\n            self._fold = 1\n            self._hour = h - 128\n        else:\n            self._fold = 0\n            self._hour = h\n        self._microsecond = (((us1 << 8) | us2) << 8) | us3\n        self._tzinfo = tzinfo\n\n    def __reduce_ex__(self, protocol):\n        return (self.__class__, self._getstate(protocol))\n\n    def __reduce__(self):\n        return self.__reduce_ex__(2)\n\n\n_time_class = time  # so functions w/ args named "time" can get at the class\n\ntime.min = time(0, 0, 0)\ntime.max = time(23, 59, 59, 999999)\ntime.resolution = timedelta(microseconds=1)\n\n\nclass datetime(date):\n    """datetime(year, month, day[, hour[, minute[, second[, microsecond[,tzinfo]]]]])\n\n    The year, month and day arguments are required. tzinfo may be None, or an\n    instance of a tzinfo subclass. The remaining arguments may be ints.\n    """\n\n    __slots__ = date.__slots__ + time.__slots__\n\n    def __new__(\n        cls,\n        year,\n        month=None,\n        day=None,\n        hour=0,\n        minute=0,\n        second=0,\n        microsecond=0,\n        tzinfo=None,\n        *,\n        fold=0,\n    ):\n        if (\n            isinstance(year, (bytes, str))\n            and len(year) == 10\n            and 1 <= ord(year[2:3]) & 0x7F <= 12\n        ):\n            # Pickle support\n            if isinstance(year, str):\n                try:\n                    year = bytes(year, "latin1")\n                except UnicodeEncodeError:\n                    # More informative error message.\n                    raise ValueError(\n                        "Failed to encode latin1 string when unpickling "\n                        "a datetime object. "\n                        "pickle.load(data, encoding=\'latin1\') is assumed."\n                    )\n            self = object.__new__(cls)\n            self.__setstate(year, month)\n            self._hashcode = -1\n            return self\n        year, month, day = _check_date_fields(year, month, day)\n        hour, minute, second, microsecond, fold = _check_time_fields(\n            hour, minute, second, microsecond, fold\n        )\n        _check_tzinfo_arg(tzinfo)\n        self = object.__new__(cls)\n        self._year = year\n        self._month = month\n        self._day = day\n        self._hour = hour\n        self._minute = minute\n        self._second = second\n        self._microsecond = microsecond\n        self._tzinfo = tzinfo\n        self._hashcode = -1\n        self._fold = fold\n        return self\n\n    # Read-only field accessors\n    @property\n    def hour(self):\n        """hour (0-23)"""\n        return self._hour\n\n    @property\n    def minute(self):\n        """minute (0-59)"""\n        return self._minute\n\n    @property\n    def second(self):\n        """second (0-59)"""\n        return self._second\n\n    @property\n    def microsecond(self):\n        """microsecond (0-999999)"""\n        return self._microsecond\n\n    @property\n    def tzinfo(self):\n        """timezone info object"""\n        return self._tzinfo\n\n    @property\n    def fold(self):\n        return self._fold\n\n    @classmethod\n    def _fromtimestamp(cls, t, utc, tz):\n        """Construct a datetime from a POSIX timestamp (like time.time()).\n\n        A timezone info object may be passed in as well.\n        """\n        frac, t = _math.modf(t)\n        us = round(frac * 1e6)\n        if us >= 1000000:\n            t += 1\n            us -= 1000000\n        elif us < 0:\n            t -= 1\n            us += 1000000\n\n        converter = _time.gmtime if utc else _time.localtime\n        y, m, d, hh, mm, ss, weekday, jday, dst = converter(t)\n        ss = min(ss, 59)  # clamp out leap seconds if the platform has them\n        result = cls(y, m, d, hh, mm, ss, us, tz)\n        if tz is None and not utc:\n            # As of version 2015f max fold in IANA database is\n            # 23 hours at 1969-09-30 13:00:00 in Kwajalein.\n            # Let\'s probe 24 hours in the past to detect a transition:\n            max_fold_seconds = 24 * 3600\n\n            # On Windows localtime_s throws an OSError for negative values,\n            # thus we can\'t perform fold detection for values of time less\n            # than the max time fold. See comments in _datetimemodule\'s\n            # version of this method for more details.\n            if t < max_fold_seconds and sys.platform.startswith("win"):\n                return result\n\n            y, m, d, hh, mm, ss = converter(t - max_fold_seconds)[:6]\n            probe1 = cls(y, m, d, hh, mm, ss, us, tz)\n            trans = result - probe1 - timedelta(0, max_fold_seconds)\n            if trans.days < 0:\n                y, m, d, hh, mm, ss = converter(t + trans // timedelta(0, 1))[:6]\n                probe2 = cls(y, m, d, hh, mm, ss, us, tz)\n                if probe2 == result:\n                    result._fold = 1\n        elif tz is not None:\n            result = tz.fromutc(result)\n        return result\n\n    @classmethod\n    def fromtimestamp(cls, t, tz=None):\n        """Construct a datetime from a POSIX timestamp (like time.time()).\n\n        A timezone info object may be passed in as well.\n        """\n        _check_tzinfo_arg(tz)\n\n        return cls._fromtimestamp(t, tz is not None, tz)\n\n    @classmethod\n    def utcfromtimestamp(cls, t):\n        """Construct a naive UTC datetime from a POSIX timestamp."""\n        return cls._fromtimestamp(t, True, None)\n\n    @classmethod\n    def now(cls, tz=None):\n        "Construct a datetime from time.time() and optional time zone info."\n        t = _time.time()\n        return cls.fromtimestamp(t, tz)\n\n    @classmethod\n    def utcnow(cls):\n        "Construct a UTC datetime from time.time()."\n        t = _time.time()\n        return cls.utcfromtimestamp(t)\n\n    @classmethod\n    def combine(cls, date, time, tzinfo=True):\n        "Construct a datetime from a given date and a given time."\n        if not isinstance(date, _date_class):\n            raise TypeError("date argument must be a date instance")\n        if not isinstance(time, _time_class):\n            raise TypeError("time argument must be a time instance")\n        if tzinfo is True:\n            tzinfo = time.tzinfo\n        return cls(\n            date.year,\n            date.month,\n            date.day,\n            time.hour,\n            time.minute,\n            time.second,\n            time.microsecond,\n            tzinfo,\n            fold=time.fold,\n        )\n\n    @classmethod\n    def fromisoformat(cls, date_string):\n        """Construct a datetime from a string in one of the ISO 8601 formats."""\n        if not isinstance(date_string, str):\n            raise TypeError("fromisoformat: argument must be str")\n\n        if len(date_string) < 7:\n            raise ValueError(f\'Invalid isoformat string: "{date_string}"\')\n\n        # Split this at the separator\n        try:\n            separator_location = _find_isoformat_datetime_separator(date_string)\n            dstr = date_string[0:separator_location]\n            tstr = date_string[(separator_location + 1) :]\n\n            date_components = _parse_isoformat_date(dstr)\n        except ValueError:\n            raise ValueError(f\'Invalid isoformat string: "{date_string}"\') from None\n\n        if tstr:\n            try:\n                time_components = _parse_isoformat_time(tstr)\n            except ValueError:\n                raise ValueError(f\'Invalid isoformat string: "{date_string}"\') from None\n        else:\n            time_components = [0, 0, 0, 0, None]\n\n        return cls(*(date_components + time_components))\n\n    def timetuple(self):\n        "Return local time tuple compatible with time.localtime()."\n        dst = self.dst()\n        if dst is None:\n            dst = -1\n        elif dst:\n            dst = 1\n        else:\n            dst = 0\n        return _build_struct_time(\n            self.year, self.month, self.day, self.hour, self.minute, self.second, dst\n        )\n\n    def _mktime(self):\n        """Return integer POSIX timestamp."""\n        epoch = datetime(1970, 1, 1)\n        max_fold_seconds = 24 * 3600\n        t = (self - epoch) // timedelta(0, 1)\n\n        def local(u):\n            y, m, d, hh, mm, ss = _time.localtime(u)[:6]\n            return (datetime(y, m, d, hh, mm, ss) - epoch) // timedelta(0, 1)\n\n        # Our goal is to solve t = local(u) for u.\n        a = local(t) - t\n        u1 = t - a\n        t1 = local(u1)\n        if t1 == t:\n            # We found one solution, but it may not be the one we need.\n            # Look for an earlier solution (if `fold` is 0), or a\n            # later one (if `fold` is 1).\n            u2 = u1 + (-max_fold_seconds, max_fold_seconds)[self.fold]\n            b = local(u2) - u2\n            if a == b:\n                return u1\n        else:\n            b = t1 - u1\n            assert a != b\n        u2 = t - b\n        t2 = local(u2)\n        if t2 == t:\n            return u2\n        if t1 == t:\n            return u1\n        # We have found both offsets a and b, but neither t - a nor t - b is\n        # a solution.  This means t is in the gap.\n        return (max, min)[self.fold](u1, u2)\n\n    def timestamp(self):\n        "Return POSIX timestamp as float"\n        if self._tzinfo is None:\n            s = self._mktime()\n            return s + self.microsecond / 1e6\n        else:\n            return (self - _EPOCH).total_seconds()\n\n    def utctimetuple(self):\n        "Return UTC time tuple compatible with time.gmtime()."\n        offset = self.utcoffset()\n        if offset:\n            self -= offset\n        y, m, d = self.year, self.month, self.day\n        hh, mm, ss = self.hour, self.minute, self.second\n        return _build_struct_time(y, m, d, hh, mm, ss, 0)\n\n    def date(self):\n        "Return the date part."\n        return date(self._year, self._month, self._day)\n\n    def time(self):\n        "Return the time part, with tzinfo None."\n        return time(\n            self.hour, self.minute, self.second, self.microsecond, fold=self.fold\n        )\n\n    def timetz(self):\n        "Return the time part, with same tzinfo."\n        return time(\n            self.hour,\n            self.minute,\n            self.second,\n            self.microsecond,\n            self._tzinfo,\n            fold=self.fold,\n        )\n\n    def replace(\n        self,\n        year=None,\n        month=None,\n        day=None,\n        hour=None,\n        minute=None,\n        second=None,\n        microsecond=None,\n        tzinfo=True,\n        *,\n        fold=None,\n    ):\n        """Return a new datetime with new values for the specified fields."""\n        if year is None:\n            year = self.year\n        if month is None:\n            month = self.month\n        if day is None:\n            day = self.day\n        if hour is None:\n            hour = self.hour\n        if minute is None:\n            minute = self.minute\n        if second is None:\n            second = self.second\n        if microsecond is None:\n            microsecond = self.microsecond\n        if tzinfo is True:\n            tzinfo = self.tzinfo\n        if fold is None:\n            fold = self.fold\n        return type(self)(\n            year, month, day, hour, minute, second, microsecond, tzinfo, fold=fold\n        )\n\n    def _local_timezone(self):\n        if self.tzinfo is None:\n            ts = self._mktime()\n        else:\n            ts = (self - _EPOCH) // timedelta(seconds=1)\n        localtm = _time.localtime(ts)\n        local = datetime(*localtm[:6])\n        # Extract TZ data\n        gmtoff = localtm.tm_gmtoff\n        zone = localtm.tm_zone\n        return timezone(timedelta(seconds=gmtoff), zone)\n\n    def astimezone(self, tz=None):\n        if tz is None:\n            tz = self._local_timezone()\n        elif not isinstance(tz, tzinfo):\n            raise TypeError("tz argument must be an instance of tzinfo")\n\n        mytz = self.tzinfo\n        if mytz is None:\n            mytz = self._local_timezone()\n            myoffset = mytz.utcoffset(self)\n        else:\n            myoffset = mytz.utcoffset(self)\n            if myoffset is None:\n                mytz = self.replace(tzinfo=None)._local_timezone()\n                myoffset = mytz.utcoffset(self)\n\n        if tz is mytz:\n            return self\n\n        # Convert self to UTC, and attach the new time zone object.\n        utc = (self - myoffset).replace(tzinfo=tz)\n\n        # Convert from UTC to tz\'s local time.\n        return tz.fromutc(utc)\n\n    # Ways to produce a string.\n\n    def ctime(self):\n        "Return ctime() style string."\n        weekday = self.toordinal() % 7 or 7\n        return "%s %s %2d %02d:%02d:%02d %04d" % (\n            _DAYNAMES[weekday],\n            _MONTHNAMES[self._month],\n            self._day,\n            self._hour,\n            self._minute,\n            self._second,\n            self._year,\n        )\n\n    def isoformat(self, sep="T", timespec="auto"):\n        """Return the time formatted according to ISO.\n\n        The full format looks like \'YYYY-MM-DD HH:MM:SS.mmmmmm\'.\n        By default, the fractional part is omitted if self.microsecond == 0.\n\n        If self.tzinfo is not None, the UTC offset is also attached, giving\n        giving a full format of \'YYYY-MM-DD HH:MM:SS.mmmmmm+HH:MM\'.\n\n        Optional argument sep specifies the separator between date and\n        time, default \'T\'.\n\n        The optional argument timespec specifies the number of additional\n        terms of the time to include. Valid options are \'auto\', \'hours\',\n        \'minutes\', \'seconds\', \'milliseconds\' and \'microseconds\'.\n        """\n        s = "%04d-%02d-%02d%c" % (\n            self._year,\n            self._month,\n            self._day,\n            sep,\n        ) + _format_time(\n            self._hour, self._minute, self._second, self._microsecond, timespec\n        )\n\n        off = self.utcoffset()\n        tz = _format_offset(off)\n        if tz:\n            s += tz\n\n        return s\n\n    def __repr__(self):\n        """Convert to formal string, for repr()."""\n        L = [\n            self._year,\n            self._month,\n            self._day,  # These are never zero\n            self._hour,\n            self._minute,\n            self._second,\n            self._microsecond,\n        ]\n        if L[-1] == 0:\n            del L[-1]\n        if L[-1] == 0:\n            del L[-1]\n        s = "%s.%s(%s)" % (\n            self.__class__.__module__,\n            self.__class__.__qualname__,\n            ", ".join(map(str, L)),\n        )\n        if self._tzinfo is not None:\n            assert s[-1:] == ")"\n            s = s[:-1] + ", tzinfo=%r" % self._tzinfo + ")"\n        if self._fold:\n            assert s[-1:] == ")"\n            s = s[:-1] + ", fold=1)"\n        return s\n\n    def __str__(self):\n        "Convert to string, for str()."\n        return self.isoformat(sep=" ")\n\n    @classmethod\n    def strptime(cls, date_string, format):\n        "string, format -> new datetime parsed from a string (like time.strptime())."\n        import _strptime\n\n        return _strptime._strptime_datetime(cls, date_string, format)\n\n    def utcoffset(self):\n        """Return the timezone offset as timedelta positive east of UTC (negative west of\n        UTC)."""\n        if self._tzinfo is None:\n            return None\n        offset = self._tzinfo.utcoffset(self)\n        _check_utc_offset("utcoffset", offset)\n        return offset\n\n    def tzname(self):\n        """Return the timezone name.\n\n        Note that the name is 100% informational -- there\'s no requirement that\n        it mean anything in particular. For example, "GMT", "UTC", "-500",\n        "-5:00", "EDT", "US/Eastern", "America/New York" are all valid replies.\n        """\n        if self._tzinfo is None:\n            return None\n        name = self._tzinfo.tzname(self)\n        _check_tzname(name)\n        return name\n\n    def dst(self):\n        """Return 0 if DST is not in effect, or the DST offset (as timedelta\n        positive eastward) if DST is in effect.\n\n        This is purely informational; the DST offset has already been added to\n        the UTC offset returned by utcoffset() if applicable, so there\'s no\n        need to consult dst() unless you\'re interested in displaying the DST\n        info.\n        """\n        if self._tzinfo is None:\n            return None\n        offset = self._tzinfo.dst(self)\n        _check_utc_offset("dst", offset)\n        return offset\n\n    # Comparisons of datetime objects with other.\n\n    def __eq__(self, other):\n        if isinstance(other, datetime):\n            return self._cmp(other, allow_mixed=True) == 0\n        elif not isinstance(other, date):\n            return NotImplemented\n        else:\n            return False\n\n    def __le__(self, other):\n        if isinstance(other, datetime):\n            return self._cmp(other) <= 0\n        elif not isinstance(other, date):\n            return NotImplemented\n        else:\n            _cmperror(self, other)\n\n    def __lt__(self, other):\n        if isinstance(other, datetime):\n            return self._cmp(other) < 0\n        elif not isinstance(other, date):\n            return NotImplemented\n        else:\n            _cmperror(self, other)\n\n    def __ge__(self, other):\n        if isinstance(other, datetime):\n            return self._cmp(other) >= 0\n        elif not isinstance(other, date):\n            return NotImplemented\n        else:\n            _cmperror(self, other)\n\n    def __gt__(self, other):\n        if isinstance(other, datetime):\n            return self._cmp(other) > 0\n        elif not isinstance(other, date):\n            return NotImplemented\n        else:\n            _cmperror(self, other)\n\n    def _cmp(self, other, allow_mixed=False):\n        assert isinstance(other, datetime)\n        mytz = self._tzinfo\n        ottz = other._tzinfo\n        myoff = otoff = None\n\n        if mytz is ottz:\n            base_compare = True\n        else:\n            myoff = self.utcoffset()\n            otoff = other.utcoffset()\n            # Assume that allow_mixed means that we are called from __eq__\n            if allow_mixed:\n                if myoff != self.replace(fold=not self.fold).utcoffset():\n                    return 2\n                if otoff != other.replace(fold=not other.fold).utcoffset():\n                    return 2\n            base_compare = myoff == otoff\n\n        if base_compare:\n            return _cmp(\n                (\n                    self._year,\n                    self._month,\n                    self._day,\n                    self._hour,\n                    self._minute,\n                    self._second,\n                    self._microsecond,\n                ),\n                (\n                    other._year,\n                    other._month,\n                    other._day,\n                    other._hour,\n                    other._minute,\n                    other._second,\n                    other._microsecond,\n                ),\n            )\n        if myoff is None or otoff is None:\n            if allow_mixed:\n                return 2  # arbitrary non-zero value\n            else:\n                raise TypeError("cannot compare naive and aware datetimes")\n        # XXX What follows could be done more efficiently...\n        diff = self - other  # this will take offsets into account\n        if diff.days < 0:\n            return -1\n        return diff and 1 or 0\n\n    def __add__(self, other):\n        "Add a datetime and a timedelta."\n        if not isinstance(other, timedelta):\n            return NotImplemented\n        delta = timedelta(\n            self.toordinal(),\n            hours=self._hour,\n            minutes=self._minute,\n            seconds=self._second,\n            microseconds=self._microsecond,\n        )\n        delta += other\n        hour, rem = divmod(delta.seconds, 3600)\n        minute, second = divmod(rem, 60)\n        if 0 < delta.days <= _MAXORDINAL:\n            return type(self).combine(\n                date.fromordinal(delta.days),\n                time(hour, minute, second, delta.microseconds, tzinfo=self._tzinfo),\n            )\n        raise OverflowError("result out of range")\n\n    __radd__ = __add__\n\n    def __sub__(self, other):\n        "Subtract two datetimes, or a datetime and a timedelta."\n        if not isinstance(other, datetime):\n            if isinstance(other, timedelta):\n                return self + -other\n            return NotImplemented\n\n        days1 = self.toordinal()\n        days2 = other.toordinal()\n        secs1 = self._second + self._minute * 60 + self._hour * 3600\n        secs2 = other._second + other._minute * 60 + other._hour * 3600\n        base = timedelta(\n            days1 - days2, secs1 - secs2, self._microsecond - other._microsecond\n        )\n        if self._tzinfo is other._tzinfo:\n            return base\n        myoff = self.utcoffset()\n        otoff = other.utcoffset()\n        if myoff == otoff:\n            return base\n        if myoff is None or otoff is None:\n            raise TypeError("cannot mix naive and timezone-aware time")\n        return base + otoff - myoff\n\n    def __hash__(self):\n        if self._hashcode == -1:\n            if self.fold:\n                t = self.replace(fold=0)\n            else:\n                t = self\n            tzoff = t.utcoffset()\n            if tzoff is None:\n                self._hashcode = hash(t._getstate()[0])\n            else:\n                days = _ymd2ord(self.year, self.month, self.day)\n                seconds = self.hour * 3600 + self.minute * 60 + self.second\n                self._hashcode = hash(\n                    timedelta(days, seconds, self.microsecond) - tzoff\n                )\n        return self._hashcode\n\n    # Pickle support.\n\n    def _getstate(self, protocol=3):\n        yhi, ylo = divmod(self._year, 256)\n        us2, us3 = divmod(self._microsecond, 256)\n        us1, us2 = divmod(us2, 256)\n        m = self._month\n        if self._fold and protocol > 3:\n            m += 128\n        basestate = bytes(\n            [\n                yhi,\n                ylo,\n                m,\n                self._day,\n                self._hour,\n                self._minute,\n                self._second,\n                us1,\n                us2,\n                us3,\n            ]\n        )\n        if self._tzinfo is None:\n            return (basestate,)\n        else:\n            return (basestate, self._tzinfo)\n\n    def __setstate(self, string, tzinfo):\n        if tzinfo is not None and not isinstance(tzinfo, _tzinfo_class):\n            raise TypeError("bad tzinfo state arg")\n        (\n            yhi,\n            ylo,\n            m,\n            self._day,\n            self._hour,\n            self._minute,\n            self._second,\n            us1,\n            us2,\n            us3,\n        ) = string\n        if m > 127:\n            self._fold = 1\n            self._month = m - 128\n        else:\n            self._fold = 0\n            self._month = m\n        self._year = yhi * 256 + ylo\n        self._microsecond = (((us1 << 8) | us2) << 8) | us3\n        self._tzinfo = tzinfo\n\n    def __reduce_ex__(self, protocol):\n        return (self.__class__, self._getstate(protocol))\n\n    def __reduce__(self):\n        return self.__reduce_ex__(2)\n\n\ndatetime.min = datetime(1, 1, 1)\ndatetime.max = datetime(9999, 12, 31, 23, 59, 59, 999999)\ndatetime.resolution = timedelta(microseconds=1)\n\n\ndef _isoweek1monday(year):\n    # Helper to calculate the day number of the Monday starting week 1\n    # XXX This could be done more efficiently\n    THURSDAY = 3\n    firstday = _ymd2ord(year, 1, 1)\n    firstweekday = (firstday + 6) % 7  # See weekday() above\n    week1monday = firstday - firstweekday\n    if firstweekday > THURSDAY:\n        week1monday += 7\n    return week1monday\n\n\nclass timezone(tzinfo):\n    __slots__ = "_offset", "_name"\n\n    # Sentinel value to disallow None\n    _Omitted = object()\n\n    def __new__(cls, offset, name=_Omitted):\n        if not isinstance(offset, timedelta):\n            raise TypeError("offset must be a timedelta")\n        if name is cls._Omitted:\n            if not offset:\n                return cls.utc\n            name = None\n        elif not isinstance(name, str):\n            raise TypeError("name must be a string")\n        if not cls._minoffset <= offset <= cls._maxoffset:\n            raise ValueError(\n                "offset must be a timedelta "\n                "strictly between -timedelta(hours=24) and "\n                "timedelta(hours=24)."\n            )\n        return cls._create(offset, name)\n\n    @classmethod\n    def _create(cls, offset, name=None):\n        self = object.__new__(cls)\n        self._offset = offset\n        self._name = name\n        return self\n\n    def __getinitargs__(self):\n        """pickle support"""\n        if self._name is None:\n            return (self._offset,)\n        return (self._offset, self._name)\n\n    def __eq__(self, other):\n        if isinstance(other, timezone):\n            return self._offset == other._offset\n        return NotImplemented\n\n    def __hash__(self):\n        return hash(self._offset)\n\n    def __repr__(self):\n        """Convert to formal string, for repr().\n\n        >>> tz = timezone.utc\n        >>> repr(tz)\n        \'datetime.timezone.utc\'\n        >>> tz = timezone(timedelta(hours=-5), \'EST\')\n        >>> repr(tz)\n        "datetime.timezone(datetime.timedelta(-1, 68400), \'EST\')"\n        """\n        if self is self.utc:\n            return "datetime.timezone.utc"\n        if self._name is None:\n            return "%s.%s(%r)" % (\n                self.__class__.__module__,\n                self.__class__.__qualname__,\n                self._offset,\n            )\n        return "%s.%s(%r, %r)" % (\n            self.__class__.__module__,\n            self.__class__.__qualname__,\n            self._offset,\n            self._name,\n        )\n\n    def __str__(self):\n        return self.tzname(None)\n\n    def utcoffset(self, dt):\n        if isinstance(dt, datetime) or dt is None:\n            return self._offset\n        raise TypeError("utcoffset() argument must be a datetime instance" " or None")\n\n    def tzname(self, dt):\n        if isinstance(dt, datetime) or dt is None:\n            if self._name is None:\n                return self._name_from_offset(self._offset)\n            return self._name\n        raise TypeError("tzname() argument must be a datetime instance" " or None")\n\n    def dst(self, dt):\n        if isinstance(dt, datetime) or dt is None:\n            return None\n        raise TypeError("dst() argument must be a datetime instance" " or None")\n\n    def fromutc(self, dt):\n        if isinstance(dt, datetime):\n            if dt.tzinfo is not self:\n                raise ValueError("fromutc: dt.tzinfo " "is not self")\n            return dt + self._offset\n        raise TypeError("fromutc() argument must be a datetime instance" " or None")\n\n    _maxoffset = timedelta(hours=24, microseconds=-1)\n    _minoffset = -_maxoffset\n\n    @staticmethod\n    def _name_from_offset(delta):\n        if not delta:\n            return "UTC"\n        if delta < timedelta(0):\n            sign = "-"\n            delta = -delta\n        else:\n            sign = "+"\n        hours, rest = divmod(delta, timedelta(hours=1))\n        minutes, rest = divmod(rest, timedelta(minutes=1))\n        seconds = rest.seconds\n        microseconds = rest.microseconds\n        if microseconds:\n            return (\n                f"UTC{sign}{hours:02d}:{minutes:02d}:{seconds:02d}.{microseconds:06d}"\n            )\n        if seconds:\n            return f"UTC{sign}{hours:02d}:{minutes:02d}:{seconds:02d}"\n        return f"UTC{sign}{hours:02d}:{minutes:02d}"\n\n\nUTC = timezone.utc = timezone._create(timedelta(0))\n\n# bpo-37642: These attributes are rounded to the nearest minute for backwards\n# compatibility, even though the constructor will accept a wider range of\n# values. This may change in the future.\ntimezone.min = timezone._create(-timedelta(hours=23, minutes=59))\ntimezone.max = timezone._create(timedelta(hours=23, minutes=59))\n_EPOCH = datetime(1970, 1, 1, tzinfo=timezone.utc)\n\n# Some time zone algebra.  For a datetime x, let\n#     x.n = x stripped of its timezone -- its naive time.\n#     x.o = x.utcoffset(), and assuming that doesn\'t raise an exception or\n#           return None\n#     x.d = x.dst(), and assuming that doesn\'t raise an exception or\n#           return None\n#     x.s = x\'s standard offset, x.o - x.d\n#\n# Now some derived rules, where k is a duration (timedelta).\n#\n# 1. x.o = x.s + x.d\n#    This follows from the definition of x.s.\n#\n# 2. If x and y have the same tzinfo member, x.s = y.s.\n#    This is actually a requirement, an assumption we need to make about\n#    sane tzinfo classes.\n#\n# 3. The naive UTC time corresponding to x is x.n - x.o.\n#    This is again a requirement for a sane tzinfo class.\n#\n# 4. (x+k).s = x.s\n#    This follows from #2, and that datetime.timetz+timedelta preserves tzinfo.\n#\n# 5. (x+k).n = x.n + k\n#    Again follows from how arithmetic is defined.\n#\n# Now we can explain tz.fromutc(x).  Let\'s assume it\'s an interesting case\n# (meaning that the various tzinfo methods exist, and don\'t blow up or return\n# None when called).\n#\n# The function wants to return a datetime y with timezone tz, equivalent to x.\n# x is already in UTC.\n#\n# By #3, we want\n#\n#     y.n - y.o = x.n                             [1]\n#\n# The algorithm starts by attaching tz to x.n, and calling that y.  So\n# x.n = y.n at the start.  Then it wants to add a duration k to y, so that [1]\n# becomes true; in effect, we want to solve [2] for k:\n#\n#    (y+k).n - (y+k).o = x.n                      [2]\n#\n# By #1, this is the same as\n#\n#    (y+k).n - ((y+k).s + (y+k).d) = x.n          [3]\n#\n# By #5, (y+k).n = y.n + k, which equals x.n + k because x.n=y.n at the start.\n# Substituting that into [3],\n#\n#    x.n + k - (y+k).s - (y+k).d = x.n; the x.n terms cancel, leaving\n#    k - (y+k).s - (y+k).d = 0; rearranging,\n#    k = (y+k).s - (y+k).d; by #4, (y+k).s == y.s, so\n#    k = y.s - (y+k).d\n#\n# On the RHS, (y+k).d can\'t be computed directly, but y.s can be, and we\n# approximate k by ignoring the (y+k).d term at first.  Note that k can\'t be\n# very large, since all offset-returning methods return a duration of magnitude\n# less than 24 hours.  For that reason, if y is firmly in std time, (y+k).d must\n# be 0, so ignoring it has no consequence then.\n#\n# In any case, the new value is\n#\n#     z = y + y.s                                 [4]\n#\n# It\'s helpful to step back at look at [4] from a higher level:  it\'s simply\n# mapping from UTC to tz\'s standard time.\n#\n# At this point, if\n#\n#     z.n - z.o = x.n                             [5]\n#\n# we have an equivalent time, and are almost done.  The insecurity here is\n# at the start of daylight time.  Picture US Eastern for concreteness.  The wall\n# time jumps from 1:59 to 3:00, and wall hours of the form 2:MM don\'t make good\n# sense then.  The docs ask that an Eastern tzinfo class consider such a time to\n# be EDT (because it\'s "after 2"), which is a redundant spelling of 1:MM EST\n# on the day DST starts.  We want to return the 1:MM EST spelling because that\'s\n# the only spelling that makes sense on the local wall clock.\n#\n# In fact, if [5] holds at this point, we do have the standard-time spelling,\n# but that takes a bit of proof.  We first prove a stronger result.  What\'s the\n# difference between the LHS and RHS of [5]?  Let\n#\n#     diff = x.n - (z.n - z.o)                    [6]\n#\n# Now\n#     z.n =                       by [4]\n#     (y + y.s).n =               by #5\n#     y.n + y.s =                 since y.n = x.n\n#     x.n + y.s =                 since z and y are have the same tzinfo member,\n#                                     y.s = z.s by #2\n#     x.n + z.s\n#\n# Plugging that back into [6] gives\n#\n#     diff =\n#     x.n - ((x.n + z.s) - z.o) =     expanding\n#     x.n - x.n - z.s + z.o =         cancelling\n#     - z.s + z.o =                   by #2\n#     z.d\n#\n# So diff = z.d.\n#\n# If [5] is true now, diff = 0, so z.d = 0 too, and we have the standard-time\n# spelling we wanted in the endcase described above.  We\'re done.  Contrarily,\n# if z.d = 0, then we have a UTC equivalent, and are also done.\n#\n# If [5] is not true now, diff = z.d != 0, and z.d is the offset we need to\n# add to z (in effect, z is in tz\'s standard time, and we need to shift the\n# local clock into tz\'s daylight time).\n#\n# Let\n#\n#     z\' = z + z.d = z + diff                     [7]\n#\n# and we can again ask whether\n#\n#     z\'.n - z\'.o = x.n                           [8]\n#\n# If so, we\'re done.  If not, the tzinfo class is insane, according to the\n# assumptions we\'ve made.  This also requires a bit of proof.  As before, let\'s\n# compute the difference between the LHS and RHS of [8] (and skipping some of\n# the justifications for the kinds of substitutions we\'ve done several times\n# already):\n#\n#     diff\' = x.n - (z\'.n - z\'.o) =           replacing z\'.n via [7]\n#             x.n  - (z.n + diff - z\'.o) =    replacing diff via [6]\n#             x.n - (z.n + x.n - (z.n - z.o) - z\'.o) =\n#             x.n - z.n - x.n + z.n - z.o + z\'.o =    cancel x.n\n#             - z.n + z.n - z.o + z\'.o =              cancel z.n\n#             - z.o + z\'.o =                      #1 twice\n#             -z.s - z.d + z\'.s + z\'.d =          z and z\' have same tzinfo\n#             z\'.d - z.d\n#\n# So z\' is UTC-equivalent to x iff z\'.d = z.d at this point.  If they are equal,\n# we\'ve found the UTC-equivalent so are done.  In fact, we stop with [7] and\n# return z\', not bothering to compute z\'.d.\n#\n# How could z.d and z\'d differ?  z\' = z + z.d [7], so merely moving z\' by\n# a dst() offset, and starting *from* a time already in DST (we know z.d != 0),\n# would have to change the result dst() returns:  we start in DST, and moving\n# a little further into it takes us out of DST.\n#\n# There isn\'t a sane case where this can happen.  The closest it gets is at\n# the end of DST, where there\'s an hour in UTC with no spelling in a hybrid\n# tzinfo class.  In US Eastern, that\'s 5:MM UTC = 0:MM EST = 1:MM EDT.  During\n# that hour, on an Eastern clock 1:MM is taken as being in standard time (6:MM\n# UTC) because the docs insist on that, but 0:MM is taken as being in daylight\n# time (4:MM UTC).  There is no local time mapping to 5:MM UTC.  The local\n# clock jumps from 1:59 back to 1:00 again, and repeats the 1:MM hour in\n# standard time.  Since that\'s what the local clock *does*, we want to map both\n# UTC hours 5:MM and 6:MM to 1:MM Eastern.  The result is ambiguous\n# in local time, but so it goes -- it\'s the way the local clock works.\n#\n# When x = 5:MM UTC is the input to this algorithm, x.o=0, y.o=-5 and y.d=0,\n# so z=0:MM.  z.d=60 (minutes) then, so [5] doesn\'t hold and we keep going.\n# z\' = z + z.d = 1:MM then, and z\'.d=0, and z\'.d - z.d = -60 != 0 so [8]\n# (correctly) concludes that z\' is not UTC-equivalent to x.\n#\n# Because we know z.d said z was in daylight time (else [5] would have held and\n# we would have stopped then), and we know z.d != z\'.d (else [8] would have held\n# and we have stopped then), and there are only 2 possible values dst() can\n# return in Eastern, it follows that z\'.d must be 0 (which it is in the example,\n# but the reasoning doesn\'t depend on the example -- it depends on there being\n# two possible dst() outcomes, one zero and the other non-zero).  Therefore\n# z\' must be in standard time, and is the spelling we want in this case.\n#\n# Note again that z\' is not UTC-equivalent as far as the hybrid tzinfo class is\n# concerned (because it takes z\' as being in standard time rather than the\n# daylight time we intend here), but returning it gives the real-life "local\n# clock repeats an hour" behavior when mapping the "unspellable" UTC hour into\n# tz.\n#\n# When the input is 6:MM, z=1:MM and z.d=0, and we stop at once, again with\n# the 1:MM standard time spelling we want.\n#\n# So how can this break?  One of the assumptions must be violated.  Two\n# possibilities:\n#\n# 1) [2] effectively says that y.s is invariant across all y belong to a given\n#    time zone.  This isn\'t true if, for political reasons or continental drift,\n#    a region decides to change its base offset from UTC.\n#\n# 2) There may be versions of "double daylight" time where the tail end of\n#    the analysis gives up a step too early.  I haven\'t thought about that\n#    enough to say.\n#\n# In any case, it\'s clear that the default fromutc() is strong enough to handle\n# "almost all" time zones:  so long as the standard offset is invariant, it\n# doesn\'t matter if daylight time transition points change from year to year, or\n# if daylight time is skipped in some years; it doesn\'t matter how large or\n# small dst() may get within its bounds; and it doesn\'t even matter if some\n# perverse time zone returns a negative dst()).  So a breaking case must be\n# pretty bizarre, and a tzinfo subclass can override fromutc() if it is.\n',
    ],
    ["pyodide/__init__.py", ""],
    [
      "pyodide/ffi/wrappers.py",
      'from . import create_once_callable, create_proxy\n\nfrom js import clearInterval, clearTimeout, setInterval, setTimeout\n\n\n# An object with a no-op destroy method so we can do\n#\n# TIMEOUTS.pop(id, DUMMY_DESTROYABLE).destroy()\n#\n# and either it gets a real object and calls the real destroy method or it gets\n# the fake which does nothing. This is to handle the case where clear_timeout is\n# called after the timeout executes.\nclass DUMMY_DESTROYABLE:\n    @staticmethod\n    def destroy():\n        pass\n\n\nEVENT_LISTENERS = {}\n\n\ndef add_event_listener(elt, event: str, listener) -> None:\n    """Wrapper for JavaScript\'s\n    :js:meth:`~EventTarget.addEventListener` which automatically manages the lifetime of a\n    JsProxy corresponding to the ``listener`` parameter.\n    """\n    proxy = create_proxy(listener)\n    EVENT_LISTENERS[(elt.js_id, event, listener)] = proxy\n    elt.addEventListener(event, proxy)\n\n\ndef remove_event_listener(elt, event: str, listener) -> None:\n    """Wrapper for JavaScript\'s\n    :js:meth:`~EventTarget.removeEventListener` which automatically manages the\n    lifetime of a JsProxy corresponding to the ``listener`` parameter.\n    """\n    proxy = EVENT_LISTENERS.pop((elt.js_id, event, listener))\n    elt.removeEventListener(event, proxy)\n    proxy.destroy()\n\n\nTIMEOUTS = {}\n\n\ndef set_timeout(callback, timeout):\n    """Wrapper for JavaScript\'s :js:func:`setTimeout` which\n    automatically manages the lifetime of a JsProxy corresponding to the\n    callback param.\n    """\n    id = -1\n\n    def wrapper():\n        nonlocal id\n        callback()\n        TIMEOUTS.pop(id, None)\n\n    callable = create_once_callable(wrapper)\n    timeout_retval = setTimeout(callable, timeout)\n    id = timeout_retval if isinstance(timeout_retval, int) else timeout_retval.js_id\n    TIMEOUTS[id] = callable\n    return timeout_retval\n\n\ndef clear_timeout(timeout_retval) -> None:\n    """Wrapper for JavaScript\'s :js:func:`clearTimeout` which\n    automatically manages the lifetime of a JsProxy corresponding to the\n    ``callback`` parameter.\n    """\n    clearTimeout(timeout_retval)\n    id = timeout_retval if isinstance(timeout_retval, int) else timeout_retval.js_id\n    TIMEOUTS.pop(id, DUMMY_DESTROYABLE).destroy()\n\n\nINTERVAL_CALLBACKS = {}\n\n\ndef set_interval(callback, interval):\n    """Wrapper for JavaScript\'s :js:func:`setInterval` which\n    automatically manages the lifetime of a JsProxy corresponding to the\n    ``callback`` parameter.\n    """\n    proxy = create_proxy(callback)\n    interval_retval = setInterval(proxy, interval)\n    id = interval_retval if isinstance(interval_retval, int) else interval_retval.js_id\n    INTERVAL_CALLBACKS[id] = proxy\n    return interval_retval\n\n\ndef clear_interval(interval_retval):\n    """Wrapper for JavaScript\'s :js:func:`clearInterval`\n    which automatically manages the lifetime of a JsProxy corresponding to\n    the ``callback`` parameter.\n    """\n    clearInterval(interval_retval)\n    id = interval_retval if isinstance(interval_retval, int) else interval_retval.js_id\n    INTERVAL_CALLBACKS.pop(id, DUMMY_DESTROYABLE).destroy()\n\n\n__all__ = [\n    "add_event_listener",\n    "remove_event_listener",\n    "set_timeout",\n    "clear_timeout",\n    "set_interval",\n    "clear_interval",\n]\n',
    ],
    [
      "pyodide/ffi/__init__.py",
      "from _pyodide_core import create_proxy\n\n\ndef create_once_callable(x):\n    return create_proxy(x)\n",
    ],
    [
      "pyodide/code.py",
      "from textwrap import dedent\n\n\ndef eval_code(code, globals=None, locals=None):\n    code = dedent(code)\n    exec(code, globals, locals)\n",
    ],
    [
      "contextlib.py",
      '"""Utilities for with-statement contexts.  See PEP 343."""\nimport os\nimport sys\nfrom collections import deque\n\n__all__ = [\n    "asynccontextmanager",\n    "contextmanager",\n    "closing",\n    "nullcontext",\n    "AsyncExitStack",\n    "ContextDecorator",\n    "ExitStack",\n    "redirect_stdout",\n    "redirect_stderr",\n    "suppress",\n    "aclosing",\n    "chdir",\n]\n\n\nclass ContextDecorator(object):\n    "A base class or mixin that enables context managers to work as decorators."\n\n    def _recreate_cm(self):\n        """Return a recreated instance of self.\n\n        Allows an otherwise one-shot context manager like\n        _GeneratorContextManager to support use as\n        a decorator via implicit recreation.\n\n        This is a private interface just for _GeneratorContextManager.\n        See issue #11647 for details.\n        """\n        return self\n\n    def __call__(self, func):\n        # @wraps(func)\n        def inner(*args, **kwds):\n            with self._recreate_cm():\n                return func(*args, **kwds)\n\n        return inner\n\n\nclass AsyncContextDecorator(object):\n    "A base class or mixin that enables async context managers to work as decorators."\n\n    def _recreate_cm(self):\n        """Return a recreated instance of self."""\n        return self\n\n    def __call__(self, func):\n        # @wraps(func)\n        async def inner(*args, **kwds):\n            async with self._recreate_cm():\n                return await func(*args, **kwds)\n\n        return inner\n\n\nclass _GeneratorContextManagerBase:\n    """Shared functionality for @contextmanager and @asynccontextmanager."""\n\n    def __init__(self, func, args, kwds):\n        self.gen = func(*args, **kwds)\n        self.func, self.args, self.kwds = func, args, kwds\n        # Issue 19330: ensure context manager instances have good docstrings\n        doc = getattr(func, "__doc__", None)\n        if doc is None:\n            doc = type(self).__doc__\n        self.__doc__ = doc\n        # Unfortunately, this still doesn\'t provide good help output when\n        # inspecting the created context manager instances, since pydoc\n        # currently bypasses the instance docstring and shows the docstring\n        # for the class instead.\n        # See http://bugs.python.org/issue19404 for more details.\n\n    def _recreate_cm(self):\n        # _GCMB instances are one-shot context managers, so the\n        # CM must be recreated each time a decorated function is\n        # called\n        return self.__class__(self.func, self.args, self.kwds)\n\n\nclass _GeneratorContextManager(\n    _GeneratorContextManagerBase,\n    ContextDecorator,\n):\n    """Helper for @contextmanager decorator."""\n\n    def __enter__(self):\n        # do not keep args and kwds alive unnecessarily\n        # they are only needed for recreation, which is not possible anymore\n        del self.args, self.kwds, self.func\n        try:\n            return next(self.gen)\n        except StopIteration:\n            raise RuntimeError("generator didn\'t yield") from None\n\n    def __exit__(self, typ, value, traceback):\n        if typ is None:\n            try:\n                next(self.gen)\n            except StopIteration:\n                return False\n            else:\n                raise RuntimeError("generator didn\'t stop")\n        else:\n            if value is None:\n                # Need to force instantiation so we can reliably\n                # tell if we get the same exception back\n                value = typ()\n            try:\n                self.gen.throw(typ, value, traceback)\n            except StopIteration as exc:\n                # Suppress StopIteration *unless* it\'s the same exception that\n                # was passed to throw().  This prevents a StopIteration\n                # raised inside the "with" statement from being suppressed.\n                return exc is not value\n            except RuntimeError as exc:\n                # Don\'t re-raise the passed in exception. (issue27122)\n                if exc is value:\n                    exc.__traceback__ = traceback\n                    return False\n                # Avoid suppressing if a StopIteration exception\n                # was passed to throw() and later wrapped into a RuntimeError\n                # (see PEP 479 for sync generators; async generators also\n                # have this behavior). But do this only if the exception wrapped\n                # by the RuntimeError is actually Stop(Async)Iteration (see\n                # issue29692).\n                if isinstance(value, StopIteration) and exc.__cause__ is value:\n                    exc.__traceback__ = traceback\n                    return False\n                raise\n            except BaseException as exc:\n                # only re-raise if it\'s *not* the exception that was\n                # passed to throw(), because __exit__() must not raise\n                # an exception unless __exit__() itself failed.  But throw()\n                # has to raise the exception to signal propagation, so this\n                # fixes the impedance mismatch between the throw() protocol\n                # and the __exit__() protocol.\n                if exc is not value:\n                    raise\n                exc.__traceback__ = traceback\n                return False\n            raise RuntimeError("generator didn\'t stop after throw()")\n\n\nclass _AsyncGeneratorContextManager(\n    _GeneratorContextManagerBase,\n    AsyncContextDecorator,\n):\n    """Helper for @asynccontextmanager decorator."""\n\n    async def __aenter__(self):\n        # do not keep args and kwds alive unnecessarily\n        # they are only needed for recreation, which is not possible anymore\n        del self.args, self.kwds, self.func\n        try:\n            return await anext(self.gen)\n        except StopAsyncIteration:\n            raise RuntimeError("generator didn\'t yield") from None\n\n    async def __aexit__(self, typ, value, traceback):\n        if typ is None:\n            try:\n                await anext(self.gen)\n            except StopAsyncIteration:\n                return False\n            else:\n                raise RuntimeError("generator didn\'t stop")\n        else:\n            if value is None:\n                # Need to force instantiation so we can reliably\n                # tell if we get the same exception back\n                value = typ()\n            try:\n                await self.gen.athrow(typ, value, traceback)\n            except StopAsyncIteration as exc:\n                # Suppress StopIteration *unless* it\'s the same exception that\n                # was passed to throw().  This prevents a StopIteration\n                # raised inside the "with" statement from being suppressed.\n                return exc is not value\n            except RuntimeError as exc:\n                # Don\'t re-raise the passed in exception. (issue27122)\n                if exc is value:\n                    return False\n                # Avoid suppressing if a Stop(Async)Iteration exception\n                # was passed to athrow() and later wrapped into a RuntimeError\n                # (see PEP 479 for sync generators; async generators also\n                # have this behavior). But do this only if the exception wrapped\n                # by the RuntimeError is actually Stop(Async)Iteration (see\n                # issue29692).\n                if (\n                    isinstance(value, (StopIteration, StopAsyncIteration))\n                    and exc.__cause__ is value\n                ):\n                    return False\n                raise\n            except BaseException as exc:\n                # only re-raise if it\'s *not* the exception that was\n                # passed to throw(), because __exit__() must not raise\n                # an exception unless __exit__() itself failed.  But throw()\n                # has to raise the exception to signal propagation, so this\n                # fixes the impedance mismatch between the throw() protocol\n                # and the __exit__() protocol.\n                if exc is not value:\n                    raise\n                return False\n            raise RuntimeError("generator didn\'t stop after athrow()")\n\n\ndef contextmanager(func):\n    """@contextmanager decorator.\n\n    Typical usage:\n\n        @contextmanager\n        def some_generator(<arguments>):\n            <setup>\n            try:\n                yield <value>\n            finally:\n                <cleanup>\n\n    This makes this:\n\n        with some_generator(<arguments>) as <variable>:\n            <body>\n\n    equivalent to this:\n\n        <setup>\n        try:\n            <variable> = <value>\n            <body>\n        finally:\n            <cleanup>\n    """\n    # @wraps(func)\n    def helper(*args, **kwds):\n        return _GeneratorContextManager(func, args, kwds)\n\n    return helper\n\n\ndef asynccontextmanager(func):\n    """@asynccontextmanager decorator.\n\n    Typical usage:\n\n        @asynccontextmanager\n        async def some_async_generator(<arguments>):\n            <setup>\n            try:\n                yield <value>\n            finally:\n                <cleanup>\n\n    This makes this:\n\n        async with some_async_generator(<arguments>) as <variable>:\n            <body>\n\n    equivalent to this:\n\n        <setup>\n        try:\n            <variable> = <value>\n            <body>\n        finally:\n            <cleanup>\n    """\n    # @wraps(func)\n    def helper(*args, **kwds):\n        return _AsyncGeneratorContextManager(func, args, kwds)\n\n    return helper\n\n\nclass closing:\n    """Context to automatically close something at the end of a block.\n\n    Code like this:\n\n        with closing(<module>.open(<arguments>)) as f:\n            <block>\n\n    is equivalent to this:\n\n        f = <module>.open(<arguments>)\n        try:\n            <block>\n        finally:\n            f.close()\n\n    """\n\n    def __init__(self, thing):\n        self.thing = thing\n\n    def __enter__(self):\n        return self.thing\n\n    def __exit__(self, *exc_info):\n        self.thing.close()\n\n\nclass aclosing:\n    """Async context manager for safely finalizing an asynchronously cleaned-up\n    resource such as an async generator, calling its ``aclose()`` method.\n\n    Code like this:\n\n        async with aclosing(<module>.fetch(<arguments>)) as agen:\n            <block>\n\n    is equivalent to this:\n\n        agen = <module>.fetch(<arguments>)\n        try:\n            <block>\n        finally:\n            await agen.aclose()\n\n    """\n\n    def __init__(self, thing):\n        self.thing = thing\n\n    async def __aenter__(self):\n        return self.thing\n\n    async def __aexit__(self, *exc_info):\n        await self.thing.aclose()\n\n\nclass _RedirectStream:\n\n    _stream = None\n\n    def __init__(self, new_target):\n        self._new_target = new_target\n        # We use a list of old targets to make this CM re-entrant\n        self._old_targets = []\n\n    def __enter__(self):\n        self._old_targets.append(getattr(sys, self._stream))\n        setattr(sys, self._stream, self._new_target)\n        return self._new_target\n\n    def __exit__(self, exctype, excinst, exctb):\n        setattr(sys, self._stream, self._old_targets.pop())\n\n\nclass redirect_stdout(_RedirectStream):\n    """Context manager for temporarily redirecting stdout to another file.\n\n    # How to send help() to stderr\n    with redirect_stdout(sys.stderr):\n        help(dir)\n\n    # How to write help() to a file\n    with open(\'help.txt\', \'w\') as f:\n        with redirect_stdout(f):\n            help(pow)\n    """\n\n    _stream = "stdout"\n\n\nclass redirect_stderr(_RedirectStream):\n    """Context manager for temporarily redirecting stderr to another file."""\n\n    _stream = "stderr"\n\n\nclass suppress:\n    """Context manager to suppress specified exceptions\n\n    After the exception is suppressed, execution proceeds with the next\n    statement following the with statement.\n\n         with suppress(FileNotFoundError):\n             os.remove(somefile)\n         # Execution still resumes here if the file was already removed\n    """\n\n    def __init__(self, *exceptions):\n        self._exceptions = exceptions\n\n    def __enter__(self):\n        pass\n\n    def __exit__(self, exctype, excinst, exctb):\n        # Unlike isinstance and issubclass, CPython exception handling\n        # currently only looks at the concrete type hierarchy (ignoring\n        # the instance and subclass checking hooks). While Guido considers\n        # that a bug rather than a feature, it\'s a fairly hard one to fix\n        # due to various internal implementation details. suppress provides\n        # the simpler issubclass based semantics, rather than trying to\n        # exactly reproduce the limitations of the CPython interpreter.\n        #\n        # See http://bugs.python.org/issue12029 for more details\n        return exctype is not None and issubclass(exctype, self._exceptions)\n\n\nclass _BaseExitStack:\n    """A base class for ExitStack and AsyncExitStack."""\n\n    @staticmethod\n    def _create_exit_wrapper(cm, cm_exit):\n        return MethodType(cm_exit, cm)\n\n    @staticmethod\n    def _create_cb_wrapper(callback, *args, **kwds):\n        def _exit_wrapper(exc_type, exc, tb):\n            callback(*args, **kwds)\n\n        return _exit_wrapper\n\n    def __init__(self):\n        self._exit_callbacks = deque()\n\n    def pop_all(self):\n        """Preserve the context stack by transferring it to a new instance."""\n        new_stack = type(self)()\n        new_stack._exit_callbacks = self._exit_callbacks\n        self._exit_callbacks = deque()\n        return new_stack\n\n    def push(self, exit):\n        """Registers a callback with the standard __exit__ method signature.\n\n        Can suppress exceptions the same way __exit__ method can.\n        Also accepts any object with an __exit__ method (registering a call\n        to the method instead of the object itself).\n        """\n        # We use an unbound method rather than a bound method to follow\n        # the standard lookup behaviour for special methods.\n        _cb_type = type(exit)\n\n        try:\n            exit_method = _cb_type.__exit__\n        except AttributeError:\n            # Not a context manager, so assume it\'s a callable.\n            self._push_exit_callback(exit)\n        else:\n            self._push_cm_exit(exit, exit_method)\n        return exit  # Allow use as a decorator.\n\n    def enter_context(self, cm):\n        """Enters the supplied context manager.\n\n        If successful, also pushes its __exit__ method as a callback and\n        returns the result of the __enter__ method.\n        """\n        # We look up the special methods on the type to match the with\n        # statement.\n        cls = type(cm)\n        try:\n            _enter = cls.__enter__\n            _exit = cls.__exit__\n        except AttributeError:\n            raise TypeError(\n                f"\'{cls.__module__}.{cls.__qualname__}\' object does not support the context manager protocol"\n            ) from None\n        result = _enter(cm)\n        self._push_cm_exit(cm, _exit)\n        return result\n\n    def callback(self, callback, *args, **kwds):\n        """Registers an arbitrary callback and arguments.\n\n        Cannot suppress exceptions.\n        """\n        _exit_wrapper = self._create_cb_wrapper(callback, *args, **kwds)\n\n        # We changed the signature, so using @wraps is not appropriate, but\n        # setting __wrapped__ may still help with introspection.\n        _exit_wrapper.__wrapped__ = callback\n        self._push_exit_callback(_exit_wrapper)\n        return callback  # Allow use as a decorator\n\n    def _push_cm_exit(self, cm, cm_exit):\n        """Helper to correctly register callbacks to __exit__ methods."""\n        _exit_wrapper = self._create_exit_wrapper(cm, cm_exit)\n        self._push_exit_callback(_exit_wrapper, True)\n\n    def _push_exit_callback(self, callback, is_sync=True):\n        self._exit_callbacks.append((is_sync, callback))\n\n\n# Inspired by discussions on http://bugs.python.org/issue13585\nclass ExitStack(_BaseExitStack):\n    """Context manager for dynamic management of a stack of exit callbacks.\n\n    For example:\n        with ExitStack() as stack:\n            files = [stack.enter_context(open(fname)) for fname in filenames]\n            # All opened files will automatically be closed at the end of\n            # the with statement, even if attempts to open files later\n            # in the list raise an exception.\n    """\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, *exc_details):\n        received_exc = exc_details[0] is not None\n\n        # We manipulate the exception state so it behaves as though\n        # we were actually nesting multiple with statements\n        frame_exc = sys.exc_info()[1]\n\n        def _fix_exception_context(new_exc, old_exc):\n            # Context may not be correct, so find the end of the chain\n            while 1:\n                exc_context = new_exc.__context__\n                if exc_context is None or exc_context is old_exc:\n                    # Context is already set correctly (see issue 20317)\n                    return\n                if exc_context is frame_exc:\n                    break\n                new_exc = exc_context\n            # Change the end of the chain to point to the exception\n            # we expect it to reference\n            new_exc.__context__ = old_exc\n\n        # Callbacks are invoked in LIFO order to match the behaviour of\n        # nested context managers\n        suppressed_exc = False\n        pending_raise = False\n        while self._exit_callbacks:\n            is_sync, cb = self._exit_callbacks.pop()\n            assert is_sync\n            try:\n                if cb(*exc_details):\n                    suppressed_exc = True\n                    pending_raise = False\n                    exc_details = (None, None, None)\n            except:\n                new_exc_details = sys.exc_info()\n                # simulate the stack of exceptions by setting the context\n                _fix_exception_context(new_exc_details[1], exc_details[1])\n                pending_raise = True\n                exc_details = new_exc_details\n        if pending_raise:\n            try:\n                # bare "raise exc_details[1]" replaces our carefully\n                # set-up context\n                fixed_ctx = exc_details[1].__context__\n                raise exc_details[1]\n            except BaseException:\n                exc_details[1].__context__ = fixed_ctx\n                raise\n        return received_exc and suppressed_exc\n\n    def close(self):\n        """Immediately unwind the context stack."""\n        self.__exit__(None, None, None)\n\n\n# Inspired by discussions on https://bugs.python.org/issue29302\nclass AsyncExitStack(_BaseExitStack):\n    """Async context manager for dynamic management of a stack of exit\n    callbacks.\n\n    For example:\n        async with AsyncExitStack() as stack:\n            connections = [await stack.enter_async_context(get_connection())\n                for i in range(5)]\n            # All opened connections will automatically be released at the\n            # end of the async with statement, even if attempts to open a\n            # connection later in the list raise an exception.\n    """\n\n    @staticmethod\n    def _create_async_exit_wrapper(cm, cm_exit):\n        return MethodType(cm_exit, cm)\n\n    @staticmethod\n    def _create_async_cb_wrapper(callback, *args, **kwds):\n        async def _exit_wrapper(exc_type, exc, tb):\n            await callback(*args, **kwds)\n\n        return _exit_wrapper\n\n    async def enter_async_context(self, cm):\n        """Enters the supplied async context manager.\n\n        If successful, also pushes its __aexit__ method as a callback and\n        returns the result of the __aenter__ method.\n        """\n        cls = type(cm)\n        try:\n            _enter = cls.__aenter__\n            _exit = cls.__aexit__\n        except AttributeError:\n            raise TypeError(\n                f"\'{cls.__module__}.{cls.__qualname__}\' object does not support the asynchronous context manager protocol"\n            ) from None\n        result = await _enter(cm)\n        self._push_async_cm_exit(cm, _exit)\n        return result\n\n    def push_async_exit(self, exit):\n        """Registers a coroutine function with the standard __aexit__ method\n        signature.\n\n        Can suppress exceptions the same way __aexit__ method can.\n        Also accepts any object with an __aexit__ method (registering a call\n        to the method instead of the object itself).\n        """\n        _cb_type = type(exit)\n        try:\n            exit_method = _cb_type.__aexit__\n        except AttributeError:\n            # Not an async context manager, so assume it\'s a coroutine function\n            self._push_exit_callback(exit, False)\n        else:\n            self._push_async_cm_exit(exit, exit_method)\n        return exit  # Allow use as a decorator\n\n    def push_async_callback(self, callback, *args, **kwds):\n        """Registers an arbitrary coroutine function and arguments.\n\n        Cannot suppress exceptions.\n        """\n        _exit_wrapper = self._create_async_cb_wrapper(callback, *args, **kwds)\n\n        # We changed the signature, so using @wraps is not appropriate, but\n        # setting __wrapped__ may still help with introspection.\n        _exit_wrapper.__wrapped__ = callback\n        self._push_exit_callback(_exit_wrapper, False)\n        return callback  # Allow use as a decorator\n\n    async def aclose(self):\n        """Immediately unwind the context stack."""\n        await self.__aexit__(None, None, None)\n\n    def _push_async_cm_exit(self, cm, cm_exit):\n        """Helper to correctly register coroutine function to __aexit__\n        method."""\n        _exit_wrapper = self._create_async_exit_wrapper(cm, cm_exit)\n        self._push_exit_callback(_exit_wrapper, False)\n\n    async def __aenter__(self):\n        return self\n\n    async def __aexit__(self, *exc_details):\n        received_exc = exc_details[0] is not None\n\n        # We manipulate the exception state so it behaves as though\n        # we were actually nesting multiple with statements\n        frame_exc = sys.exc_info()[1]\n\n        def _fix_exception_context(new_exc, old_exc):\n            # Context may not be correct, so find the end of the chain\n            while 1:\n                exc_context = new_exc.__context__\n                if exc_context is None or exc_context is old_exc:\n                    # Context is already set correctly (see issue 20317)\n                    return\n                if exc_context is frame_exc:\n                    break\n                new_exc = exc_context\n            # Change the end of the chain to point to the exception\n            # we expect it to reference\n            new_exc.__context__ = old_exc\n\n        # Callbacks are invoked in LIFO order to match the behaviour of\n        # nested context managers\n        suppressed_exc = False\n        pending_raise = False\n        while self._exit_callbacks:\n            is_sync, cb = self._exit_callbacks.pop()\n            try:\n                if is_sync:\n                    cb_suppress = cb(*exc_details)\n                else:\n                    cb_suppress = await cb(*exc_details)\n\n                if cb_suppress:\n                    suppressed_exc = True\n                    pending_raise = False\n                    exc_details = (None, None, None)\n            except:\n                new_exc_details = sys.exc_info()\n                # simulate the stack of exceptions by setting the context\n                _fix_exception_context(new_exc_details[1], exc_details[1])\n                pending_raise = True\n                exc_details = new_exc_details\n        if pending_raise:\n            try:\n                # bare "raise exc_details[1]" replaces our carefully\n                # set-up context\n                fixed_ctx = exc_details[1].__context__\n                raise exc_details[1]\n            except BaseException:\n                exc_details[1].__context__ = fixed_ctx\n                raise\n        return received_exc and suppressed_exc\n\n\nclass nullcontext:\n    """Context manager that does no additional processing.\n\n    Used as a stand-in for a normal context manager, when a particular\n    block of code is only sometimes used with a normal context manager:\n\n    cm = optional_cm if condition else nullcontext()\n    with cm:\n        # Perform operation, using optional_cm if condition is True\n    """\n\n    def __init__(self, enter_result=None):\n        self.enter_result = enter_result\n\n    def __enter__(self):\n        return self.enter_result\n\n    def __exit__(self, *excinfo):\n        pass\n\n    async def __aenter__(self):\n        return self.enter_result\n\n    async def __aexit__(self, *excinfo):\n        pass\n\n\nclass chdir:\n    """Non thread-safe context manager to change the current working directory."""\n\n    def __init__(self, path):\n        self.path = path\n        self._old_cwd = []\n\n    def __enter__(self):\n        self._old_cwd.append(os.getcwd())\n        os.chdir(self.path)\n\n    def __exit__(self, *excinfo):\n        os.chdir(self._old_cwd.pop())\n',
    ],
    [
      "html.py",
      'import re as _re\n\n__all__ = ["escape", "unescape"]\n\n\ndef escape(s, quote=True):\n    """\n    Replace special characters "&", "<" and ">" to HTML-safe sequences.\n    If the optional flag quote is true (the default), the quotation mark\n    characters, both double quote (") and single quote (\') characters are also\n    translated.\n    """\n    s = s.replace("&", "&amp;")  # Must be done first!\n    s = s.replace("<", "&lt;")\n    s = s.replace(">", "&gt;")\n    if quote:\n        s = s.replace(\'"\', "&quot;")\n        s = s.replace("\'", "&#x27;")\n    return s\n',
    ],
    [
      "importlib.py",
      'def invalidate_caches():\n    pass\n\n\ndef import_module(modname):\n    mod = __import__(modname)\n    for x in modname.split(".")[1:]:\n        mod = getattr(mod, x)\n    return mod\n',
    ],
  ],
};


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = typeof window == 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts == 'function';
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = typeof process == 'object' && typeof process.versions == 'object' && typeof process.versions.node == 'string';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)');
}

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var read_,
    readAsync,
    readBinary,
    setWindowTitle;

// Normally we don't log exceptions but instead let them bubble out the top
// level where the embedding environment (e.g. the browser) can handle
// them.
// However under v8 and node we sometimes exit the process direcly in which case
// its up to use us to log the exception before exiting.
// If we fix https://github.com/emscripten-core/emscripten/issues/15080
// this may no longer be needed under node.
function logExceptionOnExit(e) {
  if (e instanceof ExitStatus) return;
  let toLog = e;
  if (e && typeof e == 'object' && e.stack) {
    toLog = [e, e.stack];
  }
  err('exiting due to exception: ' + toLog);
}

if (ENVIRONMENT_IS_NODE) {
  if (typeof process == 'undefined' || !process.release || process.release.name !== 'node') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');
  // `require()` is no-op in an ESM module, use `createRequire()` to construct
  // the require()` function.  This is only necessary for multi-environment
  // builds, `-sENVIRONMENT=node` emits a static import declaration instead.
  // TODO: Swap all `require()`'s with `import()`'s?
  // These modules will usually be used on Node.js. Load them eagerly to avoid
  // the complexity of lazy-loading.
  var fs = require('fs');
  var nodePath = require('path');

  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = nodePath.dirname(scriptDirectory) + '/';
  } else {
    scriptDirectory = __dirname + '/';
  }

// include: node_shell_read.js


read_ = (filename, binary) => {
  // We need to re-wrap `file://` strings to URLs. Normalizing isn't
  // necessary in that case, the path should already be absolute.
  filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
  return fs.readFileSync(filename, binary ? undefined : 'utf8');
};

readBinary = (filename) => {
  var ret = read_(filename, true);
  if (!ret.buffer) {
    ret = new Uint8Array(ret);
  }
  assert(ret.buffer);
  return ret;
};

readAsync = (filename, onload, onerror) => {
  // See the comment in the `read_` function.
  filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
  fs.readFile(filename, function(err, data) {
    if (err) onerror(err);
    else onload(data.buffer);
  });
};

// end include: node_shell_read.js
  if (process['argv'].length > 1) {
    thisProgram = process['argv'][1].replace(/\\/g, '/');
  }

  arguments_ = process['argv'].slice(2);

  // MODULARIZE will export the module in the proper place outside, we don't need to export here

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });

  // Without this older versions of node (< v15) will log unhandled rejections
  // but return 0, which is not normally the desired behaviour.  This is
  // not be needed with node v15 and about because it is now the default
  // behaviour:
  // See https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode
  process['on']('unhandledRejection', function(reason) { throw reason; });

  quit_ = (status, toThrow) => {
    if (keepRuntimeAlive()) {
      process['exitCode'] = status;
      throw toThrow;
    }
    logExceptionOnExit(toThrow);
    process['exit'](status);
  };

  Module['inspect'] = function () { return '[Emscripten Module object]'; };

} else
if (ENVIRONMENT_IS_SHELL) {

  if ((typeof process == 'object' && typeof require === 'function') || typeof window == 'object' || typeof importScripts == 'function') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  if (typeof read != 'undefined') {
    read_ = function shell_read(f) {
      return read(f);
    };
  }

  readBinary = function readBinary(f) {
    let data;
    if (typeof readbuffer == 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data == 'object');
    return data;
  };

  readAsync = function readAsync(f, onload, onerror) {
    setTimeout(() => onload(readBinary(f)), 0);
  };

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit == 'function') {
    quit_ = (status, toThrow) => {
      logExceptionOnExit(toThrow);
      quit(status);
    };
  }

  if (typeof print != 'undefined') {
    // Prefer to use print/printErr where they exist, as they usually work better.
    if (typeof console == 'undefined') console = /** @type{!Console} */({});
    console.log = /** @type{!function(this:Console, ...*): undefined} */ (print);
    console.warn = console.error = /** @type{!function(this:Console, ...*): undefined} */ (typeof printErr != 'undefined' ? printErr : print);
  }

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (typeof document != 'undefined' && document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // When MODULARIZE, this JS may be executed later, after document.currentScript
  // is gone, so we saved it, and we use it here instead of any other info.
  if (_scriptDir) {
    scriptDirectory = _scriptDir;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  // If scriptDirectory contains a query (starting with ?) or a fragment (starting with #),
  // they are removed because they could contain a slash.
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf('/')+1);
  } else {
    scriptDirectory = '';
  }

  if (!(typeof window == 'object' || typeof importScripts == 'function')) throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  // Differentiate the Web Worker from the Node Worker case, as reading must
  // be done differently.
  {
// include: web_or_worker_shell_read.js


  read_ = (url) => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      return xhr.responseText;
  }

  if (ENVIRONMENT_IS_WORKER) {
    readBinary = (url) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.responseType = 'arraybuffer';
        xhr.send(null);
        return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
    };
  }

  readAsync = (url, onload, onerror) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  }

// end include: web_or_worker_shell_read.js
  }

  setWindowTitle = (title) => document.title = title;
} else
{
  throw new Error('environment detection error');
}

var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.warn.bind(console);

// Merge back in the overrides
Object.assign(Module, moduleOverrides);
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = null;
checkIncomingModuleAPI();

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.

if (Module['arguments']) arguments_ = Module['arguments'];legacyModuleProp('arguments', 'arguments_');

if (Module['thisProgram']) thisProgram = Module['thisProgram'];legacyModuleProp('thisProgram', 'thisProgram');

if (Module['quit']) quit_ = Module['quit'];legacyModuleProp('quit', 'quit_');

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// Assertions on removed incoming Module JS APIs.
assert(typeof Module['memoryInitializerPrefixURL'] == 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] == 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] == 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] == 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['read'] == 'undefined', 'Module.read option was removed (modify read_ in JS)');
assert(typeof Module['readAsync'] == 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
assert(typeof Module['readBinary'] == 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
assert(typeof Module['setWindowTitle'] == 'undefined', 'Module.setWindowTitle option was removed (modify setWindowTitle in JS)');
assert(typeof Module['TOTAL_MEMORY'] == 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
legacyModuleProp('read', 'read_');
legacyModuleProp('readAsync', 'readAsync');
legacyModuleProp('readBinary', 'readBinary');
legacyModuleProp('setWindowTitle', 'setWindowTitle');
var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';

assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time.  Add 'shell' to `-sENVIRONMENT` to enable.");

// include: support.js


var STACK_ALIGN = 16;
var POINTER_SIZE = 4;

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': case 'u8': return 1;
    case 'i16': case 'u16': return 2;
    case 'i32': case 'u32': return 4;
    case 'i64': case 'u64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length - 1] === '*') {
        return POINTER_SIZE;
      }
      if (type[0] === 'i') {
        const bits = Number(type.substr(1));
        assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
        return bits / 8;
      }
      return 0;
    }
  }
}

// include: runtime_debug.js


function legacyModuleProp(prop, newName) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      get: function() {
        abort('Module.' + prop + ' has been replaced with plain ' + newName + ' (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
      }
    });
  }
}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort('`Module.' + prop + '` was supplied but `' + prop + '` not included in INCOMING_MODULE_JS_API');
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === 'FS_createPath' ||
         name === 'FS_createDataFile' ||
         name === 'FS_createPreloadedFile' ||
         name === 'FS_unlink' ||
         name === 'addRunDependency' ||
         // The old FS has some functionality that WasmFS lacks.
         name === 'FS_createLazyFile' ||
         name === 'FS_createDevice' ||
         name === 'removeRunDependency';
}

function missingGlobal(sym, msg) {
  Object.defineProperty(globalThis, sym, {
    configurable: true,
    get: function() {
      warnOnce('`' + sym + '` is not longer defined by emscripten. ' + msg);
      return undefined;
    }
  });
}

missingGlobal('buffer', 'Please use HEAP8.buffer or wasmMemory.buffer');

function missingLibrarySymbol(sym) {
  if (typeof globalThis !== 'undefined' && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get: function() {
        // Can't `abort()` here because it would break code that does runtime
        // checks.  e.g. `if (typeof SDL === 'undefined')`.
        var msg = '`' + sym + '` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line';
        // DEFAULT_LIBRARY_FUNCS_TO_INCLUDE requires the name as it appears in
        // library.js, which means $name for a JS name with no prefix, or name
        // for a JS name like _name.
        var librarySymbol = sym;
        if (!librarySymbol.startsWith('_')) {
          librarySymbol = '$' + sym;
        }
        msg += " (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=" + librarySymbol + ")";
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        warnOnce(msg);
        return undefined;
      }
    });
  }
}

function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get: function() {
        var msg = "'" + sym + "' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)";
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        abort(msg);
      }
    });
  }
}

// end include: runtime_debug.js
// end include: support.js



// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary;
if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];legacyModuleProp('wasmBinary', 'wasmBinary');
var noExitRuntime = Module['noExitRuntime'] || true;legacyModuleProp('noExitRuntime', 'noExitRuntime');

if (typeof WebAssembly != 'object') {
  abort('no native wasm support detected');
}

// Wasm globals

var wasmMemory;

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed' + (text ? ': ' + text : ''));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.

// include: runtime_strings.js


// runtime_strings.js: String related runtime functions that are part of both
// MINIMAL_RUNTIME and regular runtime.

var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf8') : undefined;

/**
 * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
 * array that contains uint8 values, returns a copy of that string as a
 * Javascript String object.
 * heapOrArray is either a regular array, or a JavaScript typed array view.
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on
  // null terminator by itself.  Also, use the length info to avoid running tiny
  // strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation,
  // so that undefined means Infinity)
  while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
  }
  var str = '';
  // If building with TextDecoder, we have already computed the string length
  // above, so test loop end condition against that
  while (idx < endPtr) {
    // For UTF8 byte structure, see:
    // http://en.wikipedia.org/wiki/UTF-8#Description
    // https://www.ietf.org/rfc/rfc2279.txt
    // https://tools.ietf.org/html/rfc3629
    var u0 = heapOrArray[idx++];
    if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
    var u1 = heapOrArray[idx++] & 63;
    if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
    var u2 = heapOrArray[idx++] & 63;
    if ((u0 & 0xF0) == 0xE0) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte ' + ptrToString(u0) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
      u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
    }

    if (u0 < 0x10000) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    }
  }
  return str;
}

/**
 * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
 * emscripten HEAP, returns a copy of that string as a Javascript String object.
 *
 * @param {number} ptr
 * @param {number=} maxBytesToRead - An optional length that specifies the
 *   maximum number of bytes to read. You can omit this parameter to scan the
 *   string until the first \0 byte. If maxBytesToRead is passed, and the string
 *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
 *   string will cut short at that byte index (i.e. maxBytesToRead will not
 *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
 *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
 *   JS JIT optimizations off, so it is worth to consider consistently using one
 * @return {string}
 */
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
}

/**
 * Copies the given Javascript String object 'str' to the given byte array at
 * address 'outIdx', encoded in UTF8 form and null-terminated. The copy will
 * require at most str.length*4+1 bytes of space in the HEAP.  Use the function
 * lengthBytesUTF8 to compute the exact number of bytes (excluding null
 * terminator) that this function will write.
 *
 * @param {string} str - The Javascript string to copy.
 * @param {ArrayBufferView|Array<number>} heap - The array to copy to. Each
 *                                               index in this array is assumed
 *                                               to be one 8-byte element.
 * @param {number} outIdx - The starting offset in the array to begin the copying.
 * @param {number} maxBytesToWrite - The maximum number of bytes this function
 *                                   can write to the array.  This count should
 *                                   include the null terminator, i.e. if
 *                                   maxBytesToWrite=1, only the null terminator
 *                                   will be written and nothing else.
 *                                   maxBytesToWrite=0 does not write any bytes
 *                                   to the output, not even the null
 *                                   terminator.
 * @return {number} The number of bytes written, EXCLUDING the null terminator.
 */
function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
  // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
  // undefined and false each don't write out any bytes.
  if (!(maxBytesToWrite > 0))
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
    // unit, not a Unicode code point of the character! So decode
    // UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
    // and https://www.ietf.org/rfc/rfc2279.txt
    // and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 0xC0 | (u >> 6);
      heap[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 0xE0 | (u >> 12);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u > 0x10FFFF) warnOnce('Invalid Unicode code point ' + ptrToString(u) + ' encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).');
      heap[outIdx++] = 0xF0 | (u >> 18);
      heap[outIdx++] = 0x80 | ((u >> 12) & 63);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  heap[outIdx] = 0;
  return outIdx - startIdx;
}

/**
 * Copies the given Javascript String object 'str' to the emscripten HEAP at
 * address 'outPtr', null-terminated and encoded in UTF8 form. The copy will
 * require at most str.length*4+1 bytes of space in the HEAP.
 * Use the function lengthBytesUTF8 to compute the exact number of bytes
 * (excluding null terminator) that this function will write.
 *
 * @return {number} The number of bytes written, EXCLUDING the null terminator.
 */
function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

/**
 * Returns the number of bytes the given Javascript string takes if encoded as a
 * UTF8 byte array, EXCLUDING the null terminator byte.
 *
 * @param {string} str - JavaScript string to operator on
 * @return {number} Length, in bytes, of the UTF8 encoded string.
 */
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
    // unit, not a Unicode code point of the character! So decode
    // UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var c = str.charCodeAt(i); // possibly a lead surrogate
    if (c <= 0x7F) {
      len++;
    } else if (c <= 0x7FF) {
      len += 2;
    } else if (c >= 0xD800 && c <= 0xDFFF) {
      len += 4; ++i;
    } else {
      len += 3;
    }
  }
  return len;
}

// end include: runtime_strings.js
// Memory management

var HEAP,
/** @type {!Int8Array} */
  HEAP8,
/** @type {!Uint8Array} */
  HEAPU8,
/** @type {!Int16Array} */
  HEAP16,
/** @type {!Uint16Array} */
  HEAPU16,
/** @type {!Int32Array} */
  HEAP32,
/** @type {!Uint32Array} */
  HEAPU32,
/** @type {!Float32Array} */
  HEAPF32,
/** @type {!Float64Array} */
  HEAPF64;

function updateMemoryViews() {
  var b = wasmMemory.buffer;
  Module['HEAP8'] = HEAP8 = new Int8Array(b);
  Module['HEAP16'] = HEAP16 = new Int16Array(b);
  Module['HEAP32'] = HEAP32 = new Int32Array(b);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(b);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(b);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(b);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(b);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(b);
}

var STACK_SIZE = 65536;
if (Module['STACK_SIZE']) assert(STACK_SIZE === Module['STACK_SIZE'], 'the stack size can no longer be determined at runtime')

var INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 16777216;legacyModuleProp('INITIAL_MEMORY', 'INITIAL_MEMORY');

assert(INITIAL_MEMORY >= STACK_SIZE, 'INITIAL_MEMORY should be larger than STACK_SIZE, was ' + INITIAL_MEMORY + '! (STACK_SIZE=' + STACK_SIZE + ')');

// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array != 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined,
       'JS engine does not provide full typed array support');

// If memory is defined in wasm, the user can't provide it.
assert(!Module['wasmMemory'], 'Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally');
assert(INITIAL_MEMORY == 16777216, 'Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically');

// include: runtime_init_table.js
// In regular non-RELOCATABLE mode the table is exported
// from the wasm module and this will be assigned once
// the exports are available.
var wasmTable;

// end include: runtime_init_table.js
// include: runtime_stack_check.js


// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with the (separate) address-zero check
  // below.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAPU32[((max)>>2)] = 0x2135467;
  HEAPU32[(((max)+(4))>>2)] = 0x89BACDFE;
  // Also test the global address 0 for integrity.
  HEAPU32[0] = 0x63736d65; /* 'emsc' */
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var cookie1 = HEAPU32[((max)>>2)];
  var cookie2 = HEAPU32[(((max)+(4))>>2)];
  if (cookie1 != 0x2135467 || cookie2 != 0x89BACDFE) {
    abort('Stack overflow! Stack cookie has been overwritten at ' + ptrToString(max) + ', expected hex dwords 0x89BACDFE and 0x2135467, but received ' + ptrToString(cookie2) + ' ' + ptrToString(cookie1));
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[0] !== 0x63736d65 /* 'emsc' */) {
    abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
}

// end include: runtime_stack_check.js
// include: runtime_assertions.js


// Endianness check
(function() {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) throw 'Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)';
})();

// end include: runtime_assertions.js
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;

function keepRuntimeAlive() {
  return noExitRuntime;
}

function preRun() {

  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  checkStackCookie();

  
if (!Module["noFSInit"] && !FS.init.initialized)
  FS.init();
FS.ignorePermissions = false;

TTY.init();
  callRuntimeCallbacks(__ATINIT__);
}

function postRun() {
  checkStackCookie();

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

// include: runtime_math.js


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc

assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');

// end include: runtime_math.js
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
}

function addRunDependency(id) {
  runDependencies++;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval != 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }
          err('dependency: ' + dep);
        }
        if (shown) {
          err('(end of list)');
        }
      }, 10000);
    }
  } else {
    err('warning: run dependency added without ID');
  }
}

function removeRunDependency(id) {
  runDependencies--;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

/** @param {string|number=} what */
function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  what = 'Aborted(' + what + ')';
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;
  EXITSTATUS = 1;

  if (what.indexOf('RuntimeError: unreachable') >= 0) {
    what += '. "unreachable" may be due to ASYNCIFY_STACK_SIZE not being large enough (try increasing it)';
  }

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.

  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // defintion for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(what);

  readyPromiseReject(e);
  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

// {{MEM_INITIALIZER}}

// include: memoryprofiler.js


// end include: memoryprofiler.js
// include: URIUtils.js


// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  // Prefix of data URIs emitted by SINGLE_FILE and related options.
  return filename.startsWith(dataURIPrefix);
}

// Indicates whether filename is delivered via file protocol (as opposed to http/https)
function isFileURI(filename) {
  return filename.startsWith('file://');
}

// end include: URIUtils.js
/** @param {boolean=} fixedasm */
function createExportWrapper(name, fixedasm) {
  return function() {
    var displayName = name;
    var asm = fixedasm;
    if (!fixedasm) {
      asm = Module['asm'];
    }
    assert(runtimeInitialized, 'native function `' + displayName + '` called before runtime initialization');
    if (!asm[name]) {
      assert(asm[name], 'exported native function `' + displayName + '` not found');
    }
    return asm[name].apply(null, arguments);
  };
}

var wasmBinaryFile;
  wasmBinaryFile = 'micropython.wasm';
  if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
  }

function getBinary(file) {
  try {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    if (readBinary) {
      return readBinary(file);
    }
    throw "both async and sync fetching of the wasm failed";
  }
  catch (err) {
    abort(err);
  }
}

function getBinaryPromise() {
  // If we don't have the binary yet, try to to load it asynchronously.
  // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
  // See https://github.com/github/fetch/pull/92#issuecomment-140665932
  // Cordova or Electron apps are typically loaded from a file:// url.
  // So use fetch if it is available and the url is not a file, otherwise fall back to XHR.
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
    if (typeof fetch == 'function'
      && !isFileURI(wasmBinaryFile)
    ) {
      return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
        if (!response['ok']) {
          throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
        }
        return response['arrayBuffer']();
      }).catch(function () {
          return getBinary(wasmBinaryFile);
      });
    }
    else {
      if (readAsync) {
        // fetch is not available or url is file => try XHR (readAsync uses XHR internally)
        return new Promise(function(resolve, reject) {
          readAsync(wasmBinaryFile, function(response) { resolve(new Uint8Array(/** @type{!ArrayBuffer} */(response))) }, reject)
        });
      }
    }
  }

  // Otherwise, getBinary should be able to get it synchronously
  return Promise.resolve().then(function() { return getBinary(wasmBinaryFile); });
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  // prepare imports
  var info = {
    'env': asmLibraryArg,
    'wasi_snapshot_preview1': asmLibraryArg,
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    var exports = instance.exports;

    exports = Asyncify.instrumentWasmExports(exports);

    Module['asm'] = exports;

    wasmMemory = Module['asm']['memory'];
    assert(wasmMemory, "memory not found in wasm exports");
    // This assertion doesn't hold when emscripten is run in --post-link
    // mode.
    // TODO(sbc): Read INITIAL_MEMORY out of the wasm file in post-link mode.
    //assert(wasmMemory.buffer.byteLength === 16777216);
    updateMemoryViews();

    wasmTable = Module['asm']['__indirect_function_table'];
    assert(wasmTable, "table not found in wasm exports");

    addOnInit(Module['asm']['__wasm_call_ctors']);

    removeRunDependency('wasm-instantiate');

  }
  // wait for the pthread pool (if any)
  addRunDependency('wasm-instantiate');

  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null;
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above USE_PTHREADS-enabled path.
    receiveInstance(result['instance']);
  }

  function instantiateArrayBuffer(receiver) {
    return getBinaryPromise().then(function(binary) {
      return WebAssembly.instantiate(binary, info);
    }).then(function (instance) {
      return instance;
    }).then(receiver, function(reason) {
      err('failed to asynchronously prepare wasm: ' + reason);

      // Warn on some common problems.
      if (isFileURI(wasmBinaryFile)) {
        err('warning: Loading from a file URI (' + wasmBinaryFile + ') is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing');
      }
      abort(reason);
    });
  }

  function instantiateAsync() {
    if (!wasmBinary &&
        typeof WebAssembly.instantiateStreaming == 'function' &&
        !isDataURI(wasmBinaryFile) &&
        // Don't use streaming for file:// delivered objects in a webview, fetch them synchronously.
        !isFileURI(wasmBinaryFile) &&
        // Avoid instantiateStreaming() on Node.js environment for now, as while
        // Node.js v18.1.0 implements it, it does not have a full fetch()
        // implementation yet.
        //
        // Reference:
        //   https://github.com/emscripten-core/emscripten/pull/16917
        !ENVIRONMENT_IS_NODE &&
        typeof fetch == 'function') {
      return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
        // Suppress closure warning here since the upstream definition for
        // instantiateStreaming only allows Promise<Repsponse> rather than
        // an actual Response.
        // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure is fixed.
        /** @suppress {checkTypes} */
        var result = WebAssembly.instantiateStreaming(response, info);

        return result.then(
          receiveInstantiationResult,
          function(reason) {
            // We expect the most common failure cause to be a bad MIME type for the binary,
            // in which case falling back to ArrayBuffer instantiation should work.
            err('wasm streaming compile failed: ' + reason);
            err('falling back to ArrayBuffer instantiation');
            return instantiateArrayBuffer(receiveInstantiationResult);
          });
      });
    } else {
      return instantiateArrayBuffer(receiveInstantiationResult);
    }
  }

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
  // to any other async startup actions they are performing.
  // Also pthreads and wasm workers initialize the wasm instance through this path.
  if (Module['instantiateWasm']) {
    try {
      var exports = Module['instantiateWasm'](info, receiveInstance);
      exports = Asyncify.instrumentWasmExports(exports);
      return exports;
    } catch(e) {
      err('Module.instantiateWasm callback failed with error: ' + e);
        // If instantiation fails, reject the module ready promise.
        readyPromiseReject(e);
    }
  }

  // If instantiation fails, reject the module ready promise.
  instantiateAsync().catch(readyPromiseReject);
  return {}; // no exports yet; we'll fill them in later
}

// Globals used by JS i64 conversions (see makeSetValue)
var tempDouble;
var tempI64;

// === Body ===

var ASM_CONSTS = {
  
};
function set_exc(tb,tblen) { API.python_tb = (new TextDecoder()).decode(HEAP8.subarray(tb, tb + tblen)); }
function hiwire_to_bool(val) { return !!Hiwire.get_value(val); }
function hiwire_init_js() { try { let _hiwire = { objects : new Map(), obj_to_key : new Map(), counter : new Uint32Array([1]) }; Hiwire.UNDEFINED = HEAPU8[_Js_undefined + 0]; _hiwire.objects.set(Hiwire.UNDEFINED, [ undefined, -1 ]); _hiwire.obj_to_key.set(undefined, Hiwire.UNDEFINED);; Hiwire.JSNULL = HEAPU8[_Js_null + 0]; _hiwire.objects.set(Hiwire.JSNULL, [ null, -1 ]); _hiwire.obj_to_key.set(null, Hiwire.JSNULL);; Hiwire.TRUE = HEAPU8[_Js_true + 0]; _hiwire.objects.set(Hiwire.TRUE, [ (!!1), -1 ]); _hiwire.obj_to_key.set((!!1), Hiwire.TRUE);; Hiwire.FALSE = HEAPU8[_Js_false + 0]; _hiwire.objects.set(Hiwire.FALSE, [ (!!0), -1 ]); _hiwire.obj_to_key.set((!!0), Hiwire.FALSE);; let hiwire_next_permanent = HEAPU8[_Js_novalue] + 2; Hiwire._hiwire = _hiwire; let many_objects_warning_threshold = 200; Hiwire.new_value = function(jsval) { let idval = _hiwire.obj_to_key.get(jsval); if (idval !== undefined) { _hiwire.objects.get(idval)[1]++; return idval; } while (_hiwire.objects.has(_hiwire.counter[0])) { _hiwire.counter[0] += 2; } idval = _hiwire.counter[0]; _hiwire.objects.set(idval, [ jsval, 1 ]); _hiwire.obj_to_key.set(jsval, idval); _hiwire.counter[0] += 2; if (_hiwire.objects.size > many_objects_warning_threshold) { console.warn( "A fairly large number of hiwire objects are present, this could " + "be a sign of a memory leak."); many_objects_warning_threshold += 100; } if (HEAPU8[_tracerefs + 0]) { console.warn("hw.new_value", idval, jsval); } return idval; }; Hiwire.intern_object = function(obj) { let id = hiwire_next_permanent; hiwire_next_permanent += 2; _hiwire.objects.set(id, [ obj, -1 ]); return id; }; Hiwire.num_keys = function(){ return Array.from(_hiwire.objects.keys()).filter((x) => x % 2).length }; Hiwire.get_value = function(idval) { if (!idval) { API.fail_test = (!!1); console.error( `Pyodide internal error: Argument '${idval}' to hiwire.get_value is falsy. ` ); throw new Error(`Pyodide internal error: Argument '${idval}' to hiwire.get_value is falsy. `); } if (!_hiwire.objects.has(idval)) { API.fail_test = (!!1); console.error(`Pyodide internal error: Undefined id ${ idval }`); throw new Error(`Undefined id ${ idval }`); } return _hiwire.objects.get(idval)[0]; }; Hiwire.decref = function(idval) { if ((idval & 1) === 0) { return; } if(HEAPU8[_tracerefs + 0]){ console.warn("hw.decref", idval, _hiwire.objects.get(idval)); } let pair = _hiwire.objects.get(idval); let new_refcnt = --pair[1]; if (new_refcnt === 0) { _hiwire.objects.delete(idval); _hiwire.obj_to_key.delete(pair[0]); } }; Hiwire.incref = function(idval) { if ((idval & 1) === 0) { return; } _hiwire.objects.get(idval)[1]++; if (HEAPU8[_tracerefs + 0]) { console.warn("hw.incref", idval, _hiwire.objects.get(idval)); } }; Hiwire.pop_value = function(idval) { let result = Hiwire.get_value(idval); Hiwire.decref(idval); return result; }; Hiwire.isPromise = function(obj) { try { return (!!obj) && typeof obj.then === 'function'; } catch (e) { return (!!0); } }; API.typedArrayAsUint8Array = function(arg) { if(ArrayBuffer.isView(arg)){ return new Uint8Array(arg.buffer, arg.byteOffset, arg.byteLength); } else { return new Uint8Array(arg); } }; { let dtypes_str = [ "b", "B", "h", "H", "i", "I", "f", "d" ].join(String.fromCharCode(0)); let dtypes_ptr = stringToNewUTF8(dtypes_str); let dtypes_map = {}; for (let[idx, val] of Object.entries(dtypes_str)) { dtypes_map[val] = dtypes_ptr + Number(idx); } let buffer_datatype_map = new Map([ [ 'Int8Array', [ dtypes_map['b'], 1, (!!1) ] ], [ 'Uint8Array', [ dtypes_map['B'], 1, (!!1) ] ], [ 'Uint8ClampedArray', [ dtypes_map['B'], 1, (!!1) ] ], [ 'Int16Array', [ dtypes_map['h'], 2, (!!1) ] ], [ 'Uint16Array', [ dtypes_map['H'], 2, (!!1) ] ], [ 'Int32Array', [ dtypes_map['i'], 4, (!!1) ] ], [ 'Uint32Array', [ dtypes_map['I'], 4, (!!1) ] ], [ 'Float32Array', [ dtypes_map['f'], 4, (!!1) ] ], [ 'Float64Array', [ dtypes_map['d'], 8, (!!1) ] ], [ 'DataView', [ dtypes_map['B'], 1, (!!0) ] ], [ 'ArrayBuffer', [ dtypes_map['B'], 1, (!!0) ] ], ]); Module.get_buffer_datatype = function(jsobj) { return buffer_datatype_map.get(jsobj.constructor.name) || [ 0, 0, (!!0) ]; } } Module.iterObject = function * (object) { for (let k in object) { if (Object.prototype.hasOwnProperty.call(object, k)) { yield k; } } }; if (globalThis.BigInt) { Module.BigInt = BigInt; } else { Module.BigInt = Number; } return 0; } catch (e) { do { console.error( `EM_JS raised exception on line 286 in func hiwire_init_js in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function hiwire_incref_js(idval) { if (idval & 1) { Hiwire.incref(idval); } return idval; }
function hiwire_decref(idval) { Hiwire.decref(idval); }
function hiwire_int_js(val) { try { return Hiwire.new_value(val); } catch (e) { do { console.error( `EM_JS raised exception on line 318 in func hiwire_int_js in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_int_from_digits_js(digits,ndigits) { try { let result = BigInt(0); for (let i = 0; i < ndigits; i++) { result += BigInt(HEAPU32[(digits >> 2) + i]) << BigInt(32 * i); } result += BigInt(HEAPU32[(digits >> 2) + ndigits - 1] & 0x80000000) << BigInt(1 + 32 * (ndigits - 1)); if (-Number.MAX_SAFE_INTEGER < result && result < Number.MAX_SAFE_INTEGER) { result = Number(result); } return Hiwire.new_value(result); } catch (e) { do { console.error( `EM_JS raised exception on line 339 in func hiwire_int_from_digits_js in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_double_js(val) { try { return Hiwire.new_value(val); } catch (e) { do { console.error( `EM_JS raised exception on line 350 in func hiwire_double_js in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_string_utf8_len_js(ptr,length) { try { return Hiwire.new_value((new TextDecoder()).decode(HEAP8.subarray(ptr, ptr + length))); } catch (e) { do { console.error( `EM_JS raised exception on line 365 in func hiwire_string_utf8_len_js in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_string_utf8_js(ptr) { try { return Hiwire.new_value(UTF8ToString(ptr)); } catch (e) { do { console.error( `EM_JS raised exception on line 377 in func hiwire_string_utf8_js in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_throw_error(iderr) { throw Hiwire.pop_value(iderr); }
function hiwire_call(idfunc,idargs) { try { let jsfunc = Hiwire.get_value(idfunc); let jsargs = Hiwire.get_value(idargs); return Hiwire.new_value(jsfunc(... jsargs)); } catch (e) { do { console.error( `EM_JS raised exception on line 408 in func hiwire_call in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_call_OneArg(idfunc,idarg) { try { let jsfunc = Hiwire.get_value(idfunc); let jsarg = Hiwire.get_value(idarg); return Hiwire.new_value(jsfunc(jsarg)); } catch (e) { do { console.error( `EM_JS raised exception on line 425 in func hiwire_call_OneArg in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_call_bound_js(idfunc,idthis,idargs) { try { let func = Hiwire.get_value(idfunc); let this_; if (idthis === 0) { this_ = null; } else { this_ = Hiwire.get_value(idthis); } let args = Hiwire.get_value(idargs); return Hiwire.new_value(func.apply(this_, args)); } catch (e) { do { console.error( `EM_JS raised exception on line 442 in func hiwire_call_bound_js in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_HasMethod(obj_id,name) { try { let obj = Hiwire.get_value(obj_id); return obj && typeof obj[Hiwire.get_value(name)] === "function"; } catch (e) { do { console.error( `EM_JS raised exception on line 456 in func hiwire_HasMethod in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); return (!!0); } }
function hiwire_CallMethodString(idobj,name,idargs) { try { let jsobj = Hiwire.get_value(idobj); let jsname = UTF8ToString(name); let jsargs = Hiwire.get_value(idargs); return Hiwire.new_value(jsobj[jsname](...jsargs)); } catch (e) { do { console.error( `EM_JS raised exception on line 474 in func hiwire_CallMethodString in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_CallMethod(idobj,name,idargs) { try { let jsobj = Hiwire.get_value(idobj); let jsname = Hiwire.get_value(name); let jsargs = Hiwire.get_value(idargs); return Hiwire.new_value(jsobj[jsname](... jsargs)); } catch (e) { do { console.error( `EM_JS raised exception on line 482 in func hiwire_CallMethod in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_CallMethod_NoArgs(idobj,name) { try { let jsobj = Hiwire.get_value(idobj); let jsname = Hiwire.get_value(name); return Hiwire.new_value(jsobj[jsname]()); } catch (e) { do { console.error( `EM_JS raised exception on line 488 in func hiwire_CallMethod_NoArgs in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_CallMethod_OneArg(idobj,name,idarg) { try { let jsobj = Hiwire.get_value(idobj); let jsname = Hiwire.get_value(name); let jsarg = Hiwire.get_value(idarg); return Hiwire.new_value(jsobj[jsname](jsarg)); } catch (e) { do { console.error( `EM_JS raised exception on line 500 in func hiwire_CallMethod_OneArg in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_construct(idobj,idargs) { try { let jsobj = Hiwire.get_value(idobj); let jsargs = Hiwire.get_value(idargs); return Hiwire.new_value(Reflect.construct(jsobj, jsargs)); } catch (e) { do { console.error( `EM_JS raised exception on line 559 in func hiwire_construct in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_has_length(idobj) { try { let val = Hiwire.get_value(idobj); return (typeof val.size === "number") || (typeof val.length === "number" && typeof val !== "function"); } catch (e) { do { console.error( `EM_JS raised exception on line 567 in func hiwire_has_length in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); return (!!0); } }
function hiwire_get_length_helper(idobj) { try { let val = Hiwire.get_value(idobj); let result; if (typeof val.size === "number") { result = val.size; } else if (typeof val.length === "number") { result = val.length; } else { return -2; } if(result < 0){ return -3; } if(result > 2147483647){ return -4; } return result; } catch (e) { do { console.error( `EM_JS raised exception on line 588 in func hiwire_get_length_helper in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function hiwire_get_length_string(idobj) { try { const val = Hiwire.get_value(idobj); let result; if (typeof val.size === "number") { result = val.size; } else if (typeof val.length === "number") { result = val.length; } return stringToNewUTF8(" " + result.toString()) } catch (e) { do { console.error( `EM_JS raised exception on line 602 in func hiwire_get_length_string in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_get_bool(idobj) { try { let val = Hiwire.get_value(idobj); if (!val) { return (!!0); } if (val.size === 0) { if(/HTML[A-Za-z]*Element/.test(getTypeTag(val))){ return (!!1); } return (!!0); } if (val.length === 0 && JsArray_Check(idobj)) { return (!!0); } if (val.byteLength === 0) { return (!!0); } return (!!1); } catch (e) { do { console.error( `EM_JS raised exception on line 674 in func hiwire_get_bool in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); return (!!0); } }
function hiwire_is_function_js(idobj) { try { return typeof Hiwire.get_value(idobj) === 'function'; } catch (e) { do { console.error( `EM_JS raised exception on line 680 in func hiwire_is_function_js in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); return (!!0); } }
function hiwire_is_generator(idobj) { try { return getTypeTag(Hiwire.get_value(idobj)) === "[object Generator]"; } catch (e) { do { console.error( `EM_JS raised exception on line 692 in func hiwire_is_generator in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); return (!!0); } }
function hiwire_is_async_generator(idobj) { try { return Object.prototype.toString.call(Hiwire.get_value(idobj)) === "[object AsyncGenerator]"; } catch (e) { do { console.error( `EM_JS raised exception on line 698 in func hiwire_is_async_generator in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); return (!!0); } }
function hiwire_is_comlink_proxy(idobj) { try { let value = Hiwire.get_value(idobj); return !!(API.Comlink && value[API.Comlink.createEndpoint]); } catch (e) { do { console.error( `EM_JS raised exception on line 703 in func hiwire_is_comlink_proxy in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); return (!!0); } }
function hiwire_is_error(idobj) { try { let value = Hiwire.get_value(idobj); return !!(value && typeof value.stack === "string" && typeof value.message === "string"); } catch (e) { do { console.error( `EM_JS raised exception on line 712 in func hiwire_is_error in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); return (!!0); } }
function hiwire_is_promise(idobj) { try { let obj = Hiwire.get_value(idobj); return Hiwire.isPromise(obj); } catch (e) { do { console.error( `EM_JS raised exception on line 719 in func hiwire_is_promise in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); return (!!0); } }
function hiwire_resolve_promise(idobj) { try { let obj = Hiwire.get_value(idobj); let result = Promise.resolve(obj); return Hiwire.new_value(result); } catch (e) { do { console.error( `EM_JS raised exception on line 727 in func hiwire_resolve_promise in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_to_string_js(idobj) { try { return Hiwire.new_value(Hiwire.get_value(idobj).toString()); } catch (e) { do { console.error( `EM_JS raised exception on line 731 in func hiwire_to_string_js in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_typeof(idobj) { return Hiwire.new_value(typeof Hiwire.get_value(idobj)); }
function hiwire_constructor_name(idobj) { try { return stringToNewUTF8(Hiwire.get_value(idobj).constructor.name); } catch (e) { do { console.error( `EM_JS raised exception on line 745 in func hiwire_constructor_name in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_less_than(ida,idb) { try { return !!(Hiwire.get_value(ida) < Hiwire.get_value(idb)); } catch (e) { do { console.error( `EM_JS raised exception on line 752 in func hiwire_less_than in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); return (!!0); } }
function hiwire_less_than_equal(ida,idb) { try { return !!(Hiwire.get_value(ida) <= Hiwire.get_value(idb)); } catch (e) { do { console.error( `EM_JS raised exception on line 753 in func hiwire_less_than_equal in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); return (!!0); } }
function hiwire_equal(ida,idb) { try { return !!(Hiwire.get_value(ida) === Hiwire.get_value(idb)); } catch (e) { do { console.error( `EM_JS raised exception on line 755 in func hiwire_equal in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); return (!!0); } }
function hiwire_not_equal(ida,idb) { try { return !!(Hiwire.get_value(ida) !== Hiwire.get_value(idb)); } catch (e) { do { console.error( `EM_JS raised exception on line 756 in func hiwire_not_equal in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); return (!!0); } }
function hiwire_greater_than(ida,idb) { try { return !!(Hiwire.get_value(ida) > Hiwire.get_value(idb)); } catch (e) { do { console.error( `EM_JS raised exception on line 758 in func hiwire_greater_than in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); return (!!0); } }
function hiwire_greater_than_equal(ida,idb) { try { return !!(Hiwire.get_value(ida) >= Hiwire.get_value(idb)); } catch (e) { do { console.error( `EM_JS raised exception on line 759 in func hiwire_greater_than_equal in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); return (!!0); } }
function hiwire_reversed_iterator(idarray) { try { if (!Module._reversedIterator) { Module._reversedIterator = class ReversedIterator { constructor(array) { this._array = array; this._i = array.length - 1; } __length_hint__() { return this._array.length; } [Symbol.toStringTag]() { return "ReverseIterator"; } next() { const i = this._i; const a = this._array; const done = i < 0; const value = done ? undefined : a[i]; this._i--; return { done, value }; } }; } let array = Hiwire.get_value(idarray); return Hiwire.new_value(new Module._reversedIterator(array)); } catch (e) { do { console.error( `EM_JS raised exception on line 789 in func hiwire_reversed_iterator in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function hiwire_assign_to_ptr(idobj,ptr) { try { let jsobj = Hiwire.get_value(idobj); Module.HEAPU8.set(API.typedArrayAsUint8Array(jsobj), ptr); } catch (e) { do { console.error( `EM_JS raised exception on line 794 in func hiwire_assign_to_ptr in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function hiwire_assign_from_ptr(idobj,ptr) { try { let jsobj = Hiwire.get_value(idobj); API.typedArrayAsUint8Array(jsobj).set( Module.HEAPU8.subarray(ptr, ptr + jsobj.byteLength)); } catch (e) { do { console.error( `EM_JS raised exception on line 800 in func hiwire_assign_from_ptr in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function hiwire_read_from_file(idobj,fd) { try { let jsobj = Hiwire.get_value(idobj); let uint8_buffer = API.typedArrayAsUint8Array(jsobj); let stream = Module.FS.streams[fd]; Module.FS.read(stream, uint8_buffer, 0, uint8_buffer.byteLength); } catch (e) { do { console.error( `EM_JS raised exception on line 807 in func hiwire_read_from_file in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function hiwire_write_to_file(idobj,fd) { try { let jsobj = Hiwire.get_value(idobj); let uint8_buffer = API.typedArrayAsUint8Array(jsobj); let stream = Module.FS.streams[fd]; Module.FS.write(stream, uint8_buffer, 0, uint8_buffer.byteLength); } catch (e) { do { console.error( `EM_JS raised exception on line 814 in func hiwire_write_to_file in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function hiwire_into_file(idobj,fd) { try { let jsobj = Hiwire.get_value(idobj); let uint8_buffer = API.typedArrayAsUint8Array(jsobj); let stream = Module.FS.streams[fd]; Module.FS.write( stream, uint8_buffer, 0, uint8_buffer.byteLength, undefined, (!!1)); } catch (e) { do { console.error( `EM_JS raised exception on line 823 in func hiwire_into_file in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function hiwire_get_buffer_info(idobj,byteLength_ptr,format_ptr,size_ptr,checked_ptr) { let jsobj = Hiwire.get_value(idobj); let byteLength = jsobj.byteLength; let [format_utf8, size, checked] = Module.get_buffer_datatype(jsobj); HEAPU32[(byteLength_ptr >> 2) + 0] = byteLength; HEAPU32[(format_ptr >> 2) + 0] = format_utf8; HEAPU32[(size_ptr >> 2) + 0] = size; HEAPU8[checked_ptr + 0] = checked; }
function hiwire_subarray(idarr,start,end) { try { let jsarr = Hiwire.get_value(idarr); let jssub = jsarr.subarray(start, end); return Hiwire.new_value(jssub); } catch (e) { do { console.error( `EM_JS raised exception on line 849 in func hiwire_subarray in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function JsArray_Check(idobj) { try { let obj = Hiwire.get_value(idobj); if (Array.isArray(obj)) { return (!!1); } let typeTag = getTypeTag(obj); if(typeTag === "[object HTMLCollection]" || typeTag === "[object NodeList]"){ return (!!1); } if (ArrayBuffer.isView(obj) && obj.constructor.name !== "DataView") { return (!!1); } return (!!0); } catch (e) { do { console.error( `EM_JS raised exception on line 872 in func JsArray_Check in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); return (!!0); } }
function JsArray_New_js() { try { return Hiwire.new_value([]); } catch (e) { do { console.error( `EM_JS raised exception on line 877 in func JsArray_New_js in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function JsArray_Push_js(idarr,idval) { try { Hiwire.get_value(idarr).push(Hiwire.get_value(idval)); } catch (e) { do { console.error( `EM_JS raised exception on line 887 in func JsArray_Push_js in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function JsArray_Push_unchecked_js(idarr,idval) { const arr = Hiwire.get_value(idarr); arr.push(Hiwire.get_value(idval)); return arr.length - 1; }
function JsArray_Get_js(idobj,idx) { try { let obj = Hiwire.get_value(idobj); let result = obj[idx]; if (result === undefined && !(idx in obj)) { return (0); } return Hiwire.new_value(result); } catch (e) { do { console.error( `EM_JS raised exception on line 916 in func JsArray_Get_js in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function JsArray_Set(idobj,idx,idval) { try { Hiwire.get_value(idobj)[idx] = Hiwire.get_value(idval); } catch (e) { do { console.error( `EM_JS raised exception on line 926 in func JsArray_Set in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function JsArray_Delete(idobj,idx) { try { let obj = Hiwire.get_value(idobj); if (idx < 0 || idx >= obj.length) { return (-1); } obj.splice(idx, 1); } catch (e) { do { console.error( `EM_JS raised exception on line 936 in func JsArray_Delete in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function JsArray_Splice(idobj,idx) { try { let obj = Hiwire.get_value(idobj); if (idx < 0 || idx >= obj.length) { return 0; } return Hiwire.new_value(obj.splice(idx, 1)); } catch (e) { do { console.error( `EM_JS raised exception on line 946 in func JsArray_Splice in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function JsArray_slice(idobj,length,start,stop,step) { try { let obj = Hiwire.get_value(idobj); let result; if (step === 1) { result = obj.slice(start, stop); } else { result = Array.from({ length }, (_, i) => obj[start + i * step]); } return Hiwire.new_value(result); } catch (e) { do { console.error( `EM_JS raised exception on line 961 in func JsArray_slice in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function JsArray_Clear(idobj) { try { let obj = Hiwire.get_value(idobj); obj.splice(0, obj.length); } catch (e) { do { console.error( `EM_JS raised exception on line 995 in func JsArray_Clear in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function JsObject_New_js() { try { return Hiwire.new_value({}); } catch (e) { do { console.error( `EM_JS raised exception on line 1002 in func JsObject_New_js in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function JsObject_GetString_js(idobj,ptrkey) { try { let jsobj = Hiwire.get_value(idobj); let jskey = UTF8ToString(ptrkey); if (jskey in jsobj) { return Hiwire.new_value(jsobj[jskey]); } return (0); } catch (e) { do { console.error( `EM_JS raised exception on line 1018 in func JsObject_GetString_js in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function JsObject_SetString_js(idobj,ptrkey,idval) { try { let jsobj = Hiwire.get_value(idobj); let jskey = UTF8ToString(ptrkey); let jsval = Hiwire.get_value(idval); jsobj[jskey] = jsval; } catch (e) { do { console.error( `EM_JS raised exception on line 1035 in func JsObject_SetString_js in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function JsObject_DeleteString_js(idobj,ptrkey) { try { let jsobj = Hiwire.get_value(idobj); let jskey = UTF8ToString(ptrkey); delete jsobj[jskey]; } catch (e) { do { console.error( `EM_JS raised exception on line 1053 in func JsObject_DeleteString_js in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function JsObject_Dir(idobj) { try { let jsobj = Hiwire.get_value(idobj); let result = []; do { const names = Object.getOwnPropertyNames(jsobj); result.push(...names.filter( s => { let c = s.charCodeAt(0); return c < 48 || c > 57; } )); } while (jsobj = Object.getPrototypeOf(jsobj)); return Hiwire.new_value(result); } catch (e) { do { console.error( `EM_JS raised exception on line 1077 in func JsObject_Dir in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function JsObject_Entries(idobj) { try { let jsobj = Hiwire.get_value(idobj); return Hiwire.new_value(Object.entries(jsobj)); } catch (e) { do { console.error( `EM_JS raised exception on line 1082 in func JsObject_Entries in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function JsObject_Keys(idobj) { try { let jsobj = Hiwire.get_value(idobj); return Hiwire.new_value(Object.keys(jsobj)); } catch (e) { do { console.error( `EM_JS raised exception on line 1087 in func JsObject_Keys in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function JsObject_Values(idobj) { try { let jsobj = Hiwire.get_value(idobj); return Hiwire.new_value(Object.values(jsobj)); } catch (e) { do { console.error( `EM_JS raised exception on line 1092 in func JsObject_Values in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function JsString_InternFromCString(str) { try { let jsstring = UTF8ToString(str); return Hiwire.intern_object(jsstring); } catch (e) { do { console.error( `EM_JS raised exception on line 1099 in func JsString_InternFromCString in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function JsMap_New() { try { return Hiwire.new_value(new Map()); } catch (e) { do { console.error( `EM_JS raised exception on line 1115 in func JsMap_New in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function JsMap_Set(mapid,keyid,valueid) { try { let map = Hiwire.get_value(mapid); let key = Hiwire.get_value(keyid); let value = Hiwire.get_value(valueid); map.set(key, value); } catch (e) { do { console.error( `EM_JS raised exception on line 1123 in func JsMap_Set in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function JsSet_New() { try { return Hiwire.new_value(new Set()); } catch (e) { do { console.error( `EM_JS raised exception on line 1130 in func JsSet_New in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function JsSet_Add(mapid,keyid) { try { let set = Hiwire.get_value(mapid); let key = Hiwire.get_value(keyid); set.add(key); } catch (e) { do { console.error( `EM_JS raised exception on line 1137 in func JsSet_Add in file "pyodide/hiwire.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function js2python_immutable(id) { try { let value = Hiwire.get_value(id); let result = Module.js2python_convertImmutable(value, id); if (result !== undefined) { return result; } return 0; } catch (e) { do { console.error( `EM_JS raised exception on line 42 in func js2python_immutable in file "pyodide/js2python.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function js2python_js(id) { try { let value = Hiwire.get_value(id); let result = Module.js2python_convertImmutable(value, id); if (result !== undefined) { return result; } return _JsProxy_new(id); } catch (e) { do { console.error( `EM_JS raised exception on line 53 in func js2python_js in file "pyodide/js2python.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function js2python_init_js() { try { { 0; let PropagateError = Module._PropagatePythonError; function js2python_string(jsString) { const length = lengthBytesUTF8(jsString) + 1; const cString = _malloc(length); stringToUTF8(jsString, cString, length); return _mp_obj_new_str(cString, length - 1); } Module.js2python_string = js2python_string; function js2python_bigint(value) { let value_orig = value; let length = 0; if (value < 0) { value = -value; } value <<= BigInt(1); while (value) { length++; value >>= BigInt(32); } let stackTop = stackSave(); let ptr = stackAlloc(length * 4); value = value_orig; for (let i = 0; i < length; i++) { HEAPU32[(ptr >> 2) + i] = Number(value & BigInt(0xffffffff)); value >>= BigInt(32); } let result = _mp_obj_int_from_bytes_impl( (!!0) , length * 4 , ptr ); stackRestore(stackTop); return result; } function js2python_convertImmutable(value, id) { let result = js2python_convertImmutableInner(value, id); if (result === 0) { throw new PropagateError(); } return result; } Module.js2python_convertImmutable = js2python_convertImmutable; function js2python_convertImmutableInner(value, id) { let type = typeof value; if (type === "string") { return js2python_string(value); } else if (type === "number") { if (Number.isSafeInteger(value)) { return _mp_obj_new_int(value); } else { return _mp_obj_new_float(value); } } else if (type === "bigint") { return js2python_bigint(value); } else if (value === undefined || value === null) { return __js2python_none(); } else if (value === (!!1)) { return __js2python_true(); } else if (value === (!!0)) { return __js2python_false(); } else if (API.isPyProxy(value)) { if (value.$$.ptr == 0) { Module.PyProxy_getPtr(value); } if (value.$$props.roundtrip) { if (id === undefined) { id = Hiwire.new_value(value); } return _JsProxy_create(id); } else { return Module.PyProxy_getPtr(value); } } return undefined; } } return 0; } catch (e) { do { console.error( `EM_JS raised exception on line 100 in func js2python_init_js in file "pyodide/js2python.js"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function JsProxy_GetIter_js(idobj) { try { let jsobj = Hiwire.get_value(idobj); return Hiwire.new_value(jsobj[Symbol.iterator]()); } catch (e) { do { console.error( `EM_JS raised exception on line 183 in func JsProxy_GetIter_js in file "pyodide/jsproxy.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function JsProxy_iternext_js(idit,done_ptr,value_ptr) { try { let it = Hiwire.get_value(idit); let { done, value } = it.next(); HEAPU8[done_ptr + 0] = done; HEAPU32[(value_ptr >> 2) + 0] = Hiwire.new_value(value); } catch (e) { do { console.error( `EM_JS raised exception on line 195 in func JsProxy_iternext_js in file "pyodide/jsproxy.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }
function JsProxy_subscr_js(idself,idkey,idvalue,type,error) { try { const obj = Hiwire.get_value(idself); const isArray = Array.isArray(obj); const isTypedArray = ArrayBuffer.isView(obj) && obj.constructor.name !== "DataView"; const typeTag = getTypeTag(obj); const isDomArray = typeTag === "[object HTMLCollection]" || typeTag === "[object NodeList]"; const array_like = isArray || isTypedArray || isDomArray; const map_like = !isArray && "get" in obj; if (!array_like && !map_like) { HEAPU32[(error >> 2) + 0] = 3; return 0; } let key = Hiwire.get_value(idkey); if (array_like && typeof key === "number" && key < 0) { key = obj.length + key; } if (type === 0) { let result; if (map_like) { result = obj.get(key); if (result !== undefined) { return Hiwire.new_value(result); } if (obj.has && typeof obj.has === "function" && obj.has(key)) { return HEAPU32[(_Js_undefined >> 2) + 0]; } HEAPU32[(error >> 2) + 0] = 1; return 0; } if (!(key in obj)) { HEAPU32[(error >> 2) + 0] = 2; return 0; } return Hiwire.new_value(obj[key]); } if (type === 1) { const value = Hiwire.get_value(idvalue); if (map_like) { obj.set(key, value); } else { obj[key] = value; } return Js_undefined; } if (type === 2) { if (map_like) { obj.delete(key); } else { delete obj[key]; } return Js_undefined; } } catch (e) { do { console.error( `EM_JS raised exception on line 305 in func JsProxy_subscr_js in file "pyodide/jsproxy.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function lib_init() { FS.mkdir('/lib/'); for (const dir of pylibManifest.dirs) { FS.mkdir('/lib/' + dir); } for (const[path, value] of pylibManifest.files) { FS.writeFile('/lib/' + path, value); } }
function pyproxy_Check_js(x) { if (x == 0) { return false; } let val = Hiwire.get_value(x); return API.isPyProxy(val); }
function pyproxy_AsPyObject(x) { if (x == 0) { return 0; } let val = Hiwire.get_value(x); if (!API.isPyProxy(val)) { return 0; } return Module.PyProxy_getPtr(val); }
function destroy_proxies_js(proxies_id,msg_ptr) { let msg = undefined; if (msg_ptr) { msg = UTF8ToString(msg_ptr); } let proxies = Hiwire.get_value(proxies_id); for (let px of proxies) { Module.pyproxy_destroy(px, msg, false); } }
function destroy_proxy(proxy_id,msg_ptr) { let px = Module.hiwire.get_value(proxy_id); if (px.$$props.roundtrip) { return; } let msg = undefined; if (msg_ptr) { msg = UTF8ToString(msg_ptr); } Module.pyproxy_destroy(px, msg, false); }
function pyproxy_new_js(ptrobj) { try { return Hiwire.new_value(Module.pyproxy_new(ptrobj)); } catch (e) { do { console.error( `EM_JS raised exception on line 936 in func pyproxy_new_js in file "pyodide/pyproxy.c"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } throw new Error( "Assertion error: control reached end of function without return" ); }
function pyproxy_init_js() { try { { 0; function isPyProxy(jsobj) { return jsobj instanceof PyProxy; } API.isPyProxy = isPyProxy; Module.callPyObjectKwargs = function (ptrobj, jsargs, kwargs) { let num_pos_args = jsargs.length; let kwargs_names = Object.entries(kwargs); let num_kwargs = kwargs_names.length; jsargs.push(...kwargs_names.flat()); let idargs = Hiwire.new_value(jsargs); let idresult; try { ; idresult = Module.__pyproxy_apply( ptrobj, num_pos_args, num_kwargs, idargs ); ; } catch (e) { API.fatal_error(e); return; } finally { Hiwire.decref(idargs); } throw_if_error(); let result = Hiwire.pop_value(idresult); if (result && result.type === "coroutine" && result._ensure_future) { result._ensure_future(); } return result; }; Module.callPyObject = function (ptrobj, jsargs) { return Module.callPyObjectKwargs(ptrobj, jsargs, {}); }; Module.pyproxy_destroy = function (proxy, destroyed_msg, destroy_roundtrip) { if (proxy.$$.ptr === 0) { return; } if (!destroy_roundtrip && proxy.$$props.roundtrip) { return; } let ptrobj = _getPtr(proxy); destroyed_msg = destroyed_msg || "Object has already been destroyed"; let proxy_type = proxy.type; let proxy_repr; try { proxy_repr = proxy.toString(); } catch (e) { if (e.pyodide_fatal_error) { throw e; } } proxy.$$.ptr = 0; _pyproxy_decref(ptrobj); destroyed_msg += "\n" + `The object was of type "${proxy_type}" and `; if (proxy_repr) { destroyed_msg += `had repr "${proxy_repr}"`; } else { destroyed_msg += "an error was raised when trying to generate its repr"; } proxy.$$.destroyed_msg = destroyed_msg; }; class PyProxy { constructor() { throw new TypeError("PyProxy is not a constructor"); } get [Symbol.toStringTag]() { return "PyProxy"; } get type() { let ptrobj = _getPtr(this); return Hiwire.pop_value(Module.__pyproxy_type(ptrobj)); } toString() { let ptrobj = _getPtr(this); let jsref_repr; try { ; jsref_repr = Module.__pyproxy_repr(ptrobj); ; } catch (e) { API.fatal_error(e); } throw_if_error(); return Hiwire.pop_value(jsref_repr); } destroy(options) { options = Object.assign({ message: "", destroyRoundtrip: (!!1) }, options); const { message: m, destroyRoundtrip: d } = options; Module.pyproxy_destroy(this, m, d); } copy() { let ptrobj = _getPtr(this); return pyproxy_new(ptrobj, { flags: this.$$flags, cache: this.$$.cache, props: this.$$props, }); } } let pyproxyClassMap = new Map(); function getPyProxyClass(flags) { const FLAG_TYPE_PAIRS = [ [(1 << 1), PySubscriptMethods], [(1 << 3), PyContainsMethods], [(1 << 8), PyCallableMethods], ]; let result = pyproxyClassMap.get(flags); if (result) { return result; } let descriptors = {}; for (let [feature_flag, methods] of FLAG_TYPE_PAIRS) { if (flags & feature_flag) { Object.assign( descriptors, Object.getOwnPropertyDescriptors(methods.prototype) ); } } descriptors.constructor = Object.getOwnPropertyDescriptor( PyProxy.prototype, "constructor" ); Object.assign( descriptors, Object.getOwnPropertyDescriptors({ $$flags: flags }) ); let new_proto = Object.create(PyProxy.prototype, descriptors); function NewPyProxyClass() {} NewPyProxyClass.prototype = new_proto; pyproxyClassMap.set(flags, NewPyProxyClass); return NewPyProxyClass; } class PySubscriptMethods { get(key) { let ptrobj = _getPtr(this); let idkey = Hiwire.new_value(key); let idresult; try { ; idresult = Module.__pyproxy_getitem(ptrobj, idkey); ; } catch (e) { API.fatal_error(e); } finally { Hiwire.decref(idkey); } throw_if_error(); return Hiwire.pop_value(idresult); } set(key, value) { let ptrobj = _getPtr(this); let idkey = Hiwire.new_value(key); let idval = Hiwire.new_value(value); let errcode; try { ; errcode = Module.__pyproxy_setitem(ptrobj, idkey, idval); ; } catch (e) { API.fatal_error(e); } finally { Hiwire.decref(idkey); Hiwire.decref(idval); } throw_if_error(); } delete(key) { let ptrobj = _getPtr(this); let idkey = Hiwire.new_value(key); let errcode; try { ; errcode = Module.__pyproxy_delitem(ptrobj, idkey); ; } catch (e) { API.fatal_error(e); } finally { Hiwire.decref(idkey); } throw_if_error(); } } class PyContainsMethods { has(key) { let ptrobj = _getPtr(this); let idkey = Hiwire.new_value(key); let result; try { ; result = Module.__pyproxy_contains(ptrobj, idkey); ; } catch (e) { API.fatal_error(e); } finally { Hiwire.decref(idkey); } throw_if_error(); return result === 1; } } class PyCallableMethods { apply(thisArg, jsargs) { jsargs = function (...args) { return args; }.apply(undefined, jsargs); return Module.callPyObject(_getPtr(this), jsargs); } callKwargs(...jsargs) { if (jsargs.length === 0) { throw new TypeError( "callKwargs requires at least one argument (the key word argument object)" ); } let kwargs = jsargs.pop(); if ( kwargs.constructor !== undefined && kwargs.constructor.name !== "Object" ) { throw new TypeError("kwargs argument is not an object"); } return Module.callPyObjectKwargs(_getPtr(this), jsargs, kwargs); } } function pyproxy_new(ptrobj, { flags: flags_arg, cache, props, $$ } = {}) { const flags = Module._pyproxy_getflags(ptrobj); const cls = getPyProxyClass(flags); let target; if (flags & (1 << 8)) { target = function () {}; Object.setPrototypeOf(target, cls.prototype); delete target.length; delete target.name; target.prototype = undefined; } else { target = Object.create(cls.prototype); } const isAlias = !!$$; if (!isAlias) { if (!cache) { let cacheId = Hiwire.new_value(new Map()); cache = { cacheId, refcnt: 0 }; } cache.refcnt++; $$ = { ptr: ptrobj, type: "PyProxy", cache, flags }; } Object.defineProperty(target, "$$", { value: $$ }); if (!props) { props = {}; } props = Object.assign( { isBound: (!!0), captureThis: (!!0), boundArgs: [], roundtrip: (!!0) }, props ); Object.defineProperty(target, "$$props", { value: props }); let proxy = new Proxy(target, PyProxyHandlers); return proxy; } Module.pyproxy_new = pyproxy_new; function _getPtr(jsobj) { let ptr = jsobj.$$.ptr; if (ptr === 0) { throw new Error(jsobj.$$.destroyed_msg); } return ptr; } Module.PyProxy_getPtr = _getPtr; let PyProxyHandlers = { isExtensible() { return (!!1); }, has(jsobj, jskey) { let objHasKey = Reflect.has(jsobj, jskey); if (objHasKey) { return (!!1); } if (typeof jskey === "symbol") { return (!!0); } if (jskey.startsWith("$")) { jskey = jskey.slice(1); } return python_hasattr(jsobj, jskey); }, get(jsobj, jskey) { if (jskey in jsobj || typeof jskey === "symbol") { return Reflect.get(jsobj, jskey); } if (jskey.startsWith("$")) { jskey = jskey.slice(1); } let idresult = python_getattr(jsobj, jskey); if (idresult !== 0) { return Hiwire.pop_value(idresult); } }, set(jsobj, jskey, jsval) { let descr = Object.getOwnPropertyDescriptor(jsobj, jskey); if (descr && !descr.writable) { throw new TypeError(`Cannot set read only field '${jskey}'`); } if (typeof jskey === "symbol") { return Reflect.set(jsobj, jskey, jsval); } if (jskey.startsWith("$")) { jskey = jskey.slice(1); } python_setattr(jsobj, jskey, jsval); return (!!1); }, deleteProperty(jsobj, jskey) { let descr = Object.getOwnPropertyDescriptor(jsobj, jskey); if (descr && !descr.writable) { throw new TypeError(`Cannot delete read only field '${jskey}'`); } if (typeof jskey === "symbol") { return Reflect.deleteProperty(jsobj, jskey); } if (jskey.startsWith("$")) { jskey = jskey.slice(1); } python_delattr(jsobj, jskey); return !descr || !!descr.configurable; }, ownKeys(jsobj) { let ptrobj = _getPtr(jsobj); let idresult; try { ; idresult = Module.__pyproxy_ownKeys(ptrobj); ; } catch (e) { API.fatal_error(e); } if (idresult === 0) { Module._pythonexc2js(); } let result = Hiwire.pop_value(idresult); result.push(...Reflect.ownKeys(jsobj)); return result; }, apply(jsobj, jsthis, jsargs) { return jsobj.apply(jsthis, jsargs); }, }; function python_hasattr(jsobj, jskey) { let ptrobj = _getPtr(jsobj); let idkey = Hiwire.new_value(jskey); let result; try { ; result = Module.__pyproxy_hasattr(ptrobj, idkey); ; } catch (e) { API.fatal_error(e); } finally { Hiwire.decref(idkey); } if (result === -1) { Module._pythonexc2js(); } return result !== 0; } function python_getattr(jsobj, jskey) { let ptrobj = _getPtr(jsobj); let idkey = Hiwire.new_value(jskey); let idresult; let cacheId = jsobj.$$.cache.cacheId; try { ; idresult = Module.__pyproxy_getattr(ptrobj, idkey, cacheId); ; } catch (e) { API.fatal_error(e); } finally { Hiwire.decref(idkey); } throw_if_error(); return idresult; } function python_setattr(jsobj, jskey, jsval) { let ptrobj = _getPtr(jsobj); let idkey = Hiwire.new_value(jskey); let idval = Hiwire.new_value(jsval); let errcode; try { ; errcode = Module.__pyproxy_setattr(ptrobj, idkey, idval); ; } catch (e) { API.fatal_error(e); } finally { Hiwire.decref(idkey); Hiwire.decref(idval); } if (errcode === -1) { Module._pythonexc2js(); } } function python_delattr(jsobj, jskey) { let ptrobj = _getPtr(jsobj); let idkey = Hiwire.new_value(jskey); let errcode; try { ; errcode = Module.__pyproxy_delattr(ptrobj, idkey); ; } catch (e) { API.fatal_error(e); } finally { Hiwire.decref(idkey); } if (errcode === -1) { Module._pythonexc2js(); } } } return 0; } catch (e) { do { console.error( `EM_JS raised exception on line 613 in func pyproxy_init_js in file "pyodide/pyproxy.js"`); console.error("Error was:", e); } while (0); API.handle_js_error(e); } return 0; }




  /** @constructor */
  function ExitStatus(status) {
      this.name = 'ExitStatus';
      this.message = 'Program terminated with exit(' + status + ')';
      this.status = status;
    }

  function callRuntimeCallbacks(callbacks) {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    }

  
    /**
     * @param {number} ptr
     * @param {string} type
     */
  function getValue(ptr, type = 'i8') {
      if (type.endsWith('*')) type = '*';
      switch (type) {
        case 'i1': return HEAP8[((ptr)>>0)];
        case 'i8': return HEAP8[((ptr)>>0)];
        case 'i16': return HEAP16[((ptr)>>1)];
        case 'i32': return HEAP32[((ptr)>>2)];
        case 'i64': return HEAP32[((ptr)>>2)];
        case 'float': return HEAPF32[((ptr)>>2)];
        case 'double': return HEAPF64[((ptr)>>3)];
        case '*': return HEAPU32[((ptr)>>2)];
        default: abort('invalid type for getValue: ' + type);
      }
      return null;
    }

  function ptrToString(ptr) {
      assert(typeof ptr === 'number');
      return '0x' + ptr.toString(16).padStart(8, '0');
    }

  
    /**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */
  function setValue(ptr, value, type = 'i8') {
      if (type.endsWith('*')) type = '*';
      switch (type) {
        case 'i1': HEAP8[((ptr)>>0)] = value; break;
        case 'i8': HEAP8[((ptr)>>0)] = value; break;
        case 'i16': HEAP16[((ptr)>>1)] = value; break;
        case 'i32': HEAP32[((ptr)>>2)] = value; break;
        case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)] = tempI64[0],HEAP32[(((ptr)+(4))>>2)] = tempI64[1]); break;
        case 'float': HEAPF32[((ptr)>>2)] = value; break;
        case 'double': HEAPF64[((ptr)>>3)] = value; break;
        case '*': HEAPU32[((ptr)>>2)] = value; break;
        default: abort('invalid type for setValue: ' + type);
      }
    }

  function warnOnce(text) {
      if (!warnOnce.shown) warnOnce.shown = {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        if (ENVIRONMENT_IS_NODE) text = 'warning: ' + text;
        err(text);
      }
    }

  var PATH = {isAbs:(path) => path.charAt(0) === '/',splitPath:(filename) => {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:(parts, allowAboveRoot) => {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:(path) => {
        var isAbsolute = PATH.isAbs(path),
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter((p) => !!p), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:(path) => {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:(path) => {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        path = PATH.normalize(path);
        path = path.replace(/\/$/, "");
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },join:function() {
        var paths = Array.prototype.slice.call(arguments);
        return PATH.normalize(paths.join('/'));
      },join2:(l, r) => {
        return PATH.normalize(l + '/' + r);
      }};
  
  function getRandomDevice() {
      if (typeof crypto == 'object' && typeof crypto['getRandomValues'] == 'function') {
        // for modern web browsers
        var randomBuffer = new Uint8Array(1);
        return () => { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
      } else
      if (ENVIRONMENT_IS_NODE) {
        // for nodejs with or without crypto support included
        try {
          var crypto_module = require('crypto');
          // nodejs has crypto support
          return () => crypto_module['randomBytes'](1)[0];
        } catch (e) {
          // nodejs doesn't have crypto support
        }
      }
      // we couldn't find a proper implementation, as Math.random() is not suitable for /dev/random, see emscripten-core/emscripten/pull/7096
      return () => abort("no cryptographic support found for randomDevice. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: function(array) { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };");
    }
  
  
  
  var PATH_FS = {resolve:function() {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path != 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = PATH.isAbs(path);
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter((p) => !!p), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:(from, to) => {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  
  /** @type {function(string, boolean=, number=)} */
  function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array;
  }
  var TTY = {ttys:[],init:function () {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function(stream) {
          // flush any pending line data
          stream.tty.ops.fsync(stream.tty);
        },fsync:function(stream) {
          stream.tty.ops.fsync(stream.tty);
        },read:function(stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function(tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              // we will read data by chunks of BUFSIZE
              var BUFSIZE = 256;
              var buf = Buffer.alloc(BUFSIZE);
              var bytesRead = 0;
  
              try {
                bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE, -1);
              } catch(e) {
                // Cross-platform differences: on Windows, reading EOF throws an exception, but on other OSes,
                // reading EOF returns 0. Uniformize behavior by treating the EOF exception to return 0.
                if (e.toString().includes('EOF')) bytesRead = 0;
                else throw e;
              }
  
              if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
              } else {
                result = null;
              }
            } else
            if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function(tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },fsync:function(tty) {
          if (tty.output && tty.output.length > 0) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }},default_tty1_ops:{put_char:function(tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },fsync:function(tty) {
          if (tty.output && tty.output.length > 0) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }}};
  
  
  function zeroMemory(address, size) {
      HEAPU8.fill(0, address, address + size);
      return address;
    }
  
  function alignMemory(size, alignment) {
      assert(alignment, "alignment argument is required");
      return Math.ceil(size / alignment) * alignment;
    }
  function mmapAlloc(size) {
      abort('internal error: mmapAlloc called but `emscripten_builtin_memalign` native symbol not exported');
    }
  var MEMFS = {ops_table:null,mount:function(mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(63);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap,
                msync: MEMFS.stream_ops.msync
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            }
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.length which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
          parent.timestamp = node.timestamp;
        }
        return node;
      },getFileDataAsTypedArray:function(node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },expandFileStorage:function(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
        // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
        // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
        // avoid overshooting the allocation cap by a very large margin.
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) >>> 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity); // Allocate new storage.
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
      },resizeFileStorage:function(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
        } else {
          var oldContents = node.contents;
          node.contents = new Uint8Array(newSize); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
        }
      },node_ops:{getattr:function(node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function(node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },lookup:function(parent, name) {
          throw FS.genericErrors[44];
        },mknod:function(parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function(old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(55);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.parent.timestamp = Date.now()
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          new_dir.timestamp = old_node.parent.timestamp;
          old_node.parent = new_dir;
        },unlink:function(parent, name) {
          delete parent.contents[name];
          parent.timestamp = Date.now();
        },rmdir:function(parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
          parent.timestamp = Date.now();
        },readdir:function(node) {
          var entries = ['.', '..'];
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function(parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function(node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        }},stream_ops:{read:function(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },write:function(stream, buffer, offset, length, position, canOwn) {
          // The data buffer should be a typed array view
          assert(!(buffer instanceof ArrayBuffer));
  
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) {
              assert(position === 0, 'canOwn must imply no weird position inside the file');
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = buffer.slice(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
  
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) {
            // Use typed array write which is available.
            node.contents.set(buffer.subarray(offset, offset + length), position);
          } else {
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position + length);
          return length;
        },llseek:function(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },allocate:function(stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },mmap:function(stream, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if (!(flags & 2) && contents.buffer === HEAP8.buffer) {
            // We can't emulate MAP_SHARED when the file is not backed by the
            // buffer we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = mmapAlloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            HEAP8.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        },msync:function(stream, buffer, offset, length, mmapFlags) {
          MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        }}};
  
  /** @param {boolean=} noRunDep */
  function asyncLoad(url, onload, onerror, noRunDep) {
      var dep = !noRunDep ? getUniqueRunDependency('al ' + url) : '';
      readAsync(url, (arrayBuffer) => {
        assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
        onload(new Uint8Array(arrayBuffer));
        if (dep) removeRunDependency(dep);
      }, (event) => {
        if (onerror) {
          onerror();
        } else {
          throw 'Loading data file "' + url + '" failed.';
        }
      });
      if (dep) addRunDependency(dep);
    }
  
  
  var ERRNO_MESSAGES = {0:"Success",1:"Arg list too long",2:"Permission denied",3:"Address already in use",4:"Address not available",5:"Address family not supported by protocol family",6:"No more processes",7:"Socket already connected",8:"Bad file number",9:"Trying to read unreadable message",10:"Mount device busy",11:"Operation canceled",12:"No children",13:"Connection aborted",14:"Connection refused",15:"Connection reset by peer",16:"File locking deadlock error",17:"Destination address required",18:"Math arg out of domain of func",19:"Quota exceeded",20:"File exists",21:"Bad address",22:"File too large",23:"Host is unreachable",24:"Identifier removed",25:"Illegal byte sequence",26:"Connection already in progress",27:"Interrupted system call",28:"Invalid argument",29:"I/O error",30:"Socket is already connected",31:"Is a directory",32:"Too many symbolic links",33:"Too many open files",34:"Too many links",35:"Message too long",36:"Multihop attempted",37:"File or path name too long",38:"Network interface is not configured",39:"Connection reset by network",40:"Network is unreachable",41:"Too many open files in system",42:"No buffer space available",43:"No such device",44:"No such file or directory",45:"Exec format error",46:"No record locks available",47:"The link has been severed",48:"Not enough core",49:"No message of desired type",50:"Protocol not available",51:"No space left on device",52:"Function not implemented",53:"Socket is not connected",54:"Not a directory",55:"Directory not empty",56:"State not recoverable",57:"Socket operation on non-socket",59:"Not a typewriter",60:"No such device or address",61:"Value too large for defined data type",62:"Previous owner died",63:"Not super-user",64:"Broken pipe",65:"Protocol error",66:"Unknown protocol",67:"Protocol wrong type for socket",68:"Math result not representable",69:"Read only file system",70:"Illegal seek",71:"No such process",72:"Stale file handle",73:"Connection timed out",74:"Text file busy",75:"Cross-device link",100:"Device not a stream",101:"Bad font file fmt",102:"Invalid slot",103:"Invalid request code",104:"No anode",105:"Block device required",106:"Channel number out of range",107:"Level 3 halted",108:"Level 3 reset",109:"Link number out of range",110:"Protocol driver not attached",111:"No CSI structure available",112:"Level 2 halted",113:"Invalid exchange",114:"Invalid request descriptor",115:"Exchange full",116:"No data (for no delay io)",117:"Timer expired",118:"Out of streams resources",119:"Machine is not on the network",120:"Package not installed",121:"The object is remote",122:"Advertise error",123:"Srmount error",124:"Communication error on send",125:"Cross mount point (not really error)",126:"Given log. name not unique",127:"f.d. invalid for this operation",128:"Remote address changed",129:"Can   access a needed shared lib",130:"Accessing a corrupted shared lib",131:".lib section in a.out corrupted",132:"Attempting to link in too many libs",133:"Attempting to exec a shared library",135:"Streams pipe error",136:"Too many users",137:"Socket type not supported",138:"Not supported",139:"Protocol family not supported",140:"Can't send after socket shutdown",141:"Too many references",142:"Host is down",148:"No medium (in tape drive)",156:"Level 2 not synchronized"};
  
  var ERRNO_CODES = {};
  
  function withStackSave(f) {
      var stack = stackSave();
      var ret = f();
      stackRestore(stack);
      return ret;
    }
  function demangle(func) {
      warnOnce('warning: build with -sDEMANGLE_SUPPORT to link in libcxxabi demangling');
      return func;
    }
  function demangleAll(text) {
      var regex =
        /\b_Z[\w\d_]+/g;
      return text.replace(regex,
        function(x) {
          var y = demangle(x);
          return x === y ? x : (y + ' [' + x + ']');
        });
    }
  var FS = {root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,lookupPath:(path, opts = {}) => {
        path = PATH_FS.resolve(path);
  
        if (!path) return { path: '', node: null };
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        opts = Object.assign(defaults, opts)
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(32);
        }
  
        // split the absolute path
        var parts = path.split('/').filter((p) => !!p);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
  
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count + 1 });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(32);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:(node) => {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:(parentid, name) => {
        var hash = 0;
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:(node) => {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:(node) => {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:(parent, name) => {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
          throw new FS.ErrnoError(errCode, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:(parent, name, mode, rdev) => {
        assert(typeof parent == 'object')
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:(node) => {
        FS.hashRemoveNode(node);
      },isRoot:(node) => {
        return node === node.parent;
      },isMountpoint:(node) => {
        return !!node.mounted;
      },isFile:(mode) => {
        return (mode & 61440) === 32768;
      },isDir:(mode) => {
        return (mode & 61440) === 16384;
      },isLink:(mode) => {
        return (mode & 61440) === 40960;
      },isChrdev:(mode) => {
        return (mode & 61440) === 8192;
      },isBlkdev:(mode) => {
        return (mode & 61440) === 24576;
      },isFIFO:(mode) => {
        return (mode & 61440) === 4096;
      },isSocket:(mode) => {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"r+":2,"w":577,"w+":578,"a":1089,"a+":1090},modeStringToFlags:(str) => {
        var flags = FS.flagModes[str];
        if (typeof flags == 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:(flag) => {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:(node, perms) => {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.includes('r') && !(node.mode & 292)) {
          return 2;
        } else if (perms.includes('w') && !(node.mode & 146)) {
          return 2;
        } else if (perms.includes('x') && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      },mayLookup:(dir) => {
        var errCode = FS.nodePermissions(dir, 'x');
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      },mayCreate:(dir, name) => {
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:(dir, name, isdir) => {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var errCode = FS.nodePermissions(dir, 'wx');
        if (errCode) {
          return errCode;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return 31;
          }
        }
        return 0;
      },mayOpen:(node, flags) => {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== 'r' || // opening for write
              (flags & 512)) { // TODO: check for O_SEARCH? (== search for dir only)
            return 31;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:(fd_start = 0, fd_end = FS.MAX_OPEN_FDS) => {
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      },getStream:(fd) => FS.streams[fd],createStream:(stream, fd_start, fd_end) => {
        if (!FS.FSStream) {
          FS.FSStream = /** @constructor */ function() {
            this.shared = { };
          };
          FS.FSStream.prototype = {};
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              /** @this {FS.FSStream} */
              get: function() { return this.node; },
              /** @this {FS.FSStream} */
              set: function(val) { this.node = val; }
            },
            isRead: {
              /** @this {FS.FSStream} */
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              /** @this {FS.FSStream} */
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              /** @this {FS.FSStream} */
              get: function() { return (this.flags & 1024); }
            },
            flags: {
              /** @this {FS.FSStream} */
              get: function() { return this.shared.flags; },
              /** @this {FS.FSStream} */
              set: function(val) { this.shared.flags = val; },
            },
            position : {
              /** @this {FS.FSStream} */
              get: function() { return this.shared.position; },
              /** @this {FS.FSStream} */
              set: function(val) { this.shared.position = val; },
            },
          });
        }
        // clone it, so we can return an instance of FSStream
        stream = Object.assign(new FS.FSStream(), stream);
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:(fd) => {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:(stream) => {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:() => {
          throw new FS.ErrnoError(70);
        }},major:(dev) => ((dev) >> 8),minor:(dev) => ((dev) & 0xff),makedev:(ma, mi) => ((ma) << 8 | (mi)),registerDevice:(dev, ops) => {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:(dev) => FS.devices[dev],getMounts:(mount) => {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:(populate, callback) => {
        if (typeof populate == 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          err('warning: ' + FS.syncFSRequests + ' FS.syncfs operations in flight at once, probably just doing extra work');
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(errCode) {
          assert(FS.syncFSRequests > 0);
          FS.syncFSRequests--;
          return callback(errCode);
        }
  
        function done(errCode) {
          if (errCode) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(errCode);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach((mount) => {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:(type, opts, mountpoint) => {
        if (typeof type == 'string') {
          // The filesystem was not included, and instead we have an error
          // message stored in the variable.
          throw type;
        }
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:(mountpoint) => {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach((hash) => {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.includes(current.mount)) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:(parent, name) => {
        return parent.node_ops.lookup(parent, name);
      },mknod:(path, mode, dev) => {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:(path, mode) => {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:(path, mode) => {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdirTree:(path, mode) => {
        var dirs = path.split('/');
        var d = '';
        for (var i = 0; i < dirs.length; ++i) {
          if (!dirs[i]) continue;
          d += '/' + dirs[i];
          try {
            FS.mkdir(d, mode);
          } catch(e) {
            if (e.errno != 20) throw e;
          }
        }
      },mkdev:(path, mode, dev) => {
        if (typeof dev == 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:(oldpath, newpath) => {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:(old_path, new_path) => {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
  
        // let the errors from non existant directories percolate up
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
  
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(28);
        }
        // new path should not be an ancestor of the old path
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(55);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        errCode = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(10);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          errCode = FS.nodePermissions(old_dir, 'w');
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:(path) => {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:(path) => {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(54);
        }
        return node.node_ops.readdir(node);
      },unlink:(path) => {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:(path) => {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
      },stat:(path, dontFollow) => {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(63);
        }
        return node.node_ops.getattr(node);
      },lstat:(path) => {
        return FS.stat(path, true);
      },chmod:(path, mode, dontFollow) => {
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:(path, mode) => {
        FS.chmod(path, mode, true);
      },fchmod:(fd, mode) => {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        FS.chmod(stream.node, mode);
      },chown:(path, uid, gid, dontFollow) => {
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:(path, uid, gid) => {
        FS.chown(path, uid, gid, true);
      },fchown:(fd, uid, gid) => {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:(path, len) => {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, 'w');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:(fd, len) => {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
      },utime:(path, atime, mtime) => {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:(path, flags, mode) => {
        if (path === "") {
          throw new FS.ErrnoError(44);
        }
        flags = typeof flags == 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode == 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path == 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(20);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var errCode = FS.mayOpen(node, flags);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // do truncation if necessary
        if ((flags & 512) && !created) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512 | 131072);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        });
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
          }
        }
        return stream;
      },close:(stream) => {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null; // free readdir state
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },isClosed:(stream) => {
        return stream.fd === null;
      },llseek:(stream, offset, whence) => {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },read:(stream, buffer, offset, length, position) => {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:(stream, buffer, offset, length, position, canOwn) => {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:(stream, offset, length) => {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(28);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:(stream, length, position, prot, flags) => {
        // User requests writing to file (prot & PROT_WRITE != 0).
        // Checking if we have permissions to write to the file unless
        // MAP_PRIVATE flag is set. According to POSIX spec it is possible
        // to write to file opened in read-only mode with MAP_PRIVATE flag,
        // as all modifications will be visible only in the memory of
        // the current process.
        if ((prot & 2) !== 0
            && (flags & 2) === 0
            && (stream.flags & 2097155) !== 2) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        return stream.stream_ops.mmap(stream, length, position, prot, flags);
      },msync:(stream, buffer, offset, length, mmapFlags) => {
        if (!stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },munmap:(stream) => 0,ioctl:(stream, cmd, arg) => {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:(path, opts = {}) => {
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:(path, data, opts = {}) => {
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data == 'string') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
          FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
          throw new Error('Unsupported data type');
        }
        FS.close(stream);
      },cwd:() => FS.currentPath,chdir:(path) => {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, 'x');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:() => {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },createDefaultDevices:() => {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: () => 0,
          write: (stream, buffer, offset, length, pos) => length,
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using err() rather than out()
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device = getRandomDevice();
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createSpecialDirectories:() => {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the
        // name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        var proc_self = FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount: () => {
            var node = FS.createNode(proc_self, 'fd', 16384 | 511 /* 0777 */, 73);
            node.node_ops = {
              lookup: (parent, name) => {
                var fd = +name;
                var stream = FS.getStream(fd);
                if (!stream) throw new FS.ErrnoError(8);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: () => stream.path },
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },createStandardStreams:() => {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 0);
        var stdout = FS.open('/dev/stdout', 1);
        var stderr = FS.open('/dev/stderr', 1);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:() => {
        if (FS.ErrnoError) return;
        FS.ErrnoError = /** @this{Object} */ function ErrnoError(errno, node) {
          this.node = node;
          this.setErrno = /** @this{Object} */ function(errno) {
            this.errno = errno;
            for (var key in ERRNO_CODES) {
              if (ERRNO_CODES[key] === errno) {
                this.code = key;
                break;
              }
            }
          };
          this.setErrno(errno);
          this.message = ERRNO_MESSAGES[errno];
  
          // Try to get a maximally helpful stack trace. On Node.js, getting Error.stack
          // now ensures it shows what we want.
          if (this.stack) {
            // Define the stack property for Node.js 4, which otherwise errors on the next line.
            Object.defineProperty(this, "stack", { value: (new Error).stack, writable: true });
            this.stack = demangleAll(this.stack);
          }
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [44].forEach((code) => {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:() => {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.filesystems = {
          'MEMFS': MEMFS,
        };
      },init:(input, output, error) => {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:() => {
        FS.init.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        _fflush(0);
        // close all of our streams
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:(canRead, canWrite) => {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },findObject:(path, dontResolveLastLink) => {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (!ret.exists) {
          return null;
        }
        return ret.object;
      },analyzePath:(path, dontResolveLastLink) => {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createPath:(parent, path, canRead, canWrite) => {
        parent = typeof parent == 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:(parent, name, properties, canRead, canWrite) => {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:(parent, name, data, canRead, canWrite, canOwn) => {
        var path = name;
        if (parent) {
          parent = typeof parent == 'string' ? parent : FS.getPath(parent);
          path = name ? PATH.join2(parent, name) : parent;
        }
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data == 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 577);
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:(parent, name, input, output) => {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: (stream) => {
            stream.seekable = false;
          },
          close: (stream) => {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: (stream, buffer, offset, length, pos /* ignored */) => {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: (stream, buffer, offset, length, pos) => {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },forceLoadFile:(obj) => {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (typeof XMLHttpRequest != 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (read_) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(read_(obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
      },createLazyFile:(parent, name, url, canRead, canWrite) => {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        /** @constructor */
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = /** @this{Object} */ function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize)|0;
          return this.getter(chunkNum)[chunkOffset];
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
  
          var chunkSize = 1024*1024; // Chunk size in bytes
  
          if (!hasByteServing) chunkSize = datalength;
  
          // Function to get a range from the remote URL.
          var doXHR = (from, to) => {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
            // Some hints to the browser that we want binary data.
            xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
  
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(/** @type{Array<number>} */(xhr.response || []));
            }
            return intArrayFromString(xhr.responseText || '', true);
          };
          var lazyArray = this;
          lazyArray.setDataGetter((chunkNum) => {
            var start = chunkNum * chunkSize;
            var end = (chunkNum+1) * chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof lazyArray.chunks[chunkNum] == 'undefined') {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof lazyArray.chunks[chunkNum] == 'undefined') throw new Error('doXHR failed!');
            return lazyArray.chunks[chunkNum];
          });
  
          if (usesGzip || !datalength) {
            // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
            chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
            datalength = this.getter(0).length;
            chunkSize = datalength;
            out("LazyFiles on gzip forces download of the whole file when length is accessed");
          }
  
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        };
        if (typeof XMLHttpRequest != 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperties(lazyArray, {
            length: {
              get: /** @this{Object} */ function() {
                if (!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._length;
              }
            },
            chunkSize: {
              get: /** @this{Object} */ function() {
                if (!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._chunkSize;
              }
            }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: /** @this {FSNode} */ function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach((key) => {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            FS.forceLoadFile(node);
            return fn.apply(null, arguments);
          };
        });
        function writeChunks(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        }
        // use a custom read function
        stream_ops.read = (stream, buffer, offset, length, position) => {
          FS.forceLoadFile(node);
          return writeChunks(stream, buffer, offset, length, position)
        };
        // use a custom mmap function
        stream_ops.mmap = (stream, length, position, prot, flags) => {
          FS.forceLoadFile(node);
          var ptr = mmapAlloc(length);
          if (!ptr) {
            throw new FS.ErrnoError(48);
          }
          writeChunks(stream, HEAP8, ptr, length, position);
          return { ptr: ptr, allocated: true };
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency('cp ' + fullname); // might have several active requests for the same fullname
        function processData(byteArray) {
          function finish(byteArray) {
            if (preFinish) preFinish();
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency(dep);
          }
          if (Browser.handledByPreloadPlugin(byteArray, fullname, finish, () => {
            if (onerror) onerror();
            removeRunDependency(dep);
          })) {
            return;
          }
          finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == 'string') {
          asyncLoad(url, (byteArray) => processData(byteArray), onerror);
        } else {
          processData(url);
        }
      },indexedDB:() => {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:() => {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:(paths, onload, onerror) => {
        onload = onload || (() => {});
        onerror = onerror || (() => {});
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = () => {
          out('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = () => {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach((path) => {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = () => { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = () => { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:(paths, onload, onerror) => {
        onload = onload || (() => {});
        onerror = onerror || (() => {});
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = () => {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach((path) => {
            var getRequest = files.get(path);
            getRequest.onsuccess = () => {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = () => { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },absolutePath:() => {
        abort('FS.absolutePath has been removed; use PATH_FS.resolve instead');
      },createFolder:() => {
        abort('FS.createFolder has been removed; use FS.mkdir instead');
      },createLink:() => {
        abort('FS.createLink has been removed; use FS.symlink instead');
      },joinPath:() => {
        abort('FS.joinPath has been removed; use PATH.join instead');
      },mmapAlloc:() => {
        abort('FS.mmapAlloc has been replaced by the top level function mmapAlloc');
      },standardizePath:() => {
        abort('FS.standardizePath has been removed; use PATH.normalize instead');
      }};
  var SYSCALLS = {DEFAULT_POLLMASK:5,calculateAt:function(dirfd, path, allowEmpty) {
        if (PATH.isAbs(path)) {
          return path;
        }
        // relative path
        var dir;
        if (dirfd === -100) {
          dir = FS.cwd();
        } else {
          var dirstream = SYSCALLS.getStreamFromFD(dirfd);
          dir = dirstream.path;
        }
        if (path.length == 0) {
          if (!allowEmpty) {
            throw new FS.ErrnoError(44);;
          }
          return dir;
        }
        return PATH.join2(dir, path);
      },doStat:function(func, path, buf) {
        try {
          var stat = func(path);
        } catch (e) {
          if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
            // an error occurred while trying to look up the path; we should just report ENOTDIR
            return -54;
          }
          throw e;
        }
        HEAP32[((buf)>>2)] = stat.dev;
        HEAP32[(((buf)+(8))>>2)] = stat.ino;
        HEAP32[(((buf)+(12))>>2)] = stat.mode;
        HEAPU32[(((buf)+(16))>>2)] = stat.nlink;
        HEAP32[(((buf)+(20))>>2)] = stat.uid;
        HEAP32[(((buf)+(24))>>2)] = stat.gid;
        HEAP32[(((buf)+(28))>>2)] = stat.rdev;
        (tempI64 = [stat.size>>>0,(tempDouble=stat.size,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(40))>>2)] = tempI64[0],HEAP32[(((buf)+(44))>>2)] = tempI64[1]);
        HEAP32[(((buf)+(48))>>2)] = 4096;
        HEAP32[(((buf)+(52))>>2)] = stat.blocks;
        var atime = stat.atime.getTime();
        var mtime = stat.mtime.getTime();
        var ctime = stat.ctime.getTime();
        (tempI64 = [Math.floor(atime / 1000)>>>0,(tempDouble=Math.floor(atime / 1000),(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(56))>>2)] = tempI64[0],HEAP32[(((buf)+(60))>>2)] = tempI64[1]);
        HEAPU32[(((buf)+(64))>>2)] = (atime % 1000) * 1000;
        (tempI64 = [Math.floor(mtime / 1000)>>>0,(tempDouble=Math.floor(mtime / 1000),(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(72))>>2)] = tempI64[0],HEAP32[(((buf)+(76))>>2)] = tempI64[1]);
        HEAPU32[(((buf)+(80))>>2)] = (mtime % 1000) * 1000;
        (tempI64 = [Math.floor(ctime / 1000)>>>0,(tempDouble=Math.floor(ctime / 1000),(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(88))>>2)] = tempI64[0],HEAP32[(((buf)+(92))>>2)] = tempI64[1]);
        HEAPU32[(((buf)+(96))>>2)] = (ctime % 1000) * 1000;
        (tempI64 = [stat.ino>>>0,(tempDouble=stat.ino,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(104))>>2)] = tempI64[0],HEAP32[(((buf)+(108))>>2)] = tempI64[1]);
        return 0;
      },doMsync:function(addr, stream, len, flags, offset) {
        if (!FS.isFile(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (flags & 2) {
          // MAP_PRIVATE calls need not to be synced back to underlying fs
          return 0;
        }
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
      },varargs:undefined,get:function() {
        assert(SYSCALLS.varargs != undefined);
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },getStreamFromFD:function(fd) {
        var stream = FS.getStream(fd);
        if (!stream) throw new FS.ErrnoError(8);
        return stream;
      }};
  function ___syscall_chdir(path) {
  try {
  
      path = SYSCALLS.getStr(path);
      FS.chdir(path);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function ___syscall_fstat64(fd, buf) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      return SYSCALLS.doStat(FS.stat, stream.path, buf);
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function ___syscall_getcwd(buf, size) {
  try {
  
      if (size === 0) return -28;
      var cwd = FS.cwd();
      var cwdLengthInBytes = lengthBytesUTF8(cwd) + 1;
      if (size < cwdLengthInBytes) return -68;
      stringToUTF8(cwd, buf, size);
      return cwdLengthInBytes;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function ___syscall_getdents64(fd, dirp, count) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd)
      if (!stream.getdents) {
        stream.getdents = FS.readdir(stream.path);
      }
  
      var struct_size = 280;
      var pos = 0;
      var off = FS.llseek(stream, 0, 1);
  
      var idx = Math.floor(off / struct_size);
  
      while (idx < stream.getdents.length && pos + struct_size <= count) {
        var id;
        var type;
        var name = stream.getdents[idx];
        if (name === '.') {
          id = stream.node.id;
          type = 4; // DT_DIR
        }
        else if (name === '..') {
          var lookup = FS.lookupPath(stream.path, { parent: true });
          id = lookup.node.id;
          type = 4; // DT_DIR
        }
        else {
          var child = FS.lookupNode(stream.node, name);
          id = child.id;
          type = FS.isChrdev(child.mode) ? 2 :  // DT_CHR, character device.
                 FS.isDir(child.mode) ? 4 :     // DT_DIR, directory.
                 FS.isLink(child.mode) ? 10 :   // DT_LNK, symbolic link.
                 8;                             // DT_REG, regular file.
        }
        assert(id);
        (tempI64 = [id>>>0,(tempDouble=id,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((dirp + pos)>>2)] = tempI64[0],HEAP32[(((dirp + pos)+(4))>>2)] = tempI64[1]);
        (tempI64 = [(idx + 1) * struct_size>>>0,(tempDouble=(idx + 1) * struct_size,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((dirp + pos)+(8))>>2)] = tempI64[0],HEAP32[(((dirp + pos)+(12))>>2)] = tempI64[1]);
        HEAP16[(((dirp + pos)+(16))>>1)] = 280;
        HEAP8[(((dirp + pos)+(18))>>0)] = type;
        stringToUTF8(name, dirp + pos + 19, 256);
        pos += struct_size;
        idx += 1;
      }
      FS.llseek(stream, idx * struct_size, 0);
      return pos;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function ___syscall_lstat64(path, buf) {
  try {
  
      path = SYSCALLS.getStr(path);
      return SYSCALLS.doStat(FS.lstat, path, buf);
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function ___syscall_mkdirat(dirfd, path, mode) {
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      // remove a trailing slash, if one - /a/b/ has basename of '', but
      // we want to create b in the context of this function
      path = PATH.normalize(path);
      if (path[path.length-1] === '/') path = path.substr(0, path.length-1);
      FS.mkdir(path, mode, 0);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function ___syscall_newfstatat(dirfd, path, buf, flags) {
  try {
  
      path = SYSCALLS.getStr(path);
      var nofollow = flags & 256;
      var allowEmpty = flags & 4096;
      flags = flags & (~6400);
      assert(!flags, 'unknown flags in __syscall_newfstatat: ' + flags);
      path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
      return SYSCALLS.doStat(nofollow ? FS.lstat : FS.stat, path, buf);
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function ___syscall_openat(dirfd, path, flags, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      var mode = varargs ? SYSCALLS.get() : 0;
      return FS.open(path, flags, mode).fd;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function ___syscall_poll(fds, nfds, timeout) {
  try {
  
      var nonzero = 0;
      for (var i = 0; i < nfds; i++) {
        var pollfd = fds + 8 * i;
        var fd = HEAP32[((pollfd)>>2)];
        var events = HEAP16[(((pollfd)+(4))>>1)];
        var mask = 32;
        var stream = FS.getStream(fd);
        if (stream) {
          mask = SYSCALLS.DEFAULT_POLLMASK;
          if (stream.stream_ops.poll) {
            mask = stream.stream_ops.poll(stream);
          }
        }
        mask &= events | 8 | 16;
        if (mask) nonzero++;
        HEAP16[(((pollfd)+(6))>>1)] = mask;
      }
      return nonzero;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function ___syscall_renameat(olddirfd, oldpath, newdirfd, newpath) {
  try {
  
      oldpath = SYSCALLS.getStr(oldpath);
      newpath = SYSCALLS.getStr(newpath);
      oldpath = SYSCALLS.calculateAt(olddirfd, oldpath);
      newpath = SYSCALLS.calculateAt(newdirfd, newpath);
      FS.rename(oldpath, newpath);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function ___syscall_rmdir(path) {
  try {
  
      path = SYSCALLS.getStr(path);
      FS.rmdir(path);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function ___syscall_stat64(path, buf) {
  try {
  
      path = SYSCALLS.getStr(path);
      return SYSCALLS.doStat(FS.stat, path, buf);
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function ___syscall_statfs64(path, size, buf) {
  try {
  
      path = SYSCALLS.getStr(path);
      assert(size === 64);
      // NOTE: None of the constants here are true. We're just returning safe and
      //       sane values.
      HEAP32[(((buf)+(4))>>2)] = 4096;
      HEAP32[(((buf)+(40))>>2)] = 4096;
      HEAP32[(((buf)+(8))>>2)] = 1000000;
      HEAP32[(((buf)+(12))>>2)] = 500000;
      HEAP32[(((buf)+(16))>>2)] = 500000;
      HEAP32[(((buf)+(20))>>2)] = FS.nextInode;
      HEAP32[(((buf)+(24))>>2)] = 1000000;
      HEAP32[(((buf)+(28))>>2)] = 42;
      HEAP32[(((buf)+(44))>>2)] = 2;  // ST_NOSUID
      HEAP32[(((buf)+(36))>>2)] = 255;
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function ___syscall_unlinkat(dirfd, path, flags) {
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      if (flags === 0) {
        FS.unlink(path);
      } else if (flags === 512) {
        FS.rmdir(path);
      } else {
        abort('Invalid flags passed to unlinkat');
      }
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function __emscripten_throw_longjmp() { throw Infinity; }

  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.copyWithin(dest, src, src + num);
    }

  function getHeapMax() {
      return HEAPU8.length;
    }
  
  function abortOnCannotGrowMemory(requestedSize) {
      abort('Cannot enlarge memory arrays to size ' + requestedSize + ' bytes (OOM). Either (1) compile with -sINITIAL_MEMORY=X with X higher than the current value ' + HEAP8.length + ', (2) compile with -sALLOW_MEMORY_GROWTH which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with -sABORTING_MALLOC=0');
    }
  function _emscripten_resize_heap(requestedSize) {
      var oldSize = HEAPU8.length;
      requestedSize = requestedSize >>> 0;
      abortOnCannotGrowMemory(requestedSize);
    }

  function handleException(e) {
      // Certain exception types we do not treat as errors since they are used for
      // internal control flow.
      // 1. ExitStatus, which is thrown by exit()
      // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
      //    that wish to return to JS event loop.
      if (e instanceof ExitStatus || e == 'unwind') {
        return EXITSTATUS;
      }
      checkStackCookie();
      if (e instanceof WebAssembly.RuntimeError) {
        if (_emscripten_stack_get_current() <= 0) {
          err('Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to ' + STACK_SIZE + ')');
        }
      }
      quit_(1, e);
    }
  function callUserCallback(func) {
      if (ABORT) {
        err('user callback triggered after runtime exited or application aborted.  Ignoring.');
        return;
      }
      try {
        func();
      } catch (e) {
        handleException(e);
      }
    }
  /** @param {number=} timeout */
  function safeSetTimeout(func, timeout) {
      
      return setTimeout(function() {
        
        callUserCallback(func);
      }, timeout);
    }
  function _emscripten_scan_registers(func) {
      return Asyncify.handleSleep((wakeUp) => {
        // We must first unwind, so things are spilled to the stack. Then while
        // we are pausing we do the actual scan. After that we can resume. Note
        // how using a timeout here avoids unbounded call stack growth, which
        // could happen if we tried to scan the stack immediately after unwinding.
        safeSetTimeout(() => {
          var stackBegin = Asyncify.currData + 12;
          var stackEnd = HEAP32[Asyncify.currData >> 2];
          ((a1, a2) => dynCall_vii.apply(null, [func, a1, a2]))(stackBegin, stackEnd);
          wakeUp();
        }, 0);
      });
    }

  function _fd_close(fd) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return e.errno;
  }
  }

  /** @param {number=} offset */
  function doReadv(stream, iov, iovcnt, offset) {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        var curr = FS.read(stream, HEAP8,ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) break; // nothing more to read
        if (typeof offset !== 'undefined') {
          offset += curr;
        }
      }
      return ret;
    }
  
  function _fd_read(fd, iov, iovcnt, pnum) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doReadv(stream, iov, iovcnt);
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return e.errno;
  }
  }

  function convertI32PairToI53Checked(lo, hi) {
      assert(lo == (lo >>> 0) || lo == (lo|0)); // lo should either be a i32 or a u32
      assert(hi === (hi|0));                    // hi should be a i32
      return ((hi + 0x200000) >>> 0 < 0x400001 - !!lo) ? (lo >>> 0) + hi * 4294967296 : NaN;
    }
  
  
  
  
  function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
  try {
  
      var offset = convertI32PairToI53Checked(offset_low, offset_high); if (isNaN(offset)) return 61;
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.llseek(stream, offset, whence);
      (tempI64 = [stream.position>>>0,(tempDouble=stream.position,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((newOffset)>>2)] = tempI64[0],HEAP32[(((newOffset)+(4))>>2)] = tempI64[1]);
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return e.errno;
  }
  }

  function _fd_sync(fd) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      return Asyncify.handleSleep(function(wakeUp) {
        var mount = stream.node.mount;
        if (!mount.type.syncfs) {
          // We write directly to the file system, so there's nothing to do here.
          wakeUp(0);
          return;
        }
        mount.type.syncfs(mount, false, function(err) {
          if (err) {
            wakeUp(function() { return 29 });
            return;
          }
          wakeUp(0);
        });
      });
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return e.errno;
  }
  }

  /** @param {number=} offset */
  function doWritev(stream, iov, iovcnt, offset) {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        var curr = FS.write(stream, HEAP8,ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (typeof offset !== 'undefined') {
          offset += curr;
        }
      }
      return ret;
    }
  
  function _fd_write(fd, iov, iovcnt, pnum) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doWritev(stream, iov, iovcnt);
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return e.errno;
  }
  }

  function _mp_js_hook() {
      if (typeof process !== "undefined" && process.versions.node !== "undefined") {
        var mp_interrupt_char = Module.ccall(
          "mp_hal_get_interrupt_char",
          "number",
          ["number"],
          ["null"]
        );
        var fs = require("fs");
  
        var buf = Buffer.alloc(1);
        try {
          var n = fs.readSync(process.stdin.fd, buf, 0, 1);
          if (n > 0) {
            if (buf[0] == mp_interrupt_char) {
              Module.ccall(
                "mp_sched_keyboard_interrupt",
                "null",
                ["null"],
                ["null"]
              );
            } else {
              process.stdout.write(String.fromCharCode(buf[0]));
            }
          }
        } catch (e) {
          if (e.code === "EAGAIN") {
          } else {
            throw e;
          }
        }
      }
    }

  function _mp_js_ticks_ms() {
      return Date.now() - MP_JS_EPOCH;
    }

  var wasmTableMirror = [];
  
  function getWasmTableEntry(funcPtr) {
      var func = wasmTableMirror[funcPtr];
      if (!func) {
        if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
      }
      assert(wasmTable.get(funcPtr) == func, "JavaScript-side Wasm function table mirror is out of date!");
      return func;
    }

  function runAndAbortIfError(func) {
      try {
        return func();
      } catch (e) {
        abort(e);
      }
    }
  
  
  function sigToWasmTypes(sig) {
      var typeNames = {
        'i': 'i32',
        // i64 values will be split into two i32s.
        'j': 'i32',
        'f': 'f32',
        'd': 'f64',
        'p': 'i32',
      };
      var type = {
        parameters: [],
        results: sig[0] == 'v' ? [] : [typeNames[sig[0]]]
      };
      for (var i = 1; i < sig.length; ++i) {
        assert(sig[i] in typeNames, 'invalid signature char: ' + sig[i]);
        type.parameters.push(typeNames[sig[i]]);
        if (sig[i] === 'j') {
          type.parameters.push('i32');
        }
      }
      return type;
    }
  
  function runtimeKeepalivePush() {
    }
  
  function runtimeKeepalivePop() {
    }
  var Asyncify = {instrumentWasmImports:function(imports) {
        var ASYNCIFY_IMPORTS = ["env.invoke_*","env.emscripten_sleep","env.emscripten_wget","env.emscripten_wget_data","env.emscripten_idb_load","env.emscripten_idb_store","env.emscripten_idb_delete","env.emscripten_idb_exists","env.emscripten_idb_load_blob","env.emscripten_idb_store_blob","env.SDL_Delay","env.emscripten_scan_registers","env.emscripten_lazy_load_code","env.emscripten_fiber_swap","wasi_snapshot_preview1.fd_sync","env.__wasi_fd_sync","env._emval_await","env._dlopen_js","env.__asyncjs__*"].map((x) => x.split('.')[1]);
        for (var x in imports) {
          (function(x) {
            var original = imports[x];
            var sig = original.sig;
            if (typeof original == 'function') {
              var isAsyncifyImport = ASYNCIFY_IMPORTS.indexOf(x) >= 0 ||
                                     x.startsWith('__asyncjs__');
              imports[x] = function() {
                var originalAsyncifyState = Asyncify.state;
                try {
                  return original.apply(null, arguments);
                } finally {
                  // Only asyncify-declared imports are allowed to change the
                  // state.
                  // Changing the state from normal to disabled is allowed (in any
                  // function) as that is what shutdown does (and we don't have an
                  // explicit list of shutdown imports).
                  var changedToDisabled =
                        originalAsyncifyState === Asyncify.State.Normal &&
                        Asyncify.state        === Asyncify.State.Disabled;
                  // invoke_* functions are allowed to change the state if we do
                  // not ignore indirect calls.
                  var ignoredInvoke = x.startsWith('invoke_') &&
                                      true;
                  if (Asyncify.state !== originalAsyncifyState &&
                      !isAsyncifyImport &&
                      !changedToDisabled &&
                      !ignoredInvoke) {
                    throw new Error('import ' + x + ' was not in ASYNCIFY_IMPORTS, but changed the state');
                  }
                }
              };
            }
          })(x);
        }
      },instrumentWasmExports:function(exports) {
        var ret = {};
        for (var x in exports) {
          (function(x) {
            var original = exports[x];
            if (typeof original == 'function') {
              ret[x] = function() {
                Asyncify.exportCallStack.push(x);
                try {
                  return original.apply(null, arguments);
                } finally {
                  if (!ABORT) {
                    var y = Asyncify.exportCallStack.pop();
                    assert(y === x);
                    Asyncify.maybeStopUnwind();
                  }
                }
              };
            } else {
              ret[x] = original;
            }
          })(x);
        }
        return ret;
      },State:{Normal:0,Unwinding:1,Rewinding:2,Disabled:3},state:0,StackSize:4096,currData:null,handleSleepReturnValue:0,exportCallStack:[],callStackNameToId:{},callStackIdToName:{},callStackId:0,asyncPromiseHandlers:null,sleepCallbacks:[],getCallStackId:function(funcName) {
        var id = Asyncify.callStackNameToId[funcName];
        if (id === undefined) {
          id = Asyncify.callStackId++;
          Asyncify.callStackNameToId[funcName] = id;
          Asyncify.callStackIdToName[id] = funcName;
        }
        return id;
      },maybeStopUnwind:function() {
        if (Asyncify.currData &&
            Asyncify.state === Asyncify.State.Unwinding &&
            Asyncify.exportCallStack.length === 0) {
          // We just finished unwinding.
          // Be sure to set the state before calling any other functions to avoid
          // possible infinite recursion here (For example in debug pthread builds
          // the dbg() function itself can call back into WebAssembly to get the
          // current pthread_self() pointer).
          Asyncify.state = Asyncify.State.Normal;
          
          // Keep the runtime alive so that a re-wind can be done later.
          runAndAbortIfError(_asyncify_stop_unwind);
          if (typeof Fibers != 'undefined') {
            Fibers.trampoline();
          }
        }
      },whenDone:function() {
        assert(Asyncify.currData, 'Tried to wait for an async operation when none is in progress.');
        assert(!Asyncify.asyncPromiseHandlers, 'Cannot have multiple async operations in flight at once');
        return new Promise((resolve, reject) => {
          Asyncify.asyncPromiseHandlers = {
            resolve: resolve,
            reject: reject
          };
        });
      },allocateData:function() {
        // An asyncify data structure has three fields:
        //  0  current stack pos
        //  4  max stack pos
        //  8  id of function at bottom of the call stack (callStackIdToName[id] == name of js function)
        //
        // The Asyncify ABI only interprets the first two fields, the rest is for the runtime.
        // We also embed a stack in the same memory region here, right next to the structure.
        // This struct is also defined as asyncify_data_t in emscripten/fiber.h
        var ptr = _malloc(12 + Asyncify.StackSize);
        Asyncify.setDataHeader(ptr, ptr + 12, Asyncify.StackSize);
        Asyncify.setDataRewindFunc(ptr);
        return ptr;
      },setDataHeader:function(ptr, stack, stackSize) {
        HEAP32[((ptr)>>2)] = stack;
        HEAP32[(((ptr)+(4))>>2)] = stack + stackSize;
      },setDataRewindFunc:function(ptr) {
        var bottomOfCallStack = Asyncify.exportCallStack[0];
        var rewindId = Asyncify.getCallStackId(bottomOfCallStack);
        HEAP32[(((ptr)+(8))>>2)] = rewindId;
      },getDataRewindFunc:function(ptr) {
        var id = HEAP32[(((ptr)+(8))>>2)];
        var name = Asyncify.callStackIdToName[id];
        var func = Module['asm'][name];
        return func;
      },doRewind:function(ptr) {
        var start = Asyncify.getDataRewindFunc(ptr);
        // Once we have rewound and the stack we no longer need to artificially
        // keep the runtime alive.
        
        return start();
      },handleSleep:function(startAsync) {
        assert(Asyncify.state !== Asyncify.State.Disabled, 'Asyncify cannot be done during or after the runtime exits');
        if (ABORT) return;
        if (Asyncify.state === Asyncify.State.Normal) {
          // Prepare to sleep. Call startAsync, and see what happens:
          // if the code decided to call our callback synchronously,
          // then no async operation was in fact begun, and we don't
          // need to do anything.
          var reachedCallback = false;
          var reachedAfterCallback = false;
          startAsync((handleSleepReturnValue) => {
            assert(!handleSleepReturnValue || typeof handleSleepReturnValue == 'number' || typeof handleSleepReturnValue == 'boolean'); // old emterpretify API supported other stuff
            if (ABORT) return;
            Asyncify.handleSleepReturnValue = handleSleepReturnValue || 0;
            reachedCallback = true;
            if (!reachedAfterCallback) {
              // We are happening synchronously, so no need for async.
              return;
            }
            // This async operation did not happen synchronously, so we did
            // unwind. In that case there can be no compiled code on the stack,
            // as it might break later operations (we can rewind ok now, but if
            // we unwind again, we would unwind through the extra compiled code
            // too).
            assert(!Asyncify.exportCallStack.length, 'Waking up (starting to rewind) must be done from JS, without compiled code on the stack.');
            Asyncify.state = Asyncify.State.Rewinding;
            runAndAbortIfError(() => _asyncify_start_rewind(Asyncify.currData));
            if (typeof Browser != 'undefined' && Browser.mainLoop.func) {
              Browser.mainLoop.resume();
            }
            var asyncWasmReturnValue, isError = false;
            try {
              asyncWasmReturnValue = Asyncify.doRewind(Asyncify.currData);
            } catch (err) {
              asyncWasmReturnValue = err;
              isError = true;
            }
            // Track whether the return value was handled by any promise handlers.
            var handled = false;
            if (!Asyncify.currData) {
              // All asynchronous execution has finished.
              // `asyncWasmReturnValue` now contains the final
              // return value of the exported async WASM function.
              //
              // Note: `asyncWasmReturnValue` is distinct from
              // `Asyncify.handleSleepReturnValue`.
              // `Asyncify.handleSleepReturnValue` contains the return
              // value of the last C function to have executed
              // `Asyncify.handleSleep()`, where as `asyncWasmReturnValue`
              // contains the return value of the exported WASM function
              // that may have called C functions that
              // call `Asyncify.handleSleep()`.
              var asyncPromiseHandlers = Asyncify.asyncPromiseHandlers;
              if (asyncPromiseHandlers) {
                Asyncify.asyncPromiseHandlers = null;
                (isError ? asyncPromiseHandlers.reject : asyncPromiseHandlers.resolve)(asyncWasmReturnValue);
                handled = true;
              }
            }
            if (isError && !handled) {
              // If there was an error and it was not handled by now, we have no choice but to
              // rethrow that error into the global scope where it can be caught only by
              // `onerror` or `onunhandledpromiserejection`.
              throw asyncWasmReturnValue;
            }
          });
          reachedAfterCallback = true;
          if (!reachedCallback) {
            // A true async operation was begun; start a sleep.
            Asyncify.state = Asyncify.State.Unwinding;
            // TODO: reuse, don't alloc/free every sleep
            Asyncify.currData = Asyncify.allocateData();
            if (typeof Browser != 'undefined' && Browser.mainLoop.func) {
              Browser.mainLoop.pause();
            }
            runAndAbortIfError(() => _asyncify_start_unwind(Asyncify.currData));
          }
        } else if (Asyncify.state === Asyncify.State.Rewinding) {
          // Stop a resume.
          Asyncify.state = Asyncify.State.Normal;
          runAndAbortIfError(_asyncify_stop_rewind);
          _free(Asyncify.currData);
          Asyncify.currData = null;
          // Call all sleep callbacks now that the sleep-resume is all done.
          Asyncify.sleepCallbacks.forEach((func) => callUserCallback(func));
        } else {
          abort('invalid state: ' + Asyncify.state);
        }
        return Asyncify.handleSleepReturnValue;
      },handleAsync:function(startAsync) {
        return Asyncify.handleSleep((wakeUp) => {
          // TODO: add error handling as a second param when handleSleep implements it.
          startAsync().then(wakeUp);
        });
      }};

  function stringToNewUTF8(jsString) {
      var length = lengthBytesUTF8(jsString)+1;
      var cString = _malloc(length);
      stringToUTF8(jsString, cString, length);
      return cString;
    }




  function getCFunc(ident) {
      var func = Module['_' + ident]; // closure exported function
      assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
      return func;
    }
  
  function writeArrayToMemory(array, buffer) {
      assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
      HEAP8.set(array, buffer);
    }
  
  
  
    /**
     * @param {string|null=} returnType
     * @param {Array=} argTypes
     * @param {Arguments|Array=} args
     * @param {Object=} opts
     */
  function ccall(ident, returnType, argTypes, args, opts) {
      // For fast lookup of conversion functions
      var toC = {
        'string': (str) => {
          var ret = 0;
          if (str !== null && str !== undefined && str !== 0) { // null string
            // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
            var len = (str.length << 2) + 1;
            ret = stackAlloc(len);
            stringToUTF8(str, ret, len);
          }
          return ret;
        },
        'array': (arr) => {
          var ret = stackAlloc(arr.length);
          writeArrayToMemory(arr, ret);
          return ret;
        }
      };
  
      function convertReturnValue(ret) {
        if (returnType === 'string') {
          
          return UTF8ToString(ret);
        }
        if (returnType === 'boolean') return Boolean(ret);
        return ret;
      }
  
      var func = getCFunc(ident);
      var cArgs = [];
      var stack = 0;
      assert(returnType !== 'array', 'Return type should not be "array".');
      if (args) {
        for (var i = 0; i < args.length; i++) {
          var converter = toC[argTypes[i]];
          if (converter) {
            if (stack === 0) stack = stackSave();
            cArgs[i] = converter(args[i]);
          } else {
            cArgs[i] = args[i];
          }
        }
      }
      // Data for a previous async operation that was in flight before us.
      var previousAsync = Asyncify.currData;
      var ret = func.apply(null, cArgs);
      function onDone(ret) {
        runtimeKeepalivePop();
        if (stack !== 0) stackRestore(stack);
        return convertReturnValue(ret);
      }
      // Keep the runtime alive through all calls. Note that this call might not be
      // async, but for simplicity we push and pop in all calls.
      runtimeKeepalivePush();
      var asyncMode = opts && opts.async;
      if (Asyncify.currData != previousAsync) {
        // A change in async operation happened. If there was already an async
        // operation in flight before us, that is an error: we should not start
        // another async operation while one is active, and we should not stop one
        // either. The only valid combination is to have no change in the async
        // data (so we either had one in flight and left it alone, or we didn't have
        // one), or to have nothing in flight and to start one.
        assert(!(previousAsync && Asyncify.currData), 'We cannot start an async operation when one is already flight');
        assert(!(previousAsync && !Asyncify.currData), 'We cannot stop an async operation in flight');
        // This is a new async operation. The wasm is paused and has unwound its stack.
        // We need to return a Promise that resolves the return value
        // once the stack is rewound and execution finishes.
        assert(asyncMode, 'The call to ' + ident + ' is running asynchronously. If this was intended, add the async option to the ccall/cwrap call.');
        return Asyncify.whenDone().then(onDone);
      }
  
      ret = onDone(ret);
      // If this is an async ccall, ensure we return a promise
      if (asyncMode) return Promise.resolve(ret);
      return ret;
    }

  var FSNode = /** @constructor */ function(parent, name, mode, rdev) {
    if (!parent) {
      parent = this;  // root node sets parent to itself
    }
    this.parent = parent;
    this.mount = parent.mount;
    this.mounted = null;
    this.id = FS.nextInode++;
    this.name = name;
    this.mode = mode;
    this.node_ops = {};
    this.stream_ops = {};
    this.rdev = rdev;
  };
  var readMode = 292/*292*/ | 73/*73*/;
  var writeMode = 146/*146*/;
  Object.defineProperties(FSNode.prototype, {
   read: {
    get: /** @this{FSNode} */function() {
     return (this.mode & readMode) === readMode;
    },
    set: /** @this{FSNode} */function(val) {
     val ? this.mode |= readMode : this.mode &= ~readMode;
    }
   },
   write: {
    get: /** @this{FSNode} */function() {
     return (this.mode & writeMode) === writeMode;
    },
    set: /** @this{FSNode} */function(val) {
     val ? this.mode |= writeMode : this.mode &= ~writeMode;
    }
   },
   isFolder: {
    get: /** @this{FSNode} */function() {
     return FS.isDir(this.mode);
    }
   },
   isDevice: {
    get: /** @this{FSNode} */function() {
     return FS.isChrdev(this.mode);
    }
   }
  });
  FS.FSNode = FSNode;
  FS.staticInit();;
ERRNO_CODES = {
      'EPERM': 63,
      'ENOENT': 44,
      'ESRCH': 71,
      'EINTR': 27,
      'EIO': 29,
      'ENXIO': 60,
      'E2BIG': 1,
      'ENOEXEC': 45,
      'EBADF': 8,
      'ECHILD': 12,
      'EAGAIN': 6,
      'EWOULDBLOCK': 6,
      'ENOMEM': 48,
      'EACCES': 2,
      'EFAULT': 21,
      'ENOTBLK': 105,
      'EBUSY': 10,
      'EEXIST': 20,
      'EXDEV': 75,
      'ENODEV': 43,
      'ENOTDIR': 54,
      'EISDIR': 31,
      'EINVAL': 28,
      'ENFILE': 41,
      'EMFILE': 33,
      'ENOTTY': 59,
      'ETXTBSY': 74,
      'EFBIG': 22,
      'ENOSPC': 51,
      'ESPIPE': 70,
      'EROFS': 69,
      'EMLINK': 34,
      'EPIPE': 64,
      'EDOM': 18,
      'ERANGE': 68,
      'ENOMSG': 49,
      'EIDRM': 24,
      'ECHRNG': 106,
      'EL2NSYNC': 156,
      'EL3HLT': 107,
      'EL3RST': 108,
      'ELNRNG': 109,
      'EUNATCH': 110,
      'ENOCSI': 111,
      'EL2HLT': 112,
      'EDEADLK': 16,
      'ENOLCK': 46,
      'EBADE': 113,
      'EBADR': 114,
      'EXFULL': 115,
      'ENOANO': 104,
      'EBADRQC': 103,
      'EBADSLT': 102,
      'EDEADLOCK': 16,
      'EBFONT': 101,
      'ENOSTR': 100,
      'ENODATA': 116,
      'ETIME': 117,
      'ENOSR': 118,
      'ENONET': 119,
      'ENOPKG': 120,
      'EREMOTE': 121,
      'ENOLINK': 47,
      'EADV': 122,
      'ESRMNT': 123,
      'ECOMM': 124,
      'EPROTO': 65,
      'EMULTIHOP': 36,
      'EDOTDOT': 125,
      'EBADMSG': 9,
      'ENOTUNIQ': 126,
      'EBADFD': 127,
      'EREMCHG': 128,
      'ELIBACC': 129,
      'ELIBBAD': 130,
      'ELIBSCN': 131,
      'ELIBMAX': 132,
      'ELIBEXEC': 133,
      'ENOSYS': 52,
      'ENOTEMPTY': 55,
      'ENAMETOOLONG': 37,
      'ELOOP': 32,
      'EOPNOTSUPP': 138,
      'EPFNOSUPPORT': 139,
      'ECONNRESET': 15,
      'ENOBUFS': 42,
      'EAFNOSUPPORT': 5,
      'EPROTOTYPE': 67,
      'ENOTSOCK': 57,
      'ENOPROTOOPT': 50,
      'ESHUTDOWN': 140,
      'ECONNREFUSED': 14,
      'EADDRINUSE': 3,
      'ECONNABORTED': 13,
      'ENETUNREACH': 40,
      'ENETDOWN': 38,
      'ETIMEDOUT': 73,
      'EHOSTDOWN': 142,
      'EHOSTUNREACH': 23,
      'EINPROGRESS': 26,
      'EALREADY': 7,
      'EDESTADDRREQ': 17,
      'EMSGSIZE': 35,
      'EPROTONOSUPPORT': 66,
      'ESOCKTNOSUPPORT': 137,
      'EADDRNOTAVAIL': 4,
      'ENETRESET': 39,
      'EISCONN': 30,
      'ENOTCONN': 53,
      'ETOOMANYREFS': 141,
      'EUSERS': 136,
      'EDQUOT': 19,
      'ESTALE': 72,
      'ENOTSUP': 138,
      'ENOMEDIUM': 148,
      'EILSEQ': 25,
      'EOVERFLOW': 61,
      'ECANCELED': 11,
      'ENOTRECOVERABLE': 56,
      'EOWNERDEAD': 62,
      'ESTRPIPE': 135,
    };;
var MP_JS_EPOCH = Date.now();
var ASSERTIONS = true;

function checkIncomingModuleAPI() {
  ignoredModuleProp('fetchSettings');
}
var asmLibraryArg = {
  "JsArray_Check": JsArray_Check,
  "JsArray_Clear": JsArray_Clear,
  "JsArray_Delete": JsArray_Delete,
  "JsArray_Get_js": JsArray_Get_js,
  "JsArray_New_js": JsArray_New_js,
  "JsArray_Push_js": JsArray_Push_js,
  "JsArray_Push_unchecked_js": JsArray_Push_unchecked_js,
  "JsArray_Set": JsArray_Set,
  "JsArray_Splice": JsArray_Splice,
  "JsArray_slice": JsArray_slice,
  "JsMap_New": JsMap_New,
  "JsMap_Set": JsMap_Set,
  "JsObject_DeleteString_js": JsObject_DeleteString_js,
  "JsObject_Dir": JsObject_Dir,
  "JsObject_Entries": JsObject_Entries,
  "JsObject_GetString_js": JsObject_GetString_js,
  "JsObject_Keys": JsObject_Keys,
  "JsObject_New_js": JsObject_New_js,
  "JsObject_SetString_js": JsObject_SetString_js,
  "JsObject_Values": JsObject_Values,
  "JsProxy_GetIter_js": JsProxy_GetIter_js,
  "JsProxy_iternext_js": JsProxy_iternext_js,
  "JsProxy_subscr_js": JsProxy_subscr_js,
  "JsSet_Add": JsSet_Add,
  "JsSet_New": JsSet_New,
  "JsString_InternFromCString": JsString_InternFromCString,
  "__syscall_chdir": ___syscall_chdir,
  "__syscall_fstat64": ___syscall_fstat64,
  "__syscall_getcwd": ___syscall_getcwd,
  "__syscall_getdents64": ___syscall_getdents64,
  "__syscall_lstat64": ___syscall_lstat64,
  "__syscall_mkdirat": ___syscall_mkdirat,
  "__syscall_newfstatat": ___syscall_newfstatat,
  "__syscall_openat": ___syscall_openat,
  "__syscall_poll": ___syscall_poll,
  "__syscall_renameat": ___syscall_renameat,
  "__syscall_rmdir": ___syscall_rmdir,
  "__syscall_stat64": ___syscall_stat64,
  "__syscall_statfs64": ___syscall_statfs64,
  "__syscall_unlinkat": ___syscall_unlinkat,
  "_emscripten_throw_longjmp": __emscripten_throw_longjmp,
  "destroy_proxies_js": destroy_proxies_js,
  "destroy_proxy": destroy_proxy,
  "emscripten_memcpy_big": _emscripten_memcpy_big,
  "emscripten_resize_heap": _emscripten_resize_heap,
  "emscripten_scan_registers": _emscripten_scan_registers,
  "fd_close": _fd_close,
  "fd_read": _fd_read,
  "fd_seek": _fd_seek,
  "fd_sync": _fd_sync,
  "fd_write": _fd_write,
  "hiwire_CallMethod": hiwire_CallMethod,
  "hiwire_CallMethodString": hiwire_CallMethodString,
  "hiwire_CallMethod_NoArgs": hiwire_CallMethod_NoArgs,
  "hiwire_CallMethod_OneArg": hiwire_CallMethod_OneArg,
  "hiwire_HasMethod": hiwire_HasMethod,
  "hiwire_assign_from_ptr": hiwire_assign_from_ptr,
  "hiwire_assign_to_ptr": hiwire_assign_to_ptr,
  "hiwire_call": hiwire_call,
  "hiwire_call_OneArg": hiwire_call_OneArg,
  "hiwire_call_bound_js": hiwire_call_bound_js,
  "hiwire_construct": hiwire_construct,
  "hiwire_constructor_name": hiwire_constructor_name,
  "hiwire_decref": hiwire_decref,
  "hiwire_double_js": hiwire_double_js,
  "hiwire_equal": hiwire_equal,
  "hiwire_get_bool": hiwire_get_bool,
  "hiwire_get_buffer_info": hiwire_get_buffer_info,
  "hiwire_get_length_helper": hiwire_get_length_helper,
  "hiwire_get_length_string": hiwire_get_length_string,
  "hiwire_greater_than": hiwire_greater_than,
  "hiwire_greater_than_equal": hiwire_greater_than_equal,
  "hiwire_has_length": hiwire_has_length,
  "hiwire_incref_js": hiwire_incref_js,
  "hiwire_init_js": hiwire_init_js,
  "hiwire_int_from_digits_js": hiwire_int_from_digits_js,
  "hiwire_int_js": hiwire_int_js,
  "hiwire_into_file": hiwire_into_file,
  "hiwire_is_async_generator": hiwire_is_async_generator,
  "hiwire_is_comlink_proxy": hiwire_is_comlink_proxy,
  "hiwire_is_error": hiwire_is_error,
  "hiwire_is_function_js": hiwire_is_function_js,
  "hiwire_is_generator": hiwire_is_generator,
  "hiwire_is_promise": hiwire_is_promise,
  "hiwire_less_than": hiwire_less_than,
  "hiwire_less_than_equal": hiwire_less_than_equal,
  "hiwire_not_equal": hiwire_not_equal,
  "hiwire_read_from_file": hiwire_read_from_file,
  "hiwire_resolve_promise": hiwire_resolve_promise,
  "hiwire_reversed_iterator": hiwire_reversed_iterator,
  "hiwire_string_utf8_js": hiwire_string_utf8_js,
  "hiwire_string_utf8_len_js": hiwire_string_utf8_len_js,
  "hiwire_subarray": hiwire_subarray,
  "hiwire_throw_error": hiwire_throw_error,
  "hiwire_to_bool": hiwire_to_bool,
  "hiwire_to_string_js": hiwire_to_string_js,
  "hiwire_typeof": hiwire_typeof,
  "hiwire_write_to_file": hiwire_write_to_file,
  "invoke_i": invoke_i,
  "invoke_ii": invoke_ii,
  "invoke_iii": invoke_iii,
  "invoke_iiii": invoke_iiii,
  "invoke_iiiii": invoke_iiiii,
  "invoke_v": invoke_v,
  "invoke_vi": invoke_vi,
  "invoke_vii": invoke_vii,
  "invoke_viii": invoke_viii,
  "invoke_viiii": invoke_viiii,
  "js2python_immutable": js2python_immutable,
  "js2python_init_js": js2python_init_js,
  "js2python_js": js2python_js,
  "lib_init": lib_init,
  "mp_js_hook": _mp_js_hook,
  "mp_js_ticks_ms": _mp_js_ticks_ms,
  "pyproxy_AsPyObject": pyproxy_AsPyObject,
  "pyproxy_Check_js": pyproxy_Check_js,
  "pyproxy_init_js": pyproxy_init_js,
  "pyproxy_new_js": pyproxy_new_js,
  "set_exc": set_exc
};
Asyncify.instrumentWasmImports(asmLibraryArg);
var asm = createWasm();
/** @type {function(...*):?} */
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = createExportWrapper("__wasm_call_ctors");

/** @type {function(...*):?} */
var _mp_obj_new_float = Module["_mp_obj_new_float"] = createExportWrapper("mp_obj_new_float");

/** @type {function(...*):?} */
var _mp_obj_new_int = Module["_mp_obj_new_int"] = createExportWrapper("mp_obj_new_int");

/** @type {function(...*):?} */
var _malloc = Module["_malloc"] = createExportWrapper("malloc");

/** @type {function(...*):?} */
var _saveSetjmp = Module["_saveSetjmp"] = createExportWrapper("saveSetjmp");

/** @type {function(...*):?} */
var _free = Module["_free"] = createExportWrapper("free");

/** @type {function(...*):?} */
var _mp_sched_keyboard_interrupt = Module["_mp_sched_keyboard_interrupt"] = createExportWrapper("mp_sched_keyboard_interrupt");

/** @type {function(...*):?} */
var _mp_obj_int_from_bytes_impl = Module["_mp_obj_int_from_bytes_impl"] = createExportWrapper("mp_obj_int_from_bytes_impl");

/** @type {function(...*):?} */
var _mp_obj_new_str = Module["_mp_obj_new_str"] = createExportWrapper("mp_obj_new_str");

/** @type {function(...*):?} */
var ___errno_location = Module["___errno_location"] = createExportWrapper("__errno_location");

/** @type {function(...*):?} */
var _mp_js_do_str = Module["_mp_js_do_str"] = createExportWrapper("mp_js_do_str");

/** @type {function(...*):?} */
var _mp_js_process_char = Module["_mp_js_process_char"] = createExportWrapper("mp_js_process_char");

/** @type {function(...*):?} */
var _mp_js_init = Module["_mp_js_init"] = createExportWrapper("mp_js_init");

/** @type {function(...*):?} */
var _mp_js_init_repl = Module["_mp_js_init_repl"] = createExportWrapper("mp_js_init_repl");

/** @type {function(...*):?} */
var _mp_hal_get_interrupt_char = Module["_mp_hal_get_interrupt_char"] = createExportWrapper("mp_hal_get_interrupt_char");

/** @type {function(...*):?} */
var _raise_js_exception = Module["_raise_js_exception"] = createExportWrapper("raise_js_exception");

/** @type {function(...*):?} */
var _record_traceback = Module["_record_traceback"] = createExportWrapper("record_traceback");

/** @type {function(...*):?} */
var __js2python_none = Module["__js2python_none"] = createExportWrapper("_js2python_none");

/** @type {function(...*):?} */
var __js2python_true = Module["__js2python_true"] = createExportWrapper("_js2python_true");

/** @type {function(...*):?} */
var __js2python_false = Module["__js2python_false"] = createExportWrapper("_js2python_false");

/** @type {function(...*):?} */
var _JsProxy_new = Module["_JsProxy_new"] = createExportWrapper("JsProxy_new");

/** @type {function(...*):?} */
var _pyimport = Module["_pyimport"] = createExportWrapper("pyimport");

/** @type {function(...*):?} */
var _pyproxy_getflags = Module["_pyproxy_getflags"] = createExportWrapper("pyproxy_getflags");

/** @type {function(...*):?} */
var __pyproxy_repr = Module["__pyproxy_repr"] = createExportWrapper("_pyproxy_repr");

/** @type {function(...*):?} */
var __pyproxy_type = Module["__pyproxy_type"] = createExportWrapper("_pyproxy_type");

/** @type {function(...*):?} */
var __pyproxy_hasattr = Module["__pyproxy_hasattr"] = createExportWrapper("_pyproxy_hasattr");

/** @type {function(...*):?} */
var __pyproxy_getattr = Module["__pyproxy_getattr"] = createExportWrapper("_pyproxy_getattr");

/** @type {function(...*):?} */
var __pyproxy_setattr = Module["__pyproxy_setattr"] = createExportWrapper("_pyproxy_setattr");

/** @type {function(...*):?} */
var __pyproxy_delattr = Module["__pyproxy_delattr"] = createExportWrapper("_pyproxy_delattr");

/** @type {function(...*):?} */
var __pyproxy_getitem = Module["__pyproxy_getitem"] = createExportWrapper("_pyproxy_getitem");

/** @type {function(...*):?} */
var __pyproxy_setitem = Module["__pyproxy_setitem"] = createExportWrapper("_pyproxy_setitem");

/** @type {function(...*):?} */
var __pyproxy_delitem = Module["__pyproxy_delitem"] = createExportWrapper("_pyproxy_delitem");

/** @type {function(...*):?} */
var __pyproxy_contains = Module["__pyproxy_contains"] = createExportWrapper("_pyproxy_contains");

/** @type {function(...*):?} */
var __pyproxy_ownKeys = Module["__pyproxy_ownKeys"] = createExportWrapper("_pyproxy_ownKeys");

/** @type {function(...*):?} */
var __pyproxy_apply = Module["__pyproxy_apply"] = createExportWrapper("_pyproxy_apply");

/** @type {function(...*):?} */
var _pyproxy_decref = Module["_pyproxy_decref"] = createExportWrapper("pyproxy_decref");

/** @type {function(...*):?} */
var _emscripten_stack_get_base = Module["_emscripten_stack_get_base"] = function() {
  return (_emscripten_stack_get_base = Module["_emscripten_stack_get_base"] = Module["asm"]["emscripten_stack_get_base"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _emscripten_stack_get_current = Module["_emscripten_stack_get_current"] = function() {
  return (_emscripten_stack_get_current = Module["_emscripten_stack_get_current"] = Module["asm"]["emscripten_stack_get_current"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _fflush = Module["_fflush"] = createExportWrapper("fflush");

/** @type {function(...*):?} */
var _setThrew = Module["_setThrew"] = createExportWrapper("setThrew");

/** @type {function(...*):?} */
var _emscripten_stack_init = Module["_emscripten_stack_init"] = function() {
  return (_emscripten_stack_init = Module["_emscripten_stack_init"] = Module["asm"]["emscripten_stack_init"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _emscripten_stack_set_limits = Module["_emscripten_stack_set_limits"] = function() {
  return (_emscripten_stack_set_limits = Module["_emscripten_stack_set_limits"] = Module["asm"]["emscripten_stack_set_limits"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = function() {
  return (_emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = Module["asm"]["emscripten_stack_get_free"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = function() {
  return (_emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = Module["asm"]["emscripten_stack_get_end"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var stackSave = Module["stackSave"] = createExportWrapper("stackSave");

/** @type {function(...*):?} */
var stackRestore = Module["stackRestore"] = createExportWrapper("stackRestore");

/** @type {function(...*):?} */
var stackAlloc = Module["stackAlloc"] = createExportWrapper("stackAlloc");

/** @type {function(...*):?} */
var dynCall_viii = Module["dynCall_viii"] = createExportWrapper("dynCall_viii");

/** @type {function(...*):?} */
var dynCall_vi = Module["dynCall_vi"] = createExportWrapper("dynCall_vi");

/** @type {function(...*):?} */
var dynCall_ii = Module["dynCall_ii"] = createExportWrapper("dynCall_ii");

/** @type {function(...*):?} */
var dynCall_vii = Module["dynCall_vii"] = createExportWrapper("dynCall_vii");

/** @type {function(...*):?} */
var dynCall_iii = Module["dynCall_iii"] = createExportWrapper("dynCall_iii");

/** @type {function(...*):?} */
var dynCall_viiii = Module["dynCall_viiii"] = createExportWrapper("dynCall_viiii");

/** @type {function(...*):?} */
var dynCall_iiii = Module["dynCall_iiii"] = createExportWrapper("dynCall_iiii");

/** @type {function(...*):?} */
var dynCall_iiiii = Module["dynCall_iiiii"] = createExportWrapper("dynCall_iiiii");

/** @type {function(...*):?} */
var dynCall_v = Module["dynCall_v"] = createExportWrapper("dynCall_v");

/** @type {function(...*):?} */
var dynCall_i = Module["dynCall_i"] = createExportWrapper("dynCall_i");

/** @type {function(...*):?} */
var dynCall_dd = Module["dynCall_dd"] = createExportWrapper("dynCall_dd");

/** @type {function(...*):?} */
var dynCall_ddd = Module["dynCall_ddd"] = createExportWrapper("dynCall_ddd");

/** @type {function(...*):?} */
var dynCall_viiiiii = Module["dynCall_viiiiii"] = createExportWrapper("dynCall_viiiiii");

/** @type {function(...*):?} */
var dynCall_jiji = Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji");

/** @type {function(...*):?} */
var dynCall_iidiiii = Module["dynCall_iidiiii"] = createExportWrapper("dynCall_iidiiii");

/** @type {function(...*):?} */
var _asyncify_start_unwind = Module["_asyncify_start_unwind"] = createExportWrapper("asyncify_start_unwind");

/** @type {function(...*):?} */
var _asyncify_stop_unwind = Module["_asyncify_stop_unwind"] = createExportWrapper("asyncify_stop_unwind");

/** @type {function(...*):?} */
var _asyncify_start_rewind = Module["_asyncify_start_rewind"] = createExportWrapper("asyncify_start_rewind");

/** @type {function(...*):?} */
var _asyncify_stop_rewind = Module["_asyncify_stop_rewind"] = createExportWrapper("asyncify_stop_rewind");

var _Js_undefined = Module['_Js_undefined'] = 98236;
var _Js_true = Module['_Js_true'] = 98240;
var _Js_false = Module['_Js_false'] = 98244;
var _Js_null = Module['_Js_null'] = 98248;
var _Js_novalue = Module['_Js_novalue'] = 98252;
var _tracerefs = Module['_tracerefs'] = 166272;
var ___start_em_js = Module['___start_em_js'] = 115168;
var ___stop_em_js = Module['___stop_em_js'] = 161430;
function invoke_ii(index,a1) {
  var sp = stackSave();
  try {
    return dynCall_ii(index,a1);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    dynCall_viii(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return dynCall_iiiii(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_v(index) {
  var sp = stackSave();
  try {
    dynCall_v(index);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  var sp = stackSave();
  try {
    return dynCall_iii(index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vi(index,a1) {
  var sp = stackSave();
  try {
    dynCall_vi(index,a1);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_iiii(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  var sp = stackSave();
  try {
    dynCall_vii(index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_i(index) {
  var sp = stackSave();
  try {
    return dynCall_i(index);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    dynCall_viiii(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}




// === Auto-generated postamble setup entry stuff ===

Module["stringToNewUTF8"] = stringToNewUTF8;
Module["ccall"] = ccall;
Module["PATH"] = PATH;
Module["PATH_FS"] = PATH_FS;
Module["FS"] = FS;
var unexportedRuntimeSymbols = [
  'run',
  'UTF8ArrayToString',
  'UTF8ToString',
  'stringToUTF8Array',
  'stringToUTF8',
  'lengthBytesUTF8',
  'addOnPreRun',
  'addOnInit',
  'addOnPreMain',
  'addOnExit',
  'addOnPostRun',
  'addRunDependency',
  'removeRunDependency',
  'FS_createFolder',
  'FS_createPath',
  'FS_createDataFile',
  'FS_createPreloadedFile',
  'FS_createLazyFile',
  'FS_createLink',
  'FS_createDevice',
  'FS_unlink',
  'getLEB',
  'getFunctionTables',
  'alignFunctionTables',
  'registerFunctions',
  'prettyPrint',
  'getCompilerSetting',
  'out',
  'err',
  'callMain',
  'abort',
  'keepRuntimeAlive',
  'wasmMemory',
  'stackAlloc',
  'stackSave',
  'stackRestore',
  'getTempRet0',
  'setTempRet0',
  'writeStackCookie',
  'checkStackCookie',
  'ptrToString',
  'zeroMemory',
  'exitJS',
  'getHeapMax',
  'abortOnCannotGrowMemory',
  'emscripten_realloc_buffer',
  'ENV',
  'ERRNO_CODES',
  'ERRNO_MESSAGES',
  'setErrNo',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'DNS',
  'getHostByName',
  'Protocols',
  'Sockets',
  'getRandomDevice',
  'warnOnce',
  'traverseStack',
  'UNWIND_CACHE',
  'convertPCtoSourceLocation',
  'readEmAsmArgsArray',
  'readEmAsmArgs',
  'runEmAsmFunction',
  'runMainThreadEmAsm',
  'jstoi_q',
  'jstoi_s',
  'getExecutableName',
  'listenOnce',
  'autoResumeAudioContext',
  'dynCallLegacy',
  'getDynCaller',
  'dynCall',
  'handleException',
  'runtimeKeepalivePush',
  'runtimeKeepalivePop',
  'callUserCallback',
  'maybeExit',
  'safeSetTimeout',
  'asmjsMangle',
  'asyncLoad',
  'alignMemory',
  'mmapAlloc',
  'handleAllocator',
  'writeI53ToI64',
  'writeI53ToI64Clamped',
  'writeI53ToI64Signaling',
  'writeI53ToU64Clamped',
  'writeI53ToU64Signaling',
  'readI53FromI64',
  'readI53FromU64',
  'convertI32PairToI53',
  'convertI32PairToI53Checked',
  'convertU32PairToI53',
  'getCFunc',
  'cwrap',
  'uleb128Encode',
  'sigToWasmTypes',
  'generateFuncType',
  'convertJsFunctionToWasm',
  'freeTableIndexes',
  'functionsInTableMap',
  'getEmptyTableSlot',
  'updateTableMap',
  'addFunction',
  'removeFunction',
  'reallyNegative',
  'unSign',
  'strLen',
  'reSign',
  'formatString',
  'setValue',
  'getValue',
  'intArrayFromString',
  'intArrayToString',
  'AsciiToString',
  'stringToAscii',
  'UTF16Decoder',
  'UTF16ToString',
  'stringToUTF16',
  'lengthBytesUTF16',
  'UTF32ToString',
  'stringToUTF32',
  'lengthBytesUTF32',
  'allocateUTF8',
  'allocateUTF8OnStack',
  'writeStringToMemory',
  'writeArrayToMemory',
  'writeAsciiToMemory',
  'SYSCALLS',
  'getSocketFromFD',
  'getSocketAddress',
  'JSEvents',
  'registerKeyEventCallback',
  'specialHTMLTargets',
  'maybeCStringToJsString',
  'findEventTarget',
  'findCanvasEventTarget',
  'getBoundingClientRect',
  'fillMouseEventData',
  'registerMouseEventCallback',
  'registerWheelEventCallback',
  'registerUiEventCallback',
  'registerFocusEventCallback',
  'fillDeviceOrientationEventData',
  'registerDeviceOrientationEventCallback',
  'fillDeviceMotionEventData',
  'registerDeviceMotionEventCallback',
  'screenOrientation',
  'fillOrientationChangeEventData',
  'registerOrientationChangeEventCallback',
  'fillFullscreenChangeEventData',
  'registerFullscreenChangeEventCallback',
  'JSEvents_requestFullscreen',
  'JSEvents_resizeCanvasForFullscreen',
  'registerRestoreOldStyle',
  'hideEverythingExceptGivenElement',
  'restoreHiddenElements',
  'setLetterbox',
  'currentFullscreenStrategy',
  'restoreOldWindowedStyle',
  'softFullscreenResizeWebGLRenderTarget',
  'doRequestFullscreen',
  'fillPointerlockChangeEventData',
  'registerPointerlockChangeEventCallback',
  'registerPointerlockErrorEventCallback',
  'requestPointerLock',
  'fillVisibilityChangeEventData',
  'registerVisibilityChangeEventCallback',
  'registerTouchEventCallback',
  'fillGamepadEventData',
  'registerGamepadEventCallback',
  'registerBeforeUnloadEventCallback',
  'fillBatteryEventData',
  'battery',
  'registerBatteryEventCallback',
  'setCanvasElementSize',
  'getCanvasElementSize',
  'demangle',
  'demangleAll',
  'jsStackTrace',
  'stackTrace',
  'ExitStatus',
  'getEnvStrings',
  'checkWasiClock',
  'doReadv',
  'doWritev',
  'dlopenMissingError',
  'createDyncallWrapper',
  'setImmediateWrapped',
  'clearImmediateWrapped',
  'polyfillSetImmediate',
  'promiseMap',
  'newNativePromise',
  'getPromise',
  'uncaughtExceptionCount',
  'exceptionLast',
  'exceptionCaught',
  'ExceptionInfo',
  'exception_addRef',
  'exception_decRef',
  'Browser',
  'setMainLoop',
  'wget',
  'MEMFS',
  'TTY',
  'PIPEFS',
  'SOCKFS',
  '_setNetworkCallback',
  'tempFixedLengthArray',
  'miniTempWebGLFloatBuffers',
  'heapObjectForWebGLType',
  'heapAccessShiftForWebGLHeap',
  'GL',
  'emscriptenWebGLGet',
  'computeUnpackAlignedImageSize',
  'emscriptenWebGLGetTexPixelData',
  'emscriptenWebGLGetUniform',
  'webglGetUniformLocation',
  'webglPrepareUniformLocationsBeforeFirstUse',
  'webglGetLeftBracePos',
  'emscriptenWebGLGetVertexAttrib',
  'writeGLArray',
  'AL',
  'SDL_unicode',
  'SDL_ttfContext',
  'SDL_audio',
  'SDL',
  'SDL_gfx',
  'GLUT',
  'EGL',
  'GLFW_Window',
  'GLFW',
  'GLEW',
  'IDBStore',
  'runAndAbortIfError',
  'Asyncify',
  'Fibers',
  'ALLOC_NORMAL',
  'ALLOC_STACK',
  'allocate',
];
unexportedRuntimeSymbols.forEach(unexportedRuntimeSymbol);
var missingLibrarySymbols = [
  'exitJS',
  'emscripten_realloc_buffer',
  'setErrNo',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'getHostByName',
  'traverseStack',
  'convertPCtoSourceLocation',
  'readEmAsmArgs',
  'runEmAsmFunction',
  'runMainThreadEmAsm',
  'jstoi_q',
  'jstoi_s',
  'getExecutableName',
  'listenOnce',
  'autoResumeAudioContext',
  'dynCallLegacy',
  'getDynCaller',
  'dynCall',
  'maybeExit',
  'asmjsMangle',
  'handleAllocator',
  'writeI53ToI64',
  'writeI53ToI64Clamped',
  'writeI53ToI64Signaling',
  'writeI53ToU64Clamped',
  'writeI53ToU64Signaling',
  'readI53FromI64',
  'readI53FromU64',
  'convertI32PairToI53',
  'convertU32PairToI53',
  'cwrap',
  'uleb128Encode',
  'generateFuncType',
  'convertJsFunctionToWasm',
  'getEmptyTableSlot',
  'updateTableMap',
  'addFunction',
  'removeFunction',
  'reallyNegative',
  'unSign',
  'strLen',
  'reSign',
  'formatString',
  'intArrayToString',
  'AsciiToString',
  'stringToAscii',
  'UTF16ToString',
  'stringToUTF16',
  'lengthBytesUTF16',
  'UTF32ToString',
  'stringToUTF32',
  'lengthBytesUTF32',
  'allocateUTF8',
  'allocateUTF8OnStack',
  'writeStringToMemory',
  'writeAsciiToMemory',
  'getSocketFromFD',
  'getSocketAddress',
  'registerKeyEventCallback',
  'maybeCStringToJsString',
  'findEventTarget',
  'findCanvasEventTarget',
  'getBoundingClientRect',
  'fillMouseEventData',
  'registerMouseEventCallback',
  'registerWheelEventCallback',
  'registerUiEventCallback',
  'registerFocusEventCallback',
  'fillDeviceOrientationEventData',
  'registerDeviceOrientationEventCallback',
  'fillDeviceMotionEventData',
  'registerDeviceMotionEventCallback',
  'screenOrientation',
  'fillOrientationChangeEventData',
  'registerOrientationChangeEventCallback',
  'fillFullscreenChangeEventData',
  'registerFullscreenChangeEventCallback',
  'JSEvents_requestFullscreen',
  'JSEvents_resizeCanvasForFullscreen',
  'registerRestoreOldStyle',
  'hideEverythingExceptGivenElement',
  'restoreHiddenElements',
  'setLetterbox',
  'softFullscreenResizeWebGLRenderTarget',
  'doRequestFullscreen',
  'fillPointerlockChangeEventData',
  'registerPointerlockChangeEventCallback',
  'registerPointerlockErrorEventCallback',
  'requestPointerLock',
  'fillVisibilityChangeEventData',
  'registerVisibilityChangeEventCallback',
  'registerTouchEventCallback',
  'fillGamepadEventData',
  'registerGamepadEventCallback',
  'registerBeforeUnloadEventCallback',
  'fillBatteryEventData',
  'battery',
  'registerBatteryEventCallback',
  'setCanvasElementSize',
  'getCanvasElementSize',
  'jsStackTrace',
  'stackTrace',
  'getEnvStrings',
  'checkWasiClock',
  'createDyncallWrapper',
  'setImmediateWrapped',
  'clearImmediateWrapped',
  'polyfillSetImmediate',
  'newNativePromise',
  'getPromise',
  'ExceptionInfo',
  'exception_addRef',
  'exception_decRef',
  'setMainLoop',
  '_setNetworkCallback',
  'heapObjectForWebGLType',
  'heapAccessShiftForWebGLHeap',
  'emscriptenWebGLGet',
  'computeUnpackAlignedImageSize',
  'emscriptenWebGLGetTexPixelData',
  'emscriptenWebGLGetUniform',
  'webglGetUniformLocation',
  'webglPrepareUniformLocationsBeforeFirstUse',
  'webglGetLeftBracePos',
  'emscriptenWebGLGetVertexAttrib',
  'writeGLArray',
  'SDL_unicode',
  'SDL_ttfContext',
  'SDL_audio',
  'GLFW_Window',
  'ALLOC_NORMAL',
  'ALLOC_STACK',
  'allocate',
];
missingLibrarySymbols.forEach(missingLibrarySymbol)


var calledRun;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

/** @type {function(Array=)} */
function run(args) {
  args = args || arguments_;

  if (runDependencies > 0) {
    return;
  }

    stackCheckInit();

  preRun();

  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    return;
  }

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    readyPromiseResolve(Module);
    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
  checkStackCookie();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = (x) => {
    has = true;
  }
  try { // it doesn't matter if it fails
    _fflush(0);
    // also flush in the JS FS layer
    ['stdout', 'stderr'].forEach(function(name) {
      var info = FS.analyzePath('/dev/' + name);
      if (!info) return;
      var stream = info.object;
      var rdev = stream.rdev;
      var tty = TTY.ttys[rdev];
      if (tty && tty.output && tty.output.length) {
        has = true;
      }
    });
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.');
  }
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

run();





  return _createMicropythonModule.ready
}
);
})();
if (typeof exports === 'object' && typeof module === 'object')
  module.exports = _createMicropythonModule;
else if (typeof define === 'function' && define['amd'])
  define([], function() { return _createMicropythonModule; });
else if (typeof exports === 'object')
  exports["_createMicropythonModule"] = _createMicropythonModule;
!function(e,t){"use strict";"function"==typeof define&&define.amd?define("stackframe",[],t):"object"==typeof exports?module.exports=t():e.StackFrame=t()}(globalThis,function(){"use strict";function e(e){return e.charAt(0).toUpperCase()+e.substring(1)}function t(e){return function(){return this[e]}}var r=["isConstructor","isEval","isNative","isToplevel"],n=["columnNumber","lineNumber"],i=["fileName","functionName","source"],a=r.concat(n,i,["args"],["evalOrigin"]);function o(t){if(t)for(var r=0;r<a.length;r++)void 0!==t[a[r]]&&this["set"+e(a[r])](t[a[r]])}o.prototype={getArgs:function(){return this.args},setArgs:function(e){if("[object Array]"!==Object.prototype.toString.call(e))throw new TypeError("Args must be an Array");this.args=e},getEvalOrigin:function(){return this.evalOrigin},setEvalOrigin:function(e){if(e instanceof o)this.evalOrigin=e;else{if(!(e instanceof Object))throw new TypeError("Eval Origin must be an Object or StackFrame");this.evalOrigin=new o(e)}},toString:function(){var e=this.getFileName()||"",t=this.getLineNumber()||"",r=this.getColumnNumber()||"",n=this.getFunctionName()||"";return this.getIsEval()?e?"[eval] ("+e+":"+t+":"+r+")":"[eval]:"+t+":"+r:n?n+" ("+e+":"+t+":"+r+")":e+":"+t+":"+r}},o.fromString=function(e){var t=e.indexOf("("),r=e.lastIndexOf(")"),n=e.substring(0,t),i=e.substring(t+1,r).split(","),a=e.substring(r+1);if(0===a.indexOf("@"))var s=/@(.+?)(?::(\d+))?(?::(\d+))?$/.exec(a,""),c=s[1],u=s[2],f=s[3];return new o({functionName:n,args:i||void 0,fileName:c,lineNumber:u||void 0,columnNumber:f||void 0})};for(var s=0;s<r.length;s++)o.prototype["get"+e(r[s])]=t(r[s]),o.prototype["set"+e(r[s])]=function(e){return function(t){this[e]=Boolean(t)}}(r[s]);for(var c=0;c<n.length;c++)o.prototype["get"+e(n[c])]=t(n[c]),o.prototype["set"+e(n[c])]=function(e){return function(t){if(r=t,isNaN(parseFloat(r))||!isFinite(r))throw new TypeError(e+" must be a Number");var r;this[e]=Number(t)}}(n[c]);for(var u=0;u<i.length;u++)o.prototype["get"+e(i[u])]=t(i[u]),o.prototype["set"+e(i[u])]=function(e){return function(t){this[e]=String(t)}}(i[u]);return o}),function(e,t){"use strict";"function"==typeof define&&define.amd?define("error-stack-parser",["stackframe"],t):"object"==typeof exports?module.exports=t(require("stackframe")):e.ErrorStackParser=t(e.StackFrame)}(globalThis,function(e){"use strict";var t=/(^|@)\S+:\d+/,r=/^\s*at .*(\S+:\d+|\(native\))/m,n=/^(eval@)?(\[native code])?$/;return{parse:function(e){if(void 0!==e.stacktrace||void 0!==e["opera#sourceloc"])return this.parseOpera(e);if(e.stack&&e.stack.match(r))return this.parseV8OrIE(e);if(e.stack)return this.parseFFOrSafari(e);throw new Error("Cannot parse given Error object")},extractLocation:function(e){if(-1===e.indexOf(":"))return[e];var t=/(.+?)(?::(\d+))?(?::(\d+))?$/.exec(e.replace(/[()]/g,""));return[t[1],t[2]||void 0,t[3]||void 0]},parseV8OrIE:function(t){return t.stack.split("\n").filter(function(e){return!!e.match(r)},this).map(function(t){t.indexOf("(eval ")>-1&&(t=t.replace(/eval code/g,"eval").replace(/(\(eval at [^()]*)|(,.*$)/g,""));var r=t.replace(/^\s+/,"").replace(/\(eval code/g,"(").replace(/^.*?\s+/,""),n=r.match(/ (\(.+\)$)/);r=n?r.replace(n[0],""):r;var i=this.extractLocation(n?n[1]:r),a=n&&r||void 0,o=["eval","<anonymous>"].indexOf(i[0])>-1?void 0:i[0];return new e({functionName:a,fileName:o,lineNumber:i[1],columnNumber:i[2],source:t})},this)},parseFFOrSafari:function(t){return t.stack.split("\n").filter(function(e){return!e.match(n)},this).map(function(t){if(t.indexOf(" > eval")>-1&&(t=t.replace(/ line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g,":$1")),-1===t.indexOf("@")&&-1===t.indexOf(":"))return new e({functionName:t});var r=/((.*".+"[^@]*)?[^@]*)(?:@)/,n=t.match(r),i=n&&n[1]?n[1]:void 0,a=this.extractLocation(t.replace(r,""));return new e({functionName:i,fileName:a[0],lineNumber:a[1],columnNumber:a[2],source:t})},this)},parseOpera:function(e){return!e.stacktrace||e.message.indexOf("\n")>-1&&e.message.split("\n").length>e.stacktrace.split("\n").length?this.parseOpera9(e):e.stack?this.parseOpera11(e):this.parseOpera10(e)},parseOpera9:function(t){for(var r=/Line (\d+).*script (?:in )?(\S+)/i,n=t.message.split("\n"),i=[],a=2,o=n.length;a<o;a+=2){var s=r.exec(n[a]);s&&i.push(new e({fileName:s[2],lineNumber:s[1],source:n[a]}))}return i},parseOpera10:function(t){for(var r=/Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i,n=t.stacktrace.split("\n"),i=[],a=0,o=n.length;a<o;a+=2){var s=r.exec(n[a]);s&&i.push(new e({functionName:s[3]||void 0,fileName:s[2],lineNumber:s[1],source:n[a]}))}return i},parseOpera11:function(r){return r.stack.split("\n").filter(function(e){return!!e.match(t)&&!e.match(/^Error created at/)},this).map(function(t){var r,n=t.split("@"),i=this.extractLocation(n.pop()),a=n.shift()||"",o=a.replace(/<anonymous function(: (\w+))?>/,"$2").replace(/\([^)]*\)/g,"")||void 0;a.match(/\(([^)]*)\)/)&&(r=a.replace(/^[^(]+\(([^)]*)\)$/,"$1"));var s=void 0===r||"[arguments not available]"===r?void 0:r.split(",");return new e({functionName:o,args:s,fileName:i[0],lineNumber:i[1],columnNumber:i[2],source:t})},this)}}});
async function loadMicroPython(options) {
  /**
   * A proxy around globals that falls back to checking for a builtin if has or
   * get fails to find a global with the given key. Note that this proxy is
   * transparent to js2python: it won't notice that this wrapper exists at all and
   * will translate this proxy to the globals dictionary.
   * @private
   */
  function wrapPythonGlobals(globals_dict, builtins_dict) {
    return new Proxy(globals_dict, {
      get(target, symbol) {
        if (symbol === "get") {
          return (key) => {
            let result = target.get(key);
            if (result === undefined) {
              result = builtins_dict.get(key);
            }
            return result;
          };
        }
        if (symbol === "has") {
          return (key) => target.has(key) || builtins_dict.has(key);
        }
        return Reflect.get(target, symbol);
      },
    });
  }

  /**
   *  If indexURL isn't provided, throw an error and catch it and then parse our
   *  file name out from the stack trace.
   *
   *  Question: But getting the URL from error stack trace is well... really
   *  hacky. Can't we use
   *  [`document.currentScript`](https://developer.mozilla.org/en-US/docs/Web/API/Document/currentScript)
   *  or
   *  [`import.meta.url`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import.meta)
   *  instead?
   *
   *  Answer: `document.currentScript` works for the browser main thread.
   *  `import.meta` works for es6 modules. In a classic webworker, I think there
   *  is no approach that works. Also we would need some third approach for node
   *  when loading a commonjs module using `require`. On the other hand, this
   *  stack trace approach works for every case without any feature detection
   *  code.
   */
  function calculateIndexURL() {
    if (typeof __dirname === "string") {
      return __dirname;
    }
    let err;
    try {
      throw new Error();
    } catch (e) {
      err = e;
    }
    let fileName = ErrorStackParser.parse(err)[0].fileName;
    const indexOfLastSlash = fileName.lastIndexOf("/");
    if (indexOfLastSlash === -1) {
      throw new Error("Could not extract indexURL path from module location");
    }
    return fileName.slice(0, indexOfLastSlash + 1);
  }
  let { heapsize, indexURL, stdin, stdout, stderr } = Object.assign(
    { heapsize: 1024 * 1024 },
    options
  );
  if (indexURL === undefined) {
    indexURL = calculateIndexURL();
  }
  const Module = {};
  const moduleLoaded = new Promise((r) => (Module.postRun = r));

  Module.locateFile = (path) => indexURL + path;
  _createMicropythonModule(Module);
  await moduleLoaded;
  Module.locateFile = (path) => {
    throw new Error("Didn't expect to load any more file_packager files!");
  };
  Module._mp_js_init(heapsize);
  const API = Module.API;
  function bootstrap_pyimport(name) {
    const nameid = Module.hiwire.new_value(name);
    const proxy_id = Module._pyimport(nameid);
    Module.hiwire.decref(nameid);
    API.throw_if_error();
    return Module.hiwire.pop_value(proxy_id);
  }

  API.initializeStreams(stdin, stdout, stderr);

  const main = bootstrap_pyimport("__main__");
  const main_dict = main.__dict__;
  const builtins = bootstrap_pyimport("builtins");
  const builtins_dict = builtins.__dict__;
  const globals = wrapPythonGlobals(main_dict, builtins_dict);
  builtins.destroy();
  main.destroy();

  const dict = globals.get("dict");
  const tmp_dict = dict();
  dict.destroy();

  const pyexec = globals.get("exec");
  function bootstrap_runPython(code) {
    pyexec(code, tmp_dict);
  }

  bootstrap_runPython("import sys");
  bootstrap_runPython("sys.path.append('/lib')");

  const importlib = bootstrap_pyimport("importlib");
  function pyimport(mod) {
    return importlib.import_module(mod);
  }
  bootstrap_runPython(
    "def register_js_module(name, mod): sys.modules[name] = mod"
  );
  const register_js_module = tmp_dict.get("register_js_module");
  tmp_dict.destroy();

  let eval_code;

  function runPython(code, { globals, locals } = {}) {
    eval_code(code, globals, locals);
  }

  function registerJsModule(name, mod) {
    register_js_module(name, mod);
  }
  const {setStdin, setStdout, setStderr} = API;
  const public_api = {
    _module: Module,
    FS: Module.FS,
    runPython,
    pyimport,
    globals,
    registerJsModule,
    setStdin, 
    setStdout, 
    setStderr,
    registerComlink(comlink) {},
  };
  registerJsModule("js", globalThis);
  registerJsModule("pyodide_js", public_api);
  eval_code = pyimport("pyodide.code").eval_code;

  return public_api;
}
globalThis.loadMicroPython = loadMicroPython;
