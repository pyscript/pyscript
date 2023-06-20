Promise.withResolvers ||
    (Promise.withResolvers = function () {
        var e,
            t,
            r = new this(function (r, n) {
                (e = r), (t = n);
            });
        return { resolve: e, reject: t, promise: r };
    });
const e = (e, t = document) => t.querySelector(e),
    t = (e, t = document) => [...t.querySelectorAll(e)],
    r = (e, t = document) => {
        const r = new XPathEvaluator()
                .createExpression(e)
                .evaluate(t, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE),
            n = [];
        for (let e = 0, { snapshotLength: t } = r; e < t; e++)
            n.push(r.snapshotItem(e));
        return n;
    },
    n = "object" == typeof self ? self : globalThis,
    s = (e) =>
        ((e, t) => {
            const r = (t, r) => (e.set(r, t), t),
                s = (o) => {
                    if (e.has(o)) return e.get(o);
                    const [a, i] = t[o];
                    switch (a) {
                        case 0:
                        case -1:
                            return r(i, o);
                        case 1: {
                            const e = r([], o);
                            for (const t of i) e.push(s(t));
                            return e;
                        }
                        case 2: {
                            const e = r({}, o);
                            for (const [t, r] of i) e[s(t)] = s(r);
                            return e;
                        }
                        case 3:
                            return r(new Date(i), o);
                        case 4: {
                            const { source: e, flags: t } = i;
                            return r(new RegExp(e, t), o);
                        }
                        case 5: {
                            const e = r(new Map(), o);
                            for (const [t, r] of i) e.set(s(t), s(r));
                            return e;
                        }
                        case 6: {
                            const e = r(new Set(), o);
                            for (const t of i) e.add(s(t));
                            return e;
                        }
                        case 7: {
                            const { name: e, message: t } = i;
                            return r(new n[e](t), o);
                        }
                        case 8:
                            return r(BigInt(i), o);
                        case "BigInt":
                            return r(Object(BigInt(i)), o);
                    }
                    return r(new n[a](i), o);
                };
            return s;
        })(
            new Map(),
            e,
        )(0),
    o = "",
    { toString: a } = {},
    { keys: i } = Object,
    c = (e) => {
        const t = typeof e;
        if ("object" !== t || !e) return [0, t];
        const r = a.call(e).slice(8, -1);
        switch (r) {
            case "Array":
                return [1, o];
            case "Object":
                return [2, o];
            case "Date":
                return [3, o];
            case "RegExp":
                return [4, o];
            case "Map":
                return [5, o];
            case "Set":
                return [6, o];
        }
        return r.includes("Array")
            ? [1, r]
            : r.includes("Error")
            ? [7, r]
            : [2, r];
    },
    l = ([e, t]) => 0 === e && ("function" === t || "symbol" === t),
    u = (e, { json: t, lossy: r } = {}) => {
        const n = [];
        return (
            ((e, t, r, n) => {
                const s = (e, t) => {
                        const s = n.push(e) - 1;
                        return r.set(t, s), s;
                    },
                    o = (n) => {
                        if (r.has(n)) return r.get(n);
                        let [a, u] = c(n);
                        switch (a) {
                            case 0: {
                                let t = n;
                                switch (u) {
                                    case "bigint":
                                        (a = 8), (t = n.toString());
                                        break;
                                    case "function":
                                    case "symbol":
                                        if (e)
                                            throw new TypeError(
                                                "unable to serialize " + u,
                                            );
                                        t = null;
                                        break;
                                    case "undefined":
                                        return s([-1], n);
                                }
                                return s([a, t], n);
                            }
                            case 1: {
                                if (u) return s([u, [...n]], n);
                                const e = [],
                                    t = s([a, e], n);
                                for (const t of n) e.push(o(t));
                                return t;
                            }
                            case 2: {
                                if (u)
                                    switch (u) {
                                        case "BigInt":
                                            return s([u, n.toString()], n);
                                        case "Boolean":
                                        case "Number":
                                        case "String":
                                            return s([u, n.valueOf()], n);
                                    }
                                if (t && "toJSON" in n) return o(n.toJSON());
                                const r = [],
                                    p = s([a, r], n);
                                for (const t of i(n))
                                    (!e && l(c(n[t]))) ||
                                        r.push([o(t), o(n[t])]);
                                return p;
                            }
                            case 3:
                                return s([a, n.toISOString()], n);
                            case 4: {
                                const { source: e, flags: t } = n;
                                return s([a, { source: e, flags: t }], n);
                            }
                            case 5: {
                                const t = [],
                                    r = s([a, t], n);
                                for (const [r, s] of n)
                                    (e || (!l(c(r)) && !l(c(s)))) &&
                                        t.push([o(r), o(s)]);
                                return r;
                            }
                            case 6: {
                                const t = [],
                                    r = s([a, t], n);
                                for (const r of n)
                                    (!e && l(c(r))) || t.push(o(r));
                                return r;
                            }
                        }
                        const { message: p } = n;
                        return s([a, { name: u, message: p }], n);
                    };
                return o;
            })(
                !(t || r),
                !!t,
                new Map(),
                n,
            )(e),
            n
        );
    },
    { parse: p, stringify: f } = JSON,
    d = { json: !0, lossy: !0 };
var h = Object.freeze({
        __proto__: null,
        parse: (e) => s(p(e)),
        stringify: (e) => f(u(e, d)),
    }),
    y = (e) => ({
        value: new Promise((t) => {
            let r = new Worker(
                "data:application/javascript," +
                    encodeURIComponent(
                        'onmessage=({data:b})=>(Atomics.wait(b,0),postMessage("ok"))',
                    ),
            );
            (r.onmessage = t), r.postMessage(e);
        }),
    });
/*! (c) Andrea Giammarchi - ISC */ const w =
        "eef159e0-b39b-4e0e-b711-43432daf4928",
    {
        Int32Array: g,
        Map: m,
        SharedArrayBuffer: b,
        Uint16Array: v,
    } = globalThis,
    { BYTES_PER_ELEMENT: $ } = g,
    { BYTES_PER_ELEMENT: A } = v,
    { isArray: _ } = Array,
    { notify: j, wait: E, waitAsync: S } = Atomics,
    { fromCharCode: k } = String,
    R = (e, t) =>
        e ? (S || y)(t, 0) : (E(t, 0), { value: { then: (e) => e() } }),
    M = new WeakSet(),
    P = new WeakMap();
let O = 0;
const W = (e, { parse: t, stringify: r } = JSON) => {
        if (!P.has(e)) {
            const n = (t, ...r) => e.postMessage({ [w]: r }, { transfer: t });
            P.set(
                e,
                new Proxy(new m(), {
                    get: (r, s) =>
                        "then" === s
                            ? null
                            : (...r) => {
                                  const o = O++;
                                  let a = new b($);
                                  const i = new g(a);
                                  let c = [];
                                  M.has(r.at(-1) || c) &&
                                      M.delete((c = r.pop())),
                                      n(c, o, a, s, r);
                                  const l = e instanceof Worker;
                                  return R(l, i).value.then(() => {
                                      const e = i[0];
                                      if (!e) return;
                                      const r = A * e;
                                      return (
                                          (a = new b(r + (r % $))),
                                          n([], o, a),
                                          R(l, new g(a)).value.then(() =>
                                              t(k(...new v(a).slice(0, e))),
                                          )
                                      );
                                  });
                              },
                    set(t, n, s) {
                        if (!t.size) {
                            const n = new m();
                            e.addEventListener(
                                "message",
                                async ({ data: e }) => {
                                    const s = e?.[w];
                                    if (_(s)) {
                                        const [e, o, ...a] = s,
                                            i = new g(o);
                                        if (a.length) {
                                            const [s, o] = a;
                                            if (!t.has(s))
                                                throw new Error(
                                                    `Unsupported action: ${s}`,
                                                );
                                            {
                                                const a = r(
                                                    await t.get(s)(...o),
                                                );
                                                a &&
                                                    (n.set(e, a),
                                                    (i[0] = a.length));
                                            }
                                        } else {
                                            const t = n.get(e);
                                            n.delete(e);
                                            for (
                                                let e = new v(o), r = 0;
                                                r < t.length;
                                                r++
                                            )
                                                e[r] = t.charCodeAt(r);
                                        }
                                        j(i, 0);
                                    }
                                },
                            );
                        }
                        return !!t.set(n, s);
                    },
                }),
            );
        }
        return P.get(e);
    },
    x = (e) => W(e, h);
x.transfer = W.transfer = (...e) => (M.add(e), e);
const { isArray: B } = Array,
    { assign: T, create: I, defineProperties: C, defineProperty: F } = Object,
    { all: G, resolve: L } = new Proxy(Promise, {
        get: (e, t) => e[t].bind(e),
    }),
    N = (e, t = location.href) => new URL(e, t).href,
    U = (e) => e.arrayBuffer(),
    J = (e) => e.json(),
    z = (e) => e.text();
var q = new WeakMap(),
    D = (...e) =>
        function t(r, n) {
            const s = q.get(t),
                o = new Worker(
                    URL.createObjectURL(
                        new Blob(
                            [
                                'const e="object"==typeof self?self:globalThis,t=t=>((t,r)=>{const n=(e,r)=>(t.set(r,e),e),s=o=>{if(t.has(o))return t.get(o);const[a,i]=r[o];switch(a){case 0:case-1:return n(i,o);case 1:{const e=n([],o);for(const t of i)e.push(s(t));return e}case 2:{const e=n({},o);for(const[t,r]of i)e[s(t)]=s(r);return e}case 3:return n(new Date(i),o);case 4:{const{source:e,flags:t}=i;return n(new RegExp(e,t),o)}case 5:{const e=n(new Map,o);for(const[t,r]of i)e.set(s(t),s(r));return e}case 6:{const e=n(new Set,o);for(const t of i)e.add(s(t));return e}case 7:{const{name:t,message:r}=i;return n(new e[t](r),o)}case 8:return n(BigInt(i),o);case"BigInt":return n(Object(BigInt(i)),o)}return n(new e[a](i),o)};return s})(new Map,t)(0),r="",{toString:n}={},{keys:s}=Object,o=e=>{const t=typeof e;if("object"!==t||!e)return[0,t];const s=n.call(e).slice(8,-1);switch(s){case"Array":return[1,r];case"Object":return[2,r];case"Date":return[3,r];case"RegExp":return[4,r];case"Map":return[5,r];case"Set":return[6,r]}return s.includes("Array")?[1,s]:s.includes("Error")?[7,s]:[2,s]},a=([e,t])=>0===e&&("function"===t||"symbol"===t),i=(e,{json:t,lossy:r}={})=>{const n=[];return((e,t,r,n)=>{const i=(e,t)=>{const s=n.push(e)-1;return r.set(t,s),s},c=n=>{if(r.has(n))return r.get(n);let[l,u]=o(n);switch(l){case 0:{let t=n;switch(u){case"bigint":l=8,t=n.toString();break;case"function":case"symbol":if(e)throw new TypeError("unable to serialize "+u);t=null;break;case"undefined":return i([-1],n)}return i([l,t],n)}case 1:{if(u)return i([u,[...n]],n);const e=[],t=i([l,e],n);for(const t of n)e.push(c(t));return t}case 2:{if(u)switch(u){case"BigInt":return i([u,n.toString()],n);case"Boolean":case"Number":case"String":return i([u,n.valueOf()],n)}if(t&&"toJSON"in n)return c(n.toJSON());const r=[],f=i([l,r],n);for(const t of s(n))!e&&a(o(n[t]))||r.push([c(t),c(n[t])]);return f}case 3:return i([l,n.toISOString()],n);case 4:{const{source:e,flags:t}=n;return i([l,{source:e,flags:t}],n)}case 5:{const t=[],r=i([l,t],n);for(const[r,s]of n)(e||!a(o(r))&&!a(o(s)))&&t.push([c(r),c(s)]);return r}case 6:{const t=[],r=i([l,t],n);for(const r of n)!e&&a(o(r))||t.push(c(r));return r}}const{message:f}=n;return i([l,{name:u,message:f}],n)};return c})(!(t||r),!!t,new Map,n)(e),n},{parse:c,stringify:l}=JSON,u={json:!0,lossy:!0};var f=Object.freeze({__proto__:null,parse:e=>t(c(e)),stringify:e=>l(i(e,u))}),p=e=>({value:new Promise((t=>{let r=new Worker("data:application/javascript,"+encodeURIComponent(\'onmessage=({data:b})=>(Atomics.wait(b,0),postMessage("ok"))\'));r.onmessage=t,r.postMessage(e)}))})\n/*! (c) Andrea Giammarchi - ISC */;const d="eef159e0-b39b-4e0e-b711-43432daf4928",{Int32Array:h,Map:w,SharedArrayBuffer:y,Uint16Array:g}=globalThis,{BYTES_PER_ELEMENT:m}=h,{BYTES_PER_ELEMENT:b}=g,{isArray:v}=Array,{notify:$,wait:_,waitAsync:j}=Atomics,{fromCharCode:S}=String,A=(e,t)=>e?(j||p)(t,0):(_(t,0),{value:{then:e=>e()}}),E=new WeakSet,M=new WeakMap;let k=0;const P=(e,{parse:t,stringify:r}=JSON)=>{if(!M.has(e)){const n=(t,...r)=>e.postMessage({[d]:r},{transfer:t});M.set(e,new Proxy(new w,{get:(r,s)=>"then"===s?null:(...r)=>{const o=k++;let a=new y(m);const i=new h(a);let c=[];E.has(r.at(-1)||c)&&E.delete(c=r.pop()),n(c,o,a,s,r);const l=e instanceof Worker;return A(l,i).value.then((()=>{const e=i[0];if(!e)return;const r=b*e;return a=new y(r+r%m),n([],o,a),A(l,new h(a)).value.then((()=>t(S(...new g(a).slice(0,e)))))}))},set(t,n,s){if(!t.size){const n=new w;e.addEventListener("message",(async({data:e})=>{const s=e?.[d];if(v(s)){const[e,o,...a]=s,i=new h(o);if(a.length){const[s,o]=a;if(!t.has(s))throw new Error(`Unsupported action: ${s}`);{const a=r(await t.get(s)(...o));a&&(n.set(e,a),i[0]=a.length)}}else{const t=n.get(e);n.delete(e);for(let e=new g(o),r=0;r<t.length;r++)e[r]=t.charCodeAt(r)}$(i,0)}}))}return!!t.set(n,s)}}))}return M.get(e)},O=e=>P(e,f);O.transfer=P.transfer=(...e)=>(E.add(e),e);const{isArray:x}=Array,{assign:R,create:B,defineProperties:F,defineProperty:T}=Object,{all:W,resolve:G}=new Proxy(Promise,{get:(e,t)=>e[t].bind(e)}),I=(e,t=location.href)=>new URL(e,t).href;Promise.withResolvers||(Promise.withResolvers=function(){var e,t,r=new this((function(r,n){e=r,t=n}));return{resolve:e,reject:t,promise:r}});const U=e=>e.arrayBuffer(),L=e=>e.json(),N=e=>e.text(),J=e=>e.replace(/^[^\\r\\n]+$/,(e=>e.trim())),z=new WeakMap,C=e=>{const t=e||console,r={stderr:(t.stderr||console.error).bind(t),stdout:(t.stdout||console.log).bind(t)};return{stderr:(...e)=>r.stderr(...e),stdout:(...e)=>r.stdout(...e),async get(e){const t=await e;return z.set(t,r),t}}},D=e=>{const t=e.split("/");return t.pop(),t.join("/")},q=(e,t)=>{const r=[];for(const n of t.split("/"))r.push(n),n&&e.mkdir(r.join("/"))},Y=(e,t)=>{const r=[];for(const e of t.split("/"))switch(e){case"":case".":break;case"..":r.pop();break;default:r.push(e)}return[e.cwd()].concat(r).join("/").replace(/^\\/+/,"/")},V=e=>{const t=e.map((e=>e.trim().replace(/(^[/]*|[/]*$)/g,""))).filter((e=>""!==e&&"."!==e)).join("/");return e[0].startsWith("/")?`/${t}`:t},H=new WeakMap,K=(e,t,r)=>W((e=>{for(const{files:t,to_file:r,from:n=""}of e){if(void 0!==t&&void 0!==r)throw new Error("Cannot use \'to_file\' and \'files\' parameters together!");if(void 0===t&&void 0===r&&n.endsWith("/"))throw new Error(`Couldn\'t determine the filename from the path ${n}, please supply \'to_file\' parameter.`)}return e.flatMap((({from:e="",to_folder:t=".",to_file:r,files:n})=>{if(x(n))return n.map((r=>({url:V([e,r]),path:V([t,r])})));const s=r||e.slice(1+e.lastIndexOf("/"));return[{url:e,path:V([t,s])}]}))})(r).map((({url:n,path:s})=>((e,t)=>fetch(I(t,H.get(e))))(r,n).then(U).then((r=>e.writeFile(t,s,r)))))),Q=(e,t)=>e.runPython(J(t)),X=(e,t)=>e.runPythonAsync(J(t)),Z=({FS:e},t,r)=>((e,t,r)=>{const{parentPath:n,name:s}=e.analyzePath(t,!0);return e.mkdirTree(n),e.writeFile([n,s].join("/"),new Uint8Array(r),{canOwn:!0})})(e,t,r);var ee={type:"micropython",module:(e="1.20.0-239")=>`https://cdn.jsdelivr.net/npm/@micropython/micropython-webassembly-pyscript@${e}/micropython.mjs`,async engine({loadMicroPython:e},t,r){const{stderr:n,stdout:s,get:o}=C();r=r.replace(/\\.m?js$/,".wasm");const a=await o(e({stderr:n,stdout:s,url:r}));return t.fetch&&await K(this,a,t.fetch),a},setGlobal(e,t,r){const n=`__pyscript_${this.type}_${t}`;globalThis[n]=r,this.run(e,`from js import ${n};${t}=${n};`)},deleteGlobal(e,t){const r=`__pyscript_${this.type}_${t}`;this.run(e,`del ${r};del ${t}`),delete globalThis[r]},run:Q,runAsync:X,writeFile:Z};var te={type:"pyodide",module:(e="0.23.2")=>`https://cdn.jsdelivr.net/pyodide/v${e}/full/pyodide.mjs`,async engine({loadPyodide:e},t,r){const{stderr:n,stdout:s,get:o}=C(),a=r.slice(0,r.lastIndexOf("/")),i=await o(e({stderr:n,stdout:s,indexURL:a}));if(t.fetch&&await K(this,i,t.fetch),t.packages){await i.loadPackage("micropip");const e=await i.pyimport("micropip");await e.install(t.packages),e.destroy()}return i},setGlobal(e,t,r){e.globals.set(t,r)},deleteGlobal(e,t){e.globals.delete(t)},run:Q,runAsync:X,writeFile:Z};const re="ruby-wasm-wasi";var ne={type:re,experimental:!0,module:(e="2.0.0")=>`https://cdn.jsdelivr.net/npm/ruby-3_2-wasm-wasi@${e}/dist/browser.esm.js`,async engine({DefaultRubyVM:e},t,r){const n=await fetch(`${r.slice(0,r.lastIndexOf("/"))}/ruby.wasm`),s=await WebAssembly.compile(await n.arrayBuffer()),{vm:o}=await e(s);return t.fetch&&await K(this,o,t.fetch),o},setGlobal(e,t,r){const n=`__pyscript_ruby_wasm_wasi_${t}`;globalThis[n]=r,this.run(e,`require "js";$${t}=JS::eval("return ${n}")`)},deleteGlobal(e,t){const r=`__pyscript_ruby_wasm_wasi_${t}`;this.run(e,`$${t}=nil`),delete globalThis[r]},run:(e,t)=>e.eval(J(t)),runAsync:(e,t)=>e.evalAsync(J(t)),writeFile:()=>{throw new Error(`writeFile is not supported in ${re}`)}};var se={type:"wasmoon",module:(e="1.15.0")=>`https://cdn.jsdelivr.net/npm/wasmoon@${e}/+esm`,async engine({LuaFactory:e,LuaLibraries:t},r){const{stderr:n,stdout:s,get:o}=C(),a=await o((new e).createEngine());return a.global.getTable(t.Base,(e=>{a.global.setField(e,"print",s),a.global.setField(e,"printErr",n)})),r.fetch&&await K(this,a,r.fetch),a},setGlobal(e,t,r){e.global.set(t,r)},deleteGlobal(e,t){e.global.set(t,void 0)},run:(e,t)=>e.doStringSync(J(t)),runAsync:(e,t)=>e.doString(J(t)),writeFile:({cmodule:{module:{FS:e}}},t,r)=>((e,t,r)=>(t=Y(e,t),q(e,D(t)),e.writeFile(t,new Uint8Array(r),{canOwn:!0})))(e,t,r)};const oe=new Map,ae=new Map,ie=new Proxy(new Map,{get(e,t){if(!e.has(t)){const[r,...n]=t.split("@"),s=oe.get(r),o=/^https?:\\/\\//i.test(n)?n.join("@"):s.module(...n);e.set(t,{url:o,module:import(o),engine:s.engine.bind(s)})}const{url:r,module:n,engine:s}=e.get(t);return(e,o)=>n.then((n=>{ae.set(t,e);const a=e?.fetch;return a&&H.set(a,o),s(n,e,r)}))}}),ce=e=>{for(const t of[].concat(e.type))oe.set(t,e)};for(const e of[ee,te,ne,se])ce(e);const le=async e=>(await import("https://cdn.jsdelivr.net/npm/basic-toml@0.3.1/es.js")).parse(e);try{new SharedArrayBuffer(4)}catch(e){throw new Error(["Unable to use SharedArrayBuffer due insecure environment.","Please read requirements in MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements"].join("\\n"))}let ue,fe,pe;const de=(e,t)=>{addEventListener(e,t||(async t=>{await ue,pe=t,fe(`xworker.on${e}(xworker.event);`,he)}),!!t&&{once:!0})},he={sync:O(self),onerror(){},onmessage(){},onmessageerror(){},postMessage:postMessage.bind(self),get event(){const e=pe;if(!e)throw new Error("Unauthorized event access");return pe=void 0,e}};de("message",(({data:{options:e,code:t,hooks:r}})=>{ue=(async()=>{const{type:n,version:s,config:o,async:a}=e,i=await((e,t)=>{let r={};if(t)if(t.endsWith(".json"))r=fetch(t).then(L);else if(t.endsWith(".toml"))r=fetch(t).then(N).then(le);else{try{r=JSON.parse(t)}catch(e){r=le(t)}t=I("./config.txt")}return G(r).then((r=>ie[e](r,t)))})(((e,t="")=>`${e}@${t}`.replace(/@$/,""))(n,s),o),c=B(oe.get(n)),l="run"+(a?"Async":"");if(r){const{beforeRun:e,beforeRunAsync:t,afterRun:n,afterRunAsync:s}=r,o=n||s,a=e||t;if(o){const e=c[l].bind(c);c[l]=(t,r)=>e(t,`${r}\\n${o}`)}if(a){const e=c[l].bind(c);c[l]=(t,r)=>e(t,`${a}\\n${r}`)}}return c.setGlobal(i,"xworker",he),fe=c[l].bind(c,i),fe(t),i})(),de("error"),de("message"),de("messageerror")}));\n',
                            ],
                            { type: "application/javascript" },
                        ),
                    ),
                    { type: "module" },
                ),
                { postMessage: a } = o;
            if (e.length) {
                const [t, r] = e;
                (n = T({}, n || { type: t, version: r })).type || (n.type = t);
            }
            n?.config && (n.config = N(n.config));
            const i = fetch(r)
                .then(z)
                .then((e) => a.call(o, { options: n, code: e, hooks: s }));
            return C(o, {
                postMessage: {
                    value: (e, ...t) => i.then(() => a.call(o, e, ...t)),
                },
                sync: { value: x(o) },
            });
        };
const X = (e) => e.replace(/^[^\r\n]+$/, (e) => e.trim()),
    Y = new WeakMap(),
    V = (e) => {
        const t = e || console,
            r = {
                stderr: (t.stderr || console.error).bind(t),
                stdout: (t.stdout || console.log).bind(t),
            };
        return {
            stderr: (...e) => r.stderr(...e),
            stdout: (...e) => r.stdout(...e),
            async get(e) {
                const t = await e;
                return Y.set(t, r), t;
            },
        };
    },
    H = (e) => {
        const t = e.split("/");
        return t.pop(), t.join("/");
    },
    K = (e, t) => {
        const r = [];
        for (const n of t.split("/")) r.push(n), n && e.mkdir(r.join("/"));
    },
    Q = (e, t) => {
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
    Z = (e) => {
        const t = e
            .map((e) => e.trim().replace(/(^[/]*|[/]*$)/g, ""))
            .filter((e) => "" !== e && "." !== e)
            .join("/");
        return e[0].startsWith("/") ? `/${t}` : t;
    },
    ee = new WeakMap(),
    te = (e, t, r) =>
        G(
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
                        to_file: r,
                        files: n,
                    }) => {
                        if (B(n))
                            return n.map((r) => ({
                                url: Z([e, r]),
                                path: Z([t, r]),
                            }));
                        const s = r || e.slice(1 + e.lastIndexOf("/"));
                        return [{ url: e, path: Z([t, s]) }];
                    },
                );
            })(r).map(({ url: n, path: s }) =>
                ((e, t) => fetch(N(t, ee.get(e))))(r, n)
                    .then(U)
                    .then((r) => e.writeFile(t, s, r)),
            ),
        ),
    re = (e, t) => e.runPython(X(t)),
    ne = (e, t) => e.runPythonAsync(X(t)),
    se = ({ FS: e }, t, r) =>
        ((e, t, r) => {
            const { parentPath: n, name: s } = e.analyzePath(t, !0);
            return (
                e.mkdirTree(n),
                e.writeFile([n, s].join("/"), new Uint8Array(r), { canOwn: !0 })
            );
        })(e, t, r);
var oe = {
    type: "micropython",
    module: (e = "1.20.0-239") =>
        `https://cdn.jsdelivr.net/npm/@micropython/micropython-webassembly-pyscript@${e}/micropython.mjs`,
    async engine({ loadMicroPython: e }, t, r) {
        const { stderr: n, stdout: s, get: o } = V();
        r = r.replace(/\.m?js$/, ".wasm");
        const a = await o(e({ stderr: n, stdout: s, url: r }));
        return t.fetch && (await te(this, a, t.fetch)), a;
    },
    setGlobal(e, t, r) {
        const n = `__pyscript_${this.type}_${t}`;
        (globalThis[n] = r), this.run(e, `from js import ${n};${t}=${n};`);
    },
    deleteGlobal(e, t) {
        const r = `__pyscript_${this.type}_${t}`;
        this.run(e, `del ${r};del ${t}`), delete globalThis[r];
    },
    run: re,
    runAsync: ne,
    writeFile: se,
};
var ae = {
    type: "pyodide",
    module: (e = "0.23.2") =>
        `https://cdn.jsdelivr.net/pyodide/v${e}/full/pyodide.mjs`,
    async engine({ loadPyodide: e }, t, r) {
        const { stderr: n, stdout: s, get: o } = V(),
            a = r.slice(0, r.lastIndexOf("/")),
            i = await o(e({ stderr: n, stdout: s, indexURL: a }));
        if ((t.fetch && (await te(this, i, t.fetch)), t.packages)) {
            await i.loadPackage("micropip");
            const e = await i.pyimport("micropip");
            await e.install(t.packages), e.destroy();
        }
        return i;
    },
    setGlobal(e, t, r) {
        e.globals.set(t, r);
    },
    deleteGlobal(e, t) {
        e.globals.delete(t);
    },
    run: re,
    runAsync: ne,
    writeFile: se,
};
const ie = "ruby-wasm-wasi";
var ce = {
    type: ie,
    experimental: !0,
    module: (e = "2.0.0") =>
        `https://cdn.jsdelivr.net/npm/ruby-3_2-wasm-wasi@${e}/dist/browser.esm.js`,
    async engine({ DefaultRubyVM: e }, t, r) {
        const n = await fetch(`${r.slice(0, r.lastIndexOf("/"))}/ruby.wasm`),
            s = await WebAssembly.compile(await n.arrayBuffer()),
            { vm: o } = await e(s);
        return t.fetch && (await te(this, o, t.fetch)), o;
    },
    setGlobal(e, t, r) {
        const n = `__pyscript_ruby_wasm_wasi_${t}`;
        (globalThis[n] = r),
            this.run(e, `require "js";$${t}=JS::eval("return ${n}")`);
    },
    deleteGlobal(e, t) {
        const r = `__pyscript_ruby_wasm_wasi_${t}`;
        this.run(e, `$${t}=nil`), delete globalThis[r];
    },
    run: (e, t) => e.eval(X(t)),
    runAsync: (e, t) => e.evalAsync(X(t)),
    writeFile: () => {
        throw new Error(`writeFile is not supported in ${ie}`);
    },
};
var le = {
    type: "wasmoon",
    module: (e = "1.15.0") => `https://cdn.jsdelivr.net/npm/wasmoon@${e}/+esm`,
    async engine({ LuaFactory: e, LuaLibraries: t }, r) {
        const { stderr: n, stdout: s, get: o } = V(),
            a = await o(new e().createEngine());
        return (
            a.global.getTable(t.Base, (e) => {
                a.global.setField(e, "print", s),
                    a.global.setField(e, "printErr", n);
            }),
            r.fetch && (await te(this, a, r.fetch)),
            a
        );
    },
    setGlobal(e, t, r) {
        e.global.set(t, r);
    },
    deleteGlobal(e, t) {
        e.global.set(t, void 0);
    },
    run: (e, t) => e.doStringSync(X(t)),
    runAsync: (e, t) => e.doString(X(t)),
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
            (t = Q(e, t)),
            K(e, H(t)),
            e.writeFile(t, new Uint8Array(r), { canOwn: !0 })
        ))(e, t, r),
};
const ue = new Map(),
    pe = new Map(),
    fe = [],
    de = [],
    he = new Proxy(new Map(), {
        get(e, t) {
            if (!e.has(t)) {
                const [r, ...n] = t.split("@"),
                    s = ue.get(r),
                    o = /^https?:\/\//i.test(n) ? n.join("@") : s.module(...n);
                e.set(t, {
                    url: o,
                    module: import(o),
                    engine: s.engine.bind(s),
                });
            }
            const { url: r, module: n, engine: s } = e.get(t);
            return (e, o) =>
                n.then((n) => {
                    pe.set(t, e);
                    const a = e?.fetch;
                    return a && ee.set(a, o), s(n, e, r);
                });
        },
    }),
    ye = (e) => {
        for (const t of [].concat(e.type))
            ue.set(t, e), fe.push(`script[type="${t}"]`), de.push(`${t}-`);
    };
for (const e of [oe, ae, ce, le]) ye(e);
const we = async (e) =>
        (
            await import("https://cdn.jsdelivr.net/npm/basic-toml@0.3.1/es.js")
        ).parse(e),
    ge = (e, t) => {
        let r = {};
        if (t)
            if (t.endsWith(".json")) r = fetch(t).then(J);
            else if (t.endsWith(".toml")) r = fetch(t).then(z).then(we);
            else {
                try {
                    r = JSON.parse(t);
                } catch (e) {
                    r = we(t);
                }
                t = N("./config.txt");
            }
        return L(r).then((r) => he[e](r, t));
    },
    me = (e, t = "") => `${e}@${t}`.replace(/@$/, ""),
    be = (t, r) => {
        const n = ((e) => {
            let t = e;
            for (; t.parentNode; ) t = t.parentNode;
            return t;
        })(t);
        return n.getElementById(r) || e(r, n);
    },
    ve = new WeakMap(),
    $e = {
        get() {
            let e = ve.get(this);
            return (
                e ||
                    ((e = document.createElement(`${this.type}-script`)),
                    ve.set(this, e),
                    Se(this)),
                e
            );
        },
        set(e) {
            "string" == typeof e
                ? ve.set(this, be(this, e))
                : (ve.set(this, e), Se(this));
        },
    },
    Ae = new WeakMap(),
    _e = new Map(),
    je = (e, t) => {
        const r = e?.value;
        return r ? t + r : "";
    },
    Ee = (e, t, r, n, s) => {
        if (!_e.has(t)) {
            const o = { interpreter: ge(r, s), queue: L(), XWorker: D(e, n) };
            _e.set(t, o), _e.has(e) || _e.set(e, o);
        }
        return _e.get(t);
    },
    Se = async (e) => {
        if (Ae.has(e)) {
            const { target: t } = e;
            t && (e.closest("head") ? document.body.append(t) : e.after(t));
        } else {
            const {
                    attributes: {
                        async: t,
                        config: r,
                        env: n,
                        target: s,
                        version: o,
                    },
                    src: a,
                    type: i,
                } = e,
                c = o?.value,
                l = me(i, c),
                u = je(s, "");
            let p = je(r, "|");
            const f = je(n, "") || `${l}${p}`;
            (p = p.slice(1)), p && (p = N(p));
            const d = Ee(i, f, l, c, p);
            Ae.set(F(e, "target", $e), d), u && ve.set(e, be(e, u));
            const h = a ? fetch(a).then(z) : e.textContent;
            d.queue = d.queue.then(() =>
                (async (e, t, r, n) => {
                    const s = ue.get(e.type);
                    s.experimental &&
                        console.warn(
                            `The ${e.type} interpreter is experimental`,
                        );
                    const [o, a] = await G([Ae.get(e).interpreter, t]);
                    try {
                        return (
                            F(document, "currentScript", {
                                configurable: !0,
                                get: () => e,
                            }),
                            s.setGlobal(o, "XWorker", r),
                            s[n ? "runAsync" : "run"](o, a)
                        );
                    } finally {
                        delete document.currentScript,
                            s.deleteGlobal(o, "XWorker");
                    }
                })(e, h, d.XWorker, !!t),
            );
        }
    };
F(globalThis, "pyscript", {
    value: { env: new Proxy(I(null), { get: (e, t) => ke(t) }) },
});
const ke = async (e) => {
        if (_e.has(e)) {
            const { interpreter: t, queue: r } = _e.get(e);
            return (await G([t, r]))[0];
        }
        const t = _e.size
            ? `Available interpreters are: ${[..._e.keys()]
                  .map((e) => `"${e}"`)
                  .join(", ")}.`
            : "There are no interpreters in this page.";
        throw new Error(`The interpreter "${e}" was not found. ${t}`);
    },
    Re = async (e) => {
        const { type: t, currentTarget: n } = e;
        for (let { name: s, value: o, ownerElement: a } of r(
            `./@*[${de.map((e) => `name()="${e}${t}"`).join(" or ")}]`,
            n,
        )) {
            s = s.slice(0, -(t.length + 1));
            const r = await ke(a.getAttribute(`${s}-env`) || s),
                n = ue.get(s);
            try {
                n.setGlobal(r, "event", e), n.run(r, o);
            } finally {
                n.deleteGlobal(r, "event");
            }
        }
    },
    Me = (e) => {
        for (let { name: t, ownerElement: n } of r(
            `.//@*[${de
                .map((e) => `starts-with(name(),"${e}")`)
                .join(" or ")}]`,
            e,
        ))
            (t = t.slice(t.lastIndexOf("-") + 1)),
                "env" !== t && n.addEventListener(t, Re);
    },
    Pe = [],
    Oe = new Map(),
    We = new Map(),
    xe = new Map(),
    Be = (e) => {
        for (const t of Pe)
            if (e.matches(t)) {
                const r = We.get(t),
                    { resolve: n } = xe.get(r),
                    { options: s, known: o } = Te.get(r);
                if (!o.has(e)) {
                    o.add(e);
                    const {
                            interpreter: t,
                            version: a,
                            config: i,
                            env: c,
                            onRuntimeReady: l,
                        } = s,
                        u = me(t, a),
                        p = c || `${u}${i ? `|${i}` : ""}`,
                        { interpreter: f, XWorker: d } = Ee(t, p, u, a, i);
                    f.then((o) => {
                        if (!Oe.has(p)) {
                            const a = I(ue.get(t)),
                                {
                                    onBeforeRun: i,
                                    onBeforeRunAsync: c,
                                    onAfterRun: l,
                                    onAfterRunAsync: f,
                                    codeBeforeRunWorker: h,
                                    codeBeforeRunWorkerAsync: y,
                                    codeAfterRunWorker: w,
                                    codeAfterRunWorkerAsync: g,
                                } = s;
                            for (const [t, [r, n]] of [["run", [i, l]]]) {
                                const s = a[t];
                                a[t] = function (t, o) {
                                    r && r.call(this, m, e);
                                    const a = s.call(this, t, o);
                                    return n && n.call(this, m, e), a;
                                };
                            }
                            for (const [t, [r, n]] of [["runAsync", [c, f]]]) {
                                const s = a[t];
                                a[t] = async function (t, o) {
                                    r && (await r.call(this, m, e));
                                    const a = await s.call(this, t, o);
                                    return n && (await n.call(this, m, e)), a;
                                };
                            }
                            q.set(d, {
                                beforeRun: h,
                                beforeRunAsync: y,
                                afterRun: w,
                                afterRunAsync: g,
                            }),
                                a.setGlobal(o, "XWorker", d);
                            const m = {
                                type: r,
                                interpreter: o,
                                XWorker: d,
                                io: Y.get(o),
                                config: structuredClone(pe.get(u)),
                                run: a.run.bind(a, o),
                                runAsync: a.runAsync.bind(a, o),
                            };
                            Oe.set(p, m), n(m);
                        }
                        l?.(Oe.get(p), e);
                    });
                }
            }
    },
    Te = new Map(),
    Ie = (e) => (
        xe.has(e) || xe.set(e, Promise.withResolvers()), xe.get(e).promise
    ),
    Ce = fe.join(","),
    Fe = new MutationObserver((e) => {
        for (const { type: r, target: n, attributeName: s, addedNodes: o } of e)
            if ("attributes" !== r) {
                for (const e of o)
                    if (1 === e.nodeType)
                        if ((Me(e), e.matches(Ce))) Se(e);
                        else {
                            if ((t(Ce, e).forEach(Se), !Pe.length)) continue;
                            Be(e), t(Pe.join(","), e).forEach(Be);
                        }
            } else {
                const e = s.lastIndexOf("-") + 1;
                if (e) {
                    const t = s.slice(0, e);
                    for (const r of de)
                        if (t === r) {
                            const t = s.slice(e);
                            if ("env" !== t) {
                                const e = n.hasAttribute(s) ? "add" : "remove";
                                n[`${e}EventListener`](t, Re);
                            }
                            break;
                        }
                }
            }
    }),
    Ge = (e) => (
        Fe.observe(e, { childList: !0, subtree: !0, attributes: !0 }), e
    ),
    { attachShadow: Le } = Element.prototype;
T(Element.prototype, {
    attachShadow(e) {
        return Ge(Le.call(this, e));
    },
}),
    Me(Ge(document)),
    t(Ce, document).forEach(Se),
    (document.head.appendChild(document.createElement("style")).textContent =
        "\n  py-script, py-config {\n    display: none;\n  }\n");
let Ne = 0;
const Ue = (e = "py-script") => `${e}-${Ne++}`;
let Je,
    ze = e("py-config");
ze
    ? (Je = ze.getAttribute("src") || ze.textContent)
    : ((ze = e('script[type="py"]')), (Je = ze?.getAttribute("config")));
const qe = (e) => "SCRIPT" === e.tagName,
    De = (e) => {
        F(document, "currentScript", { configurable: !0, get: () => e });
    },
    Xe = () => {
        delete document.currentScript;
    };
((e, r) => {
    if (ue.has(e) || Te.has(e))
        throw new Error(`<script type="${e}"> already registered`);
    if (!ue.has(r?.interpreter)) throw new Error("Unspecified interpreter");
    ue.set(e, ue.get(r?.interpreter)), Ie(e);
    const n = [`script[type="${e}"]`, `${e}-script`];
    for (const t of n) We.set(t, e);
    Pe.push(...n),
        de.push(`${e}-`),
        Te.set(e, { options: T({ env: e }, r), known: new WeakSet() }),
        Me(document),
        t(n.join(",")).forEach(Be);
})("py", {
    config: Je,
    env: "py-script",
    interpreter: "pyodide",
    codeBeforeRunWorker: 'print("codeBeforeRunWorker")',
    codeAfterRunWorker: 'print("codeAfterRunWorker")',
    onBeforeRun(e, t) {
        qe(t) && De(t);
    },
    onBeforeRunAync(e, t) {
        qe(t) && De(t);
    },
    onAfterRun(e, t) {
        qe(t) && Xe();
    },
    onAfterRunAsync(e, t) {
        qe(t) && Xe();
    },
    async onRuntimeReady(e, t) {
        if (qe(t)) {
            const {
                    attributes: { async: r, target: n },
                    src: s,
                } = t,
                o = !!n?.value,
                a = o ? be(n.value) : document.createElement("script-py");
            o || t.after(a),
                a.id || (a.id = Ue()),
                F(t, "target", { value: a });
            const i = s ? await fetch(s).then(z) : t.textContent;
            e["run" + (r ? "Async" : "")](i);
        } else t._pyodide.resolve(e);
    },
});
class Ye extends HTMLElement {
    constructor() {
        super().id || (this.id = Ue()),
            (this._pyodide = Promise.withResolvers());
    }
    async connectedCallback() {
        const { run: e } = await this._pyodide.promise,
            t = e(this.textContent);
        t && this.replaceChildren(t), (this.style.display = "block");
    }
}
customElements.define("py-script", Ye);
