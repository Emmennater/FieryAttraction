
class GravityObject extends GameObject {
  constructor(x, y, m) {
    super();
    this.x = x;
    this.y = y;
    this.m = m;
    this.vx = 0;
    this.vy = 0;
  }
  
  attract(dt, strength = 1, edgeForce = 1) {
    const gForce = system.getGravityForce(this);
    const eForce = system.getEdgeForce(this);

    this.vx += gForce.x / this.m * strength * dt;
    this.vy += gForce.y / this.m * strength * dt;
    this.vx += eForce.x / this.m * edgeForce * dt;
    this.vy += eForce.y / this.m * edgeForce * dt;
  }
}

