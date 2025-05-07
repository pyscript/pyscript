# Python port of https://github.com/stackblitz/alien-signals - MIT

from .flags import COMPUTED, EFFECT, TRACKING, NOTIFIED, RECURSED, DIRTY, PENDING_COMPUTED, PENDING_EFFECT, PROPAGATED


class Branch:
  def __init__(self, target, linked):
    self.target = target
    self.linked = linked


class LinkDep:
  def __init__(self, dep, sub, next_dep):
    self.dep = dep
    self.sub = sub
    self.next_dep = next_dep
    self.prev_sub = None
    self.next_sub = None


def is_valid_link(check_link, sub):
  deps_tail = sub.deps_tail
  if deps_tail != None:
    link = sub.deps
    while True:
      if link == check_link:
        return True
      if link == deps_tail:
        break
      link = link.next_dep
      if link == None:
        break

  return False


def link_new_dep(dep, sub, next_dep, deps_tail):
  new_link = LinkDep(dep, sub, next_dep)
  if deps_tail == None:
    sub.deps = new_link
  else:
    deps_tail.next_dep = new_link

  if dep.subs == None:
    dep.subs = new_link
  else:
    old_tail = dep.subs_tail
    new_link.prev_sub = old_tail
    old_tail.next_sub = new_link

  sub.deps_tail = new_link
  dep.subs_tail = new_link
  return new_link


def clear_tracking(link):
  while True:
    dep = link.dep
    next_dep = link.next_dep
    next_sub = link.next_sub
    prev_sub = link.prev_sub

    if next_sub != None:
      next_sub.prev_sub = prev_sub
    else:
      dep.subs_tail = prev_sub

    if prev_sub != None:
      prev_sub.next_sub = next_sub
    else:
      dep.subs = next_sub

    if dep.subs == None and hasattr(dep, 'deps'):
      dep_flags = dep.flags
      if not (dep_flags & DIRTY):
        dep.flags = dep_flags | DIRTY

      dep_deps = dep.deps
      if dep_deps != None:
        link = dep_deps
        dep.deps_tail.next_dep = next_dep
        dep.deps = None
        dep.deps_tail = None
        continue;

    link = next_dep
    if link == None:
      break


def create_reactive_system(update_computed, notify_effect):
  class Reactive:
    def __init__(self):
      self.notify_buffer = []

    def link(self, dep, sub):
      current_dep = sub.deps_tail
      if current_dep != None and current_dep.dep == dep:
        return
      next_dep = current_dep.next_dep if current_dep != None else sub.deps
      if next_dep != None and next_dep.dep == dep:
        sub.deps_tail = next_dep
        return
      dep_last_sub = dep.subs_tail
      if dep_last_sub != None and dep_last_sub.sub == sub and is_valid_link(dep_last_sub, sub):
        return
      return link_new_dep(dep, sub, next_dep, current_dep)

    def propagate(self, current):
      next = current.next_sub
      branchs = None
      branch_depth = 0
      target_flag = DIRTY
      while True:
        one_more_time = False
        sub = current.sub
        sub_flags = sub.flags
        should_notify = False

        if not (sub_flags & (TRACKING | RECURSED | PROPAGATED)):
          sub.flags = sub_flags | target_flag | NOTIFIED
          should_notify = True
        elif (sub_flags & RECURSED) and not (sub_flags & TRACKING):
          sub.flags = (sub_flags & ~RECURSED) | target_flag | NOTIFIED
          should_notify = True
        elif (not (sub_flags & PROPAGATED)) and is_valid_link(current, sub):
          sub.flags = sub_flags | RECURSED | target_flag | NOTIFIED
          should_notify = sub.subs != None

        if should_notify:
          sub_subs = sub.subs
          if sub_subs != None:
            current = sub_subs
            if sub_subs.next_sub != None:
              branchs = Branch(next, branchs)
              branch_depth += 1
              next = current.next_sub
              target_flag = PENDING_COMPUTED
            else:
              target_flag = PENDING_EFFECT if (sub_flags & EFFECT) else PENDING_COMPUTED
              continue

          if (sub_flags & EFFECT):
              self.notify_buffer.append(sub)

        elif not (sub_flags & (TRACKING | target_flag)):
          sub.flags = sub_flags | target_flag | NOTIFIED
          if (sub_flags & (EFFECT | NOTIFIED)) == EFFECT:
            self.notify_buffer.append(sub)

        elif (not (sub_flags & target_flag)) and (sub_flags & PROPAGATED) and is_valid_link(current, sub):
          sub.flags = sub_flags | target_flag

        current = next
        if current != None:
          next = current.next_sub
          target_flag = PENDING_COMPUTED if branch_depth else DIRTY
          continue

        while branch_depth:
          branch_depth -= 1
          current = branchs.target
          branchs = branchs.linked
          if current != None:
            next = current.next_sub
            target_flag = PENDING_COMPUTED if branch_depth else DIRTY
            one_more_time = True
            break

        if (not one_more_time):
          break

    def update_dirty_flag(self, sub, flags):
      if self.check_dirty(sub.deps):
        sub.flags = flags | DIRTY
        return True
      else:
        sub.flags = flags & ~PENDING_COMPUTED
        return False

    def start_tracking(self, sub):
      sub.deps_tail = None
      sub.flags = (sub.flags & ~(NOTIFIED | RECURSED | PROPAGATED)) | TRACKING

    def end_tracking(self, sub):
      deps_tail = sub.deps_tail
      if deps_tail != None:
        next_dep = deps_tail.next_dep
        if next_dep != None:
          clear_tracking(next_dep)
          deps_tail.next_dep = None

      elif sub.deps != None:
        clear_tracking(sub.deps);
        sub.deps = None

      sub.flags &= ~TRACKING

    def process_effect_notifications(self):
      for effect in self.notify_buffer:
        if not notify_effect(effect):
          effect.flags &= ~NOTIFIED

      self.notify_buffer.clear()

    def process_computed_update(self, computed, flags):
      if (flags & DIRTY) or self.check_dirty(computed.deps):
        if update_computed(computed):
          subs = computed.subs;
          if subs != None:
            self.shallow_propagate(subs)
      else:
          computed.flags = flags & ~PENDING_COMPUTED

    def process_pending_inner_effects(self, sub, flags):
      if (flags & PENDING_EFFECT):
          sub.flags = flags & ~PENDING_EFFECT
          link = sub.deps
          while True:
            dep = link.dep
            if hasattr(dep, 'flags') and (dep.flags & EFFECT) and (dep.flags & PROPAGATED):
              notify_effect(dep)

            link = link.next_dep
            if link == None:
              break

    def shallow_propagate(self, link):
      while True:
        sub = link.sub
        sub_flags = sub.flags
        if (sub_flags & (PENDING_COMPUTED | DIRTY)) == PENDING_COMPUTED:
          sub.flags = sub_flags | DIRTY | NOTIFIED
          if (sub_flags & (EFFECT | NOTIFIED)) == EFFECT:
            self.notify_buffer.append(sub)

        link = link.next_sub
        if link == None:
          break

    def check_dirty(self, current):
      prev_links = None
      check_depth = 0
      while True:
        one_more_time = False
        dirty = False
        dep = current.dep
        if current.sub.flags & DIRTY:
          dirty = True
        elif hasattr(dep, 'flags'):
          dep_flags = dep.flags
          if ((dep_flags & (COMPUTED | DIRTY)) == (COMPUTED | DIRTY)):
            if (update_computed(dep)):
              subs = dep.subs
              if subs.next_sub != None:
                self.shallow_propagate(subs)
              dirty = True
          elif (dep_flags & (COMPUTED | PENDING_COMPUTED)) == (COMPUTED | PENDING_COMPUTED):
            if (current.next_sub != None) or (current.prev_sub != None):
              prev_links = Branch(current, prev_links)
            current = dep.deps;
            check_depth += 1
            continue

        if (not dirty) and current.next_dep != None:
          current = current.next_dep
          continue

        while check_depth:
          check_depth -= 1
          sub = current.sub
          first_sub = sub.subs
          if dirty:
            if update_computed(sub):
              if first_sub.next_sub != None:
                current = prev_links.target
                prev_links = prev_links.linked
                self.shallow_propagate(first_sub)
              else:
                  current = first_sub
              continue
          else:
            sub.flags &= ~PENDING_COMPUTED

          if first_sub.next_sub != None:
            current = prev_links.target
            prev_links = prev_links.linked
          else:
            current = first_sub

          if current.next_dep != None:
            current = current.next_dep
            one_more_time = True
            break

          dirty = False

        if not one_more_time:
          return dirty

  return Reactive()
