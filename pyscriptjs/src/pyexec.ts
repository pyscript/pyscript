import type { Runtime } from './runtime';

type OutputMode = "append" | "replace";

export async function pyExec(runtime: Runtime, pysrc: string, targetID: string)
{
    try {
        await runtime.run(`set_current_display_target(target_id="${targetID}")`);
        await runtime.run(pysrc);
    }
    finally {
        await runtime.run(`set_current_display_target(target_id=None)`);
    }
}
