"""(c) https://github.com/ryanking13/pyodide-pygame-demo/blob/main/examples/aliens.html
pygame.examples.aliens

Shows a mini game where you have to defend against aliens.

What does it show you about pygame?

* pygame.sprite, the difference between Sprite and Group.
* dirty rectangle optimization for processing for speed.
* music with pygame.mixer.music, including fadeout
* sound effects with pygame.Sound
* event processing, keyboard handling, QUIT handling.
* a main loop frame limited with a game clock from the pygame.time module
* fullscreen switching.


Controls
--------

* Left and right arrows to move.
* Space bar to shoot.
* f key to toggle between fullscreen.

"""

import asyncio
import random
import os
import pathlib

import pyscript

# import basic pygame modules
import pygame

# see if we can load more than standard BMP
if not pygame.image.get_extended():
    raise SystemExit("Sorry, extended image module required")


# game constants
MAX_SHOTS = 2  # most player bullets onscreen
ALIEN_ODDS = 22  # chances a new alien appears
BOMB_ODDS = 60  # chances a new bomb will drop
ALIEN_RELOAD = 12  # frames between new aliens
SCREENRECT = pygame.Rect(0, 0, 640, 480)
SCORE = 0


main_dir = str(pathlib.Path(pygame.__file__).parent / "examples")


def load_image(file):
    """loads an image, prepares it for play"""
    file = os.path.join(main_dir, "data", file)
    try:
        surface = pygame.image.load(file)
    except pygame.error:
        raise SystemExit(f'Could not load image "{file}" {pygame.get_error()}')
    return surface.convert()


def load_sound(file):
    """because pygame can be be compiled without mixer."""
    if not pygame.mixer:
        return None
    file = os.path.join(main_dir, "data", file)
    try:
        sound = pygame.mixer.Sound(file)
        return sound
    except pygame.error:
        print(f"Warning, unable to load, {file}")
    return None


# Each type of game object gets an init and an update function.
# The update function is called once per frame, and it is when each object should
# change its current position and state.
#
# The Player object actually gets a "move" function instead of update,
# since it is passed extra information about the keyboard.


class Player(pygame.sprite.Sprite):
    """Representing the player as a moon buggy type car."""

    speed = 10
    bounce = 24
    gun_offset = -11
    images = []

    def __init__(self):
        pygame.sprite.Sprite.__init__(self, self.containers)
        self.image = self.images[0]
        self.rect = self.image.get_rect(midbottom=SCREENRECT.midbottom)
        self.reloading = False
        self.origtop = self.rect.top
        self.facing = -1

    def move(self, direction):
        if direction:
            self.facing = direction
        self.rect.move_ip(direction * self.speed, 0)
        self.rect = self.rect.clamp(SCREENRECT)
        if direction < 0:
            self.image = self.images[0]
        elif direction > 0:
            self.image = self.images[1]
        self.rect.top = self.origtop - (self.rect.left // self.bounce % 2)

    def gunpos(self):
        pos = self.facing * self.gun_offset + self.rect.centerx
        return pos, self.rect.top


class Alien(pygame.sprite.Sprite):
    """An alien space ship. That slowly moves down the screen."""

    speed = 13
    animcycle = 12
    images = []

    def __init__(self):
        pygame.sprite.Sprite.__init__(self, self.containers)
        self.image = self.images[0]
        self.rect = self.image.get_rect()
        self.facing = random.choice((-1, 1)) * Alien.speed
        self.frame = 0
        if self.facing < 0:
            self.rect.right = SCREENRECT.right

    def update(self):
        self.rect.move_ip(self.facing, 0)
        if not SCREENRECT.contains(self.rect):
            self.facing = -self.facing
            self.rect.top = self.rect.bottom + 1
            self.rect = self.rect.clamp(SCREENRECT)
        self.frame = self.frame + 1
        self.image = self.images[self.frame // self.animcycle % 3]


class Explosion(pygame.sprite.Sprite):
    """An explosion. Hopefully the Alien and not the player!"""

    defaultlife = 12
    animcycle = 3
    images = []

    def __init__(self, actor):
        pygame.sprite.Sprite.__init__(self, self.containers)
        self.image = self.images[0]
        self.rect = self.image.get_rect(center=actor.rect.center)
        self.life = self.defaultlife

    def update(self):
        """called every time around the game loop.

        Show the explosion surface for 'defaultlife'.
        Every game tick(update), we decrease the 'life'.

        Also we animate the explosion.
        """
        self.life = self.life - 1
        self.image = self.images[self.life // self.animcycle % 2]
        if self.life <= 0:
            self.kill()


class Shot(pygame.sprite.Sprite):
    """a bullet the Player sprite fires."""

    speed = -11
    images = []

    def __init__(self, pos):
        pygame.sprite.Sprite.__init__(self, self.containers)
        self.image = self.images[0]
        self.rect = self.image.get_rect(midbottom=pos)

    def update(self):
        """called every time around the game loop.

        Every tick we move the shot upwards.
        """
        self.rect.move_ip(0, self.speed)
        if self.rect.top <= 0:
            self.kill()


class Bomb(pygame.sprite.Sprite):
    """A bomb the aliens drop."""

    speed = 9
    images = []

    def __init__(self, alien):
        pygame.sprite.Sprite.__init__(self, self.containers)
        self.image = self.images[0]
        self.rect = self.image.get_rect(midbottom=alien.rect.move(0, 5).midbottom)

    def update(self):
        """called every time around the game loop.

        Every frame we move the sprite 'rect' down.
        When it reaches the bottom we:

        - make an explosion.
        - remove the Bomb.
        """
        self.rect.move_ip(0, self.speed)
        if self.rect.bottom >= 470:
            Explosion(self)
            self.kill()


class Score(pygame.sprite.Sprite):
    """to keep track of the score."""

    def __init__(self):
        pygame.sprite.Sprite.__init__(self)
        self.font = pygame.Font(None, 20)
        self.font.set_italic(1)
        self.color = "white"
        self.lastscore = -1
        self.update()
        self.rect = self.image.get_rect().move(10, 450)

    def update(self):
        """We only update the score in update() when it has changed."""
        if SCORE != self.lastscore:
            self.lastscore = SCORE
            msg = "Score: %d" % SCORE
            self.image = self.font.render(msg, 0, self.color)


async def main(winstyle=0):
    # Initialize pygame
    pygame.mixer.pre_init(44100, 32, 2, 1024)
    pygame.init()
    if pygame.mixer and not pygame.mixer.get_init():
        print("Warning, no sound")
        pygame.mixer = None

    fullscreen = False
    # Set the display mode
    winstyle = 0  # |FULLSCREEN
    screen = pygame.display.set_mode(SCREENRECT.size, winstyle)

    # Load images, assign to sprite classes
    # (do this before the classes are used, after screen setup)
    img = load_image("player1.gif")
    Player.images = [img, pygame.transform.flip(img, 1, 0)]
    img = load_image("explosion1.gif")
    Explosion.images = [img, pygame.transform.flip(img, 1, 1)]
    Alien.images = [load_image(im) for im in ("alien1.gif", "alien2.gif", "alien3.gif")]
    Bomb.images = [load_image("bomb.gif")]
    Shot.images = [load_image("shot.gif")]

    # decorate the game window
    icon = pygame.transform.scale(Alien.images[0], (32, 32))
    pygame.display.set_icon(icon)
    pygame.display.set_caption("Pygame Aliens")
    pygame.mouse.set_visible(0)

    # create the background, tile the bgd image
    bgdtile = load_image("background.gif")
    background = pygame.Surface(SCREENRECT.size)
    for x in range(0, SCREENRECT.width, bgdtile.get_width()):
        background.blit(bgdtile, (x, 0))
    screen.blit(background, (0, 0))
    pygame.display.flip()

    # load the sound effects
    boom_sound = load_sound("boom.wav")
    shoot_sound = load_sound("car_door.wav")
    if pygame.mixer:
        music = os.path.join(main_dir, "data", "house_lo.wav")
        pygame.mixer.music.load(music)
        pygame.mixer.music.play(-1)

    # Initialize Game Groups
    aliens = pygame.sprite.Group()
    shots = pygame.sprite.Group()
    bombs = pygame.sprite.Group()
    all = pygame.sprite.RenderUpdates()
    lastalien = pygame.sprite.GroupSingle()

    # assign default groups to each sprite class
    Player.containers = all
    Alien.containers = aliens, all, lastalien
    Shot.containers = shots, all
    Bomb.containers = bombs, all
    Explosion.containers = all
    Score.containers = all

    # Create Some Starting Values
    global score
    alienreload = ALIEN_RELOAD
    clock = pygame.Clock()

    # initialize our starting sprites
    global SCORE
    player = Player()
    Alien()  # note, this 'lives' because it goes into a sprite group
    if pygame.font:
        all.add(Score())

    # Run our main loop whilst the player is alive.
    while player.alive():
        # get input
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return
            if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                return
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_f:
                    if not fullscreen:
                        print("Changing to FULLSCREEN")
                        screen_backup = screen.copy()
                        screen = pygame.display.set_mode(
                            SCREENRECT.size, winstyle | pygame.FULLSCREEN, bestdepth
                        )
                        screen.blit(screen_backup, (0, 0))
                    else:
                        print("Changing to windowed mode")
                        screen_backup = screen.copy()
                        screen = pygame.display.set_mode(
                            SCREENRECT.size, winstyle, bestdepth
                        )
                        screen.blit(screen_backup, (0, 0))
                    pygame.display.flip()
                    fullscreen = not fullscreen

        keystate = pygame.key.get_pressed()

        # clear/erase the last drawn sprites
        all.clear(screen, background)

        # update all the sprites
        all.update()

        # handle player input
        direction = keystate[pygame.K_RIGHT] - keystate[pygame.K_LEFT]
        player.move(direction)
        firing = keystate[pygame.K_SPACE]
        if not player.reloading and firing and len(shots) < MAX_SHOTS:
            Shot(player.gunpos())
            if pygame.mixer:
                shoot_sound.play()
        player.reloading = firing

        # Create new alien
        if alienreload:
            alienreload = alienreload - 1
        elif not int(random.random() * ALIEN_ODDS):
            Alien()
            alienreload = ALIEN_RELOAD

        # Drop bombs
        if lastalien and not int(random.random() * BOMB_ODDS):
            Bomb(lastalien.sprite)

        # Detect collisions between aliens and players.
        for alien in pygame.sprite.spritecollide(player, aliens, 1):
            if pygame.mixer:
                boom_sound.play()
            Explosion(alien)
            Explosion(player)
            SCORE = SCORE + 1
            player.kill()

        # See if shots hit the aliens.
        for alien in pygame.sprite.groupcollide(aliens, shots, 1, 1).keys():
            if pygame.mixer:
                boom_sound.play()
            Explosion(alien)
            SCORE = SCORE + 1

        # See if alien bombs hit the player.
        for bomb in pygame.sprite.spritecollide(player, bombs, 1):
            if pygame.mixer:
                boom_sound.play()
            Explosion(player)
            Explosion(bomb)
            player.kill()

        # draw the scene
        dirty = all.draw(screen)
        pygame.display.update(dirty)

        # cap the framerate at 40fps. Also called 40HZ or 40 times per second.
        await asyncio.sleep(0.025)

    if pygame.mixer:
        pygame.mixer.music.fadeout(1000)


main()
