from textwrap import dedent
import inspect

from pyweb import pydom
from pyweb.ui import elements as el
from pyweb.ui import shoelace
from pyweb.ui.markdown import markdown
from pyscript import when, window
import tictactoe
import styles

MAIN_PAGE_MARKDOWN = dedent(
    """
    This gallery is a collection of demos using the PyWeb.UI library. There are meant
    to be examples of how to use the library to create GUI applications using Python
    only.

    ## How to use the gallery

    Simply click on the demo you want to see and the details will appear on the right
    """
)

# First thing we do is to load all the external resources we need
shoelace.load_resources()


def add_demo(demo_name, demo_creator_cb, parent_div, source=None):
    """Create a link to a component and add it to the left panel.

    Args:
        component (str): The name of the component to add.

    Returns:
        the component created

    """
    # Create the component link element
    div = el.div(el.a(demo_name, href="#"), style=styles.STYLE_LEFT_PANEL_LINKS)

    # Create a handler that opens the component details when the link is clicked
    @when("click", div)
    def _change():
        if source:
            demo_div = el.Grid("50% 50%")
            demo_div.append(demo_creator_cb())
            widget_code = markdown(dedent(f"""```python\n{source}\n```"""))
            demo_div.append(el.div(widget_code, style=styles.STYLE_CODE_BLOCK))
        else:
            demo_div = demo_creator_cb()
        demo_div.style['margin'] = '20px'
        write_to_main(demo_div)
        window.hljs.highlightAll()

    # Add the new link element to the parent div (left panel)
    parent_div.append(div)
    return div

def create_main_area():
    """Create the main area of the right side of page, with the description of the
    demo itself and how to use it.

    Returns:
        the main area

    """
    return el.div([
            el.h1("PyWeb UI Galler", style={"text-align": "center"}),
            markdown(MAIN_PAGE_MARKDOWN),
        ])


def create_markdown_app():
    """Create the basic components page.

    Returns:
        the main area

    """
    translate_button = shoelace.Button("Convert", variant="primary")
    markdown_txt_area = shoelace.TextArea(label="Use this to write your Markdown")
    result_div = el.div(style=styles.STYLE_MARKDOWN_RESULT)
    @when("click", translate_button)
    def translate_markdown():
        result_div.html = markdown(markdown_txt_area.value).html

    return el.div([
            el.h2("Markdown"),
            markdown_txt_area,
            translate_button,
            result_div,
        ], style={"margin": "20px"})


# ********** MAIN PANEL **********
main_area = create_main_area()


def write_to_main(content):
    main_area.html = ""
    main_area.append(content)


def restore_home():
    write_to_main(create_main_area())


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
left_panel_title = el.h1("PyWeb.UI", style=styles.STYLE_LEFT_PANEL_TITLE)
left_div = el.div(
    [
        left_panel_title,
        shoelace.Divider(style={"margin-bottom": "30px"}),
        el.h3("Demos", style=styles.STYLE_LEFT_PANEL_TITLE),
    ]
)

# Let's map the creation of the main area to when the user clocks on "Components"
when("click", left_panel_title)(restore_home)

# ------ ADD DEMOS ------
markdown_source = """
translate_button = shoelace.Button("Convert", variant="primary")
markdown_txt_area = shoelace.TextArea(label="Markdown",
    help_text="Write your Mardown here and press convert to see the result",
)
result_div = el.div(style=styles.STYLE_MARKDOWN_RESULT)
@when("click", translate_button)
def translate_markdown():
    result_div.html = markdown(markdown_txt_area.value).html

el.div([
    el.h2("Markdown"),
    markdown_txt_area,
    translate_button,
    result_div,
])
"""
add_demo("Markdown", create_markdown_app, left_div, source = markdown_source)
add_demo("Tic Tac Toe", tictactoe.create_tic_tac_toe, left_div, source=inspect.getsource(tictactoe))

# ********** CREATE ALL THE LAYOUT **********
grid = el.Grid("minmax(100px, 200px) 20px auto", style={"min-height": "100%"})
grid.append(left_div)
grid.append(shoelace.Divider(vertical=True))
grid.append(main_area)

pydom.body.append(grid)