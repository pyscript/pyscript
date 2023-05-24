(function () {
    var onchange = function (elem_name, python_var_global) {
        document
            .getElementById(elem_name)
            .addEventListener("change", function () {
                let is_enabled =
                    pyscript.runtime.globals.get(python_var_global);
                if (is_enabled != undefined) {
                    pyscript.runtime.globals.set(
                        python_var_global,
                        event.target.checked,
                    );
                }
            });
    };

    onchange("include_numbers", "has_numbers");
    onchange("include_symbols", "has_symbols");
    onchange("include_similar", "has_similar");
})();
