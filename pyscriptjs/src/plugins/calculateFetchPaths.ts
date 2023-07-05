import { joinPaths } from '../utils';
import { FetchConfig } from '../pyconfig';
import { UserError, ErrorCode } from '../exceptions';

export function calculateFetchPaths(fetch_cfg: FetchConfig[]): { url: string; path: string }[] {
    for (const { files, to_file, from = '' } of fetch_cfg) {
        if (files !== undefined && to_file !== undefined) {
            throw new UserError(ErrorCode.BAD_CONFIG, `Cannot use 'to_file' and 'files' parameters together!`);
        }
        if (files === undefined && to_file === undefined && from.endsWith('/')) {
            throw new UserError(
                ErrorCode.BAD_CONFIG,
                `Couldn't determine the filename from the path ${from}, please supply 'to_file' parameter.`,
            );
        }
    }

    return fetch_cfg.flatMap(function ({ from = '', to_folder = '.', to_file, files }) {
        if (files !== undefined) {
            return files.map(file => ({ url: joinPaths([from, file]), path: joinPaths([to_folder, file]) }));
        }
        const filename = to_file || from.slice(1 + from.lastIndexOf('/'));
        const to_path = joinPaths([to_folder, filename]);
        return [{ url: from, path: to_path }];
    });
}
