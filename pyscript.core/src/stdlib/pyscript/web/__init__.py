from . import elements

# Ugly trick to hide the dom module in the web package since we want the module
# to allow querying right away.
from .dom import dom
