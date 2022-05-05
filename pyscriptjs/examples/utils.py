from datetime import datetime as dt


def format_date(dt_, fmt="%m/%d/%Y, %H:%M:%S"):
    return dt_.strftime(fmt)


def now(fmt="%m/%d/%Y, %H:%M:%S"):
    return format_date(dt.now(), fmt)


def remove_class(element, className):
    element.element.classList.remove(className)


def add_class(element, className):
    element.element.classList.add(className)
