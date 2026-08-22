# Python port of https://github.com/stackblitz/alien-signals - MIT

COMPUTED = 1 << 0
EFFECT = 1 << 1
TRACKING = 1 << 2
NOTIFIED = 1 << 3
RECURSED = 1 << 4
DIRTY = 1 << 5
PENDING_COMPUTED = 1 << 6
PENDING_EFFECT = 1 << 7
PROPAGATED = DIRTY | PENDING_COMPUTED | PENDING_EFFECT
