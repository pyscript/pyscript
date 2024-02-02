from textwrap import dedent

import examples
import styles
from pyscript import when, window
from pyweb import pydom
from pyweb.ui import elements as el
from pyweb.ui import shoelace
from pyweb.ui.elements import a, button, div, grid, h1, h2, h3, input_
from pyweb.ui.markdown import markdown

MAIN_PAGE_MARKDOWN = dedent(
    """
    ## What is pyweb.ui?
    Pyweb UI is a totally immagnary exercise atm but..... imagine it is a Python library that allows you to create
                            web applications using Python only.

    It is based on base HTML/JS components but is extensible, for instance, it can have a [Shoelace](https://shoelace.style/) backend...

    PyWeb is a Python library that allows you to create web applications using Python only.

    ## What can I do with Pyweb.ui?

    You can create web applications using Python only.
    """
)

# First thing we do is to load all the external resources we need
shoelace.load_resources()


# Let's define some convenience functions first
def create_component_details(component_label, component):
    """Create a component details card.

    Args:
        component (str): The name of the component to create.

    Returns:
        the component created

    """
    # Get the example from the examples catalog
    example = component["instance"]
    details = example.__doc__ or f"Details missing for component {component_label}"

    return div(
        [
            # Title and description (description is picked from the class docstring)
            h1(component_label),
            markdown(details),
            # Example section
            h2("Example:"),
            create_component_example(component["instance"], component["code"]),
        ],
        style={"margin": "20px"},
    )


def add_component_section(component_label, component, parent_div):
    """Create a link to a component and add it to the left panel.

    Args:
        component (str): The name of the component to add.

    Returns:
        the component created

    """
    # Create the component link element
    div_ = div(
        a(component_label, href="#"),
        style={"display": "block", "text-align": "center", "margin": "auto"},
    )

    # Create a handler that opens the component details when the link is clicked
    @when("click", div_)
    def _change():
        new_main = create_component_details(component_label, component)
        main_area.html = ""
        main_area.append(new_main)

    # Add the new link element to the parent div (left panel)
    parent_div.append(div_)
    return div_


def create_component_example(widget, code):
    """Create a grid div with the widget on the left side and the relate code
    on the right side.

    Args:
        widget (ElementBase): The widget to add to the grid.
        code (str): The code to add to the grid.

    Returns:
        the grid created

    """
    # Create the grid that splits the window in two columns (25% and 75%)
    grid_ = grid("29% 2% 74%")

    # Add the widget
    grid_.append(div(widget, style=styles.STYLE_EXAMPLE_INSTANCE))

    # Add the code div
    widget_code = markdown(dedent(f"""```python\n{code}\n```"""))
    grid_.append(shoelace.Divider(vertical=True))
    grid_.append(div(widget_code, style=styles.STYLE_CODE_BLOCK))

    return grid_


def create_main_area():
    """Create the main area of the right side of page, with the description of the
    demo itself and how to use it.

    Returns:
        the main area

    """
    return div(
        [
            h1("Welcome to PyWeb UI!", style={"text-align": "center"}),
            markdown(MAIN_PAGE_MARKDOWN),
        ]
    )


def create_basic_components_page(label, kit_name):
    """Create the basic components page.

    Returns:
        the main area

    """
    div_ = div(h2(label))

    for component_label, component in examples.kits[kit_name].items():
        div_.append(h3(component_label))
        div_.append(create_component_example(component["instance"], component["code"]))

    return div_


# ********** CREATE ALL THE LAYOUT **********

main_grid = grid("140px 20px auto", style={"min-height": "100%"})

# ********** MAIN PANEL **********
main_area = create_main_area()


def write_to_main(content):
    main_area.html = ""
    main_area.append(content)


def restore_home():
    write_to_main(create_main_area())


def basic_components():
    write_to_main(
        create_basic_components_page(label="Basic Components", kit_name="elements")
    )
    # Make sure we highlight the code
    window.hljs.highlightAll()


def markdown_components():
    write_to_main(create_basic_components_page(label="", kit_name="markdown"))


def create_new_section(title, parent_div):
    basic_components_text = h3(
        title, style={"text-align": "left", "margin": "20px auto 0"}
    )
    parent_div.append(basic_components_text)
    parent_div.append(
        shoelace.Divider(style={"margin-top": "5px", "margin-bottom": "30px"})
    )
    return basic_components_text


# ********** LEFT PANEL **********
left_div = div()
left_panel_title = h1(
    "PyWeb.UI", style={"text-align": "center", "margin": "20px auto 30px"}
)
left_div.append(left_panel_title)
left_div.append(shoelace.Divider(style={"margin-bottom": "30px"}))
# Let's map the creation of the main area to when the user clocks on "Components"
when("click", left_panel_title)(restore_home)

# BASIC COMPONENTS
basic_components_text = h3(
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
shoe_components_text = h3(
    "Shoe Components", style={"text-align": "left", "margin": "20px auto 0"}
)
left_div.append(shoe_components_text)
left_div.append(shoelace.Divider(style={"margin-top": "5px", "margin-bottom": "30px"}))

# Create the links to the components on th left panel
print("SHOELACE EXAMPLES", examples.kits["shoelace"])
for component_label, component in examples.kits["shoelace"].items():
    add_component_section(component_label, component, left_div)


# ********** ADD LEFT AND MAIN PANEL TO MAIN **********
main_grid.append(left_div)
main_grid.append(shoelace.Divider(vertical=True))
main_grid.append(main_area)
pydom.body.append(main_grid)
