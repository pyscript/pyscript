(function() {
  if (typeof Mario === 'undefined')
  window.Mario = {};

  //props do even less than entities, so they don't need to inherit really
  var Prop = Mario.Prop = function(pos, sprite) {
    this.pos = pos;
    this.sprite = sprite;
  }

  //but we will be using the same Render, more or less.
  Prop.prototype.render = function(ctx, vX, vY) {
    this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
  }
})();
