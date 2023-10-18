
class Sun {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.density = 1.4;
    this.r = 400;
    this.m = PI * this.r ** 2 * this.density; // 4500;
    this.depth = 1.5;
    this.graphicx = 0;
    this.graphicy = 0;
    this.tint = { r: 255, g: 255, b: 255, a: 255 };
    this.oldTint = { r: 255, g: 255, b: 255, a: 255 };
    this.targetTint = { r: 255, g: 255, b: 255, a: 255 };
    this.tintTime = 0;
    this.tintTimeEnd = 0;
  }
  
  isTintNormal() {
    return this.tint.r == 255 && this.tint.g == 255 && this.tint.b == 255 && this.tint.a == 255;
  }

  tintFade(r, g, b, a, t) {
    if (t == 0) {
      this.tint.r = r;
      this.tint.g = g;
      this.tint.b = b;
      this.tint.a = a;
      return;
    }

    this.tintTime = 0;
    this.tintTimeEnd = t;
    this.oldTint.r = this.tint.r;
    this.oldTint.g = this.tint.g;
    this.oldTint.b = this.tint.b;
    this.oldTint.a = this.tint.a;
    this.targetTint.r = r;
    this.targetTint.g = g;
    this.targetTint.b = b;
    this.targetTint.a = a;
  }

  tintReset(t = 0) {
    this.tintFade(255, 255, 255, 255, t);
    if (this.t == 0) {
      this.tintTime = 0;
      this.tintTimeEnd = 0;
    }
  }

  update(dt) {
    if (this.tintTime < this.tintTimeEnd) {
      this.tintTime += dt;
      if (this.tintTime >= this.tintTimeEnd)
        this.tintTime = this.tintTimeEnd;
      let t = this.tintTime / this.tintTimeEnd;
      this.tint.r = lerp(this.oldTint.r, this.targetTint.r, t);
      this.tint.g = lerp(this.oldTint.g, this.targetTint.g, t);
      this.tint.b = lerp(this.oldTint.b, this.targetTint.b, t);
      this.tint.a = lerp(this.oldTint.a, this.targetTint.a, t);
    }
  }

  draw(ctx) {
    ctx.push();
    ctx.translate(width/2, height/2);
    ctx.scale(panzoom.zoom);
    ctx.rotate(panzoom.rot);
    
    let r = this.r * 2.5 / this.depth;
    let x = (this.x + panzoom.xoff) / this.depth;
    let y = (this.y + panzoom.yoff) / this.depth;
    this.graphicx = x;
    this.graphicy = y;
    
    ctx.fill(255, 140, 0);
    ctx.noStroke();
    ctx.imageMode(CENTER);

    if (!this.isTintNormal()) {
      ctx.tint(this.tint.r, this.tint.g, this.tint.b, this.tint.a);
      ctx.image(sunSprite, x, y, r, r);
      ctx.noTint();
    } else ctx.image(sunSprite, x, y, r, r);
    
    ctx.pop();
    
    // ellipse(this.x, this.y, this.r * 2, this.r * 2);
    // fill(255, 120, 0);
    // ellipse(this.x, this.y, this.r * 1.9, this.r * 1.9);
    // fill(255, 80, 0);
    // ellipse(this.x, this.y, this.r * 1.8, this.r * 1.8);
  }
}

