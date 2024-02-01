from textwrap import dedent

from pyweb import pydom
from pyweb.ui import elements as el
from pyweb.ui import shoelace
from pyweb.ui.markdown import markdown

from pyscript import when

MAIN_PAGE_MARKDOWN = dedent(
    """
    ## Welcome to the PyWeb.UI gallery!

    """
)

# Style dictionary for code blocks
STYLE_CODE_BLOCK = {"text-align": "left", "background-color": "#eee", "padding": "20px"}
STYLE_LEFT_PANEL_LINKS = {"display": "block", "text-align": "center", "margin": "auto"}
STYLE_MARKDOWN_RESULT = {
    "margin-top": "20px",
    "min-height": "200px",
    "background-color": "cornsilk",
}
STYLE_LEFT_PANEL_TITLE = {"text-align": "center", "margin": "20px auto 30px"}
STYLE_TIC_TAC_TOE = """
.tictactoe-square {
    width: 70px;
    height: 70px;
    border: 1px solid gray;
    cursor: pointer;
}
.tictactoe-choice {
    font-size: 42px;
    font-family: Brush Script MT;
    text-align: center;
    margin: auto;
}
.tictactoe-inside {
    background-color: lightblue;
}
.tictactoe-css {
    margin-top: 10px;
    width: 400px;
    height: 400px;
    background-color: rgb(255, 255, 244);
}
"""

# First thing we do is to load all the external resources we need
shoelace.load_resources()


def add_demo(demo_name, demo_creator_cb, parent_div):
    """Create a link to a component and add it to the left panel.

    Args:
        component (str): The name of the component to add.

    Returns:
        the component created

    """
    # Create the component link element
    div = el.div(el.a(demo_name, href="#"), style=STYLE_LEFT_PANEL_LINKS)

    # Create a handler that opens the component details when the link is clicked
    @when("click", div)
    def _change():
        write_to_main(demo_creator_cb())

    # Add the new link element to the parent div (left panel)
    parent_div.append(div)
    return div


def create_main_area():
    """Create the main area of the right side of page, with the description of the
    demo itself and how to use it.

    Returns:
        the main area

    """
    return el.div(
        [
            el.h1("Welcome to PyDom UI!", style={"text-align": "center"}),
            markdown(MAIN_PAGE_MARKDOWN),
        ]
    )


def create_markdown_app():
    """Create the basic components page.

    Returns:
        the main area

    """
    translate_button = shoelace.Button("Convert", variant="primary")
    markdown_txt_area = shoelace.TextArea(
        label="Markdown",
        help_text="Write your Mardown here and press convert to see the result",
    )

    result_div = el.div(style=STYLE_MARKDOWN_RESULT)

    div = el.div(
        [
            el.h2("Markdown"),
            markdown_txt_area,
            translate_button,
            result_div,
        ]
    )

    @when("click", translate_button)
    def translate_markdown():
        result_div.html = markdown(markdown_txt_area.value).html

    return div


clicks = 0


def handle_tic_tac_toe_click(square):
    @when("click", square)
    def on_click(event):
        global clicks
        if clicks % 2:
            square.html = "X"
        else:
            square.html = "0"
        clicks += 1
        square.add_class("tictactoe-choice")


def create_tic_tac_toe():
    grid = el.div()

    for _ in range(3):
        row = el.Grid("1fr 1fr 1fr", style={"width": "100px"})
        for __ in range(3):
            square = el.div()
            square.add_class("tictactoe-square")
            handle_tic_tac_toe_click(square)
            row.append(square)
        grid.append(row)

    div = el.div(
        [
            el.h2("Tic Tac Toe"),
            el.p("This is a simple tic tac toe game", style={"margin": "20px"}),
            el.Grid("1fr 1fr 1fr", style={"margin-top": "20px"}),
            grid,
            el.h3("Tip: Click inside the squares to play"),
        ]
    )

    # Load the CSS for the tic-tac-toe example
    pydom.body.append(el.style(STYLE_TIC_TAC_TOE))

    # Return the main app div
    return div


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
left_panel_title = el.h1("PyWeb.UI", style=STYLE_LEFT_PANEL_TITLE)
left_div = el.div(
    [
        left_panel_title,
        shoelace.Divider(style={"margin-bottom": "30px"}),
        el.h3("Demos", style=STYLE_LEFT_PANEL_TITLE),
    ]
)

# Let's map the creation of the main area to when the user clocks on "Components"
when("click", left_panel_title)(restore_home)

# ------ ADD DEMOS ------

add_demo("Markdown", create_markdown_app, left_div)
add_demo("Tic Tac Toe", create_tic_tac_toe, left_div)

# ********** CREATE ALL THE LAYOUT **********
grid = el.Grid("minmax(100px, 200px) 20px auto", style={"min-height": "100%"})
grid.append(left_div)
grid.append(shoelace.Divider(vertical=True))
grid.append(main_area)

pydom.body.append(grid)
