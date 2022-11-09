import { calculatePaths } from "../../src/plugins/fetch";
import { FetchConfig } from "../../src/pyconfig";

describe("CalculateFetchPaths", () => {
    it("should calculate paths when only from is provided", () => {
      const fetch_cfg: FetchConfig[] = [{from: "http://a.com/data.csv" }];
      const [paths, fetchPaths] = calculatePaths(fetch_cfg);
      expect(paths).toStrictEqual(["./data.csv"]);
      expect(fetchPaths).toStrictEqual(["http://a.com/data.csv"]);
    })

    it("should calculate paths when only files is provided", () => {
      const fetch_cfg: FetchConfig[] = [{files: ["foo/__init__.py", "foo/mod.py"] }];
      const [paths, fetchPaths] = calculatePaths(fetch_cfg);
      expect(paths).toStrictEqual(["./foo/__init__.py", "./foo/mod.py"]);
      expect(fetchPaths).toStrictEqual(["foo/__init__.py", "foo/mod.py"]);
    })

    it("should calculate paths when files and to_folder is provided", () => {
      const fetch_cfg: FetchConfig[] = [{files: ["foo/__init__.py", "foo/mod.py"], to_folder: "/my/lib/"}];
      const [paths, fetchPaths] = calculatePaths(fetch_cfg);
      expect(paths).toStrictEqual(["/my/lib/foo/__init__.py", "/my/lib/foo/mod.py"]);
      expect(fetchPaths).toStrictEqual(["foo/__init__.py", "foo/mod.py"]);
    })

    it("should calculate paths when from and files and to_folder is provided", () => {
      const fetch_cfg: FetchConfig[] = [{from: "http://a.com/download/", files: ["foo/__init__.py", "foo/mod.py"], to_folder: "/my/lib/"}];
      const [paths, fetchPaths] = calculatePaths(fetch_cfg);
      expect(paths).toStrictEqual(["/my/lib/foo/__init__.py", "/my/lib/foo/mod.py"]);
      expect(fetchPaths).toStrictEqual(["http://a.com/download/foo/__init__.py", "http://a.com/download/foo/mod.py"]);
    })

    it("should error out while calculating paths when filename cannot be determined from 'from'", () => {
      const fetch_cfg: FetchConfig[] = [{from: "http://google.com/", to_folder: "/tmp"}];
      expect(()=>calculatePaths(fetch_cfg)).toThrowError("Couldn't determine the filename from the path http://google.com/");
    })

    it("should calculate paths when to_file is explicitly supplied", () => {
      const fetch_cfg: FetchConfig[] = [{from: "http://a.com/data.csv?version=1", to_file: "pkg/tmp/data.csv"}];
      const [paths, fetchPaths] = calculatePaths(fetch_cfg);
      expect(paths).toStrictEqual(["./pkg/tmp/data.csv"]);
      expect(fetchPaths).toStrictEqual(["http://a.com/data.csv?version=1"]);
    })

    it("should error out when both to_file and files parameters are provided", () => {
      const fetch_cfg: FetchConfig[] = [{from: "http://a.com/data.csv?version=1", to_file: "pkg/tmp/data.csv", files: ["a.py", "b.py"]}];
      expect(()=>calculatePaths(fetch_cfg)).toThrowError("Cannot use 'to_file' and 'files' parameters together!");
    })
})
