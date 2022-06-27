import type { loadPyodide } from 'pyodide';

// The current release doesn't export `PyodideInterface` type
export type PyodideInterface = Awaited<ReturnType<typeof loadPyodide>>;
