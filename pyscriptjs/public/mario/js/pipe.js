(function() {
  if (typeof Mario === 'undefined')
    window.Mario = {};


  //there are too many possible configurations of pipe to capture in a reasonable
  //set of simple variables. Joints, etc. are just too much.
  //To that end, the pipe class handles simple pipes, and we'll put together
  //anything more complex with individual props. OK? OK.
  Pipe = Mario.Pipe = function(options) {
    this.pos = options.pos

    //NOTE: direction is the direction you move INTO the pipe.
    this.direction = options.direction
    this.destination = options.destination
    this.length = options.length;

    if (this.direction === "UP" || this.direction === "DOWN") {
      this.hitbox = [0,0, 32, this.length * 16];
      this.midsection = level.pipeUpMid;
      this.endsection = level.pipeTop;
    } else {
      this.hitbox = [0,0, 16*this.length, 32];
      this.midsection = level.pipeSideMid;
      this.endsection = level.pipeLeft;
    }
  }

  Pipe.prototype.checkPipe = function() {
    if (this.destination === undefined || !input.isDown(this.direction)) return;

    var h = player.power===0 ? 16 : 32;
    var x = Math.floor(player.pos[0]);
    var y = Math.floor(player.pos[1]);
    switch (this.direction) {
      case 'RIGHT': if (x === this.pos[0]-16 &&
                        y >= this.pos[1] &&
                        y+h <= this.pos[1]+32) {
                          player.pipe(this.direction, this.destination)
                        }
        break;
      case 'LEFT': if (x === this.pos[0]+16*this.length &&
                       y >= this.pos[1] &&
                       y+h <= this.pos[1]+32) {
                         player.pipe(this.direction, this.destination)
                       }
        break;
      case 'UP': if (y === this.pos[1] + 16*this.length &&
                     x >= this.pos[0] &&
                     x+16 <= this.pos[0]+32) {
                       player.pipe(this.direction, this.destination)
                     }
        break;
      case 'DOWN': if (y+h === this.pos[1] &&
                    x >= this.pos[0] &&
                    x+16 <= this.pos[0]+32) {
                      player.pipe(this.direction, this.destination);
                    }
        break;
    }
  }

  //Note to self: next time, decide on a convention for which thing checks for collisions
  //and stick to it. This is a pain.
  Pipe.prototype.checkCollisions = function() {
    var that = this;
    level.enemies.forEach (function(ent) {
      that.isCollideWith(ent);
    });

    level.items.forEach (function(ent) {
      that.isCollideWith(ent);
    });

    fireballs.forEach(function(ent){
      that.isCollideWith(ent)
    });

    if (!player.piping) this.isCollideWith(player);
  }

  Pipe.prototype.isCollideWith = function (ent) {
    //long story short: because we scan every item, and and one 'rubble' item is four things with separate positions
    //we'll crash without this line as soon as we destroy a block. OOPS.
    if (ent.pos === undefined) return;


    //the first two elements of the hitbox array are an offset, so let's do this now.
    var hpos1 = [Math.floor(this.pos[0] + this.hitbox[0]), Math.floor(this.pos[1] + this.hitbox[1])];
    var hpos2 = [Math.floor(ent.pos[0] + ent.hitbox[0]), Math.floor(ent.pos[1] + ent.hitbox[1])];

    //if the hitboxes actually overlap
    if (!(hpos1[0] > hpos2[0]+ent.hitbox[2] || (hpos1[0]+this.hitbox[2] < hpos2[0]))) {
      if (!(hpos1[1] > hpos2[1]+ent.hitbox[3] || (hpos1[1]+this.hitbox[3] < hpos2[1]))) {
        //if the entity is over the block, it's basically floor
        var center = hpos2[0] + ent.hitbox[2] / 2;
        if (Math.abs(hpos2[1] + ent.hitbox[3] - hpos1[1]) <= ent.vel[1]) {
          ent.vel[1] = 0;
          ent.pos[1] = hpos1[1] - ent.hitbox[3] - ent.hitbox[1];
          ent.standing = true;
          if (ent instanceof Mario.Player) {
            ent.jumping = 0;
          }
        } else if (Math.abs(hpos2[1] - hpos1[1] - this.hitbox[3]) > ent.vel[1] &&
        center + 2 >= hpos1[0] && center - 2 <= hpos1[0] + this.hitbox[2]) {
          //ent is under the block.
          ent.vel[1] = 0;
          ent.pos[1] = hpos1[1] + this.hitbox[3];
          if (ent instanceof Mario.Player) {
            ent.jumping = 0;
          }
        } else {
          //entity is hitting it from the side, we're a wall
          ent.collideWall(this);
        }
      }
    }
  }

  //we COULD try to write some shenanigans so that the check gets put into the
  //collision code, but there won't ever be more than a handful of pipes in a level
  //so the performance hit of scanning all of them is miniscule.
  Pipe.prototype.update = function(dt) {
    if (this.destination) this.checkPipe();
  }

  //http://stackoverflow.com/questions/11227809/why-is-processing-a-sorted-array-faster-than-an-unsorted-array
  //I honestly have no idea if javascript does this, but I feel like it makes sense
  //stylistically to prefer branching outside of loops when possible as convention

  //TODO: edit the spritesheet so UP and LEFT pipes aren't backwards.
  Pipe.prototype.render = function(ctx, vX, vY) {
    switch (this.direction) {
      case "DOWN":
        this.endsection.render(ctx, this.pos[0], this.pos[1], vX, vY);
        for (var i = 1; i < this.length; i++) {
          this.midsection.render(ctx, this.pos[0], this.pos[1]+i*16, vX, vY)
        }
        break;
      case "UP":
        this.endsection.render(ctx, this.pos[0], this.pos[1]+16*(this.length-1), vX, vY)
        for (var i=0; i < this.length - 1; i++) {
          this.midsection.render(ctx, this.pos[0], this.pos[1]+i*16, vX, vY)
        }
        break;
      case "RIGHT":
        this.endsection.render(ctx, this.pos[0], this.pos[1], vX, vY)
        for (var i = 1; i < this.length; i++) {
          this.midsection.render(ctx, this.pos[0]+16*i, this.pos[1], vX, vY)
        }
        break;
      case "LEFT":
        this.endsection.render(ctx, this.pos[0]+16*(this.length-1), this.pos[1], vX, vY)
        for (var i = 0; i < this.legth-1; i++) {
          this.midsection.render(ctx, this.pos[0], this.pos[1]+i*16, vX, vY)
        }
        break;
    }
  }
})();
