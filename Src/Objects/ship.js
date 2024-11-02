
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
  
  draw(ctx) {
    ctx.noStroke();
    
    // noFill();
    // stroke(255);
    // beginShape();
    for (let i = this.pts.length - 1; i >= 0; --i) {
      let pt = this.pts[i];
      // vertex(pt.x, pt.y);
      pt.x += pt.vx;
      pt.y += pt.vy;
      ctx.fill(pt.col, pt.a);
      ctx.circle(pt.x, pt.y, pt.r);
      pt.a -= 0.5;
      pt.r *= 0.99;
      if (pt.a <= 0) this.pts.splice(i, 1);
    }
    // endShape();
    
  }
}

class Ship extends GravityObject {
  constructor(x, y) {
    super(x, y, 50000);
    this.name = "ship";
    this.trail = new Trail();
    this.vx = 0;
    this.vy = -35;
    this.a = 0;
    this.s = 10;
    this.drag = 0.9998;
    this.speed = 8;
    this.turnSpeed = 2.4;
    this.control = { steeringAngle: 0, steerVel: 0, boost: false, fire:false };
    this.stats = { distToSun: 0, temp: 0, burning: false, wasBurning: false, bulletsShot: 0 };
    this.inputs = {};
    this.colliding = false;
    this.burning = false;
    this.damageDelay = 20 / 60;
    this.damageTime = 0;
    this.sprite = rocketSprite;
    this.alpha = 255;
    this.angle = 0;
    this.speedMult = 1;
    this.speedMultTime = 0;
    this.maxSpeed = 100;
    this.damage = 1;
    this.cameraMode = "normal";

    // Supplies
    this.fuel = 50;
    this.ammo = 200;
    this.health = 100;
    this.maxHealth = 100;

    // Boost attributes
    this.oldExaustCol = {
      min: { r: 255, g: 100, b: 0, a: 100 },
      add: { r: 0, g: 100, b: 0, a: 0 }
    };
    this.exaustCol = this.oldExaustCol;
    this.exaustDelay = 4;

    // Bullet attributes
    this.bTime = 0;
    this.bDelay = 20 / 60;
    this.bCol = { r: 60, g: 255, b: 80 };
    this.bSpeed = 120;
    this.bulletType = DEFAULT_BULLET.Type;
    this.bulletLevel = DEFAULT_BULLET.level;
    this.multishot = 1;
    this.lastBullet = null;

    // Collision mesh
    const scl = 1 / 738;
    this.makeCollisionMesh([368, 0], [273, 395], [0, 600], [0, 695], [144, 828], [595, 828], [737, 695], [737, 600], [465, 395]);
    this.collisionMesh.setOrigin(738/2, 897/2);
    this.collisionMesh.setScale(this.s * 1.4 * scl);
    this.collisionMesh.updateTransform();
  }
  
  applyEffect(...args) {
    const effect = super.applyEffect(...args);
    const duration = args[1].duration;
    if (this.name == "ship") {
      spawnBonusEffect(`+${duration} ${effect.getText()}`, ship.x, ship.y, effect.color, 2);
    }
  }

  steer(dt, delta) {
    if (Math.sign(this.control.steerVel) != Math.sign(delta))
      delta *= 2;
    this.control.steerVel += delta * dt;
    this.fuel -= 0.0005;
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

  boost() {
    if (this.fuel > 0) {
      this.control.boost = true;
      this.fuel -= 0.01;
    }
  }

  getSteeringAccel() {
    let turnSpeed = this.fuel > 0 ? this.turnSpeed : this.turnSpeed /  6;
    // if (keys.SHIFT) turnSpeed *= 0.5;
    return turnSpeed;
  }

  controls(dt) {
    let oldBoost = this.control.boost;
    this.control.boost = false;
    this.control.fire = false;
    this.bTime -= dt;

    let turnSpeed = this.getSteeringAccel();
    if (!scenes.paused) {
      // Steering
      if (keys.ARROWLEFT || keys.A)
        this.steer(dt, -turnSpeed);
      if (keys.ARROWRIGHT || keys.D)
        this.steer(dt, turnSpeed);
      
      // Boosting
      if (keys.ARROWUP || keys.W)
        this.boost();

      // Shooting
      if (keys.SPACE)
        this.fireBullet(dt);
    }
    
    // Sounds
    if (oldBoost != this.control.boost) {
      if (this.control.boost) {
        htmlSounds.fadeSound(rocketSound, 0.075, 0.2);
        // sounds.startSound(rocketSound);
      } else {
        htmlSounds.fadeSound(rocketSound, 0.0, 0.2);
        // sounds.stopSound(rocketSound);
      }
    }
    
    this.fuel = Math.max(this.fuel, 0);
    // this.control.steerVel += steerDelta * 2 * dt;
    this.control.steeringAngle += this.control.steerVel * dt;
  }
  
  fireBullet(dt) {
    // Cooldown
    if (this.bTime > 0) return;
    this.bTime = 0;
    this.control.fire = true;
    htmlSounds.playSound(shootSound, 0.02, true);
    
    // Out of ammo
    if (this.ammo <= 0) {
      this.bTime += this.bDelay * 2;
    }

    const shipAngle = this.a + this.control.steeringAngle;
    const multishot = this.multishot;
    const spreadAngle = PI * 0.1;
    const angleGap = spreadAngle / multishot;
    let bullet = null;

    const s = this.s * 0.75;
    const leftWingX = this.x - cos(shipAngle - HALF_PI) * s + cos(shipAngle) * s * 0.5;
    const leftWingY = this.y - sin(shipAngle - HALF_PI) * s + sin(shipAngle) * s * 0.5;
    const rightWingX = this.x - cos(shipAngle + HALF_PI) * s + cos(shipAngle) * s * 0.5;
    const rightWingY = this.y - sin(shipAngle + HALF_PI) * s + sin(shipAngle) * s * 0.5;

    for (let i = 0; i < multishot; i++) {
      let a = shipAngle - spreadAngle / 2;
      a += angleGap * (i + 0.5);

      let x, y;

      if (Math.abs(a - shipAngle) < 0.01) {
        x = this.x + cos(a) * this.s;
        y = this.y + sin(a) * this.s;
      } else {
        const t = (a - shipAngle + spreadAngle / 2) / spreadAngle;
        x = lerp(rightWingX, leftWingX, t);
        y = lerp(rightWingY, leftWingY, t);
      }

      let vx = this.vx + cos(a) * this.bSpeed;
      let vy = this.vy + sin(a) * this.bSpeed;
      
      let bulletStyleCol = this.bCol;
      const theme = getTheme();

      if (theme == "christmas" || theme == "thanksgiving") {
        bulletStyleCol = [
          { r: 255, g: 100, b: 100 },
          { r: 255, g: 255, b: 255 },
          { r: 100, g: 255, b: 100 },
          { r: 255, g: 255, b: 255 }
        ][this.stats.bulletsShot % 4];
      }

      this.stats.bulletsShot++;
      bullet = spawnBullet({
        x, y, vx, vy,
        owner: this,
        Type: this.bulletType,
        level: this.bulletLevel,
        damageMult: this.damage,
        bCol: bulletStyleCol
      });
    }

    this.lastBullet = bullet;
    this.bTime += bullet.delay;
    this.ammo = Math.max(this.ammo - bullet.consumes * Math.max(multishot - 1, 1), 0);
  }
  
  addFuel(amount, sender) {
    this.fuel = constrain(this.fuel + amount, 0, 50);
    spawnBonusEffect(`+${amount} fuel`, ship.x, ship.y, color(255, 0, 0), 2);
  }
  
  addAmmo(amount, sender) {
    this.ammo = constrain(this.ammo + amount, 0, 200);
    spawnBonusEffect(`+${amount} ammo`, ship.x, ship.y, color(255, 120, 0), 2);
  }
  
  addHealth(amount, sender) {
    const sign = amount > 0 ? "+" : "-";
    this.health = constrain(this.health + amount, 0, this.maxHealth);
    spawnBonusEffect(`${sign}${Math.abs(amount)} health`, ship.x, ship.y, color(0, 255, 0), 2);
  }

  updateMesh() {
    const shipAngle = this.a + this.control.steeringAngle - PI;
    const offx = -cos(shipAngle) * this.s / 4;
    const offy = -sin(shipAngle) * this.s / 4;
    this.collisionMesh.setPosition(this.x + offx, this.y + offy);
    this.collisionMesh.setRotation(shipAngle - HALF_PI);
    this.collisionMesh.updateTransform();
  }

  move(dt, ctx) {
    let startOfGame = scenes.sceneTime < 5;

    const closestStar = system.getClosestStar(this.x, this.y);
    const star = closestStar.star;
    const d = closestStar.dist;

    // Distance to sun
    let dx = star.x - this.x;
    let dy = star.y - this.y;
    this.stats.distToSun = Math.max(d - star.r, 0);
    this.stats.temp += 100 / ((this.stats.distToSun + 50) * 10 + 100);

    // Damage from sun
    let damage = Math.max(star.r - d, 0) / 4;
    damage = round(damage * 10) / 10;
    
    this.damageTime -= dt;
    if (damage > 0 && this.damageTime <= 0) {
      this.damageTime = this.damageDelay;
      this.takeDamage(damage);
      hud.addCameraShake(damage * 2, 0.1);
    }
    
    // Burning sound
    if (damage > 0) {
      this.stats.burning = damage / 30;
    }
    
    // Boost
    const shipAngle = this.a + this.control.steeringAngle;
    if (this.control.boost) {
      let speedIncrease = 1;
      
      // If the ship is moving slow in the direction of the player, increase speed
      // (increased maneuverability)
      const projectedVelocity = Math.max(0, this.vx * cos(shipAngle) + this.vy * sin(shipAngle));
      speedIncrease = Math.max(1, 2 / (projectedVelocity * 0.1 + 1));

      this.vx += cos(shipAngle) * this.speed * this.speedMult * speedIncrease * dt;
      this.vy += sin(shipAngle) * this.speed * this.speedMult * speedIncrease * dt;
      
      hud.addCameraShake(5, 10);
    }
    
    // Edge force
    let edgeStrength = 1;
    if (startOfGame && scenes.introSkipped) edgeStrength = 0;
    this.attract(dt, 1, edgeStrength);
    
    // Movement
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= this.drag;
    this.vy *= this.drag;
    this.updateMesh();
    
    // Constrain velocity
    if (!startOfGame) {
      let maxSpeed = this.control.boost ? this.maxSpeed : this.maxSpeed * 0.4;
      let sp = Math.sqrt(this.vx ** 2 + this.vy ** 2);
      let ns = Math.min(sp, maxSpeed) / sp;
      this.vx = lerp(this.vx, this.vx * ns, 0.025);
      this.vy = lerp(this.vy, this.vy * ns, 0.025);
    }

    // Reduce bullet time
    this.bulletTime -= dt * 60;
    if (this.bulletTime < 0)
      this.bulletTime = 0;
  }
  
  elasticCollision(collidedObj) {
    const playerInitVx = this.vx;
    const playerInitVy = this.vy;
    const objectInitVx = collidedObj.vx;
    const objectInitVy = collidedObj.vy;

    elasticCollision(this, collidedObj);
    
    // Calculate the change in velocity (post-collision minus pre-collision)
    const playerDeltaVx = playerInitVx - this.vx;
    const playerDeltaVy = playerInitVy - this.vy;
    const objectDeltaVx = objectInitVx - collidedObj.vx;
    const objectDeltaVy = objectInitVy - collidedObj.vy;

    // Compute damage
    const playerDeltaVel = Math.hypot(playerDeltaVx, playerDeltaVy);
    const objectDeltaVel = Math.hypot(objectDeltaVx, objectDeltaVy);

    const playerDamageTaken = round(playerDeltaVel * 2) * 0.1;
    const objectDamageTaken = round(objectDeltaVel * 1) * 0.1;

    // Damage
    this.takeDamage(playerDamageTaken);
    collidedObj.takeDamage(objectDamageTaken, { owner: this });
    
    // Sound
    htmlSounds.playSound(collisionSound, playerDamageTaken / 10 * 0.2, true);

    // Camera shake
    const amount = playerDamageTaken / 2;
    hud.addCameraShake(amount, 5);
  }

  updateCollisions(dt) {
    let collided = false;
    let collidedObj = null;
    
    // Asteroid collision
    for (let asteroid of asteroids) {
      if (!this.collides(asteroid)) continue;
      collided = true;
      collidedObj = asteroid;
      break;
    }
    
    // Enemy collision
    for (let enemy of enemies) {
      if (!this.collides(enemy)) continue;
      collided = true;
      collidedObj = enemy;
      break;
    }

    // Elastic collisions
    if (collided != this.colliding) {
      this.colliding = collided;
      if (collidedObj) this.elasticCollision(collidedObj);
    }

    // Damage from solar flair
    let solarFlair = null;
    for (let flair of solarFlairs) {
      if (!this.collides(flair)) continue;
      solarFlair = flair;
      break;
    }

    if (solarFlair) {
      const damage = solarFlair.getDamage();
      this.damageTime -= dt;
      if (damage > 0 && this.damageTime <= 0) {
        this.damageTime = this.damageDelay * 2;
        this.takeDamage(damage);
        hud.addCameraShake(damage * 2, 0.1);
      }
      
      // Burning sound
      this.stats.burning += 0.5;
      this.stats.temp += 0.2;
    }
  }
  
  updateSounds() {
    // Sounds
    if (this.stats.burning != this.stats.wasBurning) {
      if (this.stats.burning) {
        const volume = this.stats.burning;
        htmlSounds.fadeSound(burningSound, volume, 0.1);
      } else {
        htmlSounds.fadeSound(burningSound, 0.0, 0.5);
      }
    }
  }

  resetStats() {
    // this.stats.temp = 100 / ((this.stats.distToSun + 50) * 10 + 100);
    this.stats.wasBurning = this.stats.burning;
    this.stats.distToSun = 0;
    this.stats.temp = 0;
    this.stats.burning = 0;
  }
  
  alignCamera() {
    let x = this.x;
    let y = this.y;
    
    const star = system.getClosestStar(this.x, this.y).star;

    // Calculate angle to sun
    const sunAngle = Math.atan2(star.y - this.y, star.x - this.x);
    const r1 = -sunAngle + HALF_PI;
    const r2 = -this.a - HALF_PI;
    const r3 = lerpAngle(r1, r2, 0.25);
    const s = Math.min(width, height) * 0.1;

    switch (this.cameraMode) {
      case "rotated":
        x = this.x + cos(this.a) * s / panzoom.zoom;
        y = this.y + sin(this.a) * s / panzoom.zoom;
        panzoom.setRotation(r3);
        break;
      default:
        x = this.x + cos(this.a) * s / panzoom.zoom;
        y = this.y + sin(this.a) * s / panzoom.zoom;
        panzoom.setRotation(-this.a - HALF_PI);
        break;
    }
    stars.setViewPosition(x, y);
    panzoom.setInView(x, y);
  }
  
  toggleCameraMode() {
    this.cameraMode = this.cameraMode == "normal" ? "rotated" : "normal";

    storeItem("fiery-attraction-camera-mode", this.cameraMode);
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
  
  reset(difficult = false) {
    let { pos, angle } = system.getRandomSpawn(200, 200, -1, 0);
    angle += difficult ? PI * 0.2 : PI * 0.3;
    this.setPosition(pos.x, pos.y);
    this.vx = cos(angle) * 40;
    this.vy = sin(angle) * 40;
    this.fuel = 10;
    this.ammo = 100;
    this.health = 60;
    this.bulletTime = 0;
    this.damageTime = 0;
    this.control.steeringAngle = 0;
    this.control.steerVel = 0;
    this.destroyed = false;
    this.bulletType = DEFAULT_BULLET.Type;
    this.bulletLevel = DEFAULT_BULLET.level;
    this.stats.bulletsShot = 0;
  }

  resurrect() {
    this.addHealth(this.maxHealth / 2);
    this.destroyed = false;
  }
  
  drawBoost(ctx) {
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
          this.exaustCol.min.a + this.exaustCol.add.a * Math.random()
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
  
  draw(ctx) {
    this.drawBoost(ctx);
    this.trail.draw(ctx);
    
    const SIZE = 1.4;
    const aspect = rocketSprite.height / rocketSprite.width;
    
    if (this.health <= 0)
      this.alpha = Math.max(this.alpha - 8, 0);
    else
      this.alpha = 255;

    ctx.push();
    ctx.translate(this.x, this.y);
    ctx.rotate(HALF_PI + this.a + this.control.steeringAngle);
    ctx.translate(0, -this.s / 4);
    ctx.imageMode(CENTER);
    
    if (this.alpha != 255)
      ctx.tint(255, this.alpha);
    
    ctx.image(this.sprite, 0, 0, this.s * SIZE, this.s * aspect * SIZE);

    if (this.effects.length > 0)
      ctx.image(jetEnchantmentSprite, 0, 0, this.s * SIZE, this.s * aspect * SIZE);

    if (this.alpha != 255)
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
