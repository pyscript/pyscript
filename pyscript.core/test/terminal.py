###### magic monkey patching ######
import sys
import builtins
from pyscript import sync
from pyodide.code import eval_code

sys.stdout = sync
builtins.input = sync.readline

####### main code ######
import code

code.interact()
