
class Stars {
  constructor() {
    this.stars = [];
    this.generate();
    this.viewX = 0;
    this.viewY = 0;
    this.rot = 0;
  }
  
  generate() {
    let SZ = max(width, height) / 2;
    for (let i = 0; i < 200; ++i) {
      let a = Math.random() * TWO_PI;
      let d = Math.random() * SZ + sun.r;
      let x = cos(a) * d;
      let y = sin(a) * d;
      let r = Math.random() * 55 + 200;
      let g = Math.random() * 55 + 200;
      let b = Math.random() * 55 + 200;
      let depth = Math.random() * 5;
      let rot = Math.random() * 2 - 1;
      depth **= 2;
      depth += 1
      this.stars.push({ x, y, depth, r, g, b, rot });
    }
  }
  
  setViewPosition(x, y) {
    this.viewX = x;
    this.viewY = y;
  }
  
  draw(ctx, transform = true) {
    if (transform) {
      ctx.push();
      ctx.translate(width/2, height/2);
      ctx.scale(panzoom.zoom);
      ctx.rotate(panzoom.rot);
    }
    
    ctx.noStroke();
    ctx.imageMode(CENTER);
    // const sunr = (sun.r / sun.depth) ** 2;
    const sz = 16;
    for (let s of this.stars) {
      // Rotate star position
      let a = Math.atan2(s.y, s.x);
      let d = Math.hypot(s.x, s.y);
      a += this.rot;
      let newX = cos(a) * d;
      let newY = sin(a) * d;
      let x = (newX + panzoom.xoff) / s.depth;
      let y = (newY + panzoom.yoff) / s.depth;
      // s.depth > sun.depth
      // if ((sun.graphicx - x) ** 2 + (sun.graphicy - y) ** 2 < sunr2) continue;
      // if (s.depth > sun.depth && (sun.graphicx - x) ** 2 + (sun.graphicy - y) ** 2 < sunr) continue;
      
      if (starSprite) {
        ctx.push();
        ctx.translate(x, y);
        ctx.rotate(frameCount / 60 * s.rot);
        ctx.image(starSprite, 0, 0, sz / s.depth, sz / s.depth);
        ctx.pop();
      } else {
        ctx.fill(s.r, s.g, s.b);
        ctx.ellipse(x, y, 2 / s.depth);
      }
    }
    
    if (transform)
      ctx.pop();
  }
}

