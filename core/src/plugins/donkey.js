import { assign, dedent } from "polyscript/exports";

const invoke = (name, args) => `${name}(code, ${args.join(', ')})`;

export default (options = {}) => {
  const type = options.type || 'py';
  const args = options.persistent ? ['globals()', '__locals__'] : ['{}', '{}'];
  const src = URL.createObjectURL(new Blob([
    dedent(`
      from pyscript import sync, config
      __message__ = lambda e,v: f"\x1b[31m\x1b[1m{e.__name__}\x1b[0m: {v}"
      __locals__ = {}
      if config["type"] == "py":
        import sys
        def __error__(_):
          info = sys.exc_info()
          return __message__(info[0], info[1])
      else:
        __error__ = lambda e: __message__(e.__class__, e.value)
      def execute(code):
        try: return ${invoke('exec', args)};
        except Exception as e: print(__error__(e));
      def evaluate(code):
        try: return ${invoke('eval', args)};
        except Exception as e: print(__error__(e));
      sync.execute = execute
      sync.evaluate = evaluate
    `)
  ]));

  const script = assign(document.createElement('script'), { type, src });

  script.toggleAttribute('worker', true);
  script.toggleAttribute('terminal', true);
  if (options.terminal) script.setAttribute('target', options.terminal);
  if (options.config) script.setAttribute('config', JSON.stringify(options.config));

  return new Promise(resolve => {
    script.addEventListener(`${type}:done`, event => {
      event.stopPropagation();
      URL.revokeObjectURL(src);
      const { xworker, process, terminal } = script;
      const { execute, evaluate } = xworker.sync;
      script.remove();
      resolve({
        process,
        execute: code => execute(dedent(code)),
        evaluate: code => evaluate(dedent(code)),
        clear: () => terminal.clear(),
        reset: () => terminal.reset(),
        kill: () => {
          xworker.terminate();
          terminal.dispose();
        },
      });
    });
    document.body.append(script);
  });
};
