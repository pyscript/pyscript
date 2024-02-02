from pyweb.ui import elements as el
from pyweb.ui.shoelace import (
    Alert,
    Button,
    Card,
    CopyButton,
    Details,
    Dialog,
    Divider,
    Icon,
    Radio,
    Rating,
    Skeleton,
    Spinner,
    Switch,
    Textarea,
)

from pyscript import when
from pyweb import pydom

LOREM_IPSUM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
details_code = """
LOREM_IPSUM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
Details(LOREM_IPSUM, summary="Try me")
"""
example_dialog_close_btn = Button("Close")
example_dialog = Dialog(
    el.div([el.p(LOREM_IPSUM), example_dialog_close_btn]), label="Try me"
)
example_dialog_btn = Button("Open Dialog")


def toggle_dialog():
    example_dialog.open = not (example_dialog.open)


when("click", example_dialog_btn)(toggle_dialog)
when("click", example_dialog_close_btn)(toggle_dialog)

pydom.body.append(example_dialog)


kits = {
    "shoelace": {
        "Alert": {
            "instance": Alert(
                "This is a standard alert. You can customize its content and even the icon."
            ),
            "code": el.code(
                "Alert('This is a standard alert. You can customize its content and even the icon.'"
            ),
        },
        "Icon": {
            "instance": Icon(name="heart"),
            "code": el.code('Icon(name="heart")'),
        },
        "Button": {
            "instance": Button("Try me"),
            "code": el.code('Button("Try me")'),
        },
        "Card": {
            "instance": Card(
                el.p("This is a cool card!"),
                image="https://pyscript.net/assets/images/pyscript-sticker-black.svg",
                footer=el.div([Button("More Info"), Rating()]),
            ),
            "code": el.code(
                """
Card(el.p("This is a cool card!"), image="https://pyscript.net/assets/images/pyscript-sticker-black.svg", footer=el.div([Button("More Info"), Rating()]))
"""
            ),
        },
        "Details": {
            "instance": Details(LOREM_IPSUM, summary="Try me"),
            "code": el.code('Details(LOREM_IPSUM, summary="Try me")'),
        },
        "Dialog": {
            "instance": example_dialog_btn,
            "code": el.code(
                'Dialog(div([p(LOREM_IPSUM), Button("Close")]), summary="Try me")'
            ),
        },
        "Divider": {
            "instance": Divider(),
            "code": el.code("Divider()"),
        },
        "Rating": {
            "instance": Rating(),
            "code": el.code("Rating()"),
        },
        "Radio": {
            "instance": Radio(),
            "code": el.code("Radio()"),
        },
        "CopyButton": {
            "instance": CopyButton(
                value="PyShoes!",
                copy_label="Copy me!",
                sucess_label="Copied, check your clipboard!",
                error_label="Oops, something went wrong!",
                feedback_timeout=2000,
                tooltip_placement="top",
            ),
            "code": el.code(
                'CopyButton(value="PyShoes!", copy_label="Copy me!", sucess_label="Copied, check your clipboard!", error_label="Oops, something went wrong!", feedback_timeout=2000, tooltip_placement="top")'
            ),
        },
        "Skeleton": {
            "instance": Skeleton(effect="pulse"),
            "code": el.code("Skeleton(effect='pulse')"),
        },
        "Spinner": {
            "instance": Spinner(),
            "code": el.code("Spinner()"),
        },
        "Switch": {
            "instance": Switch(name="switch", size="large"),
            "code": el.code('Switch(name="switch", size="large")'),
        },
        "Textarea": {
            "instance": Textarea(
                name="textarea",
                label="Textarea",
                size="medium",
                help_text="This is a textarea",
                resize="auto",
            ),
            "code": el.code(
                'Textarea(name="textarea", label="Textarea", size="medium", help_text="This is a textarea", resize="auto")'
            ),
        }
        # "SplitPanel": {
        #     "instance": SplitPanel(
        #         el.div("First panel"), el.div("Second panel"), orientation="vertical"
        #     ),
        #     "code": el.code(
        #         'SplitPanel(div("First panel"), div("Second panel"), orientation="vertical")'
        #     ),
        # },
    }
}
