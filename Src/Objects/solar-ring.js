
solarRings = [];

class SolarRingObject {
  constructor(star, time) {
    this.star = star;
    this.startTime = time;
    this.time = time;
    this.t = 0;
    this.destroyed = false;
  }

  destroy() {
    this.destroyed = true;
  }

  update(dt) {
    this.time -= dt;
    
    if (this.time <= 10) {
      this.t = this.time / 10;
    } else if (this.time <= this.startTime - 10) {
      this.t = 1;
    } else {
      this.t = (this.startTime - this.time) / 10;
    }

    if (this.t <= 0) {
      this.destroy();
    }
  }

  getDamage() {
    return 25;
  }

  collides(obj) {
    const GAP = 100 + (1 - this.t ** 0.2) * 4000;
    const STAR_R = this.star.r;
    const INNER_RADIUS = STAR_R + GAP;
    const OUTER_RADIUS = INNER_RADIUS * (4100 / 2800);
    const OBJ_DIST = Math.hypot(obj.x - this.star.x, obj.y - this.star.y);
    return OBJ_DIST < OUTER_RADIUS && OBJ_DIST > INNER_RADIUS;
  }

  draw(ctx) {
    
    let r = this.star.r;
    const { x, y, rot } = this.star;
    
    ctx.push();
    ctx.imageMode(CENTER);
    ctx.translate(x, y);
    ctx.rotate(rot);
    
    if (this.t > 0) {
      const HALF_WIDTH = 2400;
      const EDGE_TO_INNER = 1100; // Pixels from edge of the image to the inner ring
      const SCL = HALF_WIDTH / (HALF_WIDTH - EDGE_TO_INNER);
      const GAP = 100 + (1 - this.t ** 0.2) * 4000;

      ctx.push();
      ctx.rotate(millis() / 4000);
      ctx.image(solarRingSprite, 0, 0, (r + GAP) * SCL * 2, (r + GAP) * SCL * 2);
      ctx.rotate(millis() / 8000);
      ctx.image(solarRingSprite, 0, 0, (r + GAP) * SCL * 2, (r + GAP) * SCL * 2);

      // const STAR_R = this.star.r;
      // const INNER_RADIUS = STAR_R + GAP;
      // const OUTER_RADIUS = INNER_RADIUS * (4100 / 2800);

      // ctx.noFill();
      // ctx.stroke(255, 0, 0);
      // ctx.strokeWeight(4);
      // ctx.ellipse(0, 0, INNER_RADIUS * 2);
      // ctx.ellipse(0, 0, OUTER_RADIUS * 2);

      ctx.pop();
    }
    
    ctx.pop();
  }
}

function spawnSolarRing(star, time) {
  let obj = new SolarRingObject(star, time);
  solarRings.push(obj);
  return obj;
}

function updateSolarRings(dt) {
  for (let ring of solarRings) {
    if (ring.destroyed) {
      solarRings.splice(solarRings.indexOf(ring), 1);
      continue;
    }

    ring.update(dt);
  }
}

function drawSolarRings(ctx) {
  for (let ring of solarRings) {
    ring.draw(ctx);
  }
}
