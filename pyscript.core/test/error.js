// Shoelace
const SHOELACE_BASE = 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.8.0/cdn';

// load the library and set the correct base path
const { setBasePath } = await import(`${SHOELACE_BASE}/shoelace.js`);
setBasePath(SHOELACE_BASE);

// append all styles needed to work properly
const { assign } = Object;
document.head.append(
  assign(
    document.createElement('link'),
    {
      rel: 'stylesheet',
      media: '(prefers-color-scheme:light)',
      href: `${SHOELACE_BASE}/themes/light.css`
    }
  ),
  assign(
    document.createElement('link'),
    {
      rel: 'stylesheet',
      media: '(prefers-color-scheme:dark)',
      href: `${SHOELACE_BASE}/themes/dark.css`,
      onload() {
        document.documentElement.classList.add('sl-theme-dark');
      }
    }
  )
);

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

// Always escape HTML for text arguments!
function escapeHtml(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

// Custom function to show notifications
function notify(message, variant = 'danger', icon = 'exclamation-octagon') {
  const alert = assign(
    document.createElement('sl-alert'),
    {
      variant,
      closable: true,
      open: true,
      innerHTML: `
        <sl-icon name="${icon}" slot="icon"></sl-icon>
        <pre><code>${escapeHtml(message)}</code></pre>
      `
    }
  );
  document.body.append(alert);
}
