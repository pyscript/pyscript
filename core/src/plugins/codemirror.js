// lazy loaded on-demand codemirror related files
export default {
    get core() {
        return import(/* webpackIgnore: true */ "../3rd-party/codemirror.js");
    },
    get state() {
        return import(
            /* webpackIgnore: true */ "../3rd-party/codemirror_state.js"
        );
    },
    get python() {
        return import(
            /* webpackIgnore: true */ "../3rd-party/codemirror_lang-python.js"
        );
    },
    get language() {
        return import(
            /* webpackIgnore: true */ "../3rd-party/codemirror_language.js"
        );
    },
    get view() {
        return import(
            /* webpackIgnore: true */ "../3rd-party/codemirror_view.js"
        );
    },
    get commands() {
        return import(
            /* webpackIgnore: true */ "../3rd-party/codemirror_commands.js"
        );
    },
};
