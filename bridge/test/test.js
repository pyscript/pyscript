import bridge from "https://esm.run/@pyscript/bridge";

// for local testing purpose only
const { searchParams } = new URL(location.href);

// the named (or default) export for test.py
export const ffi = bridge(import.meta.url, {
  type: searchParams.get("type") || "mpy",
  worker: searchParams.has("worker"),
  config: searchParams.has("config") ?
    ({
      files: {
        "./sys_version.py": "./sys_version.py",
      },
    }) : undefined,
});
