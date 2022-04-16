import numpy as np

def mandelbrot(width: int, height: int, *,
      x: float = -0.5, y: float = 0, zoom: int = 1, max_iterations: int = 100) -> np.array:
    """
    From https://www.learnpythonwithrune.org/numpy-compute-mandelbrot-set-by-vectorization/.
    """
    # To make navigation easier we calculate these values
    x_width, y_height = 1.5, 1.5*height/width
    x_from, x_to = x - x_width/zoom, x + x_width/zoom
    y_from, y_to = y - y_height/zoom, y + y_height/zoom

    # Here the actual algorithm starts
    x = np.linspace(x_from, x_to, width).reshape((1, width))
    y = np.linspace(y_from, y_to, height).reshape((height, 1))
    c = x + 1j*y

    # Initialize z to all zero
    z = np.zeros(c.shape, dtype=np.complex128)

    # To keep track in which iteration the point diverged
    div_time = np.zeros(z.shape, dtype=int)

    # To keep track on which points did not converge so far
    m = np.full(c.shape, True, dtype=bool)
    for i in range(max_iterations):
        z[m] = z[m]**2 + c[m]
        diverged = np.greater(np.abs(z), 2, out=np.full(c.shape, False), where=m) # Find diverging
        div_time[diverged] = i      # set the value of the diverged iteration number
        m[np.abs(z) > 2] = False    # to remember which have diverged

    return div_time

def julia(width: int, height: int, *,
        c: complex = -0.4 + 0.6j, x: float = 0, y: float = 0, zoom: int = 1, max_iterations: int = 100) -> np.array:
    """
    From https://www.learnpythonwithrune.org/numpy-calculate-the-julia-set-with-vectorization/.
    """
    # To make navigation easier we calculate these values
    x_width, y_height = 1.5, 1.5*height/width
    x_from, x_to = x - x_width/zoom, x + x_width/zoom
    y_from, y_to = y - y_height/zoom, y + y_height/zoom

    # Here the actual algorithm starts
    x = np.linspace(x_from, x_to, width).reshape((1, width))
    y = np.linspace(y_from, y_to, height).reshape((height, 1))
    z = x + 1j*y

    # Initialize z to all zero
    c = np.full(z.shape, c)

    # To keep track in which iteration the point diverged
    div_time = np.zeros(z.shape, dtype=int)

    # To keep track on which points did not converge so far
    m = np.full(c.shape, True, dtype=bool)
    for i in range(max_iterations):
        z[m] = z[m]**2 + c[m]
        m[np.abs(z) > 2] = False
        div_time[m] = i

    return div_time
