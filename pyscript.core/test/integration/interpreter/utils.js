import '/core.js';

export const init = name => pyscript.env[name].then(() => {
    document.documentElement.classList.add('ready');
});
