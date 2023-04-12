// XXX: what about code duplications?
// I think that with the current build configuration, the code for logger,
// remote_interpreter and everything which is included from there is
// bundled/fetched/executed twice, one in pyscript.js and one in
// worker_interpreter.js. Is this true?

import { getLogger } from '../logger';
import { RemoteInterpreter } from '../remote_interpreter';
import * as Synclink from 'synclink';

const logger = getLogger('worker');
logger.info('Interpreter worker starting...');

async function worker_initialize(cfg) {
    const remote_interpreter = new RemoteInterpreter(cfg.src);
    // this is the equivalent of await import(interpreterURL)
    logger.info(`Downloading ${cfg.name}...`); // XXX we should use logStatus
    importScripts(cfg.src);

    logger.info('worker_initialize() complete');
    return Synclink.proxy(remote_interpreter);
}

Synclink.expose(worker_initialize);

export type { worker_initialize };
