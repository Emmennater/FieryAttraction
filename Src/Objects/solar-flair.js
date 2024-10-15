
class Flair extends GameObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.rot = random(TWO_PI);
    this.rotSpeed = -0.1;
    this.t = 30;
    this.stretch = 1;
  }

  getAlpha() {
    return this.t * 255;
  }

  update(dt) {
    this.t -= dt;
    this.rot += this.rotSpeed * dt;
    const stretch = 60 + sin(this.ttl * 4) * 20;
    this.stretch = lerp(this.stretch, stretch, dt);
  }

  draw(ctx) {
    const w = 100 + sin(this.ttl * 4) * 10;
    const h = 40 * this.stretch;

    ctx.push();
    ctx.translate(this.x, this.y);
    ctx.tint(255, 255, 255, this.getAlpha());
    ctx.rotate(this.rot);
    ctx.image(solarFlairSprite, 0, 0, w, h);
    ctx.pop();
  }
}