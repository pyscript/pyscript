"""Each example requires the same three tests:

- Test that the initial markup loads properly (currently done by testing the <title>
  tag's content)
- Testing that pyodide is loading properly
- Testing that the page contains appropriate content after rendering

The single function iterates through the examples, instantiates one playwright browser
session per example, and runs all three of each example's tests in that same browser
session.
 """

import math
import re
import time
from urllib.parse import urljoin

from playwright.sync_api import sync_playwright


def test_examples(config):
    # Set up time/iterations to allow for testing
    max_test_time = config["default_values"]["MAX_TEST_TIME"]  # e.g. 30 seconds
    test_time_increment = config["default_values"][
        "TEST_TIME_INCREMENT"
    ]  # e.g. 1/4 second
    test_iterations = math.ceil(max_test_time / test_time_increment)  # 120 iterations

    for example in config["examples"]:

        # Set up the URL of locally-running example
        base = config["default_values"]["BASE_URL"]  # http://127.0.0.1:8080
        file = config["files"][example]  # e.g., altair.html
        url = urljoin(base, file)

        # Invoke playwright
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.goto(url)

            # STEP 1: Check page title proper initial loading of the example page

            expected_title = config["titles"][example]
            if isinstance(expected_title, list):
                # One example's title changes so expected_title is a list of possible
                # titles in that case
                assert page.title() in expected_title  # nosec
            else:
                assert page.title() == expected_title  # nosec

            # STEP 2: Test that pyodide is loading via messages displayed during loading

            loading_messages = config["loading_messages"]
            pyodide_loading = False  # Flag to be set to True when condition met

            for _ in range(test_iterations):
                time.sleep(test_time_increment)
                content = page.text_content("*")
                for message in loading_messages:
                    if message in content:
                        pyodide_loading = True
                if pyodide_loading:
                    break

            assert pyodide_loading  # nosec

            # STEP 3:
            # Assert that rendering inserts data into the page as expected: search the
            # DOM from within the timing loop for a string that is not present in the
            # initial markup but should appear by way of rendering

            re_sub_content = re.compile(config["patterns"][example])
            py_rendered = False  # Flag to be set to True when condition met

            for _ in range(test_iterations):
                time.sleep(test_time_increment)
                content = page.inner_html("*")
                if re_sub_content.search(content):
                    py_rendered = True
                    break

            assert py_rendered  # nosec

            browser.close()
