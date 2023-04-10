import os

import rich
import termcolor
from rich import print as richprint
from rich.__main__ import make_test_card

# from rich import pretty
from rich.console import Console as RichConsole

og_print = print
rich._console = RichConsole(color_system="256")

con = RichConsole(color_system="256", width=80)

# pretty.install()

richprint("Hello, [bold magenta]Printing[/bold magenta]!", ":vampire:")
richprint(f"An object: {[1,2,3,4]}")
con.print("Via ", "con.print()", style="bold red")

os.environ["FORCE_COLOR"] = "True"
og_print(termcolor.colored("What about termcolor?", "blue"))
con.print(make_test_card())
