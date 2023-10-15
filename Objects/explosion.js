
explosions = [];

class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 20;
    this.frame = 0;
    this.destroy = false;
    this.gif = explosionSprite;
    this.totalFrames = explosionSprite.numFrames();
    explosionSprite.setFrame(0);
  }
  
  move(dt) {
    this.frame += dt * 30;
    if (this.frame >= this.totalFrames)
      this.destroy = true;
  }
  
  draw() {
    const aspect = explosionSprite.height / explosionSprite.width;
    imageMode(CENTER);
    image(this.gif, this.x, this.y, this.r, this.r * aspect);
  }
}

function spawnExplosion(x, y) {
  const explosion = new Explosion(x, y);
  explosions.push(explosion);
}

function moveExplosions(dt) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const explosion = explosions[i];
    if (explosion.destroy) {
      explosions.splice(i, 1);
      continue;
    }
    explosion.move(dt);
  }
}

function drawExplosions(ctx) {
  for (let explosion of explosions) {
    explosion.draw(ctx);
  }
}
