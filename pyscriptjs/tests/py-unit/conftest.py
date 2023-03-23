"""All data required for testing examples"""
import sys
from pathlib import Path

import pytest

pyscriptjs = Path(__file__).parents[2]

import pytest  # noqa

pyscriptjs = Path(__file__).parents[2]

# add pyscript folder to path
python_source = pyscriptjs / "src" / "python"
sys.path.append(str(python_source))

# add Python plugins folder to path
python_plugins_source = pyscriptjs / "src" / "plugins" / "python"
sys.path.append(str(python_plugins_source))

# patch pyscript module where needed
import pyscript  # noqa: E402
import pyscript_plugins_tester as ppt  # noqa: E402

pyscript.define_custom_element = ppt.define_custom_element


@pytest.fixture()
def plugins_manager():
    """return a new instance of a Test version the PyScript application plugins manager"""
    yield ppt.plugins_manager  # PluginsManager()
    ppt.plugins_manager.reset()
