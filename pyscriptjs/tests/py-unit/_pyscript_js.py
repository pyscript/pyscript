from unittest.mock import Mock

import js

showWarning = Mock()
define_custom_element = Mock()


def deepQuerySelector(selector):
    return js.document.querySelector(selector)
