import type { PyProxy, PyProxyClass } from "pyodide"


export declare type PyProxy = PyProxy & {
  connect(): void;
  get(value: string): PyProxyClass;
  set(id: string, proxy: PyProxyClass): void;
}


export declare interface PyScript extends HTMLElement {
  getPySrc(): Promise<strin>
}
