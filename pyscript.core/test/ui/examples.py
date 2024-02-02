from pyscript import when, window
from pyweb import pydom
from pyweb.ui.elements import (
    a,
    button,
    code,
    div,
    grid,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    img,
    input_,
    p,
)
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

LOREM_IPSUM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
details_code = """
LOREM_IPSUM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
Details(LOREM_IPSUM, summary="Try me")
"""
example_dialog_close_btn = Button("Close")
example_dialog = Dialog(div([p(LOREM_IPSUM), example_dialog_close_btn]), label="Try me")
example_dialog_btn = Button("Open Dialog")


def toggle_dialog():
    example_dialog.open = not (example_dialog.open)


when("click", example_dialog_btn)(toggle_dialog)
when("click", example_dialog_close_btn)(toggle_dialog)

pydom.body.append(example_dialog)


# ELEMENTS

# Button
btn = button("Click me!")
when("click", btn)(lambda: window.alert("Clicked!"))

# Inputs
inputs_div = div()
inputs_code = []
for input_type in [
    "text",
    "password",
    "email",
    "number",
    "date",
    "time",
    "color",
    "range",
]:
    inputs_div.append(input_(type=input_type, style={"display": "block"}))
    inputs_code.append(f"input_(type='{input_type}')")
inputs_code = "\n".join(inputs_code)

kits = {
    "shoelace": {
        "Alert": {
            "instance": Alert(
                "This is a standard alert. You can customize its content and even the icon."
            ),
            "code": code(
                "Alert('This is a standard alert. You can customize its content and even the icon.'"
            ),
        },
        "Icon": {
            "instance": Icon(name="heart"),
            "code": code('Icon(name="heart")'),
        },
        "Button": {
            "instance": Button("Try me"),
            "code": code('Button("Try me")'),
        },
        "Card": {
            "instance": Card(
                p("This is a cool card!"),
                image="https://pyscript.net/assets/images/pyscript-sticker-black.svg",
                footer=div([Button("More Info"), Rating()]),
            ),
            "code": code(
                """
Card(p("This is a cool card!"), image="https://pyscript.net/assets/images/pyscript-sticker-black.svg", footer=div([Button("More Info"), Rating()]))
"""
            ),
        },
        "Details": {
            "instance": Details(LOREM_IPSUM, summary="Try me"),
            "code": code('Details(LOREM_IPSUM, summary="Try me")'),
        },
        "Dialog": {
            "instance": example_dialog_btn,
            "code": code(
                'Dialog(div([p(LOREM_IPSUM), Button("Close")]), summary="Try me")'
            ),
        },
        "Divider": {
            "instance": Divider(),
            "code": code("Divider()"),
        },
        "Rating": {
            "instance": Rating(),
            "code": code("Rating()"),
        },
        "Radio": {
            "instance": Radio(),
            "code": code("Radio()"),
        },
    },
    "elements": {
        "button": {
            "instance": btn,
            "code": """button("Click me!")
when('click', btn)(lambda: window.alert("Clicked!"))
""",
        },
        "div": {
            "instance": div(
                "This is a div",
                style={
                    "text-align": "center",
                    "margin": "0 auto",
                    "background-color": "cornsilk",
                },
            ),
            "code": 'div("This is a div", style={"text-align": "center", "margin": "0 auto", "background-color": "cornsilk"})',
        },
        "input": {"instance": inputs_div, "code": inputs_code},
        "grid": {
            "instance": grid([div("This is a grid")]),
            "code": 'grid([div("This is a grid")])',
        },
    },
}
