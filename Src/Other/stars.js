
class Stars {
  constructor() {
    this.stars = [];
    this.generate();
    this.rot = 0;
  }
  
  generate() {
    const CENTER = system.getCenter();
    const CX = CENTER.x;
    const CY = CENTER.y;
    for (let i = 0; i < 100; ++i) {
      let depth = Math.random() * 50000 + 10000;
      let radius = depth * 800;
      let a = Math.random() * TWO_PI;
      let d = Math.random() * radius;
      let x = cos(a) * d + CX;
      let y = sin(a) * d + CY;
      let r = Math.random() * 99 + (255 - 99);
      let g = Math.random() * 99 + (255 - 99);
      let b = Math.random() * 99 + (255 - 99);
      let rot = Math.random() * 2 - 1;
      let scl = 30000;
      this.stars.push({ x, y, depth, r, g, b, rot, scl });
    }
  }
  
  draw(ctx) {
    ctx.push();
    ctx.translate(width/2, height/2);
    // ctx.scale(panzoom.zoom);
    ctx.rotate(panzoom.rot);
    
    ctx.noStroke();
    ctx.imageMode(CENTER);
    
    for (let s of this.stars) {
      // Rotate star position
      let a = Math.atan2(s.y, s.x);
      let d = Math.hypot(s.x, s.y);
      a += this.rot;
      let newX = cos(a) * d;
      let newY = sin(a) * d;
      let x = (newX + panzoom.xoff) / s.depth;
      let y = (newY + panzoom.yoff) / s.depth;
      
      if (starSprite) {
        ctx.push();
        ctx.translate(x, y);
        ctx.rotate(frameCount / 60 * s.rot);
        ctx.image(starSprite, 0, 0, s.scl / s.depth, s.scl / s.depth);
        ctx.pop();
      } else {
        ctx.fill(s.r, s.g, s.b);
        ctx.ellipse(x, y, s.scl / s.depth);
      }
    }
    
    ctx.pop();
  }
}

