export const NAMESPACE: "@pyscript.fs";
export const ERROR: "storage permissions not granted";
export const idb: any;
export function getFileSystemDirectoryHandle(options: {
    id?: string;
    mode?: "read" | "readwrite";
    hint?: "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos";
}): Promise<FileSystemDirectoryHandle>;
