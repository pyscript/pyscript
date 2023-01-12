"""All data required for testing examples"""
import pathlib
import sys

import pytest

# current working directory
base_path = pathlib.Path().absolute()
# add pyscript folder to path
python_source = base_path / "src" / "python"
sys.path.append(str(python_source))

# add Python plugins folder to path
python_plugins_source = base_path / "src" / "plugins" / "python"
sys.path.append(str(python_plugins_source))

import pyscript_plugins_tester as ppt  # noqa: E402

# patch pyscript module where needed
import pyscript  # noqa: E402

pyscript.define_custom_element = ppt.define_custom_element


@pytest.fixture()
def plugins_manager():
    """return a new instance of a Test version the PyScript application plugins manager"""
    yield ppt.plugins_manager  # PluginsManager()
    ppt.plugins_manager.reset()
