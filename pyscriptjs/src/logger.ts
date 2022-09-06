/* Very simple logger interface.

   Each module is expected to create its own logger by doing e.g.:

       const logger = getLogger('my-prefix');

   and then use it instead of console:

       logger.info('hello', 'world');
       logger.warn('...');
       logger.error('...');

   The logger automatically adds the prefix "[my-prefix]" to all logs; so e.g., the
   above call would print:

       [my-prefix] hello world

   logger.log is intentionally omitted. The idea is that PyScript should not
   write anything to console.log, to leave it free for the user.

   Currently, the logger does not to anything more than that. In the future,
   we might want to add additional features such as the ability to
   enable/disable logs on a global or per-module basis.
*/

interface Logger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}

const _cache = new Map<string, Logger>();

function getLogger(prefix: string): Logger {
    let logger = _cache.get(prefix);
    if (logger === undefined) {
        logger = _makeLogger(prefix);
        _cache.set(prefix, logger);
    }
    return logger;
}

function _makeLogger(prefix: string): Logger {
    prefix = "[" + prefix + "] ";

    function make(level: string) {
        const out_fn = console[level].bind(console);
        function fn(fmt: string, ...args: any[]) {
            out_fn(prefix + fmt, ...args);
        }
        return fn
    }

    // 'log' is intentionally omitted
    const debug = make('debug');
    const info = make('info');
    const warn = make('warn');
    const error = make('error');

    return {debug, info, warn, error};
}

export { getLogger };
