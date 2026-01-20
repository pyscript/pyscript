/**
 * Bundled by jsDelivr using Rollup v2.79.2 and Terser v5.39.0.
 * Original file: /npm/@xterm/addon-fit@0.11.0/lib/addon-fit.mjs
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
/**
 * Copyright (c) 2014-2024 The xterm.js authors. All rights reserved.
 * @license MIT
 *
 * Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)
 * @license MIT
 *
 * Originally forked from (with the author's permission):
 *   Fabrice Bellard's javascript vt100 for jslinux:
 *   http://bellard.org/jslinux/
 *   Copyright (c) 2011 Fabrice Bellard
 */
var e=class{activate(e){this._terminal=e}dispose(){}fit(){let e=this.proposeDimensions();if(!e||!this._terminal||isNaN(e.cols)||isNaN(e.rows))return;let t=this._terminal._core;(this._terminal.rows!==e.rows||this._terminal.cols!==e.cols)&&(t._renderService.clear(),this._terminal.resize(e.cols,e.rows))}proposeDimensions(){if(!this._terminal||!this._terminal.element||!this._terminal.element.parentElement)return;let e=this._terminal._core._renderService.dimensions;if(0===e.css.cell.width||0===e.css.cell.height)return;let t=0===this._terminal.options.scrollback?0:this._terminal.options.overviewRuler?.width||14,r=window.getComputedStyle(this._terminal.element.parentElement),i=parseInt(r.getPropertyValue("height")),s=Math.max(0,parseInt(r.getPropertyValue("width"))),l=window.getComputedStyle(this._terminal.element),a=i-(parseInt(l.getPropertyValue("padding-top"))+parseInt(l.getPropertyValue("padding-bottom"))),n=s-(parseInt(l.getPropertyValue("padding-right"))+parseInt(l.getPropertyValue("padding-left")))-t;return{cols:Math.max(2,Math.floor(n/e.css.cell.width)),rows:Math.max(1,Math.floor(a/e.css.cell.height))}}};export{e as FitAddon};export default null;
