(function() {
  if (typeof Mario === 'undefined')
  window.Mario = {};

  //TODO: make each rubble an entity, use that render and write in Entity.update
  var Rubble = Mario.Rubble = function() {
    this.sprites = [];
    this.poss = [];
    this.vels = [];
  }

  Rubble.prototype.spawn = function(pos) {
    this.idx = level.items.length;
    level.items.push(this);
    this.sprites[0] = level.rubbleSprite();
    this.sprites[1] = level.rubbleSprite();
    this.sprites[2] = level.rubbleSprite();
    this.sprites[3] = level.rubbleSprite();
    this.poss[0] = pos;
    this.poss[1] = [ pos[0] + 8, pos[1] ];
    this.poss[2] = [ pos[0], pos[1] + 8 ];
    this.poss[3] = [ pos[0] + 8, pos[1] + 8 ];
    this.vels[0] = [-1.25, -5];
    this.vels[1] = [1.25, -5];
    this.vels[2] = [-1.25, -3];
    this.vels[3] = [1.25, -3];
  }

  Rubble.prototype.update = function(dt) {
    for(var i = 0; i < 4; i++) {
      if (this.sprites[i]===undefined) continue;
      this.vels[i][1] += .3;
      this.poss[i][0] += this.vels[i][0];
      this.poss[i][1] += this.vels[i][1];
      this.sprites[i].update(dt);
      if (this.poss[i][1] > 256) {
        delete this.sprites[i];
      }
    }
    if (this.sprites.every(function (el) {return !el})) {
      delete level.items[this.idx];
    }
  }

  //You might argue that things that can't collide are more like scenery
  //but these move and need to be deleted, and i'd rather deal with the 1d array.
  Rubble.prototype.checkCollisions = function() {;}

  Rubble.prototype.render = function() {
    for(var i = 0; i < 4; i++) {
      if (this.sprites[i] === undefined) continue;
      this.sprites[i].render(ctx, this.poss[i][0], this.poss[i][1], vX, vY);
    }
  }
})();
