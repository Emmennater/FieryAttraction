
class Sun {
  constructor(x = 0, y = 0, r = 400) {
    this.x = x;
    this.y = y;
    this.rot = 0;
    this.density = 1.4;
    this.r = r;
    this.m = PI * this.r ** 2 * this.density; // 4500;
    this.depth = 1;
    this.tint = { r: 255, g: 255, b: 255, a: 255 };
  }
  
  isTintNormal() {
    return this.tint.r == 255 && this.tint.g == 255 && this.tint.b == 255 && this.tint.a == 255;
  }

  update(dt) {
    
  }

  draw(ctx) {
    ctx.push();
    ctx.translate(width/2, height/2);
    ctx.scale(panzoom.zoom);
    ctx.rotate(panzoom.rot);
    ctx.translate(panzoom.xoff, panzoom.yoff);

    let r = this.r * 2.5;
    
    ctx.fill(255, 140, 0);
    ctx.noStroke();
    ctx.imageMode(CENTER);
    ctx.push();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

    if (!this.isTintNormal()) {
      ctx.tint(this.tint.r, this.tint.g, this.tint.b, this.tint.a);
      ctx.image(sunSprite, 0, 0, r, r);
      ctx.noTint();
    } else ctx.image(sunSprite, 0, 0, r, r);
    
    ctx.pop();
    ctx.pop();
    
    // ellipse(this.x, this.y, this.r * 2, this.r * 2);
    // fill(255, 120, 0);
    // ellipse(this.x, this.y, this.r * 1.9, this.r * 1.9);
    // fill(255, 80, 0);
    // ellipse(this.x, this.y, this.r * 1.8, this.r * 1.8);
  }

  getGravityForce(gravityObject) {
    // Distance to sun
    let dx = this.x - gravityObject.x;
    let dy = this.y - gravityObject.y;
    let d = sqrt(dx ** 2 + dy ** 2);
    let vx = dx / d;
    let vy = dy / d;
    let gravity = gravityObject.m * this.m / (d ** 2);
    let netForce = Math.min(gravity, 200 * gravityObject.m);

    // Apply forces
    let ForceX = vx * netForce;
    let ForceY = vy * netForce;
    return { x: ForceX, y: ForceY };
  }

  getRandomPosition(minRadius, maxRadius) {
    let distFromCenter = this.r + randInt(minRadius, maxRadius);
    let angle = Math.random() * TWO_PI;
    let x = cos(angle) * distFromCenter + this.x;
    let y = sin(angle) * distFromCenter + this.y;
    return { x, y };
  }

  getRandomTangentalAngle(x, y, angleFromSun = HALF_PI) {
    let dx = x - this.x;
    let dy = y - this.y;
    let a = atan2(dy, dx);
    a += randSign() * (PI - angleFromSun);
    return a;
  }
}

class StarSystem {
  constructor() {
    this.stars = [
      new Sun(0, 0, 300)
    ];

    this.time = 0;
  }

  getGravityForce(gravityObject) {
    let Force = { x: 0, y: 0 };
    
    for (let star of this.stars) {
      let force = star.getGravityForce(gravityObject);
      Force.x += force.x;
      Force.y += force.y;
    }

    return Force;
  }

  getEdgeForce(gravityObject) {
    const { star, dist } = this.getClosestStar(gravityObject.x, gravityObject.y);

    const RANGE = 1.5; // 1.5
    let edgeForce = Math.max(dist - star.r * RANGE, 0) * 0.05 * gravityObject.m;
    let angle = atan2(star.y - gravityObject.y, star.x - gravityObject.x);
    let fx = cos(angle) * edgeForce;
    let fy = sin(angle) * edgeForce;

    return { x: fx, y: fy };
  }

  getRandomStar() {
    return this.stars[Math.floor(Math.random() * this.stars.length)];
  }

  getRandomSpawn(minRadius, maxRadius, minPlayerDist = 200, angleFromSun = HALF_PI) {
    let star = this.getRandomStar();
    let pos = star.getRandomPosition(minRadius, maxRadius);

    // Check if position is valid
    const MAX_ATTEMPTS = 1000;
    let attempts = 0;
    while (true) {
      let distToShip = Math.hypot(ship.x - pos.x, ship.y - pos.y);
      let closestStar = this.getClosestStar(pos.x, pos.y);
      let distToStar = closestStar.dist - closestStar.star.r;
      if (distToShip > minPlayerDist && distToStar >= minRadius) break;
      pos = star.getRandomPosition(minRadius, maxRadius);
      if (attempts++ > MAX_ATTEMPTS) break;
    }


    let angle = star.getRandomTangentalAngle(pos.x, pos.y, angleFromSun);

    return { pos, angle };
  }

  getClosestStar(x, y) {
    let closestStar = this.stars[0];
    let closestDist = Infinity;
    
    for (let star of this.stars) {
      let d = Math.hypot(x - star.x, y - star.y) - star.r;
      if (d < closestDist) {
        closestStar = star;
        closestDist = d;
      }
    }

    return { star: closestStar, dist: closestDist + closestStar.r };
  }

  getCenter() {
    return { x: 0, y: 0 };
  }

  reset() {
    this.time = 0;
  }

  update(dt) {
    for (let star of this.stars) {
      star.update(dt);
    }

    this.time += dt;
  }

  draw(ctx) {
    for (let star of this.stars) {
      star.draw(ctx);
    }
  }
}

class TwoBodyStarSystem extends StarSystem {
  constructor() {
    super();

    this.stars = [
      new Sun(0, +500, 300),
      new Sun(0, -500, 300),
    ];

    this.time = 0;
  }

  reset() {
    this.time = 0;
  }

  update(dt) {
    // Rotate stars
    const ANGLE = -this.time * 0.03 + HALF_PI;
    const CENTER_X = 0;
    const CENTER_Y = 0;
    const STAR0 = this.stars[0];
    const STAR1 = this.stars[1];
    const D = 500;

    STAR0.x = cos(ANGLE) * D + CENTER_X;
    STAR0.y = sin(ANGLE) * D + CENTER_Y;
    STAR1.x = cos(ANGLE + PI) * D + CENTER_X;
    STAR1.y = sin(ANGLE + PI) * D + CENTER_Y;

    super.update(dt);
  }
}
