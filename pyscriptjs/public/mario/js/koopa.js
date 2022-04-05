(function() {
  if (typeof Mario === 'undefined')
  window.Mario = {};

  var Koopa = Mario.Koopa = function(pos, sprite, para) {
    this.dying = false;
    this.shell = false;

    this.para = para; //para. As in, is it a paratroopa?

    //So, funny story. The actual hitboxes don't reach all the way to the ground.
    //What that means is, as long as I use them to keep things on the floor
    //making the hitboxes accurate will make enemies sink into the ground.
    Mario.Entity.call(this, {
      pos: pos,
      sprite: sprite,
      hitbox: [2,8,12,24]
    });
    this.vel[0] = -0.5;
    this.idx = level.enemies.length;
  };

  Koopa.prototype.render = function(ctx, vX, vY) {
    this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
  };

  Koopa.prototype.update = function(dt, vX) {
    if (this.turn) {
      this.vel[0] = -this.vel[0];
      if (this.shell) sounds.bump.play();
      this.turn = false;
    }
    if (this.vel[0] != 0) {
      this.left = (this.vel[0] < 0);
    }

    if (this.left) {
      this.sprite.img = 'sprites/enemy.png';
    } else {
      this.sprite.img = 'sprites/enemyr.png';
    }

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

    if (this.shell) {
      if (this.vel[0] == 0) {
        this.shell -= 1;
        if (this.shell < 120) {
          this.sprite.speed = 5;
        }
        if (this.shell == 0) {
          this.sprite = level.koopaSprite();
          this.hitbox = [2,8,12,24]
          if (this.left) {
            this.sprite.img = 'sprites/enemyr.png';
            this.vel[0] = 0.5;
            this.left = false;
          } else {
            this.vel[0] = -0.5;
            this.left = true;
          }
          this.pos[1] -= 16;
        }
      } else {
        this.shell = 360;
        this.sprite.speed = 0;
        this.sprite.setFrame(0);
      }
    }
    this.acc[1] = 0.2;
    this.vel[1] += this.acc[1];
    this.pos[0] += this.vel[0];
    this.pos[1] += this.vel[1];
    this.sprite.update(dt);
  };

  Koopa.prototype.collideWall = function() {
    //This stops us from flipping twice on the same frame if we collide
    //with multiple wall tiles simultaneously.
    this.turn = true;
  };

  Koopa.prototype.checkCollisions = function() {
    var h = this.shell ? 1 : 2;
    if (this.pos[1] % 16 !== 0) {
      h += 1;
    }
    var w = this.pos[0] % 16 === 0 ? 1 : 2;

    var baseX = Math.floor(this.pos[0] / 16);
    var baseY = Math.floor(this.pos[1] / 16);

    if (baseY + h > 15) {
      delete level.enemies[this.idx];
      return;
    }

    if (this.flipping) {
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

  Koopa.prototype.isCollideWith = function(ent) {
    if (ent instanceof Mario.Player && (this.dying || ent.invincibility)) {
      return;
    }

    //the first two elements of the hitbox array are an offset, so let's do this now.
    var hpos1 = [this.pos[0] + this.hitbox[0], this.pos[1] + this.hitbox[1]];
    var hpos2 = [ent.pos[0] + ent.hitbox[0], ent.pos[1] + ent.hitbox[1]];

    //if the hitboxes actually overlap
    if (!(hpos1[0] > hpos2[0]+ent.hitbox[2] || (hpos1[0]+this.hitbox[2] < hpos2[0]))) {
      if (!(hpos1[1] > hpos2[1]+ent.hitbox[3] || (hpos1[1]+this.hitbox[3] < hpos2[1]))) {
        if (ent instanceof Mario.Player) {
          if (ent.vel[1] > 0) {
            player.bounce = true;
          }
          if (this.shell) {
            sounds.kick.play();
            if (this.vel[0] === 0) {
              if (ent.left) { //I'm pretty sure this isn't the real logic.
                this.vel[0] = -4;
              } else {
                this.vel[0] = 4;
              }
            } else {
              if (ent.bounce) {
                this.vel[0] = 0;
              } else ent.damage();
            }
          } else if (ent.vel[1] > 0) { //then we get BOPPED.
            this.stomp();
          } else { //or the player gets hit
            ent.damage();
          }
        } else {
          if (this.shell && (ent instanceof Mario.Goomba)) {
            ent.bump();
          } else this.collideWall();
        }
      }
    }
  };

  Koopa.prototype.stomp = function() {
    //Turn this thing into a shell if it isn't already. Kick it if it is.
    player.bounce = true;
    if (this.para) {
      this.para = false;
      this.sprite.pos[0] -= 32;
    } else {
      sounds.stomp.play();
      this.shell = 360;
      this.sprite.pos[0] += 64;
      this.sprite.pos[1] += 16;
      this.sprite.size = [16,16];
      this.hitbox = [2,0,12,16];
      this.sprite.speed = 0;
      this.frames = [0,1];
      this.vel = [0,0];
      this.pos[1] += 16;
    }

  };

  Koopa.prototype.bump = function() {
    sounds.kick.play();
    if (this.flipping) return;
    this.flipping = true;
    this.sprite.pos = [160, 0];
    this.sprite.size = [16,16];
    this.hitbox = [2, 0, 12, 16];
    this.sprite.speed = 0;
    this.vel[0] = 0;
    this.vel[1] = -2.5;
  };
})();
