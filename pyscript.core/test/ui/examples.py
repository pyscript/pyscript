from pyweb import pydom
from pyweb.ui import elements as el
from pyweb.ui.shoelace import (
    Alert,
    Button,
    Card,
    Details,
    Dialog,
    Divider,
    Icon,
    Radio,
    Rating,
)

from pyscript import when, window

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



btn = el.button("Click me!")
when("click", btn)(lambda: window.alert("Clicked!"))

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
    },
    'elements':{
        'button': {
            'instance': btn,
            'code': '''button("Click me!")
when('click', btn)(lambda: window.alert("Clicked!"))
'''
        },
        'div': {
            'instance': el.div("This is a div"),
            'code': 'div("This is a div")'
        }
    }
}
