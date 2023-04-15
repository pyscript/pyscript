document.getElementById("search_area").addEventListener("input", function (user_input) {
    const contacts_match_name_list = pyscript.runtime.globals.get('search_by_value') || "empty";
    if (user_input.target.value != "") {
        const search_result = contacts_match_name_list(user_input.target.value);
    } else {
        clear_search_area();
    }

    return user_input.target.value;
});

function clear_search_area() {
    const output_grid = document.getElementById("found_contacts_list");
    /* this function is for the search OUTPUT */
    output_grid.innerHTML = "";
}

function add_found_contact(contact_name, contact_number) {
    const output_grid = document.getElementById("found_contacts_list");
    const contact_card = document.getElementById("contact_card_template").cloneNode(true);
    contact_card.childNodes.forEach(function (child, number) {
        if (child.className != undefined &&
            child.className.includes("name_template")) {
            child.innerText = contact_name;
        }

        if (child.className != undefined &&
            child.className.includes("number_template")) {
            child.innerText = contact_number;
        }
    });

    contact_card.style = "visibility: visible;";
    output_grid.appendChild(contact_card);
}

function add_to_list(contact_number, contact_name) {
    let grid = document.getElementById("contacts_list_grid");
    let contacts_card = document.createElement("div");
    contacts_card.className = "d-flex justify-content-center w-100 row contact_card";
    let name = document.createElement("span");
    name.className = "d-flex justify-content-center w-50 m-auto";
    contacts_card.style = "border: 1px solid black";
    //vertical-align: middle;
    //align-middle
    let num = document.createElement("span");
    num.className = "d-flex justify-content-center m-auto";
    num.innerHTML = contact_number;
    name.innerHTML = contact_name;
    //contacts_card.style = "background-color: green; width: 100%; height: 100px;";
    //contacts_card.id = "contacts_list_grid"
    //contacts_card.innerHTML = contact_number + "<br>" + contact_name;
    contacts_card.appendChild(name);
    contacts_card.appendChild(num);
    grid.appendChild(contacts_card);
}
//# sourceMappingURL=pyscript.js.map