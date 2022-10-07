"""All data required for testing examples"""
import pytest

from .support import Logger


@pytest.fixture(scope="session")
def logger():
    return Logger()
