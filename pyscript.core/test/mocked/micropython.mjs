export const python = { content: "", target: null };
export const loadMicroPython = () => ({
    runPython(content) {
        if (document.currentScript?.target) {
            python.content = content;
            python.target = document.currentScript.target;
        }
    },
});
