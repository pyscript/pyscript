import js
import matplotlib

try:
    js.document
except AttributeError:
    matplotlib.use("agg")

import base64
import io

import matplotlib.pyplot as plt
import matplotlib.tri as tri
import numpy as np

# First create the x and y coordinates of the points.
n_angles = 36
n_radii = 8
min_radius = 0.25
radii = np.linspace(min_radius, 0.95, n_radii)

angles = np.linspace(0, 2 * np.pi, n_angles, endpoint=False)
angles = np.repeat(angles[..., np.newaxis], n_radii, axis=1)
angles[:, 1::2] += np.pi / n_angles

x = (radii * np.cos(angles)).flatten()
y = (radii * np.sin(angles)).flatten()
z = (np.cos(radii) * np.cos(3 * angles)).flatten()

# Create the Triangulation; no triangles so Delaunay triangulation created.
triang = tri.Triangulation(x, y)

# Mask off unwanted triangles.
triang.set_mask(
    np.hypot(x[triang.triangles].mean(axis=1), y[triang.triangles].mean(axis=1))
    < min_radius
)

fig1, ax1 = plt.subplots()
ax1.set_aspect("equal")
tpc = ax1.tripcolor(triang, z, shading="flat")
fig1.colorbar(tpc)
ax1.set_title("tripcolor of Delaunay triangulation, flat shading")

buf = io.BytesIO()
plt.savefig(buf, format="png")
buf.seek(0)

# how it was (including main thread counter part)
# js.xworker.postMessage(
#     "data:image/png;base64," + base64.b64encode(buf.read()).decode("UTF-8")
# )

# how it is now via structured coincident/window
document = xworker.window.document
img = document.createElement("img")
img.style.transform = "scale(.5)"
img.src = "data:image/png;base64," + base64.b64encode(buf.read()).decode("UTF-8")

document.body.append(img)
