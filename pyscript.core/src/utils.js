const entity = { "<": "&lt;", ">": "&gt;" };
const escape = (str) => str.replace(/[<>]/g, (key) => entity[key]);

export const htmlDecode = (html) =>
    new DOMParser().parseFromString(escape(html), "text/html").documentElement
        .textContent;
