from markdown import markdown
from pyweb import pydom
from pyweb.ui.elements import (
    a,
    br,
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
    small,
    strong,
)
from shoelace import (
    Alert,
    Button,
    Card,
    CopyButton,
    Details,
    Dialog,
    Divider,
    Icon,
    Radio,
    RadioGroup,
    Range,
    Rating,
    RelativeTime,
    Skeleton,
    Spinner,
    Switch,
    Tag,
    Textarea,
)

from pyscript import when, window

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


headers_div = div()
headers_code = []
for header in [h1, h2, h3, h4, h5, h6]:
    headers_div.append(header(f"{header.tag.upper()} header"))
    headers_code.append(f'{header.tag}("{header.tag.upper()} header")')
headers_code = "\n".join(headers_code)

rich_input = input_(
    type="text",
    name="some name",
    autofocus=True,
    pattern="\w{3,16}",
    placeholder="add text with > 3 chars",
    required=True,
    size="20",
)
inputs_div.append(rich_input)
inputs_code.append("# You can create inputs with more options like")
inputs_code.append("# this by passing properties as kwargs")
inputs_code.append(
    "input_(type='text', name='some name', autofocus=True, pattern='\\w{3,16}', placeholder='add text with > 3 chars', required=True, size='20')"
)
inputs_code = "\n".join(inputs_code)

MARKDOWN_EXAMPLE = """# This is a header

This is a ~~paragraph~~ text with **bold** and *italic* text in it!
"""

kits = {
    "shoelace": {
        "Alert": {
            "instance": Alert(
                "This is a standard alert. You can customize its content and even the icon."
            ),
            "code": "Alert('This is a standard alert. You can customize its content and even the icon.'",
        },
        "Icon": {
            "instance": Icon(name="heart"),
            "code": 'Icon(name="heart")',
        },
        "Button": {
            "instance": Button("Try me"),
            "code": 'Button("Try me")',
        },
        "Card": {
            "instance": Card(
                p("This is a cool card!"),
                image="https://pyscript.net/assets/images/pyscript-sticker-black.svg",
                footer=div([Button("More Info"), Rating()]),
            ),
            "code": """
Card(p("This is a cool card!"), image="https://pyscript.net/assets/images/pyscript-sticker-black.svg", footer=div([Button("More Info"), Rating()]))
""",
        },
        "Details": {
            "instance": Details(LOREM_IPSUM, summary="Try me"),
            "code": 'Details(LOREM_IPSUM, summary="Try me")',
        },
        "Dialog": {
            "instance": example_dialog_btn,
            "code": 'Dialog(div([p(LOREM_IPSUM), Button("Close")]), summary="Try me")',
        },
        "Divider": {
            "instance": Divider(),
            "code": "Divider()",
        },
        "Rating": {
            "instance": Rating(),
            "code": "Rating()",
        },
        "Radio": {
            "instance": Radio("Option 42"),
            "code": code('Radio("Option 42")'),
        },
        "Radio Group": {
            "instance": RadioGroup(
                [
                    Radio("radio 1", name="radio 1", value=1, style={"margin": "20px"}),
                    Radio("radio 2", name="radio 2", value=2, style={"margin": "20px"}),
                    Radio("radio 3", name="radio 3", value=3, style={"margin": "20px"}),
                ],
                label="Select an option",
            ),
            "code": code(
                """
                RadioGroup([Radio("radio 1", name="radio 1", value=1, style={"margin": "20px"}),
                                     Radio("radio 2", name="radio 2", value=2, style={"margin": "20px"}),
                                     Radio("radio 3", name="radio 3", value=3, style={"margin": "20px"})],
                                    label="Select an option"),"""
            ),
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
            "code": 'CopyButton(value="PyShoes!", copy_label="Copy me!", sucess_label="Copied, check your clipboard!", error_label="Oops, something went wrong!", feedback_timeout=2000, tooltip_placement="top")',
        },
        "Skeleton": {
            "instance": Skeleton(effect="pulse"),
            "code": "Skeleton(effect='pulse')",
        },
        "Spinner": {
            "instance": Spinner(),
            "code": "Spinner()",
        },
        "Switch": {
            "instance": Switch(name="switch", size="large"),
            "code": 'Switch(name="switch", size="large")',
        },
        "Textarea": {
            "instance": Textarea(
                name="textarea",
                label="Textarea",
                size="medium",
                help_text="This is a textarea",
                resize="auto",
            ),
            "code": 'Textarea(name="textarea", label="Textarea", size="medium", help_text="This is a textarea", resize="auto")',
        },
        "Tag": {
            "instance": Tag("Tag", variant="primary", size="medium"),
            "code": 'Tag("Tag", variant="primary", size="medium")',
        },
        "Range": {
            "instance": Range(min=0, max=100, value=50),
            "code": "Range(min=0, max=100, value=50)",
        },
        "RelativeTime": {
            "instance": RelativeTime(date="2021-01-01T00:00:00Z"),
            "code": 'RelativeTime(date="2021-01-01T00:00:00Z")',
        },
        # "SplitPanel": {
        #     "instance": SplitPanel(
        #         div("First panel"), div("Second panel"), orientation="vertical"
        #     ),
        #     "code": code(
        #         'SplitPanel(div("First panel"), div("Second panel"), orientation="vertical")'
        #     ),
        # },
    },
    "elements": {
        "button": {
            "instance": btn,
            "code": """btn = button("Click me!")
when('click', btn)(lambda: window.alert("Clicked!"))
parentdiv.append(btn)
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
            "instance": grid(
                "30% 70%",
                [
                    div("This is a grid", style={"background-color": "lightblue"}),
                    p("with 2 elements", style={"background-color": "lightyellow"}),
                ],
            ),
            "code": 'grid([div("This is a grid")])',
        },
        "headers": {"instance": headers_div, "code": headers_code},
        "a": {
            "instance": a(
                "Click here for something awesome",
                href="https://pyscript.net",
                target="_blank",
            ),
            "code": 'a("Click here for something awesome", href="https://pyscript.net", target="_blank")',
        },
        "br": {
            "instance": div([p("This is a paragraph"), br(), p("with a line break")]),
            "code": 'div([p("This is a paragraph"), br(), p("with a line break")])',
        },
        "img": {
            "instance": img(src="./giphy_winner.gif", style={"max-width": "200px"}),
            "code": 'img(src="./giphy_winner.gif", style={"max-width": "200px"})',
        },
        "code": {
            "instance": code("print('Hello, World!')"),
            "code": "code(\"print('Hello, World!')\")",
        },
        "p": {"instance": p("This is a paragraph"), "code": 'p("This is a paragraph")'},
        "small": {
            "instance": small("This is a small text"),
            "code": 'small("This is a small text")',
        },
        "strong": {
            "instance": strong("This is a strong text"),
            "code": 'strong("This is a strong text")',
        },
    },
    "markdown": {
        "markdown": {
            "instance": markdown(MARKDOWN_EXAMPLE),
            "code": f'markdown("""{MARKDOWN_EXAMPLE}""")',
        },
    },
}
