# Python port of https://github.com/stackblitz/alien-signals - MIT

from .flags import COMPUTED, EFFECT, DIRTY, PENDING_COMPUTED, PENDING_EFFECT
from .system import create_reactive_system

__all__ = [
  'start_batch',
  'end_batch',
  'pause_tracking',
  'resume_tracking',
  'signal',
  'computed',
  'effect',
  'effect_scope',
]


class _Stack:
  def __init__(self):
    self.pause_stack = []
    self.bacth_depth = 0
    self.active_sub = None
    self.active_scope = None

_ = _Stack()


def update_computed(computed):
  prev_sub = _.active_sub
  _.active_sub = computed
  start_tracking(computed)
  try:
    old_value = computed.current_value
    new_value = computed.getter(old_value)
    if old_value != new_value:
      computed.current_value = new_value
      return True
    return False
  finally:
    _.active_sub = prev_sub
    end_tracking(computed)

rs = create_reactive_system(
  update_computed,
  lambda e: notify_effect_scope(e) if hasattr(e, 'is_scope') else notify_effect(e)
)

link = rs.link
propagate = rs.propagate
update_dirty_flag = rs.update_dirty_flag
start_tracking = rs.start_tracking
end_tracking = rs.end_tracking
process_effect_notifications = rs.process_effect_notifications
process_computed_update = rs.process_computed_update
process_pending_inner_effects = rs.process_pending_inner_effects


def start_batch():
  _.bacth_depth += 1


def end_batch():
  _.bacth_depth -= 1
  if not _.bacth_depth:
    process_effect_notifications()


def pause_tracking():
  _.pause_stack.append(_.active_sub)
  _.active_sub = None


def resume_tracking():
  _.active_sub = _.pause_stack.pop()


class _Signal:
  def __init__(self, initial_value):
    self.current_value = initial_value
    self.subs = None
    self.subs_tail = None

  def __call__(self, *args):
    if len(args):
      self.value = args[0]
    else:
      return self.value

  @property
  def value(self):
    if _.active_sub != None:
      link(self, _.active_sub)
    return self.current_value

  @value.setter
  def value(self, value):
    if self.current_value != value:
      self.current_value = value
      if self.subs != None:
        propagate(self.subs)
        if not _.bacth_depth:
          process_effect_notifications()

signal = lambda initial_value: _Signal(initial_value)


class _Computed:
  def __init__(self, getter):
    self.current_value = None
    self.subs = None
    self.subs_tail = None
    self.deps = None
    self.deps_tail = None
    self.flags = COMPUTED | DIRTY
    self.getter = getter

  def __call__(self):
    return self.value

  @property
  def value(self):
    if (self.flags & (DIRTY | PENDING_COMPUTED)):
      process_computed_update(self, self.flags)
    if _.active_sub != None:
      link(self, _.active_sub)
    elif _.active_scope != None:
      link(self, _.active_scope)

    return self.current_value

computed = lambda getter: _Computed(getter)


def _effect_stop(e):
  def effect_stop():
    start_tracking(e)
    end_tracking(e)

  return effect_stop


class _Effect:
  def __init__(self, fn):
    self.fn = fn
    self.subs = None
    self.subs_tail = None
    self.deps = None
    self.deps_tail = None
    self.flags = EFFECT

def effect(fn):
  e = _Effect(fn)
  if _.active_sub != None:
    link(e, _.active_sub)
  elif _.active_scope != None:
    link(e, _.active_scope)
  prev_sub = _.active_sub
  _.active_sub = e
  try:
    e.fn()
  finally:
    _.active_sub = prev_sub

  return _effect_stop(e)


class _EffectScope:
  def __init__(self):
    self.subs = None
    self.subs_tail = None
    self.deps = None
    self.deps_tail = None
    self.flags = EFFECT
    self.is_scope = True

def effect_scope(fn):
  e = _EffectScope()
  prev_sub = _.active_scope
  _.active_scope = e
  try:
    fn()
  finally:
    _.active_scope = prev_sub

  return _effect_stop(e)


def notify_effect(e):
  flags = e.flags

  if ((flags & DIRTY) or ((flags & PENDING_COMPUTED) and update_dirty_flag(e, flags))):
    prev_sub = _.active_sub
    _.active_sub = e
    start_tracking(e)
    try:
      e.fn()
    finally:
      _.active_sub = prev_sub
      end_tracking(e)
  else:
    process_pending_inner_effects(e, e.flags)

  return True


def notify_effect_scope(e):
  flags = e.flags

  if flags & PENDING_EFFECT:
    process_pending_inner_effects(e, e.flags)
    return True

  return False
