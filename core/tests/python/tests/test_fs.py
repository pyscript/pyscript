"""
**INCOMPLETE** tests for the pyscript.fs module.

Note: Full unit tests require Chromium browser and user interaction
to grant filesystem permissions. These tests focus on validation logic and
error handling that can be tested without permissions.
"""

import upytest
from pyscript import fs


def test_mounted_dict_accessible():
    """
    The mounted dictionary should be accessible and be a dict.
    """
    assert hasattr(fs, "mounted")
    assert isinstance(fs.mounted, dict)


def test_functions_exist():
    """
    All public fs functions should exist and be callable.
    """
    assert hasattr(fs, "mount")
    assert callable(fs.mount)
    assert hasattr(fs, "sync")
    assert callable(fs.sync)
    assert hasattr(fs, "unmount")
    assert callable(fs.unmount)
    assert hasattr(fs, "revoke")
    assert callable(fs.revoke)


async def test_sync_unmounted_path():
    """
    Syncing an unmounted path should raise KeyError with helpful message.
    """
    with upytest.raises(KeyError):
        await fs.sync("/nonexistent")


async def test_unmount_unmounted_path():
    """
    Unmounting an unmounted path should raise KeyError with helpful message.
    """
    with upytest.raises(KeyError):
        await fs.unmount("/nonexistent")


def test_check_permission_function_exists():
    """
    The internal _check_permission function should exist.
    """
    assert hasattr(fs, "_check_permission")
    assert callable(fs._check_permission)
