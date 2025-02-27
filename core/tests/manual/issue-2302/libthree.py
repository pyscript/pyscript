import asyncio
from dataclasses import dataclass, field
from typing import Callable

from pyscript import document, window

from pyscript.js_modules import three as THREE
from pyscript.js_modules.stats_gl import default as StatsGL
from pyscript.js_modules import lsgeo, line2, linemat

from multipyjs import MICROPYTHON, new, call, to_js, create_proxy

@dataclass
class SoundPlayer:
    sound: THREE.Audio = field()
    on_start: Callable[[], None] = field()
    on_stop: Callable[[], None] = field(default=lambda: None)

    _start_time: float = -1.0

    def play(self):
        self.sound.stop()
        self.on_start()
        self._start_time = self.sound.context.currentTime
        self.sound.play()

    def stop(self):
        self.sound.stop()
        self.on_stop()
        self._start_time = -1.0

    def toggle(self):
        if self.sound.isPlaying:
            self.stop()
        else:
            self.play()

    @property
    def running_time(self):
        if self.sound.isPlaying:
            return self.sound.context.currentTime - self._start_time
        elif self._start_time != -1.0:
            self.stop()
        return 0.0

def get_renderer():
    renderer = new(THREE.WebGLRenderer, antialias=True)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0xF5F0DC)
    pyterms = list(document.getElementsByTagName("py-terminal"))
    if pyterms:
        pyterm = pyterms[0]
        pyterm.parentNode.removeChild(pyterm)
        document.getElementById("pyterm").appendChild(pyterm)

    document.getElementById("threejs").appendChild(renderer.domElement)

    initial = {0: "115px", 1: "calc(100vh - 120px)"}
    @create_proxy
    def split_element_style(dimension, size, gutter_size, index):
        if index in initial:
            result = {dimension: initial.pop(index)}
        else:
            result = {dimension: f"calc({int(size)}vh - {gutter_size}px)"}
        return to_js(result)

    call(
        window.Split,
        ["#pyterm", "#threejs"],
        direction="vertical",
        elementStyle=split_element_style,
        minSize=0,
        maxSize=to_js([120, 10000]),
    )
    return renderer

def get_ortho_camera(view_size):
    aspect_ratio = window.innerWidth / window.innerHeight
    camera = new(
        THREE.OrthographicCamera,
        -view_size * aspect_ratio,  # Left
        view_size * aspect_ratio,   # Right
        view_size,                  # Top
        -view_size,                 # Bottom
        -view_size,                 # Near plane
        view_size,                  # Far plane
    )
    camera.updateProjectionMatrix()
    camera.position.set(0, 0, 0)
    return camera

def get_loading_manager():
    loading_mgr = new(THREE.LoadingManager)
    ev = asyncio.Event()

    @create_proxy
    def on_start(url, itemsLoaded, itemsTotal):
        print(f'[{itemsLoaded}/{itemsTotal}] Started loading file: {url}')
    loading_mgr.onStart = on_start

    @create_proxy
    def on_progress(url, itemsLoaded, itemsTotal):
        print(f'[{itemsLoaded}/{itemsTotal}] Loading file: {url}')
    loading_mgr.onProgress = on_progress

    @create_proxy
    def on_error(url):
        print(f'There was a problem loading {url}')
    loading_mgr.onError = on_error

    @create_proxy
    def on_load():
        print('Loading assets complete!')
        ev.set()
    loading_mgr.onLoad = on_load

    return loading_mgr, ev


def get_perspective_camera():
    aspect_ratio = window.innerWidth / window.innerHeight
    camera = new(
        THREE.PerspectiveCamera,
        45,             # fov
        aspect_ratio,
        0.25,           # near plane
        300,            # far plane
    )
    camera.position.set(0, 0, 30)
    return camera

def get_stats_gl(renderer):
    stats = new(StatsGL, trackGPU=True, horizontal=False)
    stats.init(renderer)
    stats.dom.style.removeProperty("left")
    stats.dom.style.right = "90px"
    document.getElementById("stats").appendChild(stats.dom)
    return stats

def bg_from_v(*vertices):
    geometry = new(THREE.BufferGeometry)
    vertices_f32a = new(Float32Array, vertices)
    attr = new(THREE.Float32BufferAttribute, vertices_f32a, 3)
    return geometry.setAttribute('position', attr)

def bg_from_p(*points):
    buf = new(THREE.BufferGeometry)
    buf.setFromPoints(
        [new(THREE.Vector3, p[0], p[1], p[2]) for p in points]
    )
    return buf

def clear():
    # toggle stats and terminal?
    stats_style = document.getElementById("stats-off").style
    if stats_style.display == "none":
        # turn stuff back on
        stats_style.removeProperty("display")
        document.getElementById("pyterm").style.height = "115px"
        document.getElementById("threejs").style.height = "calc(100vh - 120px)"
        for e in document.getElementsByClassName("gutter"):
            e.style.removeProperty("display")
        for e in document.getElementsByClassName("xterm-helper-textarea"):
            e.focus()
            break
        return

    # no longer focus on xterm
    document.activeElement.blur()
    # hide stats
    document.getElementById("stats-off").style.display = "none"
    # hide pyterm and split gutter
    document.getElementById("pyterm").style.height = "0vh"
    document.getElementById("threejs").style.height = "100vh"
    for e in document.getElementsByClassName("gutter"):
        e.style.display = "none"
    # hide ltk ad
    for e in document.getElementsByClassName("ltk-built-with"):
        e.style.display = "none"
    # hide pyscript ad
    for e in document.getElementsByTagName("div"):
        style = e.getAttribute("style")
        if style and style.startswith("z-index:999"):
            e.style.display = "none"
    for e in document.getElementsByTagName("svg"):
        style = e.getAttribute("style")
        if style and style.startswith("z-index:999"):
            e.style.display = "none"
