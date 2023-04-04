// This file exists because I can only convince jest to mock real file system
// files, not fake modules. This confuses me because jest.mock has a virtual
// option for mocking things that don't live in the file system but it doesn't
// seem to work.

// @ts-ignore
import python_package from 'pyscript_python_package.esbuild_injected.json';
declare const python_package: { dirs: string[]; files: [string, string][] };
export { python_package };
