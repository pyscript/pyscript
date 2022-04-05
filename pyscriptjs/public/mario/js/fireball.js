(function() {
  if (typeof Mario === 'undefined')
    window.Mario = {};

  var Fireball = Mario.Fireball = function(pos) {
    this.hit = 0;
    this.standing = false;

    Mario.Entity.call(this, {
      pos: pos,
      sprite: new Mario.Sprite('sprites/items.png', [96, 144], [8,8], 5, [0,1,2,3]),
      hitbox: [0,0,8,8]
    });
  }

  Mario.Util.inherits(Fireball, Mario.Entity);

  Fireball.prototype.spawn = function(left) {
    sounds.fireball.currentTime = 0;
    sounds.fireball.play();
    if (fireballs[0]) {
      this.idx = 1;
      fireballs[1] = this;
    } else {
      this.idx = 0;
      fireballs[0] = this;
    }
    this.vel[0] = (left ? -5 : 5);
    this.standing = false;
    this.vel[1] = 0;
  }

  Fireball.prototype.render = function(ctx, vX, vY) {
    this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
  }

  Fireball.prototype.update = function(dt) {
    if (this.hit == 1) {
      this.sprite.pos = [96, 160];
      this.sprite.size = [16,16];
      this.sprite.frames = [0,1,2];
      this.sprite.speed = 8;
      this.hit += 1;
      return;
    } else if (this.hit == 5) {
      delete fireballs[this.idx];
      player.fireballs -= 1;
      return;
    } else if (this.hit) {
      this.hit += 1;
      return;
    }

    //In retrospect, the way collision is being handled is RIDICULOUS
    //but I don't have to use some horrible kludge for this.
    if (this.standing) {
      this.standing = false;
      this.vel[1] = -4;
    }

    this.acc[1] = 0.5;

    this.vel[1] += this.acc[1];
    this.pos[0] += this.vel[0];
    this.pos[1] += this.vel[1];
    if (this.pos[0] < vX || this.pos[0] > vX + 256) {
      this.hit = 1;
    }
    this.sprite.update(dt);
  }

  Fireball.prototype.collideWall = function() {
    if (!this.hit) this.hit = 1;
  }

  Fireball.prototype.checkCollisions = function() {
    if (this.hit) return;
    var h = this.pos[1] % 16 < 8 ? 1 : 2;
    var w = this.pos[0] % 16 < 8 ? 1 : 2;

    var baseX = Math.floor(this.pos[0] / 16);
    var baseY = Math.floor(this.pos[1] / 16);

    if (baseY + h > 15) {
      delete fireballs[this.idx];
      player.fireballs -= 1;
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

    var that = this;
    level.enemies.forEach(function(enemy){
      if (enemy.flipping || enemy.pos[0] - vX > 336){ //stop checking once we get to far away dudes.
        return;
      } else {
        that.isCollideWith(enemy);
      }
    });
  }

  Fireball.prototype.isCollideWith = function(ent) {
    //the first two elements of the hitbox array are an offset, so let's do this now.
    var hpos1 = [this.pos[0] + this.hitbox[0], this.pos[1] + this.hitbox[1]];
    var hpos2 = [ent.pos[0] + ent.hitbox[0], ent.pos[1] + ent.hitbox[1]];

    //if the hitboxes actually overlap
    if (!(hpos1[0] > hpos2[0]+ent.hitbox[2] || (hpos1[0]+this.hitbox[2] < hpos2[0]))) {
      if (!(hpos1[1] > hpos2[1]+ent.hitbox[3] || (hpos1[1]+this.hitbox[3] < hpos2[1]))) {
        this.hit = 1;
        ent.bump();
      }
    }
  };

  Fireball.prototype.bump = function() {;}
})();
