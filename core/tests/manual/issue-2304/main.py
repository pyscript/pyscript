import sys
print("Starting test...")

# Try NumPy
try:
    import numpy as np
    arr = np.array([1, 2, 3])
    print(f"NumPy works: {arr.mean()}")
except Exception as e:
    print(f"NumPy error: {e}")

# Try PyGame without NumPy first
try:
    print("Testing PyGame...")
    import pygame
    screen = pygame.display.set_mode((200, 200))
    screen.fill((255, 0, 0))  # Fill with red
    pygame.display.flip()
    print("PyGame works!")
except Exception as e:
    print(f"PyGame error: {e}")

# Now try PyGame with NumPy
try:
    print("Testing PyGame+NumPy...")
    color_array = np.random.randint(0, 255, size=(50, 50, 3), dtype=np.uint8)
    surface = pygame.surfarray.make_surface(color_array)
    screen.blit(surface, (75, 75))
    pygame.display.flip()
    print("PyGame+NumPy integration works!")
except Exception as e:
    print(f"PyGame+NumPy integration error: {e}")

print("Test completed")
