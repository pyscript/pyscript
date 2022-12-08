"""All data required for testing examples"""
import pathlib
import sys

# current working directory
base_path = pathlib.Path().absolute()
# add pyscript folder to path
python_source = base_path / "src" / "python"
sys.path.append(str(python_source))

# add Python plugins folder to path
python_plugins_source = base_path / "src" / "plugins" / "python"
sys.path.append(str(python_plugins_source))
