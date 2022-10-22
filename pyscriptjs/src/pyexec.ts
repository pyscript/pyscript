import { ensureUniqueId } from './utils';
import type { Runtime } from './runtime';

type OutputMode = "append" | "replace";

export async function pyExec(runtime: Runtime, pysrc: string, out: HTMLElement)
{
    // this is the python function defined in pyscript.py
    const set_current_display_target = runtime.globals.get('set_current_display_target');
    ensureUniqueId(out);
    set_current_display_target(out.id);
    try {
        await runtime.run(pysrc);
    }
    finally {
        set_current_display_target(undefined);
    }
}
