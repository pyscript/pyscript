""" Password Generator Web Application """
import secrets
import string

output = Element("result")
has_numbers = False
has_symbols = False
has_similar = False
similar_chars = ["l,I,1,|,L", "o,0,O", "B,8", "c,(,©"]


def remove_similar(password):
    if bool(has_similar):
        for c in password:
            for line in similar_chars:
                split_line = line.split(",")
                if c in split_line:
                    password = password.replace(c, split_line[0])
    return password


def get_alphabet():
    alphabet = string.ascii_letters
    if bool(has_numbers):
        alphabet += string.digits

    if bool(has_symbols):
        alphabet += string.punctuation.replace(string.whitespace, "")

    return alphabet


def generate_password(*args, **kwargs):
    alphabet = get_alphabet()
    length = int(Element("password_length").value)
    if type(length) is int and length > 0:
        password = str("".join(secrets.choice(alphabet) for i in range(length)))
        output.element.value = remove_similar(password)


def setup():
    """When Pyodide starts up, enable the Save button."""
    generate_button = Element("generate")  # noqa
    if generate_button is not None:
        generate_button.element.removeAttribute("disabled")
    Element("result")


setup()
