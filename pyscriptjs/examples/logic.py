from js import console, document


class Calculator:
    def __init__(self, num_first, num_second, sign_click, cal_type):
        self.num_first = num_first
        self.num_second = num_second
        self.sign_click = sign_click
        self.cal_type = cal_type


demo_calculator = Calculator("", "", "", "")
answer = Element("typing-text")
numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."]
sign = ["equal-to", "reverse", "ac", "percent", "plus-or-minus"]


def numbers_clicked(args):
    typed_in = args.target.innerText
    if typed_in in numbers and demo_calculator.sign_click == "":
        answer.element.innerText += typed_in
        demo_calculator.num_first = answer.element.innerText
    elif typed_in in numbers and demo_calculator.sign_click != "":
        Element("typing-text").element.innerHTML += typed_in
        demo_calculator.num_second += typed_in


def sign_clicked(args):
    if args.target.id == "equal-to":
        calculate()
    elif args.target.id == "reverse":
        clear_all()
    elif args.target.id == "ac":
        clear_all()
    elif (
        args.target.id == "percent"
        and demo_calculator.sign_click == ""
        and demo_calculator.num_second == ""
    ):
        demo_calculator.num_first = int(demo_calculator.num_first) / 100
        Element("typing-text").element.innerText = demo_calculator.num_first
    elif (
        args.target.id == "plus-or-minus"
        and demo_calculator.num_first != ""
        and demo_calculator.sign_click == ""
        and demo_calculator.num_second == ""
    ):
        current = Element("typing-text").element.innerText
        if current[0] == "-":
            Element("typing-text").element.innerText = abs(what_type(current))
            demo_calculator.num_first = str(abs(what_type(current)))
        else:
            Element("typing-text").element.innerText = "-" + str(what_type(current))
            demo_calculator.num_first = "-" + str(what_type(current))
    elif args.target.id not in sign:
        demo_calculator.cal_type = args.target.id
        demo_calculator.sign_click = args.target.innerText
        Element("typing-text").element.innerHTML += (
            "<span>" + demo_calculator.sign_click + "</span>"
        )


def calculate():
    console.log(
        demo_calculator.num_first,
        float(demo_calculator.num_second),
        demo_calculator.cal_type,
        demo_calculator.sign_click,
    )
    new_total = 0
    if demo_calculator.cal_type == "multiply":
        new_total = float(demo_calculator.num_first) * float(demo_calculator.num_second)
        Element("answer").element.innerText = new_total
    elif demo_calculator.cal_type == "divid":
        new_total = float(demo_calculator.num_first) / float(demo_calculator.num_second)
        Element("answer").element.innerText = new_total
    elif demo_calculator.cal_type == "minus":
        new_total = float(demo_calculator.num_first) - float(demo_calculator.num_second)
        Element("answer").element.innerText = new_total
    elif demo_calculator.cal_type == "plus":
        new_total = float(demo_calculator.num_first) + float(demo_calculator.num_second)
        Element("answer").element.innerText = new_total


def clear_all():
    demo_calculator.num_first = ""
    demo_calculator.num_second = ""
    demo_calculator.cal_type = ""
    demo_calculator.sign_click = ""
    Element("typing-text").element.innerHTML = ""
    Element("answer").element.innerText = ""


def what_type(curr_num):
    numb = 0
    try:
        numb = int(curr_num)
        return numb
    except ValueError:
        num = float(curr_num)
        return num


def theme_clicked(args):
    all_btns = document.getElementsByClassName("btns")
    all_btns_num = document.getElementsByClassName("btns-num")
    if args.target.id == "light":
        change_theme(all_btns, all_btns_num)
    else:
        change_theme(all_btns, all_btns_num, theme="dark")


def change_theme(all_btns, all_btns_num, theme="light"):
    Element("light").element.style.color = "#060709" if theme == "light" else "#474B52"
    Element("dark").element.style.color = "#474B52" if theme == "light" else "white"
    Element("main").element.style.backgroundColor = (
        "white" if theme == "light" else "#060709"
    )
    Element("theme-buttons").element.style.backgroundColor = (
        "#F9F9F9" if theme == "light" else "#292D36"
    )
    Element("main").element.style.color = "#060709" if theme == "light" else "white"
    Element("btn-wrapper").element.style.backgroundColor = (
        "#F9F9F9" if theme == "light" else "#292D36"
    )
    Element("bottom-line").element.style.backgroundColor = (
        "#DFDEDE" if theme == "light" else "#474B52"
    )
    for btn in range(len(all_btns)):
        all_btns[btn].style.backgroundColor = (
            "#F7F7F7" if theme == "light" else "#272B33"
        )

    for btn in range(len(all_btns_num)):
        all_btns_num[btn].style.backgroundColor = (
            "#F7F7F7" if theme == "light" else "#272B33"
        )
        all_btns_num[btn].style.color = "#060709" if theme == "light" else "white"
