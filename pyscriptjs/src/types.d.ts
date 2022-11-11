import type { PyProxy, PyProxyClass, PyodideInterface } from "pyodide"

/* eslint-disable @typescript-eslint/no-explicit-any */

export declare interface PyProxy extends PyProxy  {
  (...args: any[]): any;
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

type Path = {
  exists: boolean;
  parentExists: boolean
}

export declare type FileSystem = {
  (path: string): Promise<string>;
  analyzePath(path: string): Path;
  mkdir(path: string): void;
  write(stream: object, buffer: Uint8Array, offset: number, length: number,  position: number): void;
  close(stream: any): void;
  open(path: string, mode: string): object;
}

export declare interface PyodideInterface extends PyodideInterface {
  FS: FileSystem
}