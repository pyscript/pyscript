const qs = new URLSearchParams(location.search);

// src= to NOT have a config
const src = qs.has('src') ? qs.get('src') : './main.py';

// config= to NOT have a src
const config = qs.has('config') ? qs.get('config') : './settings.json';

// terminal=0 to NOT have a terminal
const terminal = qs.get('terminal') !== '0';

// worker=1 to have a worker
const worker = qs.get('worker') == '1';

const script = document.createElement('script');
script.type = qs.get('type') || 'mpy';
if (src) script.src = src;
if (config) script.setAttribute('config', config);
script.toggleAttribute('terminal', terminal);
script.toggleAttribute('worker', worker);

document.write(script.outerHTML);