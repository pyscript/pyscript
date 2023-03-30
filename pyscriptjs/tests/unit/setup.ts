import { jest } from '@jest/globals';
import { directoryManifest } from '../../directoryManifest.mjs';

jest.unstable_mockModule('../../src/python_package', async () => ({
    python_package: await directoryManifest('./src/python/'),
}));

globalThis.jest = jest;
