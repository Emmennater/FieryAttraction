
class GravityObject {
  constructor(x, y, m) {
    this.x = x;
    this.y = y;
    this.m = m;
    this.vx = 0;
    this.vy = 0;
  }
  
  attract(dt, strength = 1) {
    // Distance to sun
    let dx = sun.x - this.x;
    let dy = sun.y - this.y;
    let d = sqrt(dx ** 2 + dy ** 2);
    let vx = dx / d;
    let vy = dy / d;
    let g = this.m * sun.m / (d ** 2) / this.m;
    let grav = (g + Math.max(d - sun.r * 1.5, 0) * 0.05);
    
    let ForceX = vx * grav;
    let ForceY = vy * grav;
    this.vx += ForceX * dt * strength;
    this.vy += ForceY * dt * strength;
  }
}

