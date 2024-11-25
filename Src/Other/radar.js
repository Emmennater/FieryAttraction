
class Radar {
  constructor() {
    const MINSCL = Math.min(width, height);
    this.r = MINSCL * 0.15;
    this.x = width - this.r - 10;
    this.y = this.r + 50;
  }

  updateView() {

  }

  generateRadar

  update(dt) {
    this.updateView();
  }

  draw() {

    // Background
    stroke(0, 255, 0);
    strokeWeight(2);
    fill(0, 40, 0);
    arc(this.x, this.y, this.r * 2, this.r * 2, -PI * 3 / 4, -PI * 1 / 4);
    fill(0, 255, 0);
    noStroke();
    arc(this.x, this.y, this.r * 0.1, this.r * 0.1, -PI * 3 / 4, -PI * 1 / 4);

    // Border
    noFill();
    stroke(0, 255, 0);
    for (let i = 0; i < 2; ++i) {
      let rot = -PI * 3 / 4 + i * PI * 2 / 4;
      line(
        this.x + Math.cos(rot) * this.r,
        this.y + Math.sin(rot) * this.r,
        this.x,
        this.y
      );
    }
    strokeWeight(1);
    for (let i = 1; i < 4; ++i) {
      let rot = -PI * 3 / 4 + i * PI * 1 / 8;
      line(
        this.x + Math.cos(rot) * this.r,
        this.y + Math.sin(rot) * this.r,
        this.x,
        this.y
      );
    }

    // Concentric arcs
    noFill();
    stroke(0, 255, 0);
    const rings = 5;
    for (let i = 1; i < rings; ++i) {
      let d = (this.r - (this.r / rings) * i) * 2;
      arc(this.x, this.y, d, d, -PI * 3 / 4, -PI * 1 / 4);
    }
  }
}
