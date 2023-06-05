const e = (e, t = document) => [...t.querySelectorAll(e)],
    t = (e, t = document) => {
        const r = new XPathEvaluator()
                .createExpression(e)
                .evaluate(t, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE),
            n = [];
        for (let e = 0, { snapshotLength: t } = r; e < t; e++)
            n.push(r.snapshotItem(e));
        return n;
    };
const { isArray: r } = Array,
    { assign: n, create: o, defineProperty: s } = Object,
    { all: a, resolve: i } = new Proxy(Promise, {
        get: (e, t) => e[t].bind(e),
    }),
    c = (e, t = location.href) => new URL(e, t).href,
    u = (e) => e.arrayBuffer(),
    l = (e) => e.json(),
    p = (e) => e.text();
var h = (...e) =>
    function (t, r) {
        const o = new Worker(
                URL.createObjectURL(
                    new Blob(
                        [
                            'const e=e=>e.arrayBuffer(),t=e=>e.json(),r=e=>e.text(),{isArray:n}=Array,{all:o,resolve:s}=new Proxy(Promise,{get:(e,t)=>e[t].bind(e)}),a=(e,t=location.href)=>new URL(e,t).href,i=new WeakMap,c=e=>{const t=e||console,r={stderr:(t.stderr||console.error).bind(t),stdout:(t.stdout||console.log).bind(t)};return{stderr:(...e)=>r.stderr(...e),stdout:(...e)=>(console.log(r.stdout),r.stdout(...e)),async get(e){const t=await e;return i.set(t,r),t}}},u=(e,t,r)=>{const{parentPath:n,name:o}=e.analyzePath(t,!0);return e.mkdirTree(n),e.writeFile([n,o].join("/"),new Uint8Array(r),{canOwn:!0})},l=e=>{const t=e.split("/");return t.pop(),t.join("/")},d=(e,t)=>{const r=[];for(const n of t.split("/"))r.push(n),n&&e.mkdir(r.join("/"))},p=(e,t)=>{const r=[];for(const e of t.split("/"))switch(e){case"":case".":break;case"..":r.pop();break;default:r.push(e)}return[e.cwd()].concat(r).join("/").replace(/^\\/+/,"/")},h=e=>{const t=e.map((e=>e.trim().replace(/(^[/]*|[/]*$)/g,""))).filter((e=>""!==e&&"."!==e)).join("/");return e[0].startsWith("/")?`/${t}`:t},w=new WeakMap,f=(t,r,s)=>o((e=>{for(const{files:t,to_file:r,from:n=""}of e){if(void 0!==t&&void 0!==r)throw new Error("Cannot use \'to_file\' and \'files\' parameters together!");if(void 0===t&&void 0===r&&n.endsWith("/"))throw new Error(`Couldn\'t determine the filename from the path ${n}, please supply \'to_file\' parameter.`)}return e.flatMap((({from:e="",to_folder:t=".",to_file:r,files:o})=>{if(n(o))return o.map((r=>({url:h([e,r]),path:h([t,r])})));const s=r||e.slice(1+e.lastIndexOf("/"));return[{url:e,path:h([t,s])}]}))})(s).map((({url:n,path:o})=>((e,t)=>fetch(a(t,w.get(e))))(s,n).then(e).then((e=>t.writeFile(r,o,e)))))),y=e=>function(t,r,n){return globalThis.xworker=n,this[e](t,`from js import xworker;${r}`)};var m={type:["micropython","mpy"],module:()=>"http://localhost:8080/micropython/micropython.mjs",async engine({loadMicroPython:e},t,r){const{stderr:n,stdout:o,get:s}=c();r=r.replace(/\\.m?js$/,".wasm");const a=await s(e({stderr:n,stdout:o,url:r}));return t.fetch&&await f(this,a,t.fetch),a},run:(e,t)=>e.runPython(t),runAsync:(e,t)=>e.runPythonAsync(t),runEvent(e,t,r){return this.run(e,`import js;event=js.__events.get(${r});${t}`)},runWorker:y("run"),runWorkerAsync:y("runAsync"),writeFile:({FS:e},t,r)=>u(e,t,r)};const g=e=>function(t,r,n){return globalThis.xworker=n,this[e](t,`from js import xworker;${r}`)};var v={type:["pyodide","py"],module:(e="0.22.1")=>`https://cdn.jsdelivr.net/pyodide/v${e}/full/pyodide.mjs`,async engine({loadPyodide:e},t){const{stderr:r,stdout:n,get:o}=c(),s=await o(e({stderr:r,stdout:n}));if(t.fetch&&await f(this,s,t.fetch),t.packages){await s.loadPackage("micropip");const e=await s.pyimport("micropip");await e.install(t.packages),e.destroy()}return s},run:(e,t)=>e.runPython(t),runAsync:(e,t)=>e.runPythonAsync(t),runEvent(e,t,r){return this.run(e,`import js;event=js.__events.get(${r});${t}`)},runWorker:g("run"),runWorkerAsync:g("runAsync"),writeFile:({FS:e},t,r)=>u(e,t,r)};const k="ruby",b=e=>function(t,r,n){return globalThis.xworker=n,this[e](t,`require "js";xworker=JS::eval("return xworker");${r}`)};var j={experimental:!0,type:[k,"rb"],module:(e="2.0.0")=>`https://cdn.jsdelivr.net/npm/ruby-3_2-wasm-wasi@${e}/dist/browser.esm.js`,async engine({DefaultRubyVM:e},t,r){const n=await fetch(`${r.slice(0,r.lastIndexOf("/"))}/ruby.wasm`),o=await WebAssembly.compile(await n.arrayBuffer()),{vm:s}=await e(o);return t.fetch&&await f(this,s,t.fetch),s},run:(e,t)=>e.eval(t),runAsync:(e,t)=>e.evalAsync(t),runEvent(e,t,r){return this.run(e,`require "js";event=JS::eval("return __events.get(${r})");${t}`)},runWorker:b("run"),runWorkerAsync:b("runAsync"),writeFile:()=>{throw new Error(`writeFile is not supported in ${k}`)}};const $=e=>function(t,r,n){return t.global.set("xworker",n),this[e](t,r)};var A={type:["wasmoon","lua"],module:(e="1.15.0")=>`https://cdn.jsdelivr.net/npm/wasmoon@${e}/+esm`,async engine({LuaFactory:e,LuaLibraries:t},r){const{stderr:n,stdout:o,get:s}=c(),a=await s((new e).createEngine());return a.global.getTable(t.Base,(e=>{a.global.setField(e,"print",o),a.global.setField(e,"printErr",n)})),r.fetch&&await f(this,a,r.fetch),a},run:(e,t)=>e.doStringSync(t),runAsync:(e,t)=>e.doString(t),runEvent(e,t,r){return e.global.set("event",globalThis.__events.get(r)),this.run(e,t)},runWorker:$("run"),runWorkerAsync:$("runAsync"),writeFile:({cmodule:{module:{FS:e}}},t,r)=>((e,t,r)=>(t=p(e,t),d(e,l(t)),e.writeFile(t,new Uint8Array(r),{canOwn:!0})))(e,t,r)};const x=new Map,W=new Map,F=new Proxy(new Map,{get(e,t){if(!e.has(t)){const[r,...n]=t.split("@"),o=x.get(r),s=/^https?:\\/\\//i.test(n)?n[0]:o.module(...n);e.set(t,{url:s,module:import(s),engine:o.engine.bind(o)})}const{url:r,module:n,engine:o}=e.get(t);return(e,s)=>n.then((n=>{W.set(t,e);const a=e?.fetch;return a&&w.set(a,s),o(n,e,r)}))}}),_=e=>{for(const t of[].concat(e.type))x.set(t,e)};for(const e of[m,v,j,A])_(e);const P=async e=>(await import("https://unpkg.com/basic-toml@0.3.1/es.js")).parse(e);let E,M,S;const T=(e,t)=>{addEventListener(e,t||(async t=>{const r=await E;S=t,M(r,`xworker.on${e}(xworker.event);`,L)}),!!t&&{once:!0})},L={onerror(){},onmessage(){},onmessageerror(){},postMessage:postMessage.bind(self),get event(){const e=S;if(!e)throw new Error("Unauthorized event access");return S=void 0,e}};T("message",(({data:{options:e,code:n}})=>{E=(async()=>{const{type:o,version:i,config:c,async:u}=e,l=await((e,n)=>{let o={};if(n)if(n.endsWith(".json"))o=fetch(n).then(t);else if(n.endsWith(".toml"))o=fetch(n).then(r).then(P);else{try{o=JSON.parse(n)}catch(e){o=P(n)}n=a("./config.txt")}return s(o).then((t=>F[e](t,n)))})(((e,t="")=>`${e}@${t}`.replace(/@$/,""))(o,i),c),d=x.get(o);return(M=d["runWorker"+(u?"Async":"")].bind(d))(l,n,globalThis.xworker=L),l})(),T("error"),T("message"),T("messageerror")}));\n',
                        ],
                        { type: "application/javascript" },
                    ),
                ),
                { type: "module" },
            ),
            { postMessage: a } = o;
        if (e.length) {
            const [t, o] = e;
            (r = n({}, r || { type: t, version: o })).type || (r.type = t);
        }
        r?.config && (r.config = c(r.config));
        const i = fetch(t)
            .then(p)
            .then((e) => a.call(o, { options: r, code: e }));
        return s(o, "postMessage", {
            value: (e, ...t) => i.then(() => a.call(o, e, ...t)),
        });
    };
const d = new WeakMap(),
    f = (e) => {
        const t = e || console,
            r = {
                stderr: (t.stderr || console.error).bind(t),
                stdout: (t.stdout || console.log).bind(t),
            };
        return {
            stderr: (...e) => r.stderr(...e),
            stdout: (...e) => (console.log(r.stdout), r.stdout(...e)),
            async get(e) {
                const t = await e;
                return d.set(t, r), t;
            },
        };
    },
    y = (e, t, r) => {
        const { parentPath: n, name: o } = e.analyzePath(t, !0);
        return (
            e.mkdirTree(n),
            e.writeFile([n, o].join("/"), new Uint8Array(r), { canOwn: !0 })
        );
    },
    m = (e) => {
        const t = e.split("/");
        return t.pop(), t.join("/");
    },
    w = (e, t) => {
        const r = [];
        for (const n of t.split("/")) r.push(n), n && e.mkdir(r.join("/"));
    },
    g = (e, t) => {
        const r = [];
        for (const e of t.split("/"))
            switch (e) {
                case "":
                case ".":
                    break;
                case "..":
                    r.pop();
                    break;
                default:
                    r.push(e);
            }
        return [e.cwd()].concat(r).join("/").replace(/^\/+/, "/");
    },
    v = (e) => {
        const t = e
            .map((e) => e.trim().replace(/(^[/]*|[/]*$)/g, ""))
            .filter((e) => "" !== e && "." !== e)
            .join("/");
        return e[0].startsWith("/") ? `/${t}` : t;
    },
    b = new WeakMap(),
    k = (e, t, n) =>
        a(
            ((e) => {
                for (const { files: t, to_file: r, from: n = "" } of e) {
                    if (void 0 !== t && void 0 !== r)
                        throw new Error(
                            "Cannot use 'to_file' and 'files' parameters together!",
                        );
                    if (void 0 === t && void 0 === r && n.endsWith("/"))
                        throw new Error(
                            `Couldn't determine the filename from the path ${n}, please supply 'to_file' parameter.`,
                        );
                }
                return e.flatMap(
                    ({
                        from: e = "",
                        to_folder: t = ".",
                        to_file: n,
                        files: o,
                    }) => {
                        if (r(o))
                            return o.map((r) => ({
                                url: v([e, r]),
                                path: v([t, r]),
                            }));
                        const s = n || e.slice(1 + e.lastIndexOf("/"));
                        return [{ url: e, path: v([t, s]) }];
                    },
                );
            })(n).map(({ url: r, path: o }) =>
                ((e, t) => fetch(c(t, b.get(e))))(n, r)
                    .then(u)
                    .then((r) => e.writeFile(t, o, r)),
            ),
        ),
    $ = (e) =>
        function (t, r, n) {
            return (
                (globalThis.xworker = n),
                this[e](t, `from js import xworker;${r}`)
            );
        };
var j = {
    type: ["micropython", "mpy"],
    module: () => "http://localhost:8080/micropython/micropython.mjs",
    async engine({ loadMicroPython: e }, t, r) {
        const { stderr: n, stdout: o, get: s } = f();
        r = r.replace(/\.m?js$/, ".wasm");
        const a = await s(e({ stderr: n, stdout: o, url: r }));
        return t.fetch && (await k(this, a, t.fetch)), a;
    },
    run: (e, t) => e.runPython(t),
    runAsync: (e, t) => e.runPythonAsync(t),
    runEvent(e, t, r) {
        return this.run(e, `import js;event=js.__events.get(${r});${t}`);
    },
    runWorker: $("run"),
    runWorkerAsync: $("runAsync"),
    writeFile: ({ FS: e }, t, r) => y(e, t, r),
};
const A = (e) =>
    function (t, r, n) {
        return (
            (globalThis.xworker = n), this[e](t, `from js import xworker;${r}`)
        );
    };
var x = {
    type: ["pyodide", "py"],
    module: (e = "0.22.1") =>
        `https://cdn.jsdelivr.net/pyodide/v${e}/full/pyodide.mjs`,
    async engine({ loadPyodide: e }, t) {
        const { stderr: r, stdout: n, get: o } = f(),
            s = await o(e({ stderr: r, stdout: n }));
        if ((t.fetch && (await k(this, s, t.fetch)), t.packages)) {
            await s.loadPackage("micropip");
            const e = await s.pyimport("micropip");
            await e.install(t.packages), e.destroy();
        }
        return s;
    },
    run: (e, t) => e.runPython(t),
    runAsync: (e, t) => e.runPythonAsync(t),
    runEvent(e, t, r) {
        return this.run(e, `import js;event=js.__events.get(${r});${t}`);
    },
    runWorker: A("run"),
    runWorkerAsync: A("runAsync"),
    writeFile: ({ FS: e }, t, r) => y(e, t, r),
};
const E = "ruby",
    W = (e) =>
        function (t, r, n) {
            return (
                (globalThis.xworker = n),
                this[e](
                    t,
                    `require "js";xworker=JS::eval("return xworker");${r}`,
                )
            );
        };
var _ = {
    experimental: !0,
    type: [E, "rb"],
    module: (e = "2.0.0") =>
        `https://cdn.jsdelivr.net/npm/ruby-3_2-wasm-wasi@${e}/dist/browser.esm.js`,
    async engine({ DefaultRubyVM: e }, t, r) {
        const n = await fetch(`${r.slice(0, r.lastIndexOf("/"))}/ruby.wasm`),
            o = await WebAssembly.compile(await n.arrayBuffer()),
            { vm: s } = await e(o);
        return t.fetch && (await k(this, s, t.fetch)), s;
    },
    run: (e, t) => e.eval(t),
    runAsync: (e, t) => e.evalAsync(t),
    runEvent(e, t, r) {
        return this.run(
            e,
            `require "js";event=JS::eval("return __events.get(${r})");${t}`,
        );
    },
    runWorker: W("run"),
    runWorkerAsync: W("runAsync"),
    writeFile: () => {
        throw new Error(`writeFile is not supported in ${E}`);
    },
};
const P = (e) =>
    function (t, r, n) {
        return t.global.set("xworker", n), this[e](t, r);
    };
var S = {
    type: ["wasmoon", "lua"],
    module: (e = "1.15.0") => `https://cdn.jsdelivr.net/npm/wasmoon@${e}/+esm`,
    async engine({ LuaFactory: e, LuaLibraries: t }, r) {
        const { stderr: n, stdout: o, get: s } = f(),
            a = await s(new e().createEngine());
        return (
            a.global.getTable(t.Base, (e) => {
                a.global.setField(e, "print", o),
                    a.global.setField(e, "printErr", n);
            }),
            r.fetch && (await k(this, a, r.fetch)),
            a
        );
    },
    run: (e, t) => e.doStringSync(t),
    runAsync: (e, t) => e.doString(t),
    runEvent(e, t, r) {
        return (
            e.global.set("event", globalThis.__events.get(r)), this.run(e, t)
        );
    },
    runWorker: P("run"),
    runWorkerAsync: P("runAsync"),
    writeFile: (
        {
            cmodule: {
                module: { FS: e },
            },
        },
        t,
        r,
    ) =>
        ((e, t, r) => (
            (t = g(e, t)),
            w(e, m(t)),
            e.writeFile(t, new Uint8Array(r), { canOwn: !0 })
        ))(e, t, r),
};
const F = new Map(),
    M = new Map(),
    T = [],
    L = [],
    O = new Proxy(new Map(), {
        get(e, t) {
            if (!e.has(t)) {
                const [r, ...n] = t.split("@"),
                    o = F.get(r),
                    s = /^https?:\/\//i.test(n) ? n[0] : o.module(...n);
                e.set(t, {
                    url: s,
                    module: import(s),
                    engine: o.engine.bind(o),
                });
            }
            const { url: r, module: n, engine: o } = e.get(t);
            return (e, s) =>
                n.then((n) => {
                    M.set(t, e);
                    const a = e?.fetch;
                    return a && b.set(a, s), o(n, e, r);
                });
        },
    }),
    R = (e) => {
        for (const t of [].concat(e.type))
            F.set(t, e), T.push(`script[type="${t}"]`), L.push(`${t}-`);
    };
for (const e of [j, x, _, S]) R(e);
const q = async (e) =>
        (await import("https://unpkg.com/basic-toml@0.3.1/es.js")).parse(e),
    U = (e, t) => {
        let r = {};
        if (t)
            if (t.endsWith(".json")) r = fetch(t).then(l);
            else if (t.endsWith(".toml")) r = fetch(t).then(p).then(q);
            else {
                try {
                    r = JSON.parse(t);
                } catch (e) {
                    r = q(t);
                }
                t = c("./config.txt");
            }
        return i(r).then((r) => O[e](r, t));
    },
    B = (e, t = "") => `${e}@${t}`.replace(/@$/, ""),
    N = (e, t) => {
        const r = ((e) => {
            let t = e;
            for (; t.parentNode; ) t = t.parentNode;
            return t;
        })(e);
        return (
            r.getElementById(t) ||
            ((e, t = document) => t.querySelector(e))(t, r)
        );
    },
    X = new WeakMap(),
    C = {
        get() {
            let e = X.get(this);
            return (
                e ||
                    ((e = document.createElement(`${this.type}-script`)),
                    X.set(this, e),
                    V(this)),
                e
            );
        },
        set(e) {
            "string" == typeof e
                ? X.set(this, N(this, e))
                : (X.set(this, e), V(this));
        },
    },
    I = new WeakMap(),
    J = new Map(),
    D = (e, t) => {
        const r = e?.value;
        return r ? t + r : "";
    },
    z = (e, t, r, n, o) => {
        if (!J.has(t)) {
            const s = { runtime: U(r, o), queue: i(), XWorker: h(e, n) };
            J.set(t, s), J.has(e) || J.set(e, s);
        }
        return J.get(t);
    },
    V = async (e) => {
        if (I.has(e)) {
            const { target: t } = e;
            t && (e.closest("head") ? document.body.append(t) : e.after(t));
        } else {
            const {
                    attributes: {
                        async: t,
                        config: r,
                        env: n,
                        target: o,
                        version: i,
                    },
                    src: u,
                    type: l,
                } = e,
                h = i?.value,
                d = B(l, h),
                f = D(o, "");
            let y = D(r, "|");
            const m = D(n, "") || `${d}${y}`;
            (y = y.slice(1)), y && (y = c(y));
            const w = z(l, m, d, h, y);
            I.set(s(e, "target", C), w), f && X.set(e, N(e, f));
            const g = u ? fetch(u).then(p) : e.textContent;
            w.queue = w.queue.then(() =>
                (async (e, t, r, n) => {
                    const o = F.get(e.type);
                    o.experimental &&
                        console.warn(`The ${e.type} runtime is experimental`);
                    const [i, c] = await a([I.get(e).runtime, t]);
                    try {
                        return (
                            s(globalThis, "XWorker", {
                                configurable: !0,
                                get: () => r,
                            }),
                            s(document, "currentScript", {
                                configurable: !0,
                                get: () => e,
                            }),
                            o[n ? "runAsync" : "run"](i, c)
                        );
                    } finally {
                        delete globalThis.XWorker,
                            delete document.currentScript;
                    }
                })(e, g, w.XWorker, !!t),
            );
        }
    },
    H = [],
    Y = (e) => {
        for (const t of H)
            if (e.matches(t)) {
                const { options: r, known: n } = G.get(t);
                if (!n.has(e)) {
                    n.add(e);
                    const {
                            type: t,
                            version: o,
                            config: s,
                            env: a,
                            onRuntimeReady: i,
                        } = r,
                        c = B(t, o),
                        u = a || `${c}${s ? `|${s}` : ""}`,
                        { runtime: l, XWorker: p } = z(t, u, c, o, s);
                    l.then((r) => {
                        const n = F.get(t);
                        i(e, {
                            type: t,
                            runtime: r,
                            XWorker: p,
                            io: d.get(r),
                            config: structuredClone(M.get(c)),
                            run: n.run.bind(n, r),
                            runAsync: n.runAsync.bind(n, r),
                        });
                    });
                }
            }
    },
    G = new Map(),
    K = (t, r) => {
        if (H.includes(t)) throw new Error(`plugin ${t} already registered`);
        H.push(t),
            G.set(t, { options: r, known: new WeakSet() }),
            e(t).forEach(Y);
    },
    Q = h(),
    Z = T.join(","),
    ee = async (e) => {
        const { runtime: t, queue: r } = J.get(e);
        return (await a([t, r]))[0];
    };
s(globalThis, "pyscript", {
    value: { env: new Proxy(o(null), { get: (e, t) => ee(t) }) },
});
let te = 0;
globalThis.__events = new Map();
const re = async (e) => {
    const { type: r, currentTarget: n } = e;
    for (let { name: o, value: s, ownerElement: a } of t(
        `./@*[${L.map((e) => `name()="${e}${r}"`).join(" or ")}]`,
        n,
    )) {
        o = o.slice(0, -(r.length + 1));
        const t = await ee(a.getAttribute(`${o}-env`) || o),
            n = te++;
        try {
            globalThis.__events.set(n, e), F.get(o).runEvent(t, s, n);
        } finally {
            globalThis.__events.delete(n);
        }
    }
};
for (let { name: e, ownerElement: r } of t(
    `.//@*[${L.map((e) => `starts-with(name(),"${e}")`).join(" or ")}]`,
))
    (e = e.slice(e.indexOf("-") + 1)), "env" !== e && r.addEventListener(e, re);
const ne = new MutationObserver((t) => {
        for (const { type: r, target: n, attributeName: o, addedNodes: s } of t)
            if ("attributes" !== r) {
                for (const t of s)
                    if (1 === t.nodeType)
                        if (t.matches(Z)) V(t);
                        else {
                            if ((e(Z, t).forEach(V), !H.length)) continue;
                            Y(t), e(H.join(","), t).forEach(Y);
                        }
            } else {
                const e = o.indexOf("-") + 1;
                if (e) {
                    const t = o.slice(0, e);
                    for (const r of L)
                        if (t === r) {
                            const t = o.slice(e);
                            if ("env" !== t) {
                                const e = n.hasAttribute(o) ? "add" : "remove";
                                n[`${e}EventListener`](t, re);
                            }
                            break;
                        }
                }
            }
    }),
    oe = (e) => (
        ne.observe(e, { childList: !0, subtree: !0, attributes: !0 }), e
    ),
    { attachShadow: se } = Element.prototype;
n(Element.prototype, {
    attachShadow(e) {
        return oe(se.call(this, e));
    },
}),
    e(Z, oe(document)).forEach(V);
export { Q as XWorker, K as registerPlugin };
