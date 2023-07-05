import { calculateFetchPaths } from '../../src/plugins/calculateFetchPaths';
import { FetchConfig } from '../../src/pyconfig';

describe('CalculateFetchPaths', () => {
    it('should calculate paths when only from is provided', () => {
        const fetch_cfg: FetchConfig[] = [{ from: 'http://a.com/data.csv' }];
        const res = calculateFetchPaths(fetch_cfg);
        expect(res).toStrictEqual([{ url: 'http://a.com/data.csv', path: 'data.csv' }]);
    });

    it('should calculate paths when only files is provided', () => {
        const fetch_cfg: FetchConfig[] = [{ files: ['foo/__init__.py', 'foo/mod.py', 'foo2/mod.py'] }];
        const res = calculateFetchPaths(fetch_cfg);
        expect(res).toStrictEqual([
            { url: 'foo/__init__.py', path: 'foo/__init__.py' },
            { url: 'foo/mod.py', path: 'foo/mod.py' },
            { url: 'foo2/mod.py', path: 'foo2/mod.py' },
        ]);
    });

    it('should calculate paths when files and to_folder is provided', () => {
        const fetch_cfg: FetchConfig[] = [{ files: ['foo/__init__.py', 'foo/mod.py'], to_folder: '/my/lib/' }];
        const res = calculateFetchPaths(fetch_cfg);
        expect(res).toStrictEqual([
            { url: 'foo/__init__.py', path: '/my/lib/foo/__init__.py' },
            { url: 'foo/mod.py', path: '/my/lib/foo/mod.py' },
        ]);
    });

    it('should calculate paths when from and files and to_folder is provided', () => {
        const fetch_cfg: FetchConfig[] = [
            { from: 'http://a.com/download/', files: ['foo/__init__.py', 'foo/mod.py'], to_folder: '/my/lib/' },
        ];
        const res = calculateFetchPaths(fetch_cfg);
        expect(res).toStrictEqual([
            { url: 'http://a.com/download/foo/__init__.py', path: '/my/lib/foo/__init__.py' },
            { url: 'http://a.com/download/foo/mod.py', path: '/my/lib/foo/mod.py' },
        ]);
    });

    it("should error out while calculating paths when filename cannot be determined from 'from'", () => {
        const fetch_cfg: FetchConfig[] = [{ from: 'http://google.com/', to_folder: '/tmp' }];
        expect(() => calculateFetchPaths(fetch_cfg)).toThrowError(
            "Couldn't determine the filename from the path http://google.com/",
        );
    });

    it('should calculate paths when to_file is explicitly supplied', () => {
        const fetch_cfg: FetchConfig[] = [{ from: 'http://a.com/data.csv?version=1', to_file: 'pkg/tmp/data.csv' }];
        const res = calculateFetchPaths(fetch_cfg);
        expect(res).toStrictEqual([{ path: 'pkg/tmp/data.csv', url: 'http://a.com/data.csv?version=1' }]);
    });

    it('should error out when both to_file and files parameters are provided', () => {
        const fetch_cfg: FetchConfig[] = [
            { from: 'http://a.com/data.csv?version=1', to_file: 'pkg/tmp/data.csv', files: ['a.py', 'b.py'] },
        ];
        expect(() => calculateFetchPaths(fetch_cfg)).toThrowError(
            "Cannot use 'to_file' and 'files' parameters together!",
        );
    });
});
