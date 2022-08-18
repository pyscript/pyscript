export abstract class RuntimeEngine extends Object {
    abstract src: string;
    abstract name?: string;
    abstract lang?: string;

    abstract initialize(): Promise<void>;
}

export type AppConfig = {
    autoclose_loader: boolean;
    name?: string;
    version?: string;
    runtimes?: Array<RuntimeEngine>;
};
