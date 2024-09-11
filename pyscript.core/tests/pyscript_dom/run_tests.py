print("tests starting")
import pytest
from pyscript import window

args = window.location.search.replace("?", "").split("&")

pytest.main(args)
