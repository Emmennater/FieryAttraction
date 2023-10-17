
class Sun {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.r = 400;
    this.m = 4500;
    this.depth = 1.5;
    this.graphicx = 0;
    this.graphicy = 0;
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
    ctx.image(sunSprite, x, y, r, r);
    
    ctx.pop();
    
    // ellipse(this.x, this.y, this.r * 2, this.r * 2);
    // fill(255, 120, 0);
    // ellipse(this.x, this.y, this.r * 1.9, this.r * 1.9);
    // fill(255, 80, 0);
    // ellipse(this.x, this.y, this.r * 1.8, this.r * 1.8);
  }
}

