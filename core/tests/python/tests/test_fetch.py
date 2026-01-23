"""
Tests for the fetch function and response handling.
"""

import json
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


async def test_fetch_json_direct():
    """
    The fetch function should support direct method chaining for JSON.
    """
    data = await fetch("https://jsonplaceholder.typicode.com/todos/1").json()
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


async def test_fetch_text_direct():
    """
    The fetch function should support direct method chaining for text.
    """
    text = await fetch("https://jsonplaceholder.typicode.com/todos/1").text()
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
    assert isinstance(data, bytearray)
    assert b"delectus aut autem" in data
    assert b"completed" in data
    assert b"false" in data
    assert b"1" in data


async def test_fetch_bytearray_direct():
    """
    The fetch function should support direct method chaining for bytearray.
    """
    data = await fetch("https://jsonplaceholder.typicode.com/todos/1").bytearray()
    assert isinstance(data, bytearray)
    assert b"delectus aut autem" in data


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


async def test_fetch_array_buffer_direct():
    """
    The fetch function should support direct method chaining for arrayBuffer.
    """
    data = await fetch("https://jsonplaceholder.typicode.com/todos/1").arrayBuffer()
    bytes_ = bytes(data)
    assert b"delectus aut autem" in bytes_


async def test_fetch_blob():
    """
    The fetch function should return a blob response.
    """
    response = await fetch("https://jsonplaceholder.typicode.com/todos/1")
    assert response.ok
    blob = await response.blob()
    assert blob.size > 0
    assert blob.type in ["application/json", "application/json; charset=utf-8"]


async def test_fetch_blob_direct():
    """
    The fetch function should support direct method chaining for blob.
    """
    blob = await fetch("https://jsonplaceholder.typicode.com/todos/1").blob()
    assert blob.size > 0
    assert blob.type in ["application/json", "application/json; charset=utf-8"]


async def test_fetch_response_ok():
    """
    The fetch function should return a response with ok set to True for
    successful requests.
    """
    response = await fetch("https://jsonplaceholder.typicode.com/todos/1")
    assert response.ok


async def test_fetch_response_not_ok():
    """
    The fetch function should return a response with ok set to False for
    failed requests.
    """
    response = await fetch("https://jsonplaceholder.typicode.com/todos/1000")
    assert not response.ok
    assert response.status == 404


async def test_fetch_response_status():
    """
    The fetch function should provide access to response status code.
    """
    response = await fetch("https://jsonplaceholder.typicode.com/todos/1")
    assert response.status == 200


async def test_fetch_response_status_text():
    """
    The fetch function should provide access to response statusText.
    Note: HTTP/2 responses often have empty statusText, so we just verify
    the property exists and is a string.
    """
    response = await fetch("https://jsonplaceholder.typicode.com/todos/1")
    assert isinstance(response.statusText, str)
    assert response.statusText in ["", "OK"]


async def test_fetch_with_post_method():
    """
    The fetch function should support POST requests.
    """
    response = await fetch(
        "https://jsonplaceholder.typicode.com/posts",
        method="POST",
        headers={"Content-Type": "application/json"},
        body=json.dumps({"title": "foo", "body": "bar", "userId": 1}),
    )
    assert response.ok
    assert response.status == 201
    data = await response.json()
    assert data["title"] == "foo"
    assert data["body"] == "bar"
    assert data["userId"] == 1
    assert "id" in data


async def test_fetch_with_put_method():
    """
    The fetch function should support PUT requests.
    """
    response = await fetch(
        "https://jsonplaceholder.typicode.com/posts/1",
        method="PUT",
        headers={"Content-Type": "application/json"},
        body=json.dumps(
            {"id": 1, "title": "updated", "body": "updated body", "userId": 1}
        ),
    )
    assert response.ok
    assert response.status == 200
    data = await response.json()
    assert data["title"] == "updated"
    assert data["body"] == "updated body"


async def test_fetch_with_delete_method():
    """
    The fetch function should support DELETE requests.
    """
    response = await fetch(
        "https://jsonplaceholder.typicode.com/posts/1",
        method="DELETE",
    )
    assert response.ok
    assert response.status == 200


async def test_fetch_with_custom_headers():
    """
    The fetch function should support custom headers.
    """
    response = await fetch(
        "https://jsonplaceholder.typicode.com/todos/1",
        headers={"Accept": "application/json"},
    )
    assert response.ok
    data = await response.json()
    assert data["id"] == 1


async def test_fetch_multiple_data_extractions():
    """
    The fetch function could allow multiple data extractions from the same
    response when using the await pattern. This is a strange one, kept in
    for completeness. Note that browser behaviour may vary here (see inline
    comments). ;-)
    """
    response = await fetch("https://jsonplaceholder.typicode.com/todos/1")

    # First extraction.
    text1 = await response.text()
    assert "delectus aut autem" in text1
    # Second extraction behaviour varies by browser.
    try:
        text2 = await response.text()
        # Some browsers allow it and return empty or repeated data.
        assert text2 == "" or "delectus aut autem" in text2
    except Exception:
        # Other browsers throw an exception for already-consumed body.
        # This is expected and valid behaviour per the fetch spec.
        pass


async def test_fetch_404_error_handling():
    """
    The fetch function should handle 404 responses gracefully.
    """
    response = await fetch("https://jsonplaceholder.typicode.com/todos/999999")
    assert not response.ok
    assert response.status == 404
    # Should still be able to extract data even from error responses.
    data = await response.json()
    assert data == {}


async def test_fetch_error_response_with_text():
    """
    Error responses should still allow text extraction.
    """
    response = await fetch("https://jsonplaceholder.typicode.com/todos/999999")
    assert not response.ok
    text = await response.text()
    # Error responses may have empty or JSON content.
    assert isinstance(text, str)


async def test_fetch_response_headers():
    """
    The fetch function should provide access to response headers.
    """
    response = await fetch("https://jsonplaceholder.typicode.com/todos/1")
    assert response.ok
    # Access headers through the underlying response object.
    content_type = response.headers.get("content-type")
    assert "application/json" in content_type


async def test_fetch_direct_chaining_with_error():
    """
    Direct method chaining should work even with error responses.
    """
    data = await fetch("https://jsonplaceholder.typicode.com/todos/999999").json()
    # Should return empty dict for 404. This is expected API behaviour
    # from the jsonplaceholder API.
    assert data == {}


async def test_fetch_options_passed_correctly():
    """
    The fetch function should correctly pass options to the underlying
    JavaScript fetch.
    """
    response = await fetch(
        "https://jsonplaceholder.typicode.com/posts",
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Custom-Header": "test-value",
        },
        body=json.dumps({"test": "data"}),
    )
    assert response.ok
    # The request succeeded, confirming options were passed correctly.
    assert response.status == 201
