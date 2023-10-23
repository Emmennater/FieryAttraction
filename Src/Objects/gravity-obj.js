
class GravityObject extends GameObject {
  constructor(x, y, m) {
    super();
    this.x = x;
    this.y = y;
    this.m = m;
    this.vx = 0;
    this.vy = 0;
  }
  
  attract(dt, strength = 1, edgeStrength = 1) {
    // Distance to sun
    let dx = sun.x - this.x;
    let dy = sun.y - this.y;
    let d = sqrt(dx ** 2 + dy ** 2);
    let vx = dx / d;
    let vy = dy / d;
    let gravity = this.m * sun.m / (d ** 2) / this.m;
    let edgeForce = Math.max(d - sun.r * 1.5, 0) * 0.05 * edgeStrength;
    let netForce = Math.min(gravity + edgeForce, 200);

    // Apply forces
    let ForceX = vx * netForce;
    let ForceY = vy * netForce;
    this.vx += ForceX * dt * strength;
    this.vy += ForceY * dt * strength;
  }
}

