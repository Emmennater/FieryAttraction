
class Stars {
  constructor() {
    this.stars = [];
    this.generate();
    this.rot = 0;
    this.backgroundEnabled = getItem("fiery-attraction-toggle-bg") ?? true;
    const backgroundCheckbox = document.getElementById("toggle-bg");
    backgroundCheckbox.checked = this.backgroundEnabled;
  }
  
  generate() {
    const CENTER = system.getCenter();
    const CX = CENTER.x;
    const CY = CENTER.y;
    for (let i = 0; i < 200; ++i) {
      let depth = (Math.random() * 100) ** 0.5 + 1;
      let radius = depth * 1000;
      let scl = 5;
      let a = Math.random() * TWO_PI;
      let d = Math.random() * radius;
      let x = cos(a) * d + CX;
      let y = sin(a) * d + CY;
      let r = 255;
      let g = 255;
      let b = 255;
      let rot = Math.random() * 2 - 1;
      this.stars.push({ x, y, depth, r, g, b, rot, scl });
    }
  }

  toggleBackground() {
    this.backgroundEnabled = !this.backgroundEnabled;
    storeItem("fiery-attraction-toggle-bg", this.backgroundEnabled);
  }

  draw(ctx) {
    if (this.backgroundEnabled) {
      this.drawBg(ctx);
    }

    ctx.push();
    ctx.translate(width/2, height/2);
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
      let x = (newX - ship.x) / s.depth;
      let y = (newY - ship.y) / s.depth;
      
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

  drawBg(ctx) {
    // The height of the image must be twice the length from the center of the screen to the corner
    const distToCorner = Math.hypot(width / 2, height / 2);
    const imageHeight = distToCorner * 2;
    const aspect = spacebg.height / spacebg.width;
    const imgW = imageHeight / aspect;
    const imgH = imageHeight;

    // Space background
    ctx.push();
    ctx.translate(width/2, height/2);
    ctx.rotate(panzoom.rot);
    ctx.imageMode(CENTER);
    // ctx.tint(50);
    ctx.image(spacebg, 0, 0, imgW, imgH);
    ctx.noTint();
    ctx.pop();
  }
}

