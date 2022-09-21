// taken from https://github.com/Gin-Quin/fast-toml
/* eslint-disable */
"use strict";
let e = "",
    t = 0;
function i(e:any, t:any = 0):any {
    let i;
    for (; (i = e[t++]) && (" " == i || "\t" == i || "\r" == i); );
    return t - 1;
}
function n(e:any):any {
    switch (e[0]) {
        case void 0:
            return "";
        case '"':
            return (function (e) {
                let t,
                    i = 0,
                    n = "";
                for (; (t = e.indexOf("\\", i) + 1); ) {
                    switch (((n += e.slice(i, t - 1)), e[t])) {
                        case "\\":
                            n += "\\";
                            break;
                        case '"':
                            n += '"';
                            break;
                        case "\r":
                            "\n" == e[t + 1] && t++;
                        case "\n":
                            break;
                        case "b":
                            n += "\b";
                            break;
                        case "t":
                            n += "\t";
                            break;
                        case "n":
                            n += "\n";
                            break;
                        case "f":
                            n += "\f";
                            break;
                        case "r":
                            n += "\r";
                            break;
                        case "u":
                            (n += String.fromCharCode(parseInt(e.substr(t + 1, 4), 16))), (t += 4);
                            break;
                        case "U":
                            (n += String.fromCharCode(parseInt(e.substr(t + 1, 8), 16))), (t += 8);
                            break;
                        default:
                            throw r(e[t]);
                    }
                    i = t + 1;
                }
                return n + e.slice(i);
            })(e.slice(1, -1));
        case "'":
            return e.slice(1, -1);
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
        case "+":
        case "-":
        case ".":
            let t = e;
            if ((-1 != t.indexOf("_") && (t = t.replace(/_/g, "")), !isNaN(t))) return +t;
            if ("-" == e[4] && "-" == e[7]) {
                let t = new Date(e);
                if ("Invalid Date" != t.toString()) return t;
            } else if (":" == e[2] && ":" == e[5] && e.length >= 7) {
                let t = new Date("0000-01-01T" + e + "Z");
                if ("Invalid Date" != t.toString()) return t;
            }
            return e;
    }
    switch (e) {
        case "true":
            return !0;
        case "false":
            return !1;
        case "nan":
        case "NaN":
            return !1;
        case "null":
            return null;
        case "inf":
        case "+inf":
        case "Infinity":
        case "+Infinity":
            return 1 / 0;
        case "-inf":
        case "-Infinity":
            return -1 / 0;
    }
    return e;
}
function r(i:any):any {
    let n = (function () {
            let i = e[t],
                n = t;
            "\n" == i && n--;
            let r = 1,
                s = e.lastIndexOf("\n", n),
                a = e.indexOf("\n", n);
            -1 == a && (a = 1 / 0);
            ("," != i && "\n" != i) || (n = s + 1);
            if (-1 == s) return { line: r, column: n + 1, position: n, lineContent: e.slice(0, a).trim() };
            const c = n - s + 1,
                o = e.slice(s + 1, a).trim();
            r++;
            for (; -1 != (s = e.lastIndexOf("\n", s - 1)); ) r++;
            return { line: r, column: c, position: n, lineContent: o };
        })(),
        r = String(n.line);
    return (i += "\n" + r + " |  " + n.lineContent + "\n"), (i += " ".repeat(r.length + n.column + 2) + "^"), SyntaxError(i);
}
function s(e:any, i:any = 0, n:any = !1):any {
    let a,
        c = e[i],
        o = c,
        f = c,
        l = !0,
        u = !1;
    switch (c) {
        case '"':
        case "'":
            if (((a = i + 1), n && e[i + 1] == c && e[i + 2] == c ? ((f = c + c + c), (a += 2)) : (u = !0), "'" == c)) a = e.indexOf(f, a) + 1;
            else
                for (; (a = e.indexOf(f, a) + 1); ) {
                    let t = !0,
                        i = a - 1;
                    for (; "\\" == e[--i]; ) t = !t;
                    if (t) break;
                }
            if (!a) throw r("Missing " + f + " closer");
            if (c != f) a += 2;
            else if (u) {
                let n = e.indexOf("\n", i + 1) + 1;
                if (n && n < a) throw ((t = n - 2), r("Forbidden end-of-line character in single-line string"));
            }
            return a;
        case "(":
            f = ")";
            break;
        case "{":
            f = "}";
            break;
        case "[":
            f = "]";
            break;
        case "<":
            f = ">";
            break;
        default:
            l = !1;
    }
    let h = 0;
    for (; (c = e[++i]); )
        if (c == f) {
            if (0 == h) return i + 1;
            h--;
        } else if ('"' == c || "'" == c) {
            i = s(e, i, n) - 1;
        } else l && c == o && h++;
    throw r("Missing " + f);
}
function a(e:any):any {
    "string" != typeof e && (e = String(e));
    let t:any,
        i:any,
        n:any = -1,
        a:any = "",
        c:any = [];
    for (; (i = e[++n]); )
        switch (i) {
            case ".":
                if (!a) throw r('Unexpected "."');
                c.push(a), (a = "");
                continue;
            case '"':
            case "'":
                if (((t = s(e, n)), t == n + 2)) throw r("Empty string key");
                (a += e.slice(n + 1, t - 1)), (n = t - 1);
                continue;
            default:
                a += i;
        }
    return a && c.push(a), c;
}
function c(e:any, t:any = []):any {
    const i = t.pop();
    for (let i of t) {
        if ("object" != typeof e) {
            throw r('["' + t.slice(0, t.indexOf(i) + 1).join('"].["') + '"]' + " must be an object");
        }
        void 0 === e[i] && (e[i] = {}), (e = e[i]) instanceof Array && (e = e[e.length - 1]);
    }
    return [e, i];
}
class o {
    root:any;
    data:any;
    inlineScopeList: any[];
    constructor() {
        this.root = {};
        this.data = this.root;
        this.inlineScopeList = [];
    }
    get isRoot():any {
        return this.data == this.root;
    }
    set(e:any, t:any):any {
        let [i, n] = c(this.data, a(e));
        if ("string" == typeof i) throw "Wtf the scope is a string. Please report the bug";
        if (n in i) throw r(`Re-writing the key '${e}'`);
        return (i[n] = t), t;
    }
    push(e:any):any {
        if (!(this.data instanceof Array)) {
            if (!this.isRoot) throw r("Missing key");
            (this.data = Object.assign([], this.data)), (this.root = this.data);
        }
        return this.data.push(e), this;
    }
    use(e:any):any {
        return (
            (this.data = (function (e:any, t:any = []) {
                for (let i of t) {
                    //if (void 0 === e) e = lastData[lastElt] = {};
                    //else
                    if ("object" != typeof e) {
                        throw r('["' + t.slice(0, t.indexOf(i) + 1).join('"].["') + '"]' + " must be an object");
                    }
                    void 0 === e[i] && (e[i] = {}), (e = e[i]) instanceof Array && (e = e[e.length - 1]);
                }
                return e;
            })(this.root, a(e))),
            this
        );
    }
    useArray(e:any):any {
        let [t, i] = c(this.root, a(e));
        return (this.data = {}), void 0 === t[i] && (t[i] = []), t[i].push(this.data), this;
    }
    enter(e:any, t:any):any {
        return this.inlineScopeList.push(this.data), this.set(e, t), (this.data = t), this;
    }
    enterArray(e:any):any {
        return this.inlineScopeList.push(this.data), this.push(e), (this.data = e), this;
    }
    exit():any {
        return (this.data = this.inlineScopeList.pop()), this;
    }
}
function f(a:any):any {
    "string" != typeof a && (a = String(a));
    const c = new o(),
        f:any[] = [];
    (e = a), (t = 0);
    let l:any,
        u:any,
        h:any = "",
        d:any = "",
        p:any = e[0],
        w:any = !0;
    const g = ():any => {
        if (((h = h.trimEnd()), w)) h && c.push(n(h));
        else {
            if (!h) throw r("Expected key before =");
            if (!d) throw r("Expected value after =");
            c.set(h, n(d.trimEnd()));
        }
        (h = ""), (d = ""), (w = !0);
    };
    do {
        switch (p) {
            case " ":
                w ? h && (h += p) : d && (d += p);
            case "\t":
            case "\r":
                continue;
            case "#":
                (t = e.indexOf("\n", t + 1) - 1), -2 == t && (t = 1 / 0);
                continue;
            case '"':
            case "'":
                if (!w && d) {
                    d += p;
                    continue;
                }
                let n = e[t + 1] == p && e[t + 2] == p;
                if (((l = s(e, t, !0)), w)) {
                    if (h) throw r("Unexpected " + p);
                    (h += n ? e.slice(t + 2, l - 2) : e.slice(t, l)), (t = l);
                } else (d = e.slice(t, l)), (t = l), n && ((d = d.slice(2, -2)), "\n" == d[1] ? (d = d[0] + d.slice(2)) : "\r" == d[1] && "\n" == d[2] && (d = d[0] + d.slice(3)));
                if (((t = i(e, t)), (p = e[t]), p && "," != p && "\n" != p && "#" != p && "}" != p && "]" != p && "=" != p)) throw r("Unexpected character after end of string");
                t--;
                continue;
            case "\n":
            case ",":
            case void 0:
                g();
                continue;
            case "[":
            case "{":
                if (((u = "[" == p ? "]" : "}"), w && !f.length)) {
                    if (h) throw r("Unexpected " + p);
                    if (((l = s(e, t)), "[" == p && "[" == e[t + 1])) {
                        if ("]" != e[l - 2]) throw r("Missing ]]");
                        c.useArray(e.slice(t + 2, l - 2));
                    } else c.use(e.slice(t + 1, l - 1));
                    t = l;
                } else if (w) {
                    if (h) throw r("Unexpected " + p);
                    c.enterArray("[" == p ? [] : {}), f.push(u);
                } else {
                    if (d) throw r("Unexpected " + p);
                    c.enter(h.trimEnd(), "[" == p ? [] : {}), f.push(u), (h = ""), (w = !0);
                }
                continue;
            case "]":
            case "}":
                if ((h && g(), f.pop() != p)) throw r("Unexpected " + p);
                if ((c.exit(), (t = i(e, t + 1)), (p = e[t]), p && "," != p && "\n" != p && "#" != p && "}" != p && "]" != p)) throw r("Unexpected character after end of scope");
                t--;
                continue;
            case "=":
                if (!w) throw r("Unexpected " + p);
                if (!h) throw r("Missing key before " + p);
                w = !1;
                continue;
            default:
                w ? (h += p) : (d += p);
        }
    } while ((p = e[++t]) || h);
    if (f.length) throw r("Missing " + f.pop());
    return c.root;
}
let l = null,
    u = null;
function h():any {
    let e = "";
    for (let t of arguments) e += "string" == typeof t ? t : t[0];
    return f(e);
}

export const toml = (
    (h.parse = f),
    h
);
