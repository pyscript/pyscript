from alien_signals import (
    signal,
    computed,
    effect,
    effect_scope,
    pause_tracking,
    resume_tracking,
)


class expect:
    def __init__(self, value):
        self.value = value

    def to_be(self, value):
        assert self.value == value


print('should correctly propagate changes through computed signals')
src = signal(0)
c1 = computed(lambda _: src() % 2)
c2 = computed(lambda _: c1())
c3 = computed(lambda _: c2())

c3()
src(1)  # c1 -> dirty, c2 -> toCheckDirty, c3 -> toCheckDirty
c2()  # c1 -> none, c2 -> none
src(3)  # c1 -> dirty, c2 -> toCheckDirty

expect(c3()).to_be(1)


print('should propagate updated source value through chained computations')

src = signal(0)
a = computed(lambda _: src())
b = computed(lambda _: a() % 2)
c = computed(lambda _: src())
d = computed(lambda _: b() + c())

expect(d()).to_be(0)
src(2)
expect(d()).to_be(2)


print('should handle flags are indirectly updated during checkDirty')

a = signal(False)
b = computed(lambda _: a())


def c(_):
    b()
    return 0


c = computed(c)


def d(_):
    c()
    return b()


d = computed(d)

expect(d()).to_be(False)
a(True)
expect(d()).to_be(True)


print('should not trigger after stop')

count = signal(1)

triggers = 0
effect1 = None


def stop_scope():
    def effect1():
        global triggers
        triggers += 1
        count()

    effect1 = effect(effect1)
    expect(triggers).to_be(1)

    count(2)
    expect(triggers).to_be(2)


stop_scope = effect_scope(stop_scope)

count(3)
expect(triggers).to_be(3)
stop_scope()
count(4)
expect(triggers).to_be(3)


print('should pause tracking')

src = signal(0)


def c(_):
    pause_tracking()
    value = src()
    resume_tracking()
    return value


c = computed(c)
expect(c()).to_be(0)

src(1)
expect(c()).to_be(0)

from pyscript import document

document.documentElement.classList.add('done')
document.body.textContent = 'OK'
