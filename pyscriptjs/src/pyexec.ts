import type { Runtime } from './runtime';

type OutputMode = "append" | "replace";

export async function pyExec(runtime: Runtime, pysrc: string, targetID: string)
{
    try {
        <string>await runtime.run(`set_current_display_target(target_id="${targetID}")`);
        <string>await runtime.run(pysrc);
    }
    finally {
        <string>await runtime.run(`set_current_display_target(target_id=None)`);
    }
}
