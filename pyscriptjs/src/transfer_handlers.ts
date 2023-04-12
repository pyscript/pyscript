/* eslint-disable */

import { transferHandlers } from 'synclink';
import type { TransferHandler } from 'synclink';

const throwHandler = transferHandlers.get('throw') as TransferHandler<
    { value: unknown },
    { value: { $$isUserError: boolean } }
>;

function setupThrowTransfer() {
    /**
     * Monkey patching the error transfer handler to preserve the `$$isUserError`
     * marker so as to detect `UserError` subclasses in the error handling code.
     */
    const old_error_transfer_handler = throwHandler.serialize.bind(throwHandler) as typeof throwHandler.serialize;
    function new_error_transfer_handler({ value }: { value: { $$isUserError: boolean } }) {
        const result = old_error_transfer_handler({ value });
        result[0].value.$$isUserError = value.$$isUserError;
        return result;
    }
    throwHandler.serialize = new_error_transfer_handler;
}

const proxyValuesMarker = Symbol('proxyValues');
type ProxyValuesMarked = { [proxyValuesMarker]: boolean };

export function proxyValues<T>(obj: T): T & ProxyValuesMarked {
    return Object.assign(obj as any, { [proxyValuesMarker]: true }) as any;
}

export const isObject = (val: unknown): val is object =>
    (typeof val === 'object' && val !== null) || typeof val === 'function';

const proxyTransferHandler = transferHandlers.get('proxy');

function mapValues(obj, func) {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, func(v)]));
}

export const proxyValuesTransferHandler: TransferHandler<any, any> = {
    canHandle: (val): val is ProxyValuesMarked => isObject(val) && (val as ProxyValuesMarked)[proxyValuesMarker],
    serialize(obj) {
        const transferList = [];
        let serialized = mapValues(obj, v => {
            const [newV, transfers] = proxyTransferHandler.serialize(v);
            transferList.push(...transfers);
            return newV;
        });
        return [serialized, transferList];
    },
    deserialize(obj) {
        // @ts-ignore
        return mapValues(obj, proxyTransferHandler.deserialize);
    },
};

function autoSyncifyFunction(f: any): any {
    return (...args) => f(...args).syncify();
}

export function autoSyncifyObject(o: object): object {
    return mapValues(o, autoSyncifyFunction);
}

function setupProxyValuesTransfer() {
    transferHandlers.set('proxyValues', proxyValuesTransferHandler);
}

export function initTransferHandlers() {
    setupThrowTransfer();
    setupProxyValuesTransfer();
}
