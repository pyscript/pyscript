"""Test: simple_clock"""

import math
import re
import time

try:
    # When running `make test`
    from .common import MAX_TEST_TIME, TEST_TIME_INCREMENT, _url_join
except:
    # When running `python test_<example name>.py`
    from common import (
        MAX_TEST_TIME,
        TEST_TIME_INCREMENT,
        _url_join,
    )

from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:8080"
EXPECTED_TITLE = "Simple Clock Demo"
HTML_FILE = "simple_clock.html"


def test():
    """Wrapper for all tests for this example so as to use one playwright instance"""

    url = _url_join(BASE_URL, HTML_FILE)

    # Set up playwright package
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(url)

        # Step 1: Test page title to ensure HTML is loaded properly

        print(f"{HTML_FILE}: Asserting <title></title> == {EXPECTED_TITLE}")
        assert page.title() == EXPECTED_TITLE  # nosec

        # Step 2: Test that pyodide is loaded via the console

        loading_messages = [
            "Loading runtime...",
            "Runtime created...",
            "Initializing components...",
            "Initializing scripts...",
        ]
        rng = math.ceil(MAX_TEST_TIME / TEST_TIME_INCREMENT)  # 30 / 0.25 = 120 iters
        pyodide_loading = False

        for _ in range(rng):
            time.sleep(TEST_TIME_INCREMENT)
            content = page.text_content("*")
            for msg in loading_messages:
                if msg in content:
                    pyodide_loading = True
            if pyodide_loading:
                break

        print(f"{HTML_FILE}: Asserting that pyodide is loading")
        assert pyodide_loading  # nosec

        # Step 3:
        # Assert that rendering inserts data into the page as expected
        # (In other words, search DOM for data not in initial markup
        # but present after rendering)

        re_sub_content = re.compile(r"\d+/\d+/\d+, \d+:\d+:\d+")  # Timestamp

        py_rendered = False
        for _ in range(rng):
            time.sleep(TEST_TIME_INCREMENT)
            content = page.inner_html("*")
            if re_sub_content.search(content):
                py_rendered = True
                break

        print(f"{HTML_FILE}: Asserting that example rendered")
        assert py_rendered  # nosec


if __name__ == "__main__":
    test()
    print(f"{HTML_FILE}: Finished")
    print()
