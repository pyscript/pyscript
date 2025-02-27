# Translated from https://github.com/josephg/noisejs.
from libthree import THREE
from multipyjs import new

class V3:
    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z

    def __repr__(self):
        return f"V3({self.x}, {self.y}, {self.z})"

    def dot2(self, x, y):
        return self.x * x + self.y * y

    def dot3(self, x, y, z):
        return self.x * x + self.y * y + self.z * z

    def to_js(self, scale=1.0):
        return new(THREE.Vector3, self.x * scale, self.y * scale, self.z * scale)

PERM = [0] * 512
V3_P = [0] * 512  # assigned V3s in seed()
P = [151, 160, 137, 91, 90, 15,
     131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
     190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
     88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
     77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
     102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
     135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
     5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
     223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
     129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
     251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
     49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
     138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180]
V3_I = [V3(1, 1, 0), V3(-1, 1, 0), V3(1, -1, 0), V3(-1, -1, 0),
        V3(1, 0, 1), V3(-1, 0, 1), V3(1, 0, -1), V3(-1, 0, -1),
        V3(0, 1, 1), V3(0, -1, 1), V3(0, 1, -1), V3(0, -1, -1)]

def seed(s):
    if isinstance(s, float) and 0.0 < s < 1.0:
        s *= 65536

    s = int(s)
    if s < 256:
        s |= s << 8

    for i in range(256):
        if i & 1:
            v = P[i] ^ (s & 255)
        else:
            v = P[i] ^ ((s >> 8) & 255)

        PERM[i] = PERM[i + 256] = v
        V3_P[i] = V3_P[i + 256] = V3_I[v % 12]

seed(0)

def fade(t):
    return t * t * t * (t * (t * 6 - 15) + 10)

def lerp(a, b, t):
    return (1 - t) * a + t * b

def perlin3(x, y, z):
    # grid cells
    x_c = int(x)
    y_c = int(y)
    z_c = int(z)
    # relative coords within the cell
    x -= x_c
    y -= y_c
    z -= z_c
    # wrap cells
    x_c &= 255
    y_c &= 255
    z_c &= 255
    # noise contributions to corners
    n000 = V3_P[x_c + PERM[y_c + PERM[z_c]]].dot3(x, y, z)
    n001 = V3_P[x_c + PERM[y_c + PERM[z_c + 1]]].dot3(x, y, z - 1)
    n010 = V3_P[x_c + PERM[y_c + 1 + PERM[z_c]]].dot3(x, y - 1, z)
    n011 = V3_P[x_c + PERM[y_c + 1 + PERM[z_c + 1]]].dot3(x, y - 1, z - 1)
    n100 = V3_P[x_c + 1 + PERM[y_c + PERM[z_c]]].dot3(x - 1, y, z)
    n101 = V3_P[x_c + 1 + PERM[y_c + PERM[z_c + 1]]].dot3(x - 1, y, z - 1)
    n110 = V3_P[x_c + 1 + PERM[y_c + 1 + PERM[z_c]]].dot3(x - 1, y - 1, z)
    n111 = V3_P[x_c + 1 + PERM[y_c + 1 + PERM[z_c + 1]]].dot3(x - 1, y - 1, z - 1)
    # fade curve
    u = fade(x)
    v = fade(y)
    w = fade(z)
    # interpolation
    return lerp(
        lerp(lerp(n000, n100, u), lerp(n001, n101, u), w),
        lerp(lerp(n010, n110, u), lerp(n011, n111, u), w),
        v,
    )

def curl2(x, y, z):
    # https://www.bit-101.com/2017/2021/07/curl-noise/
    delta = 0.01
    n1 = perlin3(x + delta, y, z)
    n2 = perlin3(x - delta, y, z)
    cy = -(n1 - n2) / (delta * 2)
    n1 = perlin3(x, y + delta, z)
    n2 = perlin3(x, y - delta, z)
    cx = -(n1 - n2) / (delta * 2)
    print(n1, n2)
    return V3(cx, cy, 0)
