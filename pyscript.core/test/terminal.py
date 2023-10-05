###### magic monkey patching ######
import builtins
import sys

from pyodide.code import eval_code

from pyscript import sync

sys.stdout = sync
builtins.input = sync.readline

####### main code ######
import code

code.interact()
