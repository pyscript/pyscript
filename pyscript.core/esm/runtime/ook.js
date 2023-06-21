import { fetchPaths, stdio } from "./_utils.js";
import {
    runAsync,
    runEvent,
    runWorker,
    runWorkerAsync,
    writeFile,
} from "./_python.js";

const type = "ook";

const ookCode = `# From https://github.com/kade-robertson/pythook

def tobf(s):
    s = s.replace('\\n'," ").replace('\\r\\n'," ")
    i = iter(s.split(' '))
    s = ''.join(map(' '.join,(zip(i,i))))
    s = s.replace("Ook. Ook?", ">")
    s = s.replace("Ook? Ook.", "<")
    s = s.replace("Ook. Ook.", "+")
    s = s.replace("Ook! Ook!", "-")
    s = s.replace("Ook! Ook.", ".")
    s = s.replace("Ook. Ook!", ",")
    s = s.replace("Ook! Ook?", "[")
    s = s.replace("Ook? Ook!", "]")
    return s

def runOok(program):
    program = tobf(program)
    try:
        d={'>':'p+=1\\n','<':'p-=1\\n','+':'n[p]+=1\\n','-':'n[p]-=1\\n','.':'print(chr(n[p]),end="")\\n',',':'n[p]=raw_input()\\n','[':'while n[p]:\\n',']':''}
        s='n=[0]*32768\\np=0\\n'
        i=0
        index_track = 0
        for index, c in enumerate(program):
            index_track = index
            s += ' '*i + d[c]
            if c=='[': i+=1
            if c==']': i-=1; s += '\\r'
        exec(s)
    except Exception as err:
        print(f"Unable to process program! at {index_track=}")
        print(f"{s=}")
        print(err)
    print("")
`;

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
export default {
    type: [type, "ok"],
    module: (version = "0.22.1") =>
        `https://cdn.jsdelivr.net/pyodide/v${version}/full/pyodide.mjs`,
    async engine({ loadPyodide }, config) {
        const { stderr, stdout, get } = stdio();
        const runtime = await get(loadPyodide({ stderr, stdout }));
        if (config.fetch) await fetchPaths(this, runtime, config.fetch);
        if (config.packages) {
            await runtime.loadPackage("micropip");
            const micropip = await runtime.pyimport("micropip");
            await micropip.install(config.packages);
            micropip.destroy();
        }
        return runtime;
    },
    run: (runtime, code) => {
        runtime.runPython(ookCode);
        runtime.runPython(`runOok("""${code.trim()}""")`);
    },
    runAsync,
    runEvent: (runtime, code) => {
        runtime.runPython(ookCode);
        runtime.runPython(`runOok("""${code.trim()}""")`);
    },
    runWorker,
    runWorkerAsync,
    writeFile,
};
/* c8 ignore stop */
