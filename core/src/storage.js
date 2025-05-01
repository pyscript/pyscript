import IDBMapSync from "@webreflection/idb-map/sync";
import { parse, stringify } from "flatted";

const { isView } = ArrayBuffer;

const to_idb = (value) => {
    if (value == null) return stringify(["null", 0]);
    /* eslint-disable no-fallthrough */
    switch (typeof value) {
        case "object": {
            if (isView(value)) return stringify(["memoryview", [...value]]);
            if (value instanceof ArrayBuffer)
                return stringify(["bytearray", [...new Uint8Array(value)]]);
        }
        case "string":
        case "number":
        case "boolean":
            return stringify(["generic", value]);
        default:
            throw new TypeError(`Unexpected value: ${String(value)}`);
    }
};

const from_idb = (value) => {
    const [kind, result] = parse(value);
    if (kind === "null") return null;
    if (kind === "generic") return result;
    if (kind === "bytearray") return new Uint8Array(value).buffer;
    if (kind === "memoryview") return new Uint8Array(value);
    return value;
};

// this export simulate pyscript.storage exposed in the Python world
export const storage = async (name) => {
    if (!name) throw new SyntaxError("The storage name must be defined");

    const store = new IDBMapSync(`@pyscript/${name}`);
    const map = new Map();
    await store.sync();
    for (const [k, v] of store.entries()) map.set(k, from_idb(v));

    const clear = () => {
        map.clear();
        store.clear();
    };

    const sync = async () => {
        await store.sync();
    };

    return new Proxy(map, {
        ownKeys: (map) => [...map.keys()],
        has: (map, name) => map.has(name),
        get: (map, name) => {
            if (name === "clear") return clear;
            if (name === "sync") return sync;
            return map.get(name);
        },
        set: (map, name, value) => {
            map.set(name, value);
            store.set(name, to_idb(value));
            return true;
        },
        deleteProperty: (map, name) => {
            if (map.has(name)) {
                map.delete(name);
                store.delete(name);
            }
            return true;
        },
    });
};
