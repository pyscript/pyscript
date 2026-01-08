/**
 * Bundled by jsDelivr using Rollup v2.79.2 and Terser v5.39.0.
 * Original file: /npm/@xterm/addon-web-links@0.12.0/lib/addon-web-links.mjs
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
var e=class{constructor(e,t,r,i={}){this._terminal=e,this._regex=t,this._handler=r,this._options=i}provideLinks(e,t){let i=r.computeLink(e,this._regex,this._terminal,this._handler);t(this._addCallbacks(i))}_addCallbacks(e){return e.map((e=>(e.leave=this._options.leave,e.hover=(t,r)=>{if(this._options.hover){let{range:i}=e;this._options.hover(t,r,i)}},e)))}};function t(e){try{let t=new URL(e),r=t.password&&t.username?`${t.protocol}//${t.username}:${t.password}@${t.host}`:t.username?`${t.protocol}//${t.username}@${t.host}`:`${t.protocol}//${t.host}`;return e.toLocaleLowerCase().startsWith(r.toLocaleLowerCase())}catch{return!1}}var r=class e{static computeLink(r,i,n,s){let o,a=new RegExp(i.source,(i.flags||"")+"g"),[l,h]=e._getWindowedLineStrings(r-1,n),c=l.join(""),d=[];for(;o=a.exec(c);){let r=o[0];if(!t(r))continue;let[i,a]=e._mapStrIdx(n,h,0,o.index),[l,c]=e._mapStrIdx(n,i,a,r.length);if(-1===i||-1===a||-1===l||-1===c)continue;let p={start:{x:a+1,y:i+1},end:{x:c,y:l+1}};d.push({range:p,text:r,activate:s})}return d}static _getWindowedLineStrings(e,t){let r,i=e,n=e,s=0,o="",a=[];if(r=t.buffer.active.getLine(e)){let e=r.translateToString(!0);if(r.isWrapped&&" "!==e[0]){for(s=0;(r=t.buffer.active.getLine(--i))&&s<2048&&(o=r.translateToString(!0),s+=o.length,a.push(o),r.isWrapped&&-1===o.indexOf(" ")););a.reverse()}for(a.push(e),s=0;(r=t.buffer.active.getLine(++n))&&r.isWrapped&&s<2048&&(o=r.translateToString(!0),s+=o.length,a.push(o),-1===o.indexOf(" ")););}return[a,i]}static _mapStrIdx(e,t,r,i){let n=e.buffer.active,s=n.getNullCell(),o=r;for(;i;){let e=n.getLine(t);if(!e)return[-1,-1];for(let r=o;r<e.length;++r){e.getCell(r,s);let o=s.getChars();if(s.getWidth()&&(i-=o.length||1,r===e.length-1&&""===o)){let e=n.getLine(t+1);e&&e.isWrapped&&(e.getCell(0,s),2===s.getWidth()&&(i+=1))}if(i<0)return[t,r]}t++,o=0}return[t,o]}},i=/(https?|HTTPS?):[/]{2}[^\s"'!*(){}|\\\^<>`]*[^\s"':,.!?{}|\\\^~\[\]`()<>]/;function n(e,t){let r=window.open();if(r){try{r.opener=null}catch{}r.location.href=t}else console.warn("Opening link blocked as opener could not be cleared")}var s=class{constructor(e=n,t={}){this._handler=e,this._options=t}activate(t){this._terminal=t;let r=this._options,n=r.urlRegex||i;this._linkProvider=this._terminal.registerLinkProvider(new e(this._terminal,n,this._handler,r))}dispose(){this._linkProvider?.dispose()}};export{s as WebLinksAddon};export default null;
