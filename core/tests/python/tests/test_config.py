"""
Tests for the pyscript.config dictionary.
"""

from upytest import is_micropython

from pyscript import config, document, fetch


async def test_config_reads_expected_settings_correctly():
    """
    The config dictionary should read expected settings for this test suite.

    Just grab the raw JSON for the settings and compare it to the config
    dictionary.
    """
    settings = "/settings_mpy.json" if is_micropython else "/settings_py.json"
    url = document.location.href.rsplit("/", 1)[0] + settings
    raw_config = await fetch(url).json()
    for key, value in raw_config.items():
        assert config[key] == value, f"Expected {key} to be {value}, got {config[key]}"
