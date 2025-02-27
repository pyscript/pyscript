from array import array

from pyscript import sync, window
from perlin_py import perlin3, seed

grid_w = int(1920 * 4)
grid_h = 1080 * 2
grid_scale = 10
noise_factor = 500
grid_hs = int(grid_h/grid_scale)
grid_ws = int(grid_w/grid_scale)
crossfade_range = int(grid_ws/12.5)
height_map = array("d", [0.0] * (grid_hs * grid_ws))
edge_table = [
    (), # 0
    ((3, 2),), # 1
    ((2, 1),), # 2
    ((3, 1),), # 3
    ((0, 1),), # 4
    ((0, 3), (1, 2)), # 5 (ambiguous)
    ((0, 2),), # 6
    ((0, 3),), # 7
    ((0, 3),), # 8
    ((0, 2),), # 9
    ((0, 1), (2, 3)), # 10 (ambiguous)
    ((0, 1),), # 11
    ((3, 1),), # 12
    ((2, 1),), # 13
    ((3, 2),), # 14
    (),        # 15
]

def update_height_map(z):
    i = 0
    for y in range(0, grid_h, grid_scale):
        for x in range(0, grid_w, grid_scale):
            # 3 octaves of noise
            n = perlin3(x/noise_factor, y/noise_factor, z)
            n += 0.50 * perlin3(2*x/noise_factor, 2*y/noise_factor, z)
            n += 0.25 * perlin3(4*x/noise_factor, 4*y/noise_factor, z)
            height_map[i] = n
            i += 1

def crossfade_height_map():
    for y in range(grid_hs):
        for x in range(crossfade_range):
            pos_i = y*grid_ws + x
            neg_i = y*grid_ws + grid_ws - crossfade_range + x
            weight = x/crossfade_range
            old_pos = height_map[pos_i]
            old_neg = height_map[neg_i]
            height_map[neg_i] = height_map[pos_i] = weight * old_pos + (1.0 - weight) * old_neg


def _crossfade_height_map():
    for y in range(grid_hs):
        for x in range(crossfade_range):
            pos_i = y*grid_ws + x
            neg_i = y*grid_ws + grid_ws - x - 1
            old_pos = height_map[pos_i]
            old_neg = height_map[neg_i]
            weight = 0.5 - x/crossfade_range/2
            height_map[pos_i] = (1.0 - weight) * old_pos + weight * old_neg
            height_map[neg_i] = (1.0 - weight) * old_neg + weight * old_pos

def interpolate(sq_threshold, v1, v2):
    if v1 == v2:
        return v1
    return (sq_threshold - v1) / (v2 - v1)

stats = {'maxx': 0, 'maxy': 0, 'minx': 0, 'miny': 0}
def append_p(lines, p1, p2):
    lines.append(p1[0])
    lines.append(p1[1])
    lines.append(0)
    lines.append(p2[0])
    lines.append(p2[1])
    lines.append(0)
    stats['maxy'] = max(p1[1], p2[1], stats['maxy'])
    stats['miny'] = min(p1[1], p2[1], stats['miny'])
    stats['maxx'] = max(p1[0], p2[0], stats['maxx'])
    stats['minx'] = min(p1[0], p2[0], stats['minx'])

def marching_squares(height_map, sq_threshold):
    lines = array("d")

    for y in range(grid_hs-1):
        for x in range(grid_ws-1): #cf
            tl = height_map[y*grid_ws + x]
            tr = height_map[y*grid_ws + x+1]
            bl = height_map[(y+1)*grid_ws + x]
            br = height_map[(y+1)*grid_ws + x+1]

            sq_idx = 0
            if tl > sq_threshold:
                sq_idx |= 8
            if tr > sq_threshold:
                sq_idx |= 4
            if br > sq_threshold:
                sq_idx |= 2
            if bl > sq_threshold:
                sq_idx |= 1

            edge_points = [
                (x + interpolate(sq_threshold, tl, tr), y),
                (x + 1, y + interpolate(sq_threshold, tr, br)),
                (x + interpolate(sq_threshold, bl, br), y + 1),
                (x, y + interpolate(sq_threshold, tl, bl)),
            ]

            for a, b in edge_table[sq_idx]:
                append_p(lines, edge_points[a], edge_points[b])

    return lines

def grid_lines():
    lines = array("d")
    for x in range(0, grid_ws - crossfade_range, 26):
        append_p(lines, (x, 0), (x, grid_hs))
    for y in range(0, grid_hs, 24):
        append_p(lines, (0, y), (grid_ws-crossfade_range, y))
    return lines

seed(44)
sync.scale_lines(grid_ws - crossfade_range, grid_hs)
sync.print("Computing the height map")
update_height_map(0)
sync.print("Cross-fading the height map")
crossfade_height_map()
sync.draw_lines(grid_lines(), 'grid')
sync.draw_lines(marching_squares(height_map, 0), 'zero')
sync.draw_lines(marching_squares(height_map, 0.3), 'positive')
sync.draw_lines(marching_squares(height_map, -0.3), 'negative')
sync.draw_lines(marching_squares(height_map, 0.45), 'positive')
sync.draw_lines(marching_squares(height_map, -0.45), 'negative')
sync.draw_lines(marching_squares(height_map, 0.6), 'positive')
sync.draw_lines(marching_squares(height_map, -0.6), 'negative')
sync.draw_lines(marching_squares(height_map, -0.8), 'negative')
sync.draw_lines(marching_squares(height_map, 0.8), 'positive')
print(stats)
sync.drawing_done()
