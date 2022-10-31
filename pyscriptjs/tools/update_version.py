import argparse
import re
import json
import os
from pathlib import Path
from typing import Callable

version_pattern = '(export const version:JSON = <JSON><unknown>)({.+})'

def get_runtimets_path() -> Path:
    """
    Get the absolute path of 'runtime.ts'

    Since we don't always know what the current working directory
    will be (in tests/builds/workflows etc), search the file path
    for "pyscript/pyscriptjs" and work up from there.
    """

    currentPath = Path(os.path.abspath(__file__)).resolve()
    pycsriptjs_path = [p for p in currentPath.parents if p.stem == "pyscriptjs"][0]
    runtime_path = pycsriptjs_path / 'src' / 'runtime.ts'
    return runtime_path

def get_current_version(runtime_path) -> dict:
    """
    Get the 
    """
    with open(runtime_path, 'r') as fp:
        return json.loads(re.search(version_pattern, fp.read()).group(2))
        
def set_version(**kwargs) -> None:
    print(f"Setting version with {kwargs}")
    runtime_path = get_runtimets_path()

    version_info = get_current_version(runtime_path)

    for key, value in kwargs.items():
        if key in version_info:
            version_info[key] = value
        else:
            raise KeyError(f"set_version() only accepts the following keys: {*version_info.keys(),}")

    with open(runtime_path, 'r') as fp:
        updated_runtime = re.sub(version_pattern, lambda m: m.group(1) + str(version_info).replace("'", '"') , fp.read())

    with open(runtime_path, 'w') as fp:
        fp.write(updated_runtime)

def set_dotted_version(dotted_version: str, **kwargs) -> None:
    """
    Set the full version info using 'dotted notation' [YYYY].[MM].[(patch)].releaselevel
    """
    year, month, patch, releaselevel = dotted_version.split(".")

    year = int_with_length(4)(year)
    month = int_with_length(2)(month)
    patch = int(patch)

    set_version(year=year, month=month, patch=patch, releaselevel=releaselevel)

def int_with_length(length: int) -> Callable[[str], int]:
    def validator(arg: str) -> int:
        if len(arg) != length:
            raise argparse.ArgumentError(f"Argument must be of length {length}")
        return int(arg)
    return validator


def init_argparse() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description = "Set or update the PyScript version"
    )

    parser.add_argument(
        "-y", "--year",
        type=int_with_length(4),
        help="The year field of the verson [YYYY].[MM].[(patch)].releaselevel. Must be 4 digits."
    )

    parser.add_argument(
        "-m", "--month",
        type=int,
        help="The month field of the verson [YYYY].[MM].[(patch)].releaselevel. Must be 2 digits."
    )

    parser.add_argument(
        "-p", "--patch",
        type=int,
        help="The patch field of the verson [YYYY].[MM].[(patch)].releaselevel"
    )

    parser.add_argument(
        "--releaselevel",
        type=str,
        help="The releaselevel field of the verson [YYYY].[MM].[(patch)].releaselevel"
    )
    
    parser.add_argument(
        "--dotted",
        type=str,
        help="The version in [YYYY].[MM].[(patch)].releaselevel format"
    )


    return parser


if __name__ == "__main__":
    parser = init_argparse()
    args = vars(parser.parse_args())

    #Don't allowed dotted notation and individual keys
    if args['dotted'] is not None and [key for key in args if args[key] is not None]:
        raise ValueError(f"Dotted notation cannot be combined with individual parameters\nArguments f{args}")

    usable_args = {a:args[a] for a in args if (args[a] is not None)}
    print(usable_args)
    
    if usable_args: set_version(**usable_args)
    else: raise ValueError("No arguments were passed to update_version.py")