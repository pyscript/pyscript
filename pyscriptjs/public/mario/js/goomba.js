(function() {
  if (typeof Mario === 'undefined')
  window.Mario = {};

  //TODO: On console the hitbox is smaller. Measure it and edit this.

  var Goomba = Mario.Goomba = function(pos, sprite) {
    this.dying = false;
    Mario.Entity.call(this, {
      pos: pos,
      sprite: sprite,
      hitbox: [0,0,16,16]
    });
    this.vel[0] = -0.5;
    this.idx = level.enemies.length;
  };

  Goomba.prototype.render = function(ctx, vX, vY) {
    this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
  };

  Goomba.prototype.update = function(dt, vX) {
    if (this.pos[0] - vX > 336) { //if we're too far away, do nothing.
      return;
    } else if (this.pos[0] - vX < -32) {
      delete level.enemies[this.idx];
    }

    if (this.dying) {
      this.dying -= 1;
      if (!this.dying) {
        delete level.enemies[this.idx];
      }
    }
    this.acc[1] = 0.2;
    this.vel[1] += this.acc[1];
    this.pos[0] += this.vel[0];
    this.pos[1] += this.vel[1];
    this.sprite.update(dt);
  };

  Goomba.prototype.collideWall = function() {
    this.vel[0] = -this.vel[0];
  };

  Goomba.prototype.checkCollisions = function() {
    if (this.flipping) {
      return;
    }

    var h = this.pos[1] % 16 === 0 ? 1 : 2;
    var w = this.pos[0] % 16 === 0 ? 1 : 2;

    var baseX = Math.floor(this.pos[0] / 16);
    var baseY = Math.floor(this.pos[1] / 16);

    if (baseY + h > 15) {
      delete level.enemies[this.idx];
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
      if (enemy === that) { //don't check collisions with ourselves.
        return;
      } else if (enemy.pos[0] - vX > 336){ //stop checking once we get to far away dudes.
        return;
      } else {
        that.isCollideWith(enemy);
      }
    });
    this.isCollideWith(player);
  };

  Goomba.prototype.isCollideWith = function(ent) {
    if (ent instanceof Mario.Player && (this.dying || ent.invincibility)) {
      return;
    }

    //the first two elements of the hitbox array are an offset, so let's do this now.
    var hpos1 = [this.pos[0] + this.hitbox[0], this.pos[1] + this.hitbox[1]];
    var hpos2 = [ent.pos[0] + ent.hitbox[0], ent.pos[1] + ent.hitbox[1]];

    //if the hitboxes actually overlap
    if (!(hpos1[0] > hpos2[0]+ent.hitbox[2] || (hpos1[0]+this.hitbox[2] < hpos2[0]))) {
      if (!(hpos1[1] > hpos2[1]+ent.hitbox[3] || (hpos1[1]+this.hitbox[3] < hpos2[1]))) {
        if (ent instanceof Mario.Player) { //if we hit the player
          if (ent.vel[1] > 0) { //then the goomba dies
            this.stomp();
          } else if (ent.starTime) {
            this.bump();
          } else { //or the player gets hit
            ent.damage();
          }
        } else {
          this.collideWall();
        }
      }
    }
  };

  Goomba.prototype.stomp = function() {
    sounds.stomp.play();
    player.bounce = true;
    this.sprite.pos[0] = 32;
    this.sprite.speed = 0;
    this.vel[0] = 0;
    this.dying = 10;
  };

  Goomba.prototype.bump = function() {
    sounds.kick.play();
    this.sprite.img = 'sprites/enemyr.png';
    this.flipping = true;
    this.pos[1] -= 1;
    this.vel[0] = 0;
    this.vel[1] = -2.5;
  };
})();
