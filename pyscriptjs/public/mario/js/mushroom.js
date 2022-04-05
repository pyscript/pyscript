(function() {
  if (typeof Mario === 'undefined')
  window.Mario = {};

  var Mushroom = Mario.Mushroom = function(pos) {
    this.spawning = false;
    this.waiting = 0;

    Mario.Entity.call(this, {
      pos: pos,
      sprite: level.superShroomSprite,
      hitbox: [0,0,16,16]
    });
  }

  Mario.Util.inherits(Mushroom, Mario.Entity);

  Mushroom.prototype.render = function(ctx, vX, vY) {
    if (this.spawning > 1) return;
    this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
  }

  Mushroom.prototype.spawn = function() {
    if (player.power > 0) {
      //replace this with a fire flower
      var ff = new Mario.Fireflower(this.pos)
      ff.spawn();
      return;
    }
    sounds.itemAppear.play();
    this.idx = level.items.length;
    level.items.push(this);
    this.spawning = 12;
    this.targetpos = [];
    this.targetpos[0] = this.pos[0];
    this.targetpos[1] = this.pos[1] - 16;
  }

  Mushroom.prototype.update = function(dt) {
    if (this.spawning > 1) {
      this.spawning -= 1;
      if (this.spawning == 1) this.vel[1] = -.5;
      return;
    }
    if (this.spawning) {
      if (this.pos[1] <= this.targetpos[1]) {
        this.pos[1] = this.targetpos[1];
        this.vel[1] = 0;
        this.waiting = 5;
        this.spawning = 0;
        this.vel[0] = 1;
      }
    } else {
      this.acc[1] = 0.2;
    }

    if (this.waiting) {
      this.waiting -= 1;
    } else {
      this.vel[1] += this.acc[1];
      this.pos[0] += this.vel[0];
      this.pos[1] += this.vel[1];
      this.sprite.update(dt);
    }
  }

  Mushroom.prototype.collideWall = function() {
    this.vel[0] = -this.vel[0];
  }

  Mushroom.prototype.checkCollisions = function() {
    if(this.spawning) {
      return;
    }
    var h = this.pos[1] % 16 == 0 ? 1 : 2;
    var w = this.pos[0] % 16 == 0 ? 1 : 2;

    var baseX = Math.floor(this.pos[0] / 16);
    var baseY = Math.floor(this.pos[1] / 16);

    if (baseY + h > 15) {
      delete level.items[this.idx];
      return;
    }

    for (var i = 0; i < h; i++) {
      for (var j = 0; j < w; j++) {
        if (level.statics[baseY + i][baseX + j]) {
          level.statics[baseY + i][baseX + j].isCollideWith(this);
        }
        if (level.blocks[baseY + i][baseX + j]) {
          level.blocks[baseY + i][baseX + j].isCollideWith(this);
        }
      }
    }

    this.isPlayerCollided();
  }

  //we have access to player everywhere, so let's just do this.
  Mushroom.prototype.isPlayerCollided = function() {
    //the first two elements of the hitbox array are an offset, so let's do this now.
    var hpos1 = [this.pos[0] + this.hitbox[0], this.pos[1] + this.hitbox[1]];
    var hpos2 = [player.pos[0] + player.hitbox[0], player.pos[1] + player.hitbox[1]];

    //if the hitboxes actually overlap
    if (!(hpos1[0] > hpos2[0]+player.hitbox[2] || (hpos1[0]+this.hitbox[2] < hpos2[0]))) {
      if (!(hpos1[1] > hpos2[1]+player.hitbox[3] || (hpos1[1]+this.hitbox[3] < hpos2[1]))) {
        player.powerUp(this.idx);
      }
    }
  }

  Mushroom.prototype.bump = function() {
    this.vel[1] = -2;
  }

})();
