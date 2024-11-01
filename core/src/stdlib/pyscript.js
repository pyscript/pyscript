// ⚠️ This file is an artifact: DO NOT MODIFY
export default {
  "pyscript": {
    "__init__.py": "from polyscript import lazy_py_modules as py_import\nfrom pyscript.events import when,Event\nfrom pyscript.display import HTML,display\nfrom pyscript.fetch import fetch\nfrom pyscript.magic_js import RUNNING_IN_WORKER,PyWorker,config,current_target,document,js_import,js_modules,sync,window\nfrom pyscript.storage import Storage,storage\nfrom pyscript.websocket import WebSocket\nif not RUNNING_IN_WORKER:from pyscript.workers import create_named_worker,workers",
    "display.py": "_L='_repr_mimebundle_'\n_K='image/svg+xml'\n_J='application/json'\n_I='__repr__'\n_H='savefig'\n_G='text/html'\n_F='image/jpeg'\n_E='application/javascript'\n_D='utf-8'\n_C='text/plain'\n_B='image/png'\n_A=None\nimport base64,html,io,re\nfrom pyscript.magic_js import current_target,document,window\n_MIME_METHODS={_H:_B,'_repr_javascript_':_E,'_repr_json_':_J,'_repr_latex':'text/latex','_repr_png_':_B,'_repr_jpeg_':_F,'_repr_pdf_':'application/pdf','_repr_svg_':_K,'_repr_markdown_':'text/markdown','_repr_html_':_G,_I:_C}\ndef _render_image(mime,value,meta):\n\tA=value\n\tif isinstance(A,bytes):A=base64.b64encode(A).decode(_D)\n\tB=re.compile('^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$')\n\tif len(A)>0 and not B.match(A):A=base64.b64encode(A.encode(_D)).decode(_D)\n\tC=f\"data:{mime};charset=utf-8;base64,{A}\";D=' '.join(['{k}=\"{v}\"'for(A,B)in meta.items()]);return f'<img src=\"{C}\" {D}></img>'\ndef _identity(value,meta):return value\n_MIME_RENDERERS={_C:html.escape,_G:_identity,_B:lambda value,meta:_render_image(_B,value,meta),_F:lambda value,meta:_render_image(_F,value,meta),_K:_identity,_J:_identity,_E:lambda value,meta:f\"<script>{value}<\\\\/script>\"}\nclass HTML:\n\tdef __init__(A,html):A._html=html\n\tdef _repr_html_(A):return A._html\ndef _eval_formatter(obj,print_method):\n\tB=obj;A=print_method\n\tif A==_I:return repr(B)\n\telif hasattr(B,A):\n\t\tif A==_H:C=io.BytesIO();B.savefig(C,format='png');C.seek(0);return base64.b64encode(C.read()).decode(_D)\n\t\treturn getattr(B,A)()\n\telif A==_L:return{},{}\ndef _format_mime(obj):\n\tC=obj\n\tif isinstance(C,str):return html.escape(C),_C\n\tD=_eval_formatter(C,_L)\n\tif isinstance(D,tuple):E,I=D\n\telse:E=D\n\tA,F=_A,[]\n\tfor(H,B)in _MIME_METHODS.items():\n\t\tif B in E:A=E[B]\n\t\telse:A=_eval_formatter(C,H)\n\t\tif A is _A:continue\n\t\telif B not in _MIME_RENDERERS:F.append(B);continue\n\t\tbreak\n\tif A is _A:\n\t\tif F:window.console.warn(f\"Rendered object requested unavailable MIME renderers: {F}\")\n\t\tA=repr(A);B=_C\n\telif isinstance(A,tuple):A,G=A\n\telse:G={}\n\treturn _MIME_RENDERERS[B](A,G),B\ndef _write(element,value,append=False):\n\tB=element;C,D=_format_mime(value)\n\tif C=='\\\\n':return\n\tif append:A=document.createElement('div');B.append(A)\n\telse:\n\t\tA=B.lastElementChild\n\t\tif A is _A:A=B\n\tif D in(_E,_G):E=document.createRange().createContextualFragment(C);A.append(E)\n\telse:A.innerHTML=C\ndef display(*D,target=_A,append=True):\n\tC=append;A=target\n\tif A is _A:A=current_target()\n\telif not isinstance(A,str):raise TypeError(f\"target must be str or None, not {A.__class__.__name__}\")\n\telif A=='':raise ValueError('Cannot have an empty target')\n\telif A.startswith('#'):A=A[1:]\n\tB=document.getElementById(A)\n\tif B is _A:raise ValueError(f\"Invalid selector with id={A}. Cannot be found in the page.\")\n\tif B.tagName=='SCRIPT'and hasattr(B,'target'):B=B.target\n\tfor E in D:\n\t\tif not C:B.replaceChildren()\n\t\t_write(B,E,append=C)",
    "events.py": "import asyncio,inspect,sys\nfrom functools import wraps\nfrom pyscript.magic_js import document\nfrom pyscript.ffi import create_proxy\nfrom pyscript.util import is_awaitable\nclass Event:\n\tdef __init__(A):A._listeners=[]\n\tdef trigger(C,result):\n\t\tB=result\n\t\tfor A in C._listeners:\n\t\t\tif is_awaitable(A):asyncio.create_task(A(B))\n\t\t\telse:A(B)\n\tdef add_listener(B,listener):\n\t\tA=listener\n\t\tif is_awaitable(A)or callable(A):\n\t\t\tif A not in B._listeners:B._listeners.append(A)\n\t\telse:raise ValueError('Listener must be callable or awaitable.')\n\tdef remove_listener(A,*B):\n\t\tif B:\n\t\t\tfor C in B:A._listeners.remove(C)\n\t\telse:A._listeners=[]\ndef when(target,*B,**D):\n\tG='handler';C=target;E=None\n\tif B and(callable(B[0])or is_awaitable(B[0])):E=B[0]\n\telif callable(D.get(G))or is_awaitable(D.get(G)):E=D.pop(G)\n\tif isinstance(C,str):\n\t\tA=B[0]if B else D.pop('selector')\n\t\tif not A:raise ValueError('No selector provided.')\n\t\tfrom pyscript.web import Element as I,ElementCollection as J\n\t\tif isinstance(A,str):F=document.querySelectorAll(A)\n\t\telif isinstance(A,I):F=[A._dom_element]\n\t\telif isinstance(A,J):F=[A._dom_element for A in A]\n\t\telse:F=A if isinstance(A,list)else[A]\n\tdef H(func):\n\t\tE='positional arguments';D='takes';A=func\n\t\tif'micropython'in sys.version.lower():\n\t\t\tif is_awaitable(A):\n\t\t\t\tasync def B(*C,**F):\n\t\t\t\t\ttry:return await A(*C,**F)\n\t\t\t\t\texcept TypeError as B:\n\t\t\t\t\t\tif D in str(B)and E in str(B):return await A()\n\t\t\t\t\t\traise\n\t\t\telse:\n\t\t\t\tdef B(*C,**F):\n\t\t\t\t\ttry:return A(*C,**F)\n\t\t\t\t\texcept TypeError as B:\n\t\t\t\t\t\tif D in str(B)and E in str(B):return A()\n\t\t\t\t\t\traise\n\t\telse:\n\t\t\tG=inspect.signature(A)\n\t\t\tif G.parameters:\n\t\t\t\tif is_awaitable(A):\n\t\t\t\t\tasync def B(event):return await A(event)\n\t\t\t\telse:B=A\n\t\t\telif is_awaitable(A):\n\t\t\t\tasync def B(*B,**C):return await A()\n\t\t\telse:\n\t\t\t\tdef B(*B,**C):return A()\n\t\tB=wraps(A)(B)\n\t\tif isinstance(C,Event):C.add_listener(B)\n\t\telif isinstance(C,list)and all(isinstance(A,Event)for A in C):\n\t\t\tfor H in C:H.add_listener(B)\n\t\telse:\n\t\t\tfor I in F:I.addEventListener(C,create_proxy(B))\n\t\treturn B\n\treturn H(E)if E else H",
    "fetch.py": "import json,js\nfrom pyscript.util import as_bytearray\nclass _Response:\n\tdef __init__(A,response):A._response=response\n\tdef __getattr__(A,attr):return getattr(A._response,attr)\n\tasync def arrayBuffer(B):\n\t\tA=await B._response.arrayBuffer()\n\t\tif hasattr(A,'to_py'):return A.to_py()\n\t\treturn memoryview(as_bytearray(A))\n\tasync def blob(A):return await A._response.blob()\n\tasync def bytearray(A):B=await A._response.arrayBuffer();return as_bytearray(B)\n\tasync def json(A):return json.loads(await A.text())\n\tasync def text(A):return await A._response.text()\nclass _DirectResponse:\n\t@staticmethod\n\tdef setup(promise,response):A=promise;A._response=_Response(response);return A._response\n\tdef __init__(B,promise):A=promise;B._promise=A;A._response=None;A.arrayBuffer=B.arrayBuffer;A.blob=B.blob;A.bytearray=B.bytearray;A.json=B.json;A.text=B.text\n\tasync def _response(A):\n\t\tif not A._promise._response:await A._promise\n\t\treturn A._promise._response\n\tasync def arrayBuffer(A):B=await A._response();return await B.arrayBuffer()\n\tasync def blob(A):B=await A._response();return await B.blob()\n\tasync def bytearray(A):B=await A._response();return await B.bytearray()\n\tasync def json(A):B=await A._response();return await B.json()\n\tasync def text(A):B=await A._response();return await B.text()\ndef fetch(url,**B):C=js.JSON.parse(json.dumps(B));D=lambda response,*B:_DirectResponse.setup(A,response);A=js.fetch(url,C).then(D);_DirectResponse(A);return A",
    "ffi.py": "try:\n\timport js;from pyodide.ffi import create_proxy as _cp,to_js as _py_tjs;from_entries=js.Object.fromEntries\n\tdef _tjs(value,**A):\n\t\tB='dict_converter'\n\t\tif not hasattr(A,B):A[B]=from_entries\n\t\treturn _py_tjs(value,**A)\nexcept:from jsffi import create_proxy as _cp;from jsffi import to_js as _tjs\ncreate_proxy=_cp\nto_js=_tjs",
    "flatted.py": "import json as _json\nclass _Known:\n\tdef __init__(A):A.key=[];A.value=[]\nclass _String:\n\tdef __init__(A,value):A.value=value\ndef _array_keys(value):\n\tA=[];B=0\n\tfor C in value:A.append(B);B+=1\n\treturn A\ndef _object_keys(value):\n\tA=[]\n\tfor B in value:A.append(B)\n\treturn A\ndef _is_array(value):A=value;return isinstance(A,list)or isinstance(A,tuple)\ndef _is_object(value):return isinstance(value,dict)\ndef _is_string(value):return isinstance(value,str)\ndef _index(known,input,value):B=value;A=known;input.append(B);C=str(len(input)-1);A.key.append(B);A.value.append(C);return C\ndef _loop(keys,input,known,output):\n\tA=output\n\tfor B in keys:\n\t\tC=A[B]\n\t\tif isinstance(C,_String):_ref(B,input[int(C.value)],input,known,A)\n\treturn A\ndef _ref(key,value,input,known,output):\n\tB=known;A=value\n\tif _is_array(A)and not A in B:B.append(A);A=_loop(_array_keys(A),input,B,A)\n\telif _is_object(A)and not A in B:B.append(A);A=_loop(_object_keys(A),input,B,A)\n\toutput[key]=A\ndef _relate(known,input,value):\n\tB=known;A=value\n\tif _is_string(A)or _is_array(A)or _is_object(A):\n\t\ttry:return B.value[B.key.index(A)]\n\t\texcept:return _index(B,input,A)\n\treturn A\ndef _transform(known,input,value):\n\tB=known;A=value\n\tif _is_array(A):\n\t\tC=[]\n\t\tfor F in A:C.append(_relate(B,input,F))\n\t\treturn C\n\tif _is_object(A):\n\t\tD={}\n\t\tfor E in A:D[E]=_relate(B,input,A[E])\n\t\treturn D\n\treturn A\ndef _wrap(value):\n\tA=value\n\tif _is_string(A):return _String(A)\n\tif _is_array(A):\n\t\tB=0\n\t\tfor D in A:A[B]=_wrap(D);B+=1\n\telif _is_object(A):\n\t\tfor C in A:A[C]=_wrap(A[C])\n\treturn A\ndef parse(value,*C,**D):\n\tA=value;E=_json.loads(A,*C,**D);B=[]\n\tfor A in E:B.append(_wrap(A))\n\tinput=[]\n\tfor A in B:\n\t\tif isinstance(A,_String):input.append(A.value)\n\t\telse:input.append(A)\n\tA=input[0]\n\tif _is_array(A):return _loop(_array_keys(A),input,[A],A)\n\tif _is_object(A):return _loop(_object_keys(A),input,[A],A)\n\treturn A\ndef stringify(value,*D,**E):\n\tB=_Known();input=[];C=[];A=int(_index(B,input,value))\n\twhile A<len(input):C.append(_transform(B,input,input[A]));A+=1\n\treturn _json.dumps(C,*D,**E)",
    "magic_js.py": "import json,sys,js as globalThis\nfrom polyscript import config as _config,js_modules\nfrom pyscript.util import NotSupported\nRUNNING_IN_WORKER=not hasattr(globalThis,'document')\nconfig=json.loads(globalThis.JSON.stringify(_config))\nif'MicroPython'in sys.version:config['type']='mpy'\nelse:config['type']='py'\nclass JSModule:\n\tdef __init__(A,name):A.name=name\n\tdef __getattr__(B,field):\n\t\tA=field\n\t\tif not A.startswith('_'):return getattr(getattr(js_modules,B.name),A)\nfor name in globalThis.Reflect.ownKeys(js_modules):sys.modules[f\"pyscript.js_modules.{name}\"]=JSModule(name)\nsys.modules['pyscript.js_modules']=js_modules\nif RUNNING_IN_WORKER:\n\timport polyscript;PyWorker=NotSupported('pyscript.PyWorker','pyscript.PyWorker works only when running in the main thread')\n\ttry:import js;window=polyscript.xworker.window;document=window.document;js.document=document;js_import=window.Function('return (...urls) => Promise.all(urls.map((url) => import(url)))')()\n\texcept:message='Unable to use `window` or `document` -> https://docs.pyscript.net/latest/faq/#sharedarraybuffer';globalThis.console.warn(message);window=NotSupported('pyscript.window',message);document=NotSupported('pyscript.document',message);js_import=None\n\tsync=polyscript.xworker.sync\n\tdef current_target():return polyscript.target\nelse:\n\timport _pyscript;from _pyscript import PyWorker,js_import;window=globalThis;document=globalThis.document;sync=NotSupported('pyscript.sync','pyscript.sync works only when running in a worker')\n\tdef current_target():return _pyscript.target",
    "media.py": "from pyscript import window\nfrom pyscript.ffi import to_js\nclass Device:\n\tdef __init__(A,device):A._dom_element=device\n\t@property\n\tdef id(self):return self._dom_element.deviceId\n\t@property\n\tdef group(self):return self._dom_element.groupId\n\t@property\n\tdef kind(self):return self._dom_element.kind\n\t@property\n\tdef label(self):return self._dom_element.label\n\tdef __getitem__(A,key):return getattr(A,key)\n\t@classmethod\n\tasync def load(E,audio=False,video=True):\n\t\tB=video;A=window.Object.new();A.audio=audio\n\t\tif isinstance(B,bool):A.video=B\n\t\telse:\n\t\t\tA.video=window.Object.new()\n\t\t\tfor C in B:setattr(A.video,C,to_js(B[C]))\n\t\tD=await window.navigator.mediaDevices.getUserMedia(A);return D\n\tasync def get_stream(A):B=A.kind.replace('input','').replace('output','');C={B:{'deviceId':{'exact':A.id}}};return await A.load(**C)\nasync def list_devices():return[Device(A)for A in await window.navigator.mediaDevices.enumerateDevices()]",
    "storage.py": "_C='memoryview'\n_B='bytearray'\n_A='generic'\nfrom polyscript import storage as _storage\nfrom pyscript.flatted import parse as _parse\nfrom pyscript.flatted import stringify as _stringify\ndef _to_idb(value):\n\tA=value\n\tif A is None:return _stringify(['null',0])\n\tif isinstance(A,(bool,float,int,str,list,dict,tuple)):return _stringify([_A,A])\n\tif isinstance(A,bytearray):return _stringify([_B,[A for A in A]])\n\tif isinstance(A,memoryview):return _stringify([_C,[A for A in A]])\n\traise TypeError(f\"Unexpected value: {A}\")\ndef _from_idb(value):\n\tC=value;A,B=_parse(C)\n\tif A=='null':return\n\tif A==_A:return B\n\tif A==_B:return bytearray(B)\n\tif A==_C:return memoryview(bytearray(B))\n\treturn C\nclass Storage(dict):\n\tdef __init__(B,store):A=store;super().__init__({A:_from_idb(B)for(A,B)in A.entries()});B.__store__=A\n\tdef __delitem__(A,attr):A.__store__.delete(attr);super().__delitem__(attr)\n\tdef __setitem__(B,attr,value):A=value;B.__store__.set(attr,_to_idb(A));super().__setitem__(attr,A)\n\tdef clear(A):A.__store__.clear();super().clear()\n\tasync def sync(A):await A.__store__.sync()\nasync def storage(name='',storage_class=Storage):\n\tif not name:raise ValueError('The storage name must be defined')\n\treturn storage_class(await _storage(f\"@pyscript/{name}\"))",
    "util.py": "import js,sys,inspect\ndef as_bytearray(buffer):\n\tA=js.Uint8Array.new(buffer);B=A.length;C=bytearray(B)\n\tfor D in range(0,B):C[D]=A[D]\n\treturn C\nclass NotSupported:\n\tdef __init__(A,name,error):object.__setattr__(A,'name',name);object.__setattr__(A,'error',error)\n\tdef __repr__(A):return f\"<NotSupported {A.name} [{A.error}]>\"\n\tdef __getattr__(A,attr):raise AttributeError(A.error)\n\tdef __setattr__(A,attr,value):raise AttributeError(A.error)\n\tdef __call__(A,*B):raise TypeError(A.error)\ndef is_awaitable(obj):\n\tA=obj\n\tif'micropython'in sys.version.lower():\n\t\tif'<closure <generator>'in repr(A):return True\n\t\treturn inspect.isgeneratorfunction(A)\n\treturn inspect.iscoroutinefunction(A)",
    "web.py": "_B='on'\n_A=None\nfrom pyscript import document,when,Event\nfrom pyscript.ffi import create_proxy\ndef wrap_dom_element(dom_element):return Element.wrap_dom_element(dom_element)\nclass Element:\n\telement_classes_by_tag_name={}\n\t@classmethod\n\tdef get_tag_name(A):return A.__name__.replace('_','')\n\t@classmethod\n\tdef register_element_classes(B,element_classes):\n\t\tfor A in element_classes:C=A.get_tag_name();B.element_classes_by_tag_name[C]=A\n\t@classmethod\n\tdef unregister_element_classes(A,element_classes):\n\t\tfor B in element_classes:C=B.get_tag_name();A.element_classes_by_tag_name.pop(C,_A)\n\t@classmethod\n\tdef wrap_dom_element(A,dom_element):B=dom_element;C=A.element_classes_by_tag_name.get(B.tagName.lower(),A);return C(dom_element=B)\n\tdef __init__(A,dom_element=_A,classes=_A,style=_A,**E):\n\t\tA._dom_element=dom_element or document.createElement(type(A).get_tag_name());A._on_events={};C={}\n\t\tfor(B,D)in E.items():\n\t\t\tif B.startswith(_B):F=A.get_event(B);F.add_listener(D)\n\t\t\telse:C[B]=D\n\t\tA._classes=Classes(A);A._style=Style(A);A.update(classes=classes,style=style,**C)\n\tdef __eq__(A,obj):return isinstance(obj,Element)and obj._dom_element==A._dom_element\n\tdef __getitem__(B,key):\n\t\tA=key\n\t\tif isinstance(A,int)or isinstance(A,slice):return B.children[A]\n\t\treturn B.find(A)\n\tdef __getattr__(B,name):\n\t\tA=name\n\t\tif A.startswith(_B):return B.get_event(A)\n\t\tif A.endswith('_'):A=A[:-1]\n\t\treturn getattr(B._dom_element,A)\n\tdef __setattr__(C,name,value):\n\t\tB=value;A=name\n\t\tif A.startswith('_'):super().__setattr__(A,B)\n\t\telse:\n\t\t\tif A.endswith('_'):A=A[:-1]\n\t\t\tif A.startswith(_B):C._on_events[A]=B\n\t\t\tsetattr(C._dom_element,A,B)\n\tdef get_event(A,name):\n\t\tB=name\n\t\tif not B.startswith(_B):raise ValueError(\"Event names must start with 'on'.\")\n\t\tC=B[2:]\n\t\tif not hasattr(A._dom_element,C):raise ValueError(f\"Element has no '{C}' event.\")\n\t\tif B in A._on_events:return A._on_events[B]\n\t\tD=Event();A._on_events[B]=D;A._dom_element.addEventListener(C,create_proxy(D.trigger));return D\n\t@property\n\tdef children(self):return ElementCollection.wrap_dom_elements(self._dom_element.children)\n\t@property\n\tdef classes(self):return self._classes\n\t@property\n\tdef parent(self):\n\t\tif self._dom_element.parentElement is _A:return\n\t\treturn Element.wrap_dom_element(self._dom_element.parentElement)\n\t@property\n\tdef style(self):return self._style\n\tdef append(B,*C):\n\t\tfor A in C:\n\t\t\tif isinstance(A,Element):B._dom_element.appendChild(A._dom_element)\n\t\t\telif isinstance(A,ElementCollection):\n\t\t\t\tfor D in A:B._dom_element.appendChild(D._dom_element)\n\t\t\telif isinstance(A,list)or isinstance(A,tuple):\n\t\t\t\tfor E in A:B.append(E)\n\t\t\telse:\n\t\t\t\ttry:A.tagName;B._dom_element.appendChild(A)\n\t\t\t\texcept AttributeError:\n\t\t\t\t\ttry:\n\t\t\t\t\t\tA.length\n\t\t\t\t\t\tfor F in A:B._dom_element.appendChild(F)\n\t\t\t\t\texcept AttributeError:raise TypeError(f'Element \"{A}\" is a proxy object, \"but not a valid element or a NodeList.')\n\tdef clone(B,clone_id=_A):A=Element.wrap_dom_element(B._dom_element.cloneNode(True));A.id=clone_id;return A\n\tdef find(A,selector):return ElementCollection.wrap_dom_elements(A._dom_element.querySelectorAll(selector))\n\tdef show_me(A):A._dom_element.scrollIntoView()\n\tdef update(A,classes=_A,style=_A,**D):\n\t\tC=style;B=classes\n\t\tif B:A.classes.add(B)\n\t\tif C:A.style.set(**C)\n\t\tfor(E,F)in D.items():setattr(A,E,F)\nclass Classes:\n\tdef __init__(A,element):A._element=element;A._class_list=A._element._dom_element.classList\n\tdef __contains__(A,item):return item in A._class_list\n\tdef __eq__(C,other):\n\t\tA=other\n\t\tif isinstance(A,Classes):B=list(A._class_list)\n\t\telse:\n\t\t\ttry:B=iter(A)\n\t\t\texcept TypeError:return False\n\t\treturn set(C._class_list)==set(B)\n\tdef __iter__(A):return iter(A._class_list)\n\tdef __len__(A):return A._class_list.length\n\tdef __repr__(A):return f\"Classes({\", \".join(A._class_list)})\"\n\tdef __str__(A):return' '.join(A._class_list)\n\tdef add(B,*C):\n\t\tfor A in C:\n\t\t\tif isinstance(A,list):\n\t\t\t\tfor D in A:B.add(D)\n\t\t\telse:B._class_list.add(A)\n\tdef contains(A,class_name):return class_name in A\n\tdef remove(B,*C):\n\t\tfor A in C:\n\t\t\tif isinstance(A,list):\n\t\t\t\tfor D in A:B.remove(D)\n\t\t\telse:B._class_list.remove(A)\n\tdef replace(A,old_class,new_class):A.remove(old_class);A.add(new_class)\n\tdef toggle(A,*C):\n\t\tfor B in C:\n\t\t\tif B in A:A.remove(B)\n\t\t\telse:A.add(B)\nclass HasOptions:\n\t@property\n\tdef options(self):\n\t\tA=self\n\t\tif not hasattr(A,'_options'):A._options=Options(A)\n\t\treturn A._options\nclass Options:\n\tdef __init__(A,element):A._element=element\n\tdef __getitem__(A,key):return A.options[key]\n\tdef __iter__(A):yield from A.options\n\tdef __len__(A):return len(A.options)\n\tdef __repr__(A):return f\"{A.__class__.__name__} (length: {len(A)}) {A.options}\"\n\t@property\n\tdef options(self):return[Element.wrap_dom_element(A)for A in self._element._dom_element.options]\n\t@property\n\tdef selected(self):return self.options[self._element._dom_element.selectedIndex]\n\tdef add(D,value=_A,html=_A,text=_A,before=_A,**B):\n\t\tC=value;A=before\n\t\tif C is not _A:B['value']=C\n\t\tif html is not _A:B['innerHTML']=html\n\t\tif text is not _A:B['text']=text\n\t\tE=option(**B)\n\t\tif A:\n\t\t\tif isinstance(A,Element):A=A._dom_element\n\t\tD._element._dom_element.add(E._dom_element,A)\n\tdef clear(A):\n\t\twhile len(A)>0:A.remove(0)\n\tdef remove(A,index):A._element._dom_element.remove(index)\nclass Style:\n\tdef __init__(A,element):A._element=element;A._style=A._element._dom_element.style\n\tdef __getitem__(A,key):return A._style.getPropertyValue(key)\n\tdef __setitem__(A,key,value):A._style.setProperty(key,value)\n\tdef remove(A,key):A._style.removeProperty(key)\n\tdef set(A,**B):\n\t\tfor(C,D)in B.items():A._element._dom_element.style.setProperty(C,D)\n\t@property\n\tdef visible(self):return self._element._dom_element.style.visibility\n\t@visible.setter\n\tdef visible(self,value):self._element._dom_element.style.visibility=value\nclass ContainerElement(Element):\n\tdef __init__(B,*C,children=_A,dom_element=_A,style=_A,classes=_A,**D):\n\t\tsuper().__init__(dom_element=dom_element,style=style,classes=classes,**D)\n\t\tfor A in list(C)+(children or[]):\n\t\t\tif isinstance(A,Element)or isinstance(A,ElementCollection):B.append(A)\n\t\t\telse:B._dom_element.insertAdjacentHTML('beforeend',A)\n\tdef __iter__(A):yield from A.children\nclass ClassesCollection:\n\tdef __init__(A,collection):A._collection=collection\n\tdef __contains__(A,class_name):\n\t\tfor B in A._collection:\n\t\t\tif class_name in B.classes:return True\n\t\treturn False\n\tdef __eq__(B,other):A=other;return isinstance(A,ClassesCollection)and B._collection==A._collection\n\tdef __iter__(A):\n\t\tfor B in A._all_class_names():yield B\n\tdef __len__(A):return len(A._all_class_names())\n\tdef __repr__(A):return f\"ClassesCollection({repr(A._collection)})\"\n\tdef __str__(A):return' '.join(A._all_class_names())\n\tdef add(A,*B):\n\t\tfor C in A._collection:C.classes.add(*B)\n\tdef contains(A,class_name):return class_name in A\n\tdef remove(A,*B):\n\t\tfor C in A._collection:C.classes.remove(*B)\n\tdef replace(A,old_class,new_class):\n\t\tfor B in A._collection:B.classes.replace(old_class,new_class)\n\tdef toggle(A,*B):\n\t\tfor C in A._collection:C.classes.toggle(*B)\n\tdef _all_class_names(B):\n\t\tA=set()\n\t\tfor C in B._collection:\n\t\t\tfor D in C.classes:A.add(D)\n\t\treturn A\nclass StyleCollection:\n\tdef __init__(A,collection):A._collection=collection\n\tdef __getitem__(A,key):return[A.style[key]for A in A._collection._elements]\n\tdef __setitem__(A,key,value):\n\t\tfor B in A._collection._elements:B.style[key]=value\n\tdef __repr__(A):return f\"StyleCollection({repr(A._collection)})\"\n\tdef remove(A,key):\n\t\tfor B in A._collection._elements:B.style.remove(key)\nclass ElementCollection:\n\t@classmethod\n\tdef wrap_dom_elements(A,dom_elements):return A([Element.wrap_dom_element(A)for A in dom_elements])\n\tdef __init__(A,elements):A._elements=elements;A._classes=ClassesCollection(A);A._style=StyleCollection(A)\n\tdef __eq__(A,obj):return isinstance(obj,ElementCollection)and obj._elements==A._elements\n\tdef __getitem__(B,key):\n\t\tA=key\n\t\tif isinstance(A,int):return B._elements[A]\n\t\telif isinstance(A,slice):return ElementCollection(B._elements[A])\n\t\treturn B.find(A)\n\tdef __iter__(A):yield from A._elements\n\tdef __len__(A):return len(A._elements)\n\tdef __repr__(A):return f\"{A.__class__.__name__} (length: {len(A._elements)}) {A._elements}\"\n\tdef __getattr__(A,name):return[getattr(A,name)for A in A._elements]\n\tdef __setattr__(C,name,value):\n\t\tB=value;A=name\n\t\tif A.startswith('_'):super().__setattr__(A,B)\n\t\telse:\n\t\t\tfor D in C._elements:setattr(D,A,B)\n\t@property\n\tdef classes(self):return self._classes\n\t@property\n\tdef elements(self):return self._elements\n\t@property\n\tdef style(self):return self._style\n\tdef find(B,selector):\n\t\tA=[]\n\t\tfor C in B._elements:A.extend(C.find(selector))\n\t\treturn ElementCollection(A)\nclass a(ContainerElement):0\nclass abbr(ContainerElement):0\nclass address(ContainerElement):0\nclass area(Element):0\nclass article(ContainerElement):0\nclass aside(ContainerElement):0\nclass audio(ContainerElement):0\nclass b(ContainerElement):0\nclass base(Element):0\nclass blockquote(ContainerElement):0\nclass body(ContainerElement):0\nclass br(Element):0\nclass button(ContainerElement):0\nclass canvas(ContainerElement):\n\tdef download(A,filename='snapped.png'):B=a(download=filename,href=A._dom_element.toDataURL());A.append(B);B._dom_element.click()\n\tdef draw(E,what,width=_A,height=_A):\n\t\tC=height;B=width;A=what\n\t\tif isinstance(A,Element):A=A._dom_element\n\t\tD=E._dom_element.getContext('2d')\n\t\tif B or C:D.drawImage(A,0,0,B,C)\n\t\telse:D.drawImage(A,0,0)\nclass caption(ContainerElement):0\nclass cite(ContainerElement):0\nclass code(ContainerElement):0\nclass col(Element):0\nclass colgroup(ContainerElement):0\nclass data(ContainerElement):0\nclass datalist(ContainerElement,HasOptions):0\nclass dd(ContainerElement):0\nclass del_(ContainerElement):0\nclass details(ContainerElement):0\nclass dialog(ContainerElement):0\nclass div(ContainerElement):0\nclass dl(ContainerElement):0\nclass dt(ContainerElement):0\nclass em(ContainerElement):0\nclass embed(Element):0\nclass fieldset(ContainerElement):0\nclass figcaption(ContainerElement):0\nclass figure(ContainerElement):0\nclass footer(ContainerElement):0\nclass form(ContainerElement):0\nclass h1(ContainerElement):0\nclass h2(ContainerElement):0\nclass h3(ContainerElement):0\nclass h4(ContainerElement):0\nclass h5(ContainerElement):0\nclass h6(ContainerElement):0\nclass head(ContainerElement):0\nclass header(ContainerElement):0\nclass hgroup(ContainerElement):0\nclass hr(Element):0\nclass html(ContainerElement):0\nclass i(ContainerElement):0\nclass iframe(ContainerElement):0\nclass img(Element):0\nclass input_(Element):0\nclass ins(ContainerElement):0\nclass kbd(ContainerElement):0\nclass label(ContainerElement):0\nclass legend(ContainerElement):0\nclass li(ContainerElement):0\nclass link(Element):0\nclass main(ContainerElement):0\nclass map_(ContainerElement):0\nclass mark(ContainerElement):0\nclass menu(ContainerElement):0\nclass meta(ContainerElement):0\nclass meter(ContainerElement):0\nclass nav(ContainerElement):0\nclass object_(ContainerElement):0\nclass ol(ContainerElement):0\nclass optgroup(ContainerElement,HasOptions):0\nclass option(ContainerElement):0\nclass output(ContainerElement):0\nclass p(ContainerElement):0\nclass param(ContainerElement):0\nclass picture(ContainerElement):0\nclass pre(ContainerElement):0\nclass progress(ContainerElement):0\nclass q(ContainerElement):0\nclass s(ContainerElement):0\nclass script(ContainerElement):0\nclass section(ContainerElement):0\nclass select(ContainerElement,HasOptions):0\nclass small(ContainerElement):0\nclass source(Element):0\nclass span(ContainerElement):0\nclass strong(ContainerElement):0\nclass style(ContainerElement):0\nclass sub(ContainerElement):0\nclass summary(ContainerElement):0\nclass sup(ContainerElement):0\nclass table(ContainerElement):0\nclass tbody(ContainerElement):0\nclass td(ContainerElement):0\nclass template(ContainerElement):0\nclass textarea(ContainerElement):0\nclass tfoot(ContainerElement):0\nclass th(ContainerElement):0\nclass thead(ContainerElement):0\nclass time(ContainerElement):0\nclass title(ContainerElement):0\nclass tr(ContainerElement):0\nclass track(Element):0\nclass u(ContainerElement):0\nclass ul(ContainerElement):0\nclass var(ContainerElement):0\nclass video(ContainerElement):\n\tdef snap(D,to=_A,width=_A,height=_A):\n\t\tG='CANVAS';F='Element to snap to must be a canvas.';C=height;B=width;A=to;B=B if B is not _A else D.videoWidth;C=C if C is not _A else D.videoHeight\n\t\tif A is _A:A=canvas(width=B,height=C)\n\t\telif isinstance(A,Element):\n\t\t\tif A.tag!='canvas':raise TypeError(F)\n\t\telif getattr(A,'tagName','')==G:A=canvas(dom_element=A)\n\t\telif isinstance(A,str):\n\t\t\tE=document.querySelectorAll(A)\n\t\t\tif E.length==0:raise TypeError('No element with selector {to} to snap to.')\n\t\t\tif E[0].tagName!=G:raise TypeError(F)\n\t\t\tA=canvas(dom_element=E[0])\n\t\tA.draw(D,B,C);return A\nclass wbr(Element):0\nELEMENT_CLASSES=[a,abbr,address,area,article,aside,audio,b,base,blockquote,body,br,button,canvas,caption,cite,code,col,colgroup,data,datalist,dd,del_,details,dialog,div,dl,dt,em,embed,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,i,iframe,img,input_,ins,kbd,label,legend,li,link,main,map_,mark,menu,meta,meter,nav,object_,ol,optgroup,option,output,p,param,picture,pre,progress,q,s,script,section,select,small,source,span,strong,style,sub,summary,sup,table,tbody,td,template,textarea,tfoot,th,thead,time,title,tr,track,u,ul,var,video,wbr]\nElement.register_element_classes(ELEMENT_CLASSES)\nclass Page:\n\tdef __init__(A):A.html=Element.wrap_dom_element(document.documentElement);A.body=Element.wrap_dom_element(document.body);A.head=Element.wrap_dom_element(document.head)\n\tdef __getitem__(A,selector):return A.find(selector)\n\t@property\n\tdef title(self):return document.title\n\t@title.setter\n\tdef title(self,value):document.title=value\n\tdef append(A,*B):A.body.append(*B)\n\tdef find(A,selector):return ElementCollection.wrap_dom_elements(document.querySelectorAll(selector))\npage=Page()",
    "websocket.py": "import js\nfrom pyscript.ffi import create_proxy\nfrom pyscript.util import as_bytearray\ncode='code'\nprotocols='protocols'\nreason='reason'\nmethods=['onclose','onerror','onmessage','onopen']\nclass EventMessage:\n\tdef __init__(A,event):A._event=event\n\tdef __getattr__(B,attr):\n\t\tA=getattr(B._event,attr)\n\t\tif attr=='data'and not isinstance(A,str):\n\t\t\tif hasattr(A,'to_py'):return A.to_py()\n\t\t\treturn memoryview(as_bytearray(A))\n\t\treturn A\nclass WebSocket:\n\tCONNECTING=0;OPEN=1;CLOSING=2;CLOSED=3\n\tdef __init__(E,**A):\n\t\tD=A['url']\n\t\tif protocols in A:B=js.WebSocket.new(D,A[protocols])\n\t\telse:B=js.WebSocket.new(D)\n\t\tobject.__setattr__(E,'_ws',B)\n\t\tfor C in methods:\n\t\t\tif C in A:setattr(B,C,create_proxy(A[C]))\n\tdef __getattr__(A,attr):return getattr(A._ws,attr)\n\tdef __setattr__(B,attr,value):\n\t\tC=value;A=attr\n\t\tif A in methods:D=lambda e:C(EventMessage(e));setattr(B._ws,A,create_proxy(D))\n\t\telse:setattr(B._ws,A,C)\n\tdef close(B,**A):\n\t\tif code in A and reason in A:B._ws.close(A[code],A[reason])\n\t\telif code in A:B._ws.close(A[code])\n\t\telse:B._ws.close()\n\tdef send(B,data):\n\t\tA=data\n\t\tif isinstance(A,str):B._ws.send(A)\n\t\telse:\n\t\t\tC=js.Uint8Array.new(len(A))\n\t\t\tfor(D,E)in enumerate(A):C[D]=E\n\t\t\tB._ws.send(C)",
    "workers.py": "import js as _js\nfrom polyscript import workers as _workers\n_get=_js.Reflect.get\ndef _set(script,name,value=''):script.setAttribute(name,value)\nclass _ReadOnlyProxy:\n\tdef __getitem__(A,name):return _get(_workers,name)\n\tdef __getattr__(A,name):return _get(_workers,name)\nworkers=_ReadOnlyProxy()\nasync def create_named_worker(src='',name='',config=None,type='py'):\n\tC=name;B=config;from json import dumps\n\tif not src:raise ValueError('Named workers require src')\n\tif not C:raise ValueError('Named workers require a name')\n\tA=_js.document.createElement('script');A.type=type;A.src=src;_set(A,'worker');_set(A,'name',C)\n\tif B:_set(A,'config',isinstance(B,str)and B or dumps(B))\n\t_js.document.body.append(A);return await workers[C]"
  }
};
