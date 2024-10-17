solarFlairs = [];

class Flair extends GameObject {
  constructor(star, rot, rotVel, time) {
    super();
    this.star = star;
    this.rot = rot ?? random(TWO_PI);
    this.rotVel = rotVel ?? -0.15;
    this.t = time;
    this.stretch = 1;
    const w = 20;
    const h = 1000;
    this.makeCollisionMesh([-w, -h], [-w, h], [w, h], [w, -h]);
    this.collisionMesh.setPosition(star.x, star.y);
    this.collisionMesh.setScale(1);
  }

  getDamage() {
    return 18;
  }

  getAlpha() {
    return this.t * 255;
  }

  update(dt) {
    this.rot += this.rotVel * dt;
    const stretch = 60 + sin(this.t * 4) * 20;
    this.stretch = lerp(this.stretch, stretch, dt);
    this.t -= dt;

    this.collisionMesh.setPosition(this.star.x, this.star.y);
    this.collisionMesh.setRotation(this.rot);
    this.collisionMesh.updateTransform();

    if (this.t < 0) {
      this.destroy();
    }
  }

  draw(ctx) {
    const { x, y } = this.star;
    const w = 200 + sin(this.t * 4) * 10;
    const h = 50 * this.stretch;

    ctx.push();
    ctx.translate(x, y);
    ctx.tint(255, 255, 255, this.getAlpha());
    ctx.rotate(this.rot);
    ctx.image(solarFlairSprite, 0, 0, w, h);
    ctx.pop();
   
    // this.drawMesh(ctx);
  }
}

function spawnSolarFlair(star, rot, rotVel = -0.15, time = 30) {
  const x = star.x;
  const y = star.y;
  const flair = new Flair(star, rot, rotVel, time);

  solarFlairs.push(flair);

  return flair;
}

function updateSolarFlairs(dt) {
  for (let i = solarFlairs.length - 1; i >= 0; i--) {
    solarFlairs[i].update(dt);

    if (solarFlairs[i].destroyed) {
      solarFlairs.splice(i, 1);
    }
  }
}

function drawSolarFlairs(ctx) {
  for (let i = 0; i < solarFlairs.length; i++) {
    solarFlairs[i].draw(ctx);
  }
}
