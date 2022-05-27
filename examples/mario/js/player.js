(function() {
	if (typeof Mario === 'undefined')
		window.Mario = {};

	var Player = Mario.Player = function(pos) {
		//I know, I know, there are a lot of variables tracking Mario's state.
		//Maybe these can be consolidated some way? We'll see once they're all in.
		this.power = 0;
		this.coins = 0;
		this.powering = [];
		this.bounce = false;
		this.jumping = 0;
		this.canJump = true;
		this.invincibility = 0;
		this.crouching = false;
		this.fireballs = 0;
		this.runheld = false;
		this.noInput = false;
		this.targetPos = [];

		Mario.Entity.call(this, {
			pos: pos,
			sprite: new Mario.Sprite('sprites/player.png', [80,32],[16,16],0),
			hitbox: [0,0,16,16]
		});
	};

	Mario.Util.inherits(Player, Mario.Entity);

	Player.prototype.run = function() {
		this.maxSpeed = 2.5;
		if (this.power == 2 && !this.runheld) {
			this.shoot();
		}
		this.runheld = true;
	}

	Player.prototype.shoot = function() {
		if (this.fireballs >= 2) return; //Projectile limit!
		this.fireballs += 1;
		var fb = new Mario.Fireball([this.pos[0]+8,this.pos[1]]); //I hate you, Javascript.
		fb.spawn(this.left);
		this.shooting = 2;
	}

	Player.prototype.noRun = function() {
		this.maxSpeed = 1.5;
		this.moveAcc = 0.07;
		this.runheld = false;
	}

	Player.prototype.moveRight = function() {
		//we're on the ground
		if (this.vel[1] === 0 && this.standing) {
			if (this.crouching) {
				this.noWalk();
				return;
			}
			this.acc[0] = this.moveAcc;
			this.left = false;
		} else {
			this.acc[0] = this.moveAcc;
		}
	};

	Player.prototype.moveLeft = function() {
		if (this.vel[1] === 0 && this.standing) {
			if (this.crouching) {
				this.noWalk();
				return;
			}
			this.acc[0] = -this.moveAcc;
			this.left = true;
		} else {
			this.acc[0] = -this.moveAcc;
		}
	};

	Player.prototype.noWalk = function() {
		this.maxSpeed = 0;
		if (this.vel[0] === 0) return;

		if (Math.abs(this.vel[0]) <= 0.1) {
			this.vel[0] = 0;
			this.acc[0] = 0;
		}

	};

	Player.prototype.crouch = function() {
		if (this.power === 0) {
			this.crouching = false;
			return;
		}

		if (this.standing) this.crouching = true;
	}

	Player.prototype.noCrouch = function() {
		this.crouching = false;
	}

	Player.prototype.jump = function() {
		if (this.vel[1] > 0) {
			return;
		}
		if (this.jumping) {
			this.jumping -= 1;
		} else if (this.standing && this.canJump) {
			this.jumping = 20;
			this.canJump = false;
			this.standing = false;
			this.vel[1] = -6;
			if (this.power === 0) {
				sounds.smallJump.currentTime = 0;
				sounds.smallJump.play();
			} else {
				sounds.bigJump.currentTime = 0;
				sounds.bigJump.play();
			}
		}
	};

	Player.prototype.noJump = function() {
		this.canJump = true;
		if (this.jumping) {
			if (this.jumping <= 16) {
				this.vel[1] = 0;
				this.jumping = 0;
			} else this.jumping -= 1;
		}
	};

  Player.prototype.setAnimation = function() {
		if (this.dying) return;

		if (this.starTime) {
			var index;
			if (this.starTime > 60)
				index = Math.floor(this.starTime / 2) % 3;
			else index = Math.floor(this.starTime / 8) % 3;

			this.sprite.pos[1] = level.invincibility[index];
			if (this.power == 0) {
				this.sprite.pos[1] += 32;
			}
			this.starTime -= 1;
			if (this.starTime == 0) {
				switch(this.power) {
					case 0: this.sprite.pos[1] = 32; break;
					case 1: this.sprite.pos[1] = 0; break;
					case 2: this.sprite.pos[1] = 96; break;
				}
			}
		}
		//okay cool, now set the sprite
		if (this.crouching) {
			this.sprite.pos[0] = 176;
			this.sprite.speed = 0;
			return;
		}

    if (this.jumping) {
			this.sprite.pos[0] = 160;
			this.sprite.speed = 0;
		} else if (this.standing) {
			if (Math.abs(this.vel[0]) > 0) {
				if (this.vel[0] * this.acc[0] >= 0) {
					this.sprite.pos[0] = 96;
					this.sprite.frames = [0,1,2];
					if (this.vel[0] < 0.2) {
						this.sprite.speed = 5;
					} else {
						this.sprite.speed = Math.abs(this.vel[0]) * 8;
					}
				} else if ((this.vel[0] > 0 && this.left) || (this.vel[0] < 0 && !this.left)){
					this.sprite.pos[0] = 144;
					this.sprite.speed = 0;
				}
			} else {
				this.sprite.pos[0] = 80;
				this.sprite.speed = 0;
			}
			if (this.shooting) {
				this.sprite.pos[0] += 160;
				this.shooting -= 1;
			}
		}

		if (this.flagging) {
			this.sprite.pos[0] = 192;
			this.sprite.frames = [0,1];
			this.sprite.speed = 10;
			if (this.vel[1] === 0) this.sprite.frames = [0];
		}

		//which way are we facing?
		if (this.left) {
			this.sprite.img = 'sprites/playerl.png';
		} else {
			this.sprite.img = 'sprites/player.png';
		}
  };

	Player.prototype.update = function(dt, vX) {
		if (this.powering.length !== 0) {
			var next = this.powering.shift();
			if (next == 5) return;
			this.sprite.pos = this.powerSprites[next];
			this.sprite.size = this.powerSizes[next];
			this.pos[1] += this.shift[next];
			if (this.powering.length === 0) {
				delete level.items[this.touchedItem];
			}
			return;
		}

		if (this.invincibility) {
			this.invincibility -= Math.round(dt * 60);
		}

		if (this.waiting) {
			this.waiting -= dt;
			if (this.waiting <= 0) {
				this.waiting = 0;
			} else return;
		}

		if (this.bounce) {
			this.bounce = false;
			this.standing = false;
			this.vel[1] = -3;
		}

		if (this.pos[0] <= vX) {
			this.pos[0] = vX;
			this.vel[0] = Math.max(this.vel[0], 0);
		}

		if (Math.abs(this.vel[0]) > this.maxSpeed) {
			this.vel[0] -= 0.05 *  this.vel[0] / Math.abs(this.vel[0]);
			this.acc[0] = 0;
		}

		if (this.dying){
			if (this.pos[1] < this.targetPos[1]) {
				this.vel[1] = 1;
			}
			this.dying -= 1 * dt;
			if (this.dying <= 0) {
				player = new Mario.Player(level.playerPos);
				level.loader.call();
				input.reset();
			}
		}
		else {
			this.acc[1] = 0.25
			if (this.pos[1] > 240) {
				this.die();
			}
		}

		if (this.piping) {
			this.acc = [0,0];
			var pos = [Math.round(this.pos[0]), Math.round(this.pos[1])]
			if (pos[0] === this.targetPos[0] && pos[1] === this.targetPos[1]) {
				this.piping = false;
				this.pipeLoc.call();
			}
		}

		if (this.flagging) {
			this.acc = [0,0];
		}

		if (this.exiting) {
			this.left = false;
			this.flagging = false;
			this.vel[0] = 1.5;
			if (this.pos[0] >= this.targetPos[0]) {
				this.sprite.size = [0,0];
				this.vel = [0,0];
				window.setTimeout(function() {
					player.sprite.size = player.power===0 ? [16,16] : [16,32];
					player.exiting = false;
					player.noInput = false;
					level.loader();
					if (player.power !== 0) player.pos[1] -= 16;
					music.overworld.currentTime = 0;
				}, 5000);
			}
		}

		//approximate acceleration
		this.vel[0] += this.acc[0];
		this.vel[1] += this.acc[1];
		this.pos[0] += this.vel[0];
		this.pos[1] += this.vel[1];

    this.setAnimation();
		this.sprite.update(dt);
	};

	Player.prototype.checkCollisions = function() {
		if (this.piping || this.dying) return;
		//x-axis first!
		var h = this.power > 0 ? 2 : 1;
		var w = 1;
		if (this.pos[1] % 16 !== 0) {
			h += 1;
		}
		if (this.pos[0] % 16 !== 0) {
			w += 1;
		}
		var baseX = Math.floor(this.pos[0] / 16);
		var baseY = Math.floor(this.pos[1] / 16);

		for (var i = 0; i < h; i++) {
			if (baseY + i < 0 || baseY + i >= 15) continue;
			for (var j = 0; j < w; j++) {
				if (baseY < 0) { i++;}
				if (level.statics[baseY + i][baseX + j]) {
					level.statics[baseY + i][baseX + j].isCollideWith(this);
				}
				if (level.blocks[baseY + i][baseX + j]) {
					level.blocks[baseY + i][baseX + j].isCollideWith(this);
				}
			}
		}
	};

	Player.prototype.powerUp = function(idx) {
		sounds.powerup.play();
	  this.powering = [0,5,2,5,1,5,2,5,1,5,2,5,3,5,1,5,2,5,3,5,1,5,4];
		this.touchedItem = idx;

		if (this.power === 0) {
			this.sprite.pos[0] = 80;
			var newy = this.sprite.pos[1] - 32;
			this.powerSprites = [[80, newy+32], [80, newy+32], [320, newy], [80, newy], [128, newy]];
			this.powerSizes = [[16,16],[16,16],[16,32],[16,32],[16,32]];
			this.shift = [0,16,-16,0,-16];
			this.power = 1;
			this.hitbox = [0,0,16,32];
		} else if (this.power == 1) {
			var curx = this.sprite.pos[0];
			this.powerSprites = [[curx, 96], [curx, level.invincibility[0]],
				[curx, level.invincibility[1]], [curx, level.invincibility[2]],
				[curx, 96]];
			this.powerSizes[[16,32],[16,32],[16,32],[16,32],[16,32]];
			this.shift = [0,0,0,0,0];
			this.power = 2;
		} else {
			this.powering = [];
			delete level.items[idx];
			//no animation, but we play the sound and you get 5000 points.
		}
	};

	Player.prototype.damage = function() {
		if (this.power === 0) { //if you're already small, you dead!
			this.die();
		} else { //otherwise, you get turned into small mario
			sounds.pipe.play();
			this.powering = [0,5,1,5,2,5,1,5,2,5,1,5,2,5,1,5,2,5,1,5,2,5,3];
			this.shift = [0,16,-16,16];
			this.sprite.pos = [160, 0];
			this.powerSprites = [[160,0], [240, 32], [240, 0], [160, 32]];
			this.powerSizes = [[16, 32], [16,16], [16,32], [16,16]];
			this.invincibility = 120;
			this.power = 0;
			this.hitbox = [0,0,16,16];
		}
	};

	Player.prototype.die = function () {
		//TODO: rewrite the way sounds work to emulate the channels of an NES.
		music.overworld.pause();
		music.underground.pause();
		music.overworld.currentTime = 0;
		music.death.play();
		this.noWalk();
		this.noRun();
		this.noJump();

		this.acc[0] = 0;
		this.sprite.pos = [176, 32];
		this.sprite.speed = 0;
		this.power = 0;
		this.waiting = 0.5;
		this.dying = 2;

		if (this.pos[1] < 240) { //falling into a pit doesn't do the animation.
			this.targetPos = [this.pos[0], this.pos[1]-128];
			this.vel = [0,-5];
		} else {
			this.vel = [0,0];
			this.targetPos = [this.pos[0], this.pos[1] - 16];
		}
	};

	Player.prototype.star = function(idx) {
		delete level.items[idx];
		this.starTime = 660;
	}

	Player.prototype.pipe = function(direction, destination) {
		sounds.pipe.play();
		this.piping = true;
		this.pipeLoc = destination;
		switch(direction) {
			case "LEFT":
				this.vel = [-1,0];
				this.targetPos = [Math.round(this.pos[0]-16), Math.round(this.pos[1])]
				break;
			case "RIGHT":
				this.vel = [1,0];
				this.targetPos = [Math.round(this.pos[0]+16), Math.round(this.pos[1])]
				break;
			case "DOWN":
				this.vel = [0,1];
				this.targetPos = [Math.round(this.pos[0]), Math.round(this.pos[1]+this.hitbox[3])]
				break;
			case "UP":
				this.vel = [0,-1];
				this.targetPos = [Math.round(this.pos[0]), Math.round(this.pos[1]-this.hitbox[3])]
				break;
		}
	}

	Player.prototype.flag = function() {
		this.noInput = true;
		this.flagging = true;
		this.vel = [0, 2];
		this.acc = [0, 0];
	}

	Player.prototype.exit = function() {
		this.pos[0] += 16;
		this.targetPos[0] = level.exit * 16;
		this.left = true;
		this.setAnimation();
		this.waiting = 1;
		this.exiting = true;
	}
})();
