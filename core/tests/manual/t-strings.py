from pyscript import window, document

SHOW_COMMENT = window.NodeFilter.SHOW_COMMENT

already_parsed = {}

# accepts a t-string template, returns a JS DOM node 🤯
def domdom(template):
    strings = template.strings
    if strings in already_parsed:
        content = already_parsed[strings].cloneNode(True)
    else:
        interpolations = template.interpolations
        el = document.createElement('template')

        # create unique content that can be understood by the parser
        el.innerHTML = '<!--🐍-->'.join(strings)
        content = el.content
        already_parsed[strings] = el.content

    tw = document.createTreeWalker(content, SHOW_COMMENT)
    i = 0
    while True  :
        node = tw.nextNode()
        if node is None: break
        if node.data == '🐍':
            node.replaceWith(interpolations[i].value.node)
            i += 1

    return content


class Text:
    def __init__(self, value, node=None):
        self._value = str(value)
        self.node = document.createTextNode(self._value) if node is None else node

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, value):
        self._value = str(value)
        self.node.data = self._value

    def __str__(self):
        return f'#text: {self._value}'

    # just to demo JS string casting
    def toString(self):
        return str(self)


# create a new text and leak it for demo purposes
content = Text('Hello World!')
window.content = content

print(f"<div>{content}</div>")

# see domdom in action 🥳
document.body.append(
    domdom(
      t"<div>{content}</div>"
    ),
    # domdom(
    #   t"<div>{content}</div>"
    # )
)
