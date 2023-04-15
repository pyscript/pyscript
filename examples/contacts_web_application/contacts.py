""" Contacts Web Application """
from js import add_to_list, clear_search_area, add_found_contact
import re
contacts_list = {}
output = Element("output")

search_res = []

def search_by_value(query):
  global search_res
  search_res = []
  clear_search_area()
  for number, name in contacts_list.items():
    temp = re.findall(query, name)
    if temp:
      contact = {"contact_name": name, "contact_number": number}
      add_found_contact(name, number)
      search_res.append(contact)
  return search_res

def contact_book(*args, **kwargs):
    """Contact book function."""
    # Signal that PyScript is alive by setting the ``Save Contact``
    # disabled attribute
    save_button = Element("save")
    # Now get the various inputs
    contact_name = Element("contact_name").value
    phone_number = Element("phone_number").value

    if phone_number not in contacts_list.keys():
      contacts_list[phone_number] = contact_name
      last_val = list(contacts_list.keys())[-1]
      add_to_list(str(last_val), str(contacts_list[last_val]))


def setup():
    """When Pyodide starts up, enable the Save button."""
    save_button = Element("save")  # noqa
    save_button.element.removeAttribute("disabled")
    output = Element("output")

setup()