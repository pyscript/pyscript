print("Starting up...")

from array import array
import asyncio
import math
import time

from pyscript import document, window, PyWorker

from libthree import THREE, clear, SoundPlayer
from libthree import get_renderer, get_ortho_camera
from libthree import get_loading_manager, get_stats_gl
from libthree import lsgeo, line2, linemat, lsgeo
from libfft import BeatSync

from multipyjs import MICROPYTHON, new, call, to_js, create_proxy

from js import Float32Array

scene = new(THREE.Scene)

view_size = 1
renderer = get_renderer()
camera = get_ortho_camera(view_size)
loading_mgr, loaded_event = get_loading_manager()

t_loader = new(THREE.TextureLoader, loading_mgr)
t_loader.setPath('assets/')

light = new(THREE.AmbientLight, 0xffffff, 1.0)
scene.add(light)

fft_res = 2048
audio_listener = new(THREE.AudioListener)
camera.add(audio_listener)
sound = new(THREE.Audio, audio_listener)
audio_loader = new(THREE.AudioLoader, loading_mgr)
analyser = new(THREE.AudioAnalyser, sound, fft_res)

@create_proxy
def on_audio_load(buffer):
    sound.setBuffer(buffer)
    sound.setVolume(0.9)
    sound.setLoop(False)

audio_loader.load("assets/genuary25-18.m4a", on_audio_load)

spheres = new(THREE.Group)
scene.add(spheres)

line_basic_mat = new(
    THREE.LineBasicMaterial,
    color=0xffffff,
)

zero_mat = new(
    linemat.LineMaterial,
    color=0x662503,
    linewidth=3,
)

other_mat = new(
    linemat.LineMaterial,
    color=0x662503,
    linewidth=1.5,
)

grid_mat = new(
    linemat.LineMaterial,
    color=0x662503,
    linewidth=1,
    dashed=True,
    dashScale=1,
    dashSize=0.5,
    gapSize=1,
    dashOffset=0,
)

lines = [new(THREE.Group), new(THREE.Group)]
scene.add(lines[0])
scene.add(lines[1])

def draw_lines(line_coords, mat_name, spy=False):
    if spy:
        line_coords_f32a = new(Float32Array, line_coords.length)
        _it = line_coords.items
        for i in range(line_coords.length):
            line_coords_f32a[i] = _it[i]
    else:
        line_coords_f32a = new(Float32Array, line_coords)
    if mat_name == 'zero':
        mat = zero_mat
    elif mat_name == 'grid':
        mat = grid_mat
    else:
        mat = other_mat

    geo = new(THREE.BufferGeometry)
    geo.setAttribute('position', new(THREE.BufferAttribute, line_coords_f32a, 3))
    seg = new(THREE.LineSegments, geo, line_basic_mat)

    lsg = new(lsgeo.LineSegmentsGeometry)
    lsg.fromLineSegments(seg)
    l1 = new(line2.Line2, lsg, mat)
    l1.computeLineDistances()
    l2 = new(line2.Line2, lsg, mat)
    l2.computeLineDistances()
    lines[0].add(l1)
    lines[1].add(l2)

    seg.geometry.dispose()
    del geo
    del seg

def drawing_done():
    maybe_with_spy = "with SPy" if USE_SPY else "with pure Python"
    print(f"Time elapsed computing {maybe_with_spy}:", time.time() - start_ts)
    drawing_event.set()

grid_width = 0
grid_height = 0
scroll_offset = 0
def scale_lines(grid_ws=None, grid_hs=None, offset=None):
    global grid_width, grid_height, scroll_offset

    if grid_ws:
        grid_width = grid_ws
    else:
        grid_ws = grid_width

    if grid_hs:
        grid_height = grid_hs
    else:
        grid_hs = grid_height

    if offset:
        scroll_offset = offset
    else:
        offset = scroll_offset

    scale = 2.04/grid_hs
    lines[0].scale.set(scale, scale, scale)
    lines[1].scale.set(scale, scale, scale)
    lines[0].position.set((offset - grid_ws/2) * scale, -grid_hs/2 * scale, 0)
    lines[1].position.set((offset + grid_ws/2) * scale, -grid_hs/2 * scale, 0)

def append_p(lines, p1, p2):
    lines.append(p1[0])
    lines.append(p1[1])
    lines.append(0)
    lines.append(p2[0])
    lines.append(p2[1])
    lines.append(0)

def initial_calc():
    grid_w = int(1920 * 4)
    grid_h = 1080 * 2
    grid_scale = 10
    noise_factor = 500
    grid_hs = int(grid_h/grid_scale)
    grid_ws = int(grid_w/grid_scale)
    crossfade_range = int(grid_ws/12.5)

    def grid_lines():
        lines = array("d")
        grid_goal = 24
        grid_size_i = int(round((grid_ws - crossfade_range) / grid_goal))
        grid_actual = (grid_ws - crossfade_range) / grid_size_i
        for i in range(0, grid_size_i):
            x = i * grid_actual
            append_p(lines, (x, 0), (x, grid_hs))
        for y in range(0, grid_hs, grid_goal):
            append_p(lines, (0, y), (grid_ws-crossfade_range, y))
        return lines

    import perlin
    spy_perlin = perlin.lib
    spy_perlin.init()
    spy_perlin.seed(44)
    scale_lines(grid_ws - crossfade_range, grid_hs)
    print("Computing the height map")
    spy_perlin.make_height_map(grid_ws, grid_hs)
    spy_perlin.update_height_map(grid_ws, grid_hs, grid_scale / noise_factor, 0)
    print("Cross-fading the height map")
    spy_perlin.crossfade_height_map(grid_ws, grid_hs, crossfade_range)
    print("Drawing grid")
    draw_lines(grid_lines(), 'grid')
    print("Marching squares")
    draw_lines(spy_perlin.marching_squares(grid_ws, grid_hs, 0), 'zero', spy=True)
    draw_lines(spy_perlin.marching_squares(grid_ws, grid_hs, 0.3), 'positive', spy=True)
    draw_lines(spy_perlin.marching_squares(grid_ws, grid_hs, -0.3), 'negative', spy=True)
    draw_lines(spy_perlin.marching_squares(grid_ws, grid_hs, 0.45), 'positive', spy=True)
    draw_lines(spy_perlin.marching_squares(grid_ws, grid_hs, -0.45), 'negative', spy=True)
    draw_lines(spy_perlin.marching_squares(grid_ws, grid_hs, 0.6), 'positive', spy=True)
    draw_lines(spy_perlin.marching_squares(grid_ws, grid_hs, -0.6), 'negative', spy=True)
    draw_lines(spy_perlin.marching_squares(grid_ws, grid_hs, -0.8), 'negative', spy=True)
    draw_lines(spy_perlin.marching_squares(grid_ws, grid_hs, 0.8), 'positive', spy=True)
    drawing_done()

drawing_event = asyncio.Event()
start_ts = time.time()

USE_SPY = True
if USE_SPY:
    initial_calc()
else:
    worker = PyWorker("./worker.py", type="pyodide", configURL="./pyscript.toml")
    worker.sync.draw_lines = draw_lines
    worker.sync.drawing_done = drawing_done
    worker.sync.scale_lines = scale_lines
    worker.sync.print = print

@create_proxy
def on_tap(event):
    clear()
    player.toggle()
document.addEventListener("click", on_tap)

@create_proxy
def on_key_down(event):
    element = document.activeElement
    _class = element.getAttribute("class")
    in_xterm = element.tagName != "BODY" and _class and "xterm" in _class

    if event.code == "Backquote":
        # Screenshot mode.
        clear()
    elif not in_xterm:
        # Don't react to those bindings when typing code.
        if event.code == "Space":
            player.toggle()
document.addEventListener("keydown", on_key_down)

@create_proxy
def on_window_resize(event):
    aspect_ratio = window.innerWidth / window.innerHeight
    if camera.type == "OrthographicCamera":
        camera.left = -view_size * aspect_ratio
        camera.right = view_size * aspect_ratio
        camera.top = view_size
        camera.bottom = -view_size
        camera.updateProjectionMatrix()
    elif camera.type == "PerspectiveCamera":
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
    else:
        raise ValueError("Unknown camera type")
    renderer.setSize(window.innerWidth, window.innerHeight)
    scale_lines()

window.addEventListener("resize", on_window_resize)

@create_proxy
def animate(now=0.0):
    data = analyser.getFrequencyData()#.to_py() in Pyodide
    audio_now = player.running_time
    bs.update(data, audio_now)

    if grid_width:
        offset = -((20 * audio_now) % grid_width)
        scale_lines(offset=offset)

    renderer.render(scene, camera)
    stats_gl.update()

def reset():
    global scroll_offset
    bs.reset()
    scale_lines()

def on_stop():
    global scroll_offset
    bs.reset()
    scale_lines()

await loaded_event.wait()

stats_gl = get_stats_gl(renderer)
player = SoundPlayer(sound=sound, on_start=reset, on_stop=on_stop)
bs = BeatSync(fft_res=fft_res)
renderer.setAnimationLoop(animate)
print("Waiting for the contours...")

await drawing_event.wait()
print("Tap the map to start...")
