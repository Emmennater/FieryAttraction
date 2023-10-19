
explosions = [];

class Explosion extends GameObject {
  constructor(x, y, tracking = null) {
    super();
    this.x = x;
    this.y = y;
    this.r = 20;
    this.tracking = tracking;
    this.frame = 0;
    this.destroy = false;
    this.gif = explosionSprite;
    this.totalFrames = this.gif.numFrames();
    this.gif.setFrame(0);
  }
  
  move(dt) {
    // this.frame += dt * 30;
    // if (this.frame >= this.totalFrames)
    //   this.destroy = true;
    if (this.frame >= this.gif.numFrames() / 3)
      this.destroy = true;
    if (this.tracking != null) {
      this.x = this.tracking.x;
      this.y = this.tracking.y;
    }
  }
  
  draw(ctx) {
    const aspect = explosionSprite.height / explosionSprite.width;
    if (this.frame < this.gif.numFrames() / 3)
      this.gif.setFrame(floor(this.frame));
    this.frame += 0.1;
    ctx.imageMode(CENTER);
    ctx.image(this.gif, this.x, this.y, this.r, this.r * aspect);
  }
}

function spawnExplosion(x, y, tracking = null, volume = 0.2) {
  const explosion = new Explosion(x, y, tracking);
  explosions.push(explosion);
  htmlSounds.playSound(explodeSound, volume, true);
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
