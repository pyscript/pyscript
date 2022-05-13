"""Reusable testing functionality"""

import re

# Regexes
RE_PROTOCOL = re.compile(r"(https?:)\/+")
RE_SLASHES = re.compile(r"\/+")

# Test timing (how long to wait for and how often to check page events)
MAX_TEST_TIME = 30  # Number of seconds
TEST_TIME_INCREMENT = 0.25  # 1/4 second


def _url_join(base, *parts):
    """Join parts of a URL while handling redundant slashes and preserving protocol
    with its slashes:

    _url_join('http://localhost:8080', '/dir', 'index.html') =>
    http://localhost:8080/dir/index.html
    """

    url_parts = [base,] + list(parts)
    url = "/".join(url_parts)
    url = RE_SLASHES.sub("/", url)  # Replace multiple slashes with one '/'
    url = RE_PROTOCOL.sub(r"\1//", url)  # Fix slashes in protocol

    return url
