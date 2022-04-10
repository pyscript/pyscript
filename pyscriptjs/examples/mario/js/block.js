(function() {
  if (typeof Mario === 'undefined')
    window.Mario = {};

  //TODO: clean up the logic for sprite switching.
  //TODO: There's a weird bug with the collision logic. Look into it.

  var Block = Mario.Block = function(options) {
    this.item = options.item;
    this.usedSprite = options.usedSprite;
    this.bounceSprite = options.bounceSprite;
    this.breakable = options.breakable;

    Mario.Entity.call(this, {
      pos: options.pos,
      sprite: options.sprite,
      hitbox: [0,0,16,16]
    });

    this.standing = true;
  }

  Mario.Util.inherits(Block, Mario.Floor);

  Block.prototype.break = function() {
    sounds.breakBlock.play();
    (new Mario.Rubble()).spawn(this.pos);
    var x = this.pos[0] / 16, y = this.pos[1] / 16;
    delete level.blocks[y][x];
  }

  Block.prototype.bonk = function(power) {
    sounds.bump.play();
    if (power > 0 && this.breakable) {
      this.break();
    } else if (this.standing){
      this.standing = false;
      if (this.item) {
        this.item.spawn();
        this.item = null;
      }
      this.opos = [];
      this.opos[0] = this.pos[0];
      this.opos[1] = this.pos[1];
      if (this.bounceSprite) {
        this.osprite = this.sprite;
        this.sprite = this.bounceSprite;
      } else {
        this.sprite = this.usedSprite;
      }

      this.vel[1] = -2;
    }
  }

  Block.prototype.update = function(dt, gameTime) {
    if (!this.standing) {
      if (this.pos[1] < this.opos[1] - 8) {
        this.vel[1] = 2;
      }
      if (this.pos[1] > this.opos[1]) {
        this.vel[1] = 0;
        this.pos = this.opos;
        if (this.osprite) {
          this.sprite = this.osprite;
        }
        this.standing = true;
      }
    } else {
      if (this.sprite === this.usedSprite) {
        var x = this.pos[0] / 16, y = this.pos[1] / 16;
        level.statics[y][x] = new Mario.Floor(this.pos, this.usedSprite);
        delete level.blocks[y][x];
      }
    }

    this.pos[1] += this.vel[1];
    this.sprite.update(dt, gameTime);
  }

})();
