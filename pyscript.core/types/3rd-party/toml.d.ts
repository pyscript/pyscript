/*! (c) Jak Wings - MIT */ declare class e extends SyntaxError {
    constructor(r: any, { offset: t, line: e, column: n }: {
        offset: any;
        line: any;
        column: any;
    });
    offset: any;
    line: any;
    column: any;
}
declare function n(n: any): any;
export { e as SyntaxError, n as parse };
