from datetime import datetime as dt


def format_date(dt_, fmt="%m/%d/%Y, %H:%M:%S"):
    return dt_.strftime(fmt)


def now(fmt="%m/%d/%Y, %H:%M:%S"):
    return format_date(dt.now(), fmt)


def remove_class(element, class_name):
    element.element.classList.remove(class_name)


def add_class(element, class_name):
    element.element.classList.add(class_name)
