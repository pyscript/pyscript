import sys

print(sys.version)
RED = chr(0x1F534)  # LARGE RED CIRCLE
GREEN = chr(0x1F7E2)  # LARGE GREEN CIRCLE
MOUSE = chr(0x1F42D)  # MOUSE FACE
EARTH = chr(0x1F30E)  # EARTH GLOBE AMERICAS
FACE = chr(0x1F610)  # NEUTRAL FACE
BASMALA = chr(0xFDFD)  # ARABIC LIGATURE BISMILLAH AR-RAHMAN AR-RAHEEM

print("[", RED, "]")
print("[", MOUSE, "]")
print("[", EARTH, "]")
print("[", FACE, "]")
print("[", FACE * 3, "]")
print("[", BASMALA, "]")
print("[", BASMALA + GREEN, "]")
