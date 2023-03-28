import { jest } from '@jest/globals';
import { readFileSync } from 'fs';

jest.unstable_mockModule('./python/pyscript/__init__.py', () => ({
    default: readFileSync('./src/python/pyscript/__init__.py'),
}));
