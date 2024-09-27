"""
Ensure the pyscript.test function behaves as expected.
"""

from pyscript import fetch


async def test_fetch_json():
    """
    The fetch function should return the expected JSON response.
    """
    response = await fetch("https://jsonplaceholder.typicode.com/todos/1")
    assert response.ok
    data = await response.json()
    assert data["userId"] == 1
    assert data["id"] == 1
    assert data["title"] == "delectus aut autem"
    assert data["completed"] is False


async def test_fetch_text():
    """
    The fetch function should return the expected text response.
    """
    response = await fetch("https://jsonplaceholder.typicode.com/todos/1")
    assert response.ok
    text = await response.text()
    assert "delectus aut autem" in text
    assert "completed" in text
    assert "false" in text
    assert "1" in text


async def test_fetch_bytearray():
    """
    The fetch function should return the expected bytearray response.
    """
    response = await fetch("https://jsonplaceholder.typicode.com/todos/1")
    assert response.ok
    data = await response.bytearray()
    assert b"delectus aut autem" in data
    assert b"completed" in data
    assert b"false" in data
    assert b"1" in data


async def test_fetch_array_buffer():
    """
    The fetch function should return the expected array buffer response.
    """
    response = await fetch("https://jsonplaceholder.typicode.com/todos/1")
    assert response.ok
    data = await response.arrayBuffer()
    bytes_ = bytes(data)
    assert b"delectus aut autem" in bytes_
    assert b"completed" in bytes_
    assert b"false" in bytes_
    assert b"1" in bytes_


async def test_fetch_ok():
    """
    The fetch function should return a response with ok set to True for an
    existing URL.
    """
    response = await fetch("https://jsonplaceholder.typicode.com/todos/1")
    assert response.ok
    assert response.status == 200
    data = await response.json()
    assert data["userId"] == 1
    assert data["id"] == 1
    assert data["title"] == "delectus aut autem"
    assert data["completed"] is False


async def test_fetch_not_ok():
    """
    The fetch function should return a response with ok set to False for a
    non-existent URL.
    """
    response = await fetch("https://jsonplaceholder.typicode.com/todos/1000")
    assert not response.ok
    assert response.status == 404
