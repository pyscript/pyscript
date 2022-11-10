import type { PyProxy, PyProxyClass } from "pyodide"

/* eslint-disable @typescript-eslint/no-explicit-any */

export declare type PyProxy = PyProxy & {
  connect(): void;
  get(value: string): function | object;
  set(id: string, proxy: PyProxyClass): void;
}


export declare interface PyScript extends HTMLElement {
  getPySrc(): Promise<string>
}

export declare type Display = {
  (obj: any): void;
  callKwargs(obj: any, kwargs: object): void;
}

export declare type CurrentDisplayTarget = {
  (targetId: string): void;
}
