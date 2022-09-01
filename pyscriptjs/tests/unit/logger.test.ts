import { jest } from '@jest/globals';
import { getLogger } from '../../src/logger';

describe('getLogger', () => {
    it('getLogger caches results', () => {
        let a1 = getLogger('a');
        let b = getLogger('b');
        let a2 = getLogger('a');

        expect(a1).not.toBe(b);
        expect(a1).toBe(a2);
    });

    it('logger.info prints to console.info', () => {
        console.info = jest.fn();

        const logger = getLogger('prefix1');
        logger.info('hello world')
        expect(console.info).toHaveBeenCalledWith(
            '[prefix1] hello world'
        )
    });

    it('logger.info handles multiple args', () => {
        console.info = jest.fn();

        const logger = getLogger('prefix2');
        logger.info('hello', 'world', 1, 2, 3)
        expect(console.info).toHaveBeenCalledWith(
            '[prefix2] hello', 'world', 1, 2, 3
        )
    });

    it('logger.{debug,warn,error} also works', () => {
        console.info = jest.fn();
        console.debug = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();

        const logger = getLogger('prefix3');
        logger.debug('this is a debug');
        logger.warn('this is a warning');
        logger.error('this is an error');

        expect(console.info).not.toHaveBeenCalled();
        expect(console.debug).toHaveBeenCalledWith(
            '[prefix3] this is a debug'
        )
        expect(console.warn).toHaveBeenCalledWith(
            '[prefix3] this is a warning'
        )
        expect(console.error).toHaveBeenCalledWith(
            '[prefix3] this is an error'
        )
    });

});
