export { ie as default };
declare function ie(e: any, ...r: any[]): any;
declare namespace ie {
    import transfer = m.transfer;
    export { transfer };
}
declare function m(t: any, { parse: n, stringify: r, transform: u }?: JSON): any;
declare namespace m {
    function transfer(...e: any[]): any[];
}
