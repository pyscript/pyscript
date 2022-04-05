var oneonetunnel = Mario.oneonetunnel = function() {
  level = new Mario.Level({
    playerPos: [40,16],
    loader: Mario.oneonetunnel,
    background: "#000000",
    scrolling: false,
    coinSprite: function() {
      return new Mario.Sprite('sprites/items.png', [0,96],[16,16], 6,[0,0,0,0,1,2,1]);
    },
    floorSprite:  new Mario.Sprite('sprites/tiles.png', [0,32],[16,16],0),
    wallSprite: new Mario.Sprite('sprites/tiles.png', [32, 32],[16,16],0),
    brickSprite: new Mario.Sprite('sprites/tiles.png', [16, 0], [16,16], 0),
    brickBounceSprite: new Mario.Sprite('sprites/tiles.png',[32,0],[16,16],0),
    ublockSprite: new Mario.Sprite('sprites/tiles.png', [48, 0], [16,16],0),
    pipeLMidSprite: new Mario.Sprite('sprites/tiles.png', [0, 144], [16,16], 0),
    pipeRMidSprite: new Mario.Sprite('sprites/tiles.png', [16, 144], [16,16], 0),
    pipeLEndSprite: new Mario.Sprite('sprites/tiles.png', [0, 128], [16,16], 0),
    pipeREndSprite: new Mario.Sprite('sprites/tiles.png', [16, 128], [16,16], 0),
    pipeUpMid: new Mario.Sprite('sprites/tiles.png', [0, 144], [32,16], 0),
    pipeSideMid: new Mario.Sprite('sprites/tiles.png', [48, 128], [16,32], 0),
    pipeLeft: new Mario.Sprite('sprites/tiles.png', [32, 128], [16,32], 0),
    pipeTop: new Mario.Sprite('sprites/tiles.png', [0, 128], [32,16], 0),

    LPipeSprites:[
      new Mario.Sprite('sprites/tiles.png', [32,128],[16,16],0),
      new Mario.Sprite('sprites/tiles.png', [32,144],[16,16],0),
      new Mario.Sprite('sprites/tiles.png', [48,128],[16,16],0),
      new Mario.Sprite('sprites/tiles.png', [48,144],[16,16],0),
      new Mario.Sprite('sprites/tiles.png', [64,128],[16,16],0),
      new Mario.Sprite('sprites/tiles.png', [64,144],[16,16],0),
    ]

  });

  player.pos[0] = level.playerPos[0];
  player.pos[1] = level.playerPos[1];
  vX = 0;
  level.putFloor(0,16);
  level.putWall(0,13,11);
  walls = [4,5,6,7,8,9,10];
  walls.forEach(function(loc){
    level.putWall(loc,13,3);
    level.putWall(loc,3,1);
  });

  coins = [[5,5], [6,5], [7,5], [8,5], [9,5],
           [4,7], [5,7], [6,7], [7,7], [8,7], [9,7], [10,7],
           [4,9], [5,9], [6,9], [7,9], [8,9], [9,9], [10,9]];
  coins.forEach(function(pos){
    level.putCoin(pos[0],pos[1]);
  });

  //level.putLeftPipe(13,11);
  level.putRealPipe(13,11,3,"RIGHT", function() {
    Mario.oneone.call();
    player.pos = [2616, 177]
    player.pipe("UP", function() {;});
  });

  level.putPipe(15,13,13);

  music.overworld.pause();
  music.underground.currentTime = 0;
  music.underground.play();
};
