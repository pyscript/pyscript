export const isArray: (arg: any) => arg is any[];
export const assign: {
    <T extends {}, U>(target: T, source: U): T & U;
    <T_1 extends {}, U_1, V>(target: T_1, source1: U_1, source2: V): T_1 & U_1 & V;
    <T_2 extends {}, U_2, V_1, W>(target: T_2, source1: U_2, source2: V_1, source3: W): T_2 & U_2 & V_1 & W;
    (target: object, ...sources: any[]): any;
};
export const create: {
    (o: object): any;
    (o: object, properties: PropertyDescriptorMap & ThisType<any>): any;
};
export const defineProperty: <T>(o: T, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) => T;
export const all: {
    <T>(values: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>[]>;
    <T_1 extends [] | readonly unknown[]>(values: T_1): Promise<{ -readonly [P in keyof T_1]: Awaited<T_1[P]>; }>;
};
export const resolve: {
    (): Promise<void>;
    <T>(value: T): Promise<Awaited<T>>;
    <T_1>(value: T_1 | PromiseLike<T_1>): Promise<Awaited<T_1>>;
};
export function absoluteURL(path: any, base?: string): string;
