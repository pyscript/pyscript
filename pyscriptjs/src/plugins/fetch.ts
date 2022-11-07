import { joinPaths } from '../utils';
import { FetchConfig } from "../pyconfig";

export function calculatePaths(fetch_cfg: FetchConfig[]) {
    const fetchPaths: string[] = [];
    const paths: string[] = [];
    fetch_cfg.forEach(function (each_fetch_cfg: FetchConfig) {
        const from = each_fetch_cfg.from || "";
        const to_folder = each_fetch_cfg.to_folder || ".";
        const to_file = each_fetch_cfg.to_file;
        const files = each_fetch_cfg.files;
        if (files !== undefined)
        {
            if (to_file !== undefined)
            {
                throw Error(`Cannot use 'to_file' and 'files' parameters together!`);
            }
            for (const each_f of files)
            {
                const each_fetch_path = joinPaths([from, each_f]);
                fetchPaths.push(each_fetch_path);
                const each_path = joinPaths([to_folder, each_f]);
                paths.push(each_path);
            }
        }
        else
        {
            fetchPaths.push(from);
            const filename = to_file || from.split('/').pop();
            if (filename === '') {
                throw Error(`Couldn't determine the filename from the path ${from}, supply ${to_file} parameter!`);
            }
            else {
                paths.push(joinPaths([to_folder, filename]));
            }
        }
    });
    return [paths, fetchPaths];
}
