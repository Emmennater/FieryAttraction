
class UI {
  constructor() {

  }

  update(dt, gameState) {

  }

  draw(ctx, gameState) {
    // Game window
    const R = 255;
    const G = 255;
    const B = 255;
    const ALPHA = 255;

    let scale = max(width, height);
    let shakeMult = 0;
    let xoff = 0;
    let yoff = 0;

    CTX2.push();
    CTX2.translate(width/2, height/2);
    CTX2.scale(1 + shakeMult * (1.5 / scale));
    CTX2.translate(-width/2 + xoff, -height/2 + yoff);
    CTX2.tint(R, G, B, ALPHA);
    CTX2.imageMode(CORNER);
    CTX2.image(ctx, 0, 0, width, height);
    CTX2.pop();
    
    image(CTX2, 0, 0, width, height);
  }
}
