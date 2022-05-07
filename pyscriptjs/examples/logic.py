from js import console, DOMParser, document

answer = Element("typing-text")
num_first = ""
num_second = ""
sign_click = ""
cal_type = ""
numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."]
sign = ["equal-to", "reverse", "ac", "percent", "plus-or-minus"]

def numbers_clicked(args):
    global num_first
    global num_second
    global sign_click
    typed_in = args.target.innerText
    console.log(args.target.innerText, args)
    if typed_in in numbers and sign_click == "":
        answer.element.innerText += typed_in
        num_first = answer.element.innerText
        console.log(answer.element.innerText, num_first)
    elif typed_in in numbers and sign_click != "":
        document.getElementById("typing-text").innerHTML += typed_in
        num_second += typed_in
        console.log(answer.element.innerText, num_second, typed_in)    
    
def sign_clicked(args):
    global num_first
    global num_second
    global sign_click
    global cal_type
    console.log(args.target.innerText, args)
    if args.target.id == "equal-to":
       console.log("give total")
       calculate()
    elif args.target.id == "reverse":
        console.log("give reverse")
        clear_all()
    elif args.target.id == "ac":
        console.log("give ac")
        clear_all()
    elif args.target.id == "percent" and sign_click == "" and num_second == "":
        console.log("give percent")
        num_first = int(num_first) / 100
        document.getElementById("typing-text").innerText = num_first
    elif args.target.id == "plus-or-minus" and num_first != "" and sign_click == "" and num_second == "":
        current = document.getElementById("typing-text").innerText
        if current[0] == "-":
            document.getElementById("typing-text").innerText = abs(what_type(current))
            num_first = str(abs(what_type(current)))
        else:
            document.getElementById("typing-text").innerText = "-"+str(what_type(current))
            num_first = "-"+str(what_type(current))
    elif not args.target.id in sign:
        cal_type = args.target.id
        sign_click = args.target.innerText
        document.getElementById("typing-text").innerHTML += "<span>" + sign_click + "</span>"
            
        
def calculate():
    console.log(num_first, float(num_second), cal_type, sign_click)
    new_total = 0
    if cal_type == "multiply":
        new_total = float(num_first) * float(num_second)
        document.getElementById("answer").innerText = new_total
    elif cal_type == "divid":
        new_total = float(num_first) / float(num_second)
        document.getElementById("answer").innerText = new_total
    elif cal_type == "minus":
        new_total = float(num_first) - float(num_second)
        document.getElementById("answer").innerText = new_total
    elif cal_type == "plus":
        new_total = float(num_first) + float(num_second)
        document.getElementById("answer").innerText = new_total
        
def clear_all():
    global num_first
    global num_second
    global sign_click
    global cal_type
    num_first = 0
    num_second = ""
    cal_type = ""
    sign_click = ""
    document.getElementById("typing-text").innerHTML = ""
    document.getElementById("answer").innerText = ""
    
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
    document.getElementById("light").style.color = "#060709" if theme == "light" else "#474B52"
    document.getElementById("dark").style.color = "#474B52" if theme == "light" else "white"
    document.getElementById("main").style.backgroundColor = "white" if theme == "light" else "#060709"
    document.getElementById("theme-buttons").style.backgroundColor = "#F9F9F9" if theme == "light" else "#292D36"
    document.getElementById("main").style.color = "#060709" if theme == "light" else "white"
    document.getElementById("btn-wrapper").style.backgroundColor = "#F9F9F9" if theme == "light" else "#292D36"
    document.getElementById("bottom-line").style.backgroundColor = "#DFDEDE" if theme == "light" else "#474B52"
    for btn in range(len(all_btns)):
        all_btns[btn].style.backgroundColor = "#F7F7F7" if theme == "light" else "#272B33"
        
    for btn in range(len(all_btns_num)):
        all_btns_num[btn].style.backgroundColor = "#F7F7F7" if theme == "light" else "#272B33"
        all_btns_num[btn].style.color = "#060709" if theme == "light" else "white"                   