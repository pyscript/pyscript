with open("interactive.py", "r", encoding="utf-8") as f:
    source = f.read()

replacementMap = {
    "\\n": "\\\\n",
    "\\r": "\\\\r",
    "\\x": "\\\\x"
}

with open("_interactive_src.js", "w", encoding="utf-8") as f:
    f.write("const interactivesrc = `\n")
    for before, after in replacementMap.items():
        source = source.replace(before, after)
    f.write(source)
    f.write("`\n\nexport { interactivesrc }")
