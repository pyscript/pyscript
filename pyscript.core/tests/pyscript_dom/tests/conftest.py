import pytest
from js import document, localStorage


@pytest.fixture(autouse=True)
def before_tests():
    """
    Ensure browser storage is always reset to empty. Remove the app
    placeholder. Reset the page title.
    """
    localStorage.clear()
    # app_placeholder = document.querySelector("pyper-app")
    # if app_placeholder:
    #     app_placeholder.remove()
    document.querySelector("title").innerText = "Web API PyTest Suite"
