const qs = new URLSearchParams(location.search);

const src = './main.py';
let config = './settings_mpy.json';

// terminal=0 to NOT have a terminal
const terminal = qs.has('terminal') ? qs.get('terminal') : 1;
// worker=1 to have a worker
const worker = qs.has('worker');

const interpreter = qs.get('type') || 'mpy';
if (interpreter === 'py') {
    config = "./settings_py.json";
}

const script = document.createElement('script');
script.type = interpreter;
if (src) script.src = src;
if (config) script.setAttribute('config', config);
script.toggleAttribute('terminal', terminal);
script.toggleAttribute('worker', worker);

document.write(script.outerHTML);
