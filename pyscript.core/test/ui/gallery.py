from textwrap import dedent

from pyweb import pydom
from pyweb.ui import elements as el
from pyweb.ui import shoelace

from pyscript import when, window

# from marked import Markdown
# import element as el


# Style dictionary for code blocks
STYLE_CODE_BLOCK = {"text-align": "left", "background-color": "#eee", "padding": "20px"}

# First thing we do is to load all the external resources we need
shoelace.load_resources()


def Markdown(txt):
    # TODO: placeholder until we have a proper Markdown component
    return el.div(txt)


# Let's define some convenience functions first


def create_component_details(component):
    """Create a component details card.

    Args:
        component (str): The name of the component to create.

    Returns:
        the component created

    """
    # Outer div container
    div = el.div(style={"margin": "20px"})

    # Get the example from the examples catalog
    example = shoelace.examples[component]["instance"]

    # Title and description (description is picked from the class docstring)
    div.append(el.h1(component))
    details = example.__doc__ or f"Details missing for component {component}"

    div.append(Markdown(details))

    # Create the example and code block
    div.append(el.h2("Example:"))

    example_div = el.div(
        example,
        style={
            "border-radius": "3px",
            "background-color": "var(--sl-color-neutral-50)",
            "margin-bottom": "1.5rem",
        },
    )
    example_div.append(example)
    example_div.append(
        shoelace.Details(
            el.div(shoelace.examples[component]["code"], style=STYLE_CODE_BLOCK),
            summary="View Code",
            style={"background-color": "gainsboro"},
        )
    )
    div.append(example_div)
    return div


def add_component_section(component, parent_div):
    """Create a link to a component and add it to the left panel.

    Args:
        component (str): The name of the component to add.

    Returns:
        the component created

    """
    div = el.div(
        el.a(component, href="#"),
        style={"display": "block", "text-align": "center", "margin": "auto"},
    )

    def _change():
        new_main = create_component_details(component)
        main_area.html = ""
        main_area.append(new_main)

    when("click", div)(_change)
    print("adding component", component)
    parent_div.append(div)
    return div


def create_example_grid(widget, code):
    """Create a grid with the widget and the code.

    Args:
        widget (ElementBase): The widget to add to the grid.
        code (str): The code to add to the grid.

    Returns:
        the grid created

    """
    # Create the grid
    grid = el.Grid("25% 75%")
    # Add the widget
    grid.append(el.div(widget))
    # Add the code div
    widget_code = Markdown(
        dedent(
            f"""
```python
{code}
```
"""
        )
    )
    grid.append(el.div(widget_code, style=STYLE_CODE_BLOCK))

    return grid


def create_main_area():
    """Create the main area of the page.

    Returns:
        the main area

    """
    div = el.div()
    div.append(
        el.h1(
            "Welcome to PyDom UI!",
            style={"text-align": "center", "margin": "20px auto 30px"},
        )
    )

    div.append(el.h2("What is PyShoes?"))
    div.append(
        Markdown(
            dedent(
                """\
        PyDom UI is a totally immagnary exercise atm but..... imagine it is a Python library that allows you to create
                               web applications using Python only.

        It is based on base HTML/JS components but is extensible, for instance, it can have a [Shoelace](https://shoelace.style/) backend...

        PyWeb is a Python library that allows you to create web applications using Python only.
                               """
            )
        )
    )
    div.append(el.h2("What can I do with PyShoes?"))

    div.append(
        Markdown(
            dedent(
                """\
        You can create web applications using Python only.
                               """
            )
        )
    )

    return div


def create_markdown_components_page():
    """Create the basic components page.

    Returns:
        the main area

    """
    div = el.div()
    div.append(el.h2("Markdown"))

    # Buttons
    markdown_txt_area = shoelace.TextArea(
        label="Markdown",
        help_text="Write your Mardown here and press convert to see the result",
    )
    translate_button = shoelace.Button("Convert", variant="primary")
    result_div = el.div(
        style={
            "margin-top": "20px",
            "min-height": "200px",
            "background-color": "cornsilk",
        }
    )

    @when("click", translate_button)
    def translate_markdown():
        result_div.html = Markdown(markdown_txt_area.value).html
        print("TOOOO", markdown_txt_area.value)
        print("Translated", Markdown(markdown_txt_area.value))

    main_section = el.div(
        [
            markdown_txt_area,
            translate_button,
            result_div,
        ]
    )
    div.append(main_section)
    # div.append(el.h3("Buttons"))
    # btn = el.button("Click me!")
    # when('click', btn)(lambda: window.alert("Clicked!"))

    #     btn_code = dedent("""btn = button("Click me!"})
    # when('click', btn)(lambda: window.alert("Clicked!"))""")

    #     div.append(create_example_grid(btn, btn_code))

    #     # Inputs
    #     inputs_div = el.div()
    #     div.append(el.h3("Inputs"))
    #     inputs_code = []
    #     for input_type in ['text', 'password', 'email', 'number', 'date', 'time', 'color', 'range']:
    #         inputs_div.append(el.input(type=input_type, style={'display': 'block'}))
    #         inputs_code.append(f"input(type='{input_type}')")
    #     inputs_code = '\n'.join(inputs_code)

    #     div.append(create_example_grid(inputs_div, inputs_code))

    #     # DIV
    #     div.append(el.h3("Div"))
    #     _div = el.div("This is a div", style={'text-align': 'center', 'width': '100%', 'margin': '0 auto 0', 'background-color': 'cornsilk'})
    #     code = "div = div('This is a div', style={'text-align': 'center', 'margin': '0 auto 0', 'background-color': 'cornsilk'})"
    #     div.append(create_example_grid(_div, code))

    return div


def create_basic_components_page():
    """Create the basic components page.

    Returns:
        the main area

    """
    div = el.div()
    div.append(el.h2("Base components:"))

    # Buttons
    div.append(el.h3("Buttons"))
    btn = el.button("Click me!")
    when("click", btn)(lambda: window.alert("Clicked!"))

    btn_code = dedent(
        """btn = button("Click me!"})
when('click', btn)(lambda: window.alert("Clicked!"))"""
    )

    div.append(create_example_grid(btn, btn_code))

    # Inputs
    inputs_div = el.div()
    div.append(el.h3("Inputs"))
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
        inputs_div.append(el.input(type=input_type, style={"display": "block"}))
        inputs_code.append(f"input(type='{input_type}')")
    inputs_code = "\n".join(inputs_code)

    div.append(create_example_grid(inputs_div, inputs_code))

    # DIV
    div.append(el.h3("Div"))
    _div = el.div(
        "This is a div",
        style={
            "text-align": "center",
            "width": "100%",
            "margin": "0 auto 0",
            "background-color": "cornsilk",
        },
    )
    code = "div = div('This is a div', style={'text-align': 'center', 'margin': '0 auto 0', 'background-color': 'cornsilk'})"
    div.append(create_example_grid(_div, code))

    return div


# ********** CREATE ALL THE LAYOUT **********

grid = el.Grid("minmax(100px, 200px) 20px auto", style={"min-height": "100%"})

# ********** MAIN PANEL **********
main_area = create_main_area()


def write_to_main(content):
    main_area.html = ""
    main_area.append(content)


def restore_home():
    write_to_main(create_main_area())


def basic_components():
    write_to_main(create_basic_components_page())


def markdown_components():
    write_to_main(create_markdown_components_page())


def create_new_section(title, parent_div):
    basic_components_text = el.h3(
        title, style={"text-align": "left", "margin": "20px auto 0"}
    )
    parent_div.append(basic_components_text)
    parent_div.append(
        shoelace.Divider(style={"margin-top": "5px", "margin-bottom": "30px"})
    )
    return basic_components_text


# ********** LEFT PANEL **********
left_div = el.div()
left_panel_title = el.h1(
    "PyWeb.UI", style={"text-align": "center", "margin": "20px auto 30px"}
)
left_div.append(left_panel_title)
left_div.append(shoelace.Divider(style={"margin-bottom": "30px"}))
# Let's map the creation of the main area to when the user clocks on "Components"
when("click", left_panel_title)(restore_home)

# BASIC COMPONENTS
basic_components_text = el.h3(
    "Basic Components", style={"text-align": "left", "margin": "20px auto 0"}
)
left_div.append(basic_components_text)
left_div.append(shoelace.Divider(style={"margin-top": "5px", "margin-bottom": "30px"}))
# Let's map the creation of the main area to when the user clocks on "Components"
when("click", basic_components_text)(basic_components)

# MARKDOWN COMPONENTS
markdown_title = create_new_section("Markdown", left_div)
when("click", markdown_title)(markdown_components)


# SHOELACE COMPONENTS
shoe_components_text = el.h3(
    "Shoe Components", style={"text-align": "left", "margin": "20px auto 0"}
)
left_div.append(shoe_components_text)
left_div.append(shoelace.Divider(style={"margin-top": "5px", "margin-bottom": "30px"}))

# Create the links to the components on th left panel
print("SHOELACE EXAMPLES", shoelace.examples)
for component in shoelace.examples:
    add_component_section(component, left_div)


# ********** ADD LEFT AND MAIN PANEL TO MAIN **********
grid.append(left_div)
grid.append(shoelace.Divider(vertical=True))
grid.append(main_area)


pydom.body.append(grid)
