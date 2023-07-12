from xworker import XWorker

for i in range(4):
    sync = XWorker("pompom.py", config="turtle.toml")
