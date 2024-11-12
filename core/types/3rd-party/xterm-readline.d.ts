declare var v: any;
declare var k: boolean;
declare namespace i {
    export let __esModule: boolean;
    export { Readline };
}
declare class Readline {
    highlighter: {
        highlight(t: any, e: any): any;
        highlightPrompt(t: any): any;
        highlightChar(t: any, e: any): boolean;
    };
    history: {
        entries: any[];
        cursor: number;
        maxEntries: any;
        saveToLocalStorage(): void;
        restoreFromLocalStorage(): void;
        append(t: any): void;
        resetCursor(): void;
        next(): any;
        prev(): any;
    };
    disposables: any[];
    watermark: number;
    highWatermark: number;
    lowWatermark: number;
    highWater: boolean;
    state: {
        line: {
            buf: string;
            pos: number;
            buffer(): string;
            pos_buffer(): string;
            length(): number;
            char_length(): number;
            update(t: any, e: any): void;
            insert(t: any): boolean;
            moveBack(t: any): boolean;
            moveForward(t: any): boolean;
            moveHome(): boolean;
            moveEnd(): boolean;
            startOfLine(): number;
            endOfLine(): number;
            moveLineUp(t: any): boolean;
            moveLineDown(t: any): boolean;
            set_pos(t: any): void;
            prevPos(t: any): number;
            nextPos(t: any): number;
            backspace(t: any): boolean;
            delete(t: any): boolean;
            deleteEndOfLine(): boolean;
        };
        highlighting: boolean;
        prompt: any;
        tty: any;
        highlighter: any;
        history: any;
        promptSize: any;
        layout: c;
        buffer(): string;
        shouldHighlight(): boolean;
        clearScreen(): void;
        editInsert(t: any): void;
        update(t: any): void;
        editBackspace(t: any): void;
        editDelete(t: any): void;
        editDeleteEndOfLine(): void;
        refresh(): void;
        moveCursorBack(t: any): void;
        moveCursorForward(t: any): void;
        moveCursorUp(t: any): void;
        moveCursorDown(t: any): void;
        moveCursorHome(): void;
        moveCursorEnd(): void;
        moveCursorToEnd(): void;
        previousHistory(): void;
        nextHistory(): void;
        moveCursor(): void;
    };
    checkHandler: () => boolean;
    ctrlCHandler: () => void;
    pauseHandler: (t: any) => void;
    activate(t: any): void;
    term: any;
    dispose(): void;
    appendHistory(t: any): void;
    setHighlighter(t: any): void;
    setCheckHandler(t: any): void;
    setCtrlCHandler(t: any): void;
    setPauseHandler(t: any): void;
    writeReady(): boolean;
    write(t: any): void;
    print(t: any): void;
    println(t: any): void;
    output(): this;
    tty(): {
        tabWidth: any;
        col: any;
        row: any;
        out: any;
        write(t: any): any;
        print(t: any): any;
        println(t: any): any;
        clearScreen(): void;
        calculatePosition(t: any, e: any): any;
        computeLayout(t: any, e: any): {
            promptSize: any;
            cursor: any;
            end: any;
        };
        refreshLine(t: any, e: any, s: any, i: any, r: any): void;
        clearOldRows(t: any): void;
        moveCursor(t: any, e: any): void;
    };
    read(t: any): Promise<any>;
    activeRead: {
        prompt: any;
        resolve: (value: any) => void;
        reject: (reason?: any) => void;
    };
    handleKeyEvent(t: any): boolean;
    readData(t: any): void;
    readPaste(t: any): void;
    readKey(t: any): void;
}
declare class c {
    constructor(t: any);
    promptSize: any;
    cursor: u;
    end: u;
}
declare class u {
    constructor(t: any, e: any);
    row: any;
    col: any;
}
export { v as Readline, k as __esModule, i as default };
