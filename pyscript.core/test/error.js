// PyScript Error Plugin
import { hooks } from '@pyscript/core';

hooks.onBeforeRun.add(function override(pyScript) {
  // be sure this override happens only once
  hooks.onBeforeRun.delete(override);

  // trap generic `stderr` to propagate to it regardless
  const { stderr } = pyScript.io;

  // override it with our own logic
  pyScript.io.stderr = (...args) => {
    // grab the message of the first argument (Error)
    const [ { message } ] = args;
    // show it
    notify(message);
    // still let other plugins or PyScript itself do the rest
    return stderr(...args);
  };
});

// Error hook utilities

// Custom function to show notifications
function notify(message) {
  const div = document.createElement('div');
  div.textContent = message;
  div.style.cssText = `
    border: 1px solid red;
    background: #ffdddd;
    color: black;
    font-family: courier, monospace;
    white-space: pre;
    overflow-x: auto;
    padding: 8px;
    margin-top: 8px;
  `;
  document.body.append(div);
}
