export const python = {content: '', target: null};
export const loadMicroPython = () => ({
  runPython(content) {
    python.content = content;
    python.target = document.currentScript.target;
  }
});
