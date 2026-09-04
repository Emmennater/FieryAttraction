
class Trail extends GameObject {
  constructor() {
    super();
    this.pts = [];
    this.time = 0;
    this.delay = 5;
    this.vx = 0;
    this.vy = 0;
  }
  
  updateTrail(x, y, vx = 0, vy = 0, delay = 5, radius = 5, spread = 0.05) {
    this.vx = lerp(this.vx, vx, 0.1) + (Math.random() - 0.5) * spread;
    this.vy = lerp(this.vy, vy, 0.1) + (Math.random() - 0.5) * spread;
    if (++this.time >= delay) {
      this.time = 0;
      let a = Math.random() * 50 + 50;
      let col = Math.random() * 255;
      let r = Math.random() * radius * 0.75 + radius / 4;
      x += Math.random() * 2 - 1;
      y += Math.random() * 2 - 1;
      this.pts.push({ x, y, r, a, vx: this.vx, vy: this.vy, col });
    }
  }
  
  draw(ctx, opacity) {
    ctx.noStroke();
    
    // noFill();
    // stroke(255);
    // beginShape();
    for (let i = this.pts.length - 1; i >= 0; --i) {
      let pt = this.pts[i];
      // vertex(pt.x, pt.y);
      pt.x += pt.vx;
      pt.y += pt.vy;
      ctx.fill(pt.col, pt.a * opacity);
      ctx.circle(pt.x, pt.y, pt.r);
      pt.a -= 0.5;
      pt.r *= 0.99;
      if (pt.a <= 0) this.pts.splice(i, 1);
    }
    // endShape();
    
  }
}

class Ship extends GravityObject {
  constructor(x, y, s = 12) {
    super(x, y, 50000);
    this.trail = new Trail();
    this.vx = 0;
    this.vy = -35;
    this.a = 0;
    this.s = s;
    this.drag = 0.988;
    this.speed = 8;
    this.turnSpeed = 2.4;
    this.control = { steeringAngle: 0, steerVel: 0, boost: false, fire:false };
    this.colliding = false;
    this.damageDelay = 20 / 60;
    this.damageTime = 0;
    this.sprite = rocketSprite;
    this.alpha = 255;
    this.speedMult = 1;
    this.maxSpeed = 100;
    this.damage = 1;
    this.maneuverabilityMult = 1;
    this.maneuverability = 1;

    // Boost attributes
    this.oldExaustCol = {
      min: { r: 255, g: 100, b: 0, a: 100 },
      add: { r: 0, g: 100, b: 0, a: 0 }
    };
    this.exaustCol = this.oldExaustCol;
    this.exaustDelay = 4;

    // Bullet attributes
    this.bTime = 0;
    this.bDelay = 1;
    this.bCol = { r: 60, g: 255, b: 80 };
    this.bSpeed = 120;
    this.bulletType = DEFAULT_BULLET.Type;
    this.bulletLevel = DEFAULT_BULLET.level;
    this.multishot = 1;
    this.lastBullet = null;

    // Collision mesh
    const spriteWidth = this.sprite.width;
    const spriteHeight = this.sprite.height;
    this.makeCollisionMesh([368, 0], [273, 395], [0, 600], [0, 695], [144, 828], [595, 828], [737, 695], [737, 600], [465, 395]);
    this.collisionMesh.setOrigin(spriteWidth/2, spriteHeight/2);
    this.collisionMesh.setScale(this.s * 1.4 / spriteWidth);
    this.collisionMesh.updateTransform();
  }

  steer(dt, delta) {
    if (Math.sign(this.control.steerVel) != Math.sign(delta))
      delta *= 2;
    this.control.steerVel += delta * dt;
  }

  steerTargetAngle(dt, targetAngle) {
    let steerSpeed = this.getSteeringAccel();

    let dir = optimalAccel(
        this.control.steeringAngle,
        targetAngle,
        this.control.steerVel,
        steerSpeed
    );

    this.steer(dt, dir * steerSpeed);
  }

  boost(dt) {
    this.control.boost = true;

    const shipAngle = this.a + this.control.steeringAngle;
    let currentAngle = Math.atan2(this.vy, this.vx);
    let currentSpeed = Math.hypot(this.vx, this.vy);
    let nvx = this.vx / currentSpeed;
    let nvy = this.vy / currentSpeed;

    // Divide by zero check
    if (currentSpeed == 0) {
      nvx = 0;
      nvy = 0;
    }

    // If the ship is moving slow in the direction of the player, increase speed
    // (increased maneuverability)
    const maneuverability = this.maneuverability * this.maneuverabilityMult;
    const projectedVelocity = Math.max(0, nvx * cos(shipAngle) + nvy * sin(shipAngle));
    let speedIncrease = Math.max(1, 3 / (projectedVelocity + 1 / maneuverability));

    let ax = cos(shipAngle) * this.speed * this.speedMult * speedIncrease;
    let ay = sin(shipAngle) * this.speed * this.speedMult * speedIncrease;

    this.vx += ax * dt;
    this.vy += ay * dt;

    // currentAngle = Math.atan2(this.vy, this.vx);
    // currentSpeed = Math.hypot(this.vx, this.vy);

    // Turn the velocity vector by a factor of the maneuverability
    // let turnFactor = (1 - 1 / (maneuverability + 1)) * 0.5;
    // let angleDiff = smallestAngleDifference(currentAngle, shipAngle);
    // let newAngle = currentAngle + angleDiff * turnFactor * dt;
    
    // this.vx = cos(newAngle) * currentSpeed;
    // this.vy = sin(newAngle) * currentSpeed;
    // this.a += angleDiff * turnFactor * dt;
  }

  getSteeringAccel() {
    let turnSpeed = this.fuel > 0 ? this.turnSpeed : this.turnSpeed /  6;
    return turnSpeed;
  }
  
  spawnBullet(dat) {
    return spawnBullet(dat);
  }

  fireBullet(stray = 0) {
    const shipAngle = this.a + this.control.steeringAngle;
    const bulletStray = (Math.random() - 0.5) * stray;
    const bulletAngle = shipAngle + bulletStray;

    const multishot = this.multishot;
    const spreadAngle = PI * 0.1;
    const angleGap = spreadAngle / multishot;
    let bullet = null;

    const s = this.s * 0.75;
    const leftWingX = this.x - cos(bulletAngle - HALF_PI) * s + cos(bulletAngle) * s * 0.5;
    const leftWingY = this.y - sin(bulletAngle - HALF_PI) * s + sin(bulletAngle) * s * 0.5;
    const rightWingX = this.x - cos(bulletAngle + HALF_PI) * s + cos(bulletAngle) * s * 0.5;
    const rightWingY = this.y - sin(bulletAngle + HALF_PI) * s + sin(bulletAngle) * s * 0.5;

    for (let i = 0; i < multishot; i++) {
      let a = bulletAngle - spreadAngle / 2;
      a += angleGap * (i + 0.5);

      let x, y;

      if (Math.abs(a - bulletAngle) < 0.01) {
        x = this.x + cos(a) * this.s;
        y = this.y + sin(a) * this.s;
      } else {
        const t = (a - bulletAngle + spreadAngle / 2) / spreadAngle;
        x = lerp(rightWingX, leftWingX, t);
        y = lerp(rightWingY, leftWingY, t);
      }

      let vx = this.vx + cos(a) * this.bSpeed;
      let vy = this.vy + sin(a) * this.bSpeed;
      
      let bulletStyleCol = this.bCol;

      bullet = this.spawnBullet({
        x, y, vx, vy,
        owner: this,
        Type: this.bulletType,
        level: this.bulletLevel,
        damageMult: this.damage,
        bCol: bulletStyleCol
      });
    }

    this.lastBullet = bullet;
    
    return bullet;
  }

  updateMesh() {
    const shipAngle = this.a + this.control.steeringAngle - PI;
    const offx = -cos(shipAngle) * this.s / 4;
    const offy = -sin(shipAngle) * this.s / 4;
    this.collisionMesh.setPosition(this.x + offx, this.y + offy);
    this.collisionMesh.setRotation(shipAngle - HALF_PI);
    this.collisionMesh.updateTransform();
  }

  takeDamageFromStars(dt) {
    const closestStar = system.getClosestStar(this.x, this.y);
    const star = closestStar.star;
    const d = closestStar.dist;

    let damage = Math.max(star.r - d, 0) / 4;
    damage = round(damage * 10) / 10;

    this.damageTime -= dt;
    
    if (this.damageTime <= 0 && damage > 0) {
      this.damageTime = this.damageDelay;
      this.takeDamage(damage);
    }
    
    return damage;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.updateMesh();
  }

  elasticCollision(collidedObj) {
    const playerInitVx = this.vx;
    const playerInitVy = this.vy;
    const objectInitVel = collidedObj.getVelocity();
    const objectInitVx = objectInitVel.x;
    const objectInitVy = objectInitVel.y;

    const objectA = {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      m: this.m
    };

    const objectB = {
      x: collidedObj.x,
      y: collidedObj.y,
      vx: objectInitVx,
      vy: objectInitVy,
      m: collidedObj.m
    };

    // Force fields boost mass
    const forceFieldA = this.hasActiveEffect(ForceField);
    const forceFieldB = collidedObj.hasActiveEffect(ForceField);
    if (forceFieldA && !forceFieldB) objectB.m = 1;
    if (!forceFieldA && forceFieldB) objectA.m = 1;

    elasticCollision(objectA, objectB);
    
    // Update velocities
    this.vx = objectA.vx;
    this.vy = objectA.vy;
    collidedObj.vx = objectB.vx;
    collidedObj.vy = objectB.vy;

    // Calculate the change in velocity (post-collision minus pre-collision)
    const playerDeltaVx = playerInitVx - objectA.vx;
    const playerDeltaVy = playerInitVy - objectA.vy;
    const objectDeltaVx = objectInitVx - objectB.vx;
    const objectDeltaVy = objectInitVy - objectB.vy;

    // Compute damage
    const playerDeltaVel = Math.hypot(playerDeltaVx, playerDeltaVy);
    const objectDeltaVel = Math.hypot(objectDeltaVx, objectDeltaVy);

    const playerDamageTaken = round(playerDeltaVel) * 0.1;
    const objectDamageTaken = round(objectDeltaVel * 0.5) * 0.1;

    // Damage
    if (!forceFieldA && !forceFieldB) {
      this.takeDamage(playerDamageTaken);
      collidedObj.takeDamage(objectDamageTaken, { owner: this });
    }

    return { playerDamageTaken, objectDamageTaken };
  }
  
  move(dt) {
    this.attract(dt, 1);
    
    // Constrain velocity
    let maxSpeed = this.control.boost ? this.maxSpeed : this.maxSpeed * 0.4;
    let sp = Math.sqrt(this.vx ** 2 + this.vy ** 2);
    let ns = Math.min(sp, maxSpeed) / sp;
    this.vx = lerp(this.vx, this.vx * ns, 1.5 * dt);
    this.vy = lerp(this.vy, this.vy * ns, 1.5 * dt);

    // Movement
    this.control.steeringAngle += this.control.steerVel * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 1 - (1 - this.drag) * dt;
    this.vy *= 1 - (1 - this.drag) * dt;
    this.updateMesh();

    // Reduce bullet time
    const outOfAmmoFactor = this.ammo <= 0 ? 0.5 : 1;
    this.bTime = Math.max(this.bTime - outOfAmmoFactor * dt, 0);
  }

  drawBoost(ctx, opacity) {
    let shipTurnRate = (this.control.boost) ? 0.01 : 0.02;
    let oldAngle = fixAngle(this.a);
    let newAngle = fixAngle(atan2(this.vy, this.vx));
    let diff = smallestAngleDifference(oldAngle, newAngle);
    this.a += diff * shipTurnRate;
    this.a = fixAngle(this.a);  

    let shipAngle = this.a + this.control.steeringAngle - PI;
    let exaustDist = this.s * 0.6;
    let exaustVx = 0, exaustVy = 0;
    let exaustDelay = this.exaustDelay;
    let exaustRadius = this.s * 0.5;
    let exaustSpread = 0.1;
    
    if (this.control.boost) {
      exaustVx = cos(shipAngle) * this.s * 0.035;
      exaustVy = sin(shipAngle) * this.s * 0.035;
      exaustDelay /= 2;
      exaustRadius = 0.6 * this.s;
      exaustSpread *= 2;
    }
    
    // Smoke trail
    let trailX = this.x + cos(shipAngle) * exaustDist;
    let trailY = this.y + sin(shipAngle) * exaustDist;
    this.trail.updateTrail(trailX, trailY, exaustVx, exaustVy, exaustDelay, exaustRadius, exaustSpread);
    
    if (this.control.boost) {
      ctx.strokeWeight(this.s * 0.1);
      for (let i = 0; i < 10; ++i) {
        ctx.stroke(
          this.exaustCol.min.r + this.exaustCol.add.r * Math.random(),
          this.exaustCol.min.g + this.exaustCol.add.g * Math.random(),
          this.exaustCol.min.b + this.exaustCol.add.b * Math.random(),
          (this.exaustCol.min.a + this.exaustCol.add.a * Math.random()) * opacity
        );
        let aoff = noise(i + frameCount) * 0.4 - 0.2;
        let len = this.s * (Math.random() * 1 + 1);
        ctx.line(
          this.x + cos(shipAngle + aoff) * this.s * 0.5,
          this.y + sin(shipAngle + aoff) * this.s * 0.5,
          this.x + cos(shipAngle + aoff) * len,
          this.y + sin(shipAngle + aoff) * len
        );
      }
    }
  }
  
  draw(ctx, opacity = 1) {
    this.drawBoost(ctx, opacity);
    this.trail.draw(ctx, opacity);
    
    const SIZE = 1.2;
    const aspect = rocketSprite.height / rocketSprite.width;
    const SHIELD_SCALE = 2.5;

    if (this.health <= 0)
      this.alpha = Math.max(this.alpha - 8, 0);
    else
      this.alpha = 255;

    const ALPHA = this.alpha * opacity;

    ctx.push();
    ctx.translate(this.x, this.y);
    ctx.rotate(HALF_PI + this.a + this.control.steeringAngle);
    ctx.translate(0, -this.s / 4);
    ctx.imageMode(CENTER);
    
    if (ALPHA != 255)
      ctx.tint(255, ALPHA);
    
    ctx.image(this.sprite, 0, 0, this.s * SIZE, this.s * aspect * SIZE);
    
    const forceFieldEffect = this.getActiveEffect(ForceField);
    if (forceFieldEffect != null) {
      const ALPHA = forceFieldEffect.getAlpha();
      if (ALPHA != 255) ctx.tint(255, ALPHA);
      ctx.image(shieldSprite, 0, 0, this.s * SIZE * SHIELD_SCALE, this.s * aspect * SIZE * SHIELD_SCALE);
      if (ALPHA != 255) ctx.noTint();
    }
      
    if (this.hasActiveEffect())
      ctx.image(jetEnchantmentSprite, 0, 0, this.s * SIZE, this.s * aspect * SIZE);

    if (ALPHA != 255)
      ctx.noTint();
    
    ctx.pop();

    // Draw mesh
    // this.drawMesh(ctx);
  }
}

function smallestAngleDifference(a1, a2) {
  let diff = a2 - a1;
  diff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
  
  // Additional check for angles around 0
  if (diff < -Math.PI) {
    diff += TWO_PI;
  }
  
  return diff;
}
