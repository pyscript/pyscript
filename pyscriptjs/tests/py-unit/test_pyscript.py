import sys
import textwrap
from unittest.mock import Mock

import pyscript


class TestElement:
    def test_id_is_correct(self):
        el = pyscript.Element("something")
        assert el.id == "something"

    def test_element(self, monkeypatch):
        el = pyscript.Element("something")
        document_mock = Mock()
        call_result = "some_result"
        document_mock.querySelector = Mock(return_value=call_result)
        monkeypatch.setattr(pyscript, "document", document_mock)
        assert not el._element
        real_element = el.element
        assert real_element
        assert pyscript.document.querySelector.call_count == 1
        pyscript.document.querySelector.assert_called_with("#something")
        assert real_element == call_result


def test_format_mime_str():
    obj = "just a string"
    out, mime = pyscript.format_mime(obj)
    assert out == obj
    assert mime == "text/plain"


def test_format_mime_str_escaping():
    obj = "<p>hello</p>"
    out, mime = pyscript.format_mime(obj)
    assert out == "&lt;p&gt;hello&lt;/p&gt;"
    assert mime == "text/plain"


def test_format_mime_repr_escaping():
    out, mime = pyscript.format_mime(sys)
    assert out == "&lt;module 'sys' (built-in)&gt;"
    assert mime == "text/plain"


def test_format_mime_HTML():
    obj = pyscript.HTML("<p>hello</p>")
    out, mime = pyscript.format_mime(obj)
    assert out == "<p>hello</p>"
    assert mime == "text/html"


def test_uses_top_level_await():
    # Basic Case
    src = "x = 1"
    assert pyscript.uses_top_level_await(src) is False

    # Comments are not top-level await
    src = textwrap.dedent(
        """
        #await async for async with asyncio
        """
    )

    assert pyscript.uses_top_level_await(src) is False

    # Top-level-await cases
    src = textwrap.dedent(
        """
        async def foo():
            pass
        await foo
        """
    )
    assert pyscript.uses_top_level_await(src) is True

    src = textwrap.dedent(
        """
        async with object():
            pass
        """
    )
    assert pyscript.uses_top_level_await(src) is True

    src = textwrap.dedent(
        """
        async for _ in range(10):
            pass
        """
    )
    assert pyscript.uses_top_level_await(src) is True

    # Acceptable await/async for/async with cases
    src = textwrap.dedent(
        """
        async def foo():
            await foo()
        """
    )
    assert pyscript.uses_top_level_await(src) is False

    src = textwrap.dedent(
        """
        async def foo():
            async with object():
                pass
        """
    )
    assert pyscript.uses_top_level_await(src) is False

    src = textwrap.dedent(
        """
        async def foo():
            async for _ in range(10):
                pass
        """
    )
    assert pyscript.uses_top_level_await(src) is False


def test_set_version_info():
    version_string = "1234.56.78.ABCD"
    pyscript._set_version_info(version_string)
    assert pyscript.__version__ == version_string
    assert pyscript.version_info == (1234, 56, 78, "ABCD")
    #
    # for backwards compatibility, should be killed eventually
    assert pyscript.PyScript.__version__ == pyscript.__version__
    assert pyscript.PyScript.version_info == pyscript.version_info


class MyDeprecatedGlobal(pyscript.DeprecatedGlobal):
    """
    A subclass of DeprecatedGlobal, for tests.

    Instead of showing warnings into the DOM (which we don't have inside unit
    tests), we record the warnings into a field.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.warnings = []

    def _show_warning(self, message):
        self.warnings.append(message)


class TestDeprecatedGlobal:
    def test_show_warning_override(self):
        """
        Test that our overriding of _show_warning actually works.
        """
        glob = MyDeprecatedGlobal("foo", None, "my message")
        glob._show_warning("foo")
        glob._show_warning("bar")
        assert glob.warnings == ["foo", "bar"]

    def test_getattr(self):
        class MyFakeObject:
            name = "FooBar"

        glob = MyDeprecatedGlobal("MyFakeObject", MyFakeObject, "this is my warning")
        assert glob.name == "FooBar"
        assert glob.warnings == ["this is my warning"]

    def test_dont_show_warning_twice(self):
        class MyFakeObject:
            name = "foo"
            surname = "bar"

        glob = MyDeprecatedGlobal("MyFakeObject", MyFakeObject, "this is my warning")
        assert glob.name == "foo"
        assert glob.surname == "bar"
        assert len(glob.warnings) == 1

    def test_call(self):
        def foo(x, y):
            return x + y

        glob = MyDeprecatedGlobal("foo", foo, "this is my warning")
        assert glob(1, y=2) == 3
        assert glob.warnings == ["this is my warning"]
