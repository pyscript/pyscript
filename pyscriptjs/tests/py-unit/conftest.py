"""All data required for testing examples"""
import pathlib
import sys

# current working directory
base_path = pathlib.Path().absolute()
python_source = base_path / "src" / "python"
sys.path.append(str(python_source))
