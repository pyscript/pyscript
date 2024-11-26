declare namespace _default {
    const core: Promise<typeof import("../3rd-party/codemirror.js")>;
    const state: Promise<typeof import("../3rd-party/codemirror_state.js")>;
    const python: Promise<typeof import("../3rd-party/codemirror_lang-python.js")>;
    const language: Promise<typeof import("../3rd-party/codemirror_language.js")>;
    const view: Promise<typeof import("../3rd-party/codemirror_view.js")>;
    const commands: Promise<typeof import("../3rd-party/codemirror_commands.js")>;
}
export default _default;
