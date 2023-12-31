
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
    this.oldExaustCol = {
      min: { r: 255, g: 100, b: 0, a: 100 },
      add: { r: 0, g: 100, b: 0, a: 0 }
    };
    this.exaustCol = this.oldExaustCol;
    this.vx = 0;
    this.vy = -35;
    this.a = 0;
    this.s = 10;
    this.drag = 0.9998;
    this.speed = 8;
    this.turnSpeed = 2.4;
    this.fuel = 50;
    this.ammo = 200;
    this.health = 100;
    this.control = { steeringAngle: 0, steerVel: 4, boost: false, fire:false };
    this.stats = { distToSun: 0, temp: 0 };
    this.inputs = {};
    this.colliding = false;
    this.burning = false;
    this.damageDelay = 20 / 60;
    this.damageTime = 0;
    this.sprite = rocketSprite;
    this.alpha = 255;
    this.angle = 0;
    this.oldAngle = 0;
    this.speedMult = 1;
    this.speedMultTime = 0;
    this.damage = 1;

    // Bullet attributes
    this.bTime = 0;
    this.bDelay = 20 / 60;
    this.bCol = { r: 60, g: 255, b: 80 };
    this.bSpeed = 120;
    this.bulletType = "normal";
  }
  
  applyEffect(...args) {
    const effect = super.applyEffect(...args);
    spawnBonusEffect(`+${effect.duration} ${effect.name}`, ship.x, ship.y, effect.color, 2);
  }

  steer(dt, delta) {
    if (Math.sign(this.control.steerVel) != Math.sign(delta))
      delta *= 2;
    this.control.steerVel += delta * dt;
    this.fuel -= 0.0005;
  }

  boost() {
    if (this.fuel > 0) {
      this.control.boost = true;
      this.fuel -= 0.01;
    }
  }

  getSteeringAccel() {
    let turnSpeed = this.fuel > 0 ? this.turnSpeed : this.turnSpeed /  6;
    if (keys.SHIFT) turnSpeed *= 0.5;
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
    let x = this.x + cos(shipAngle) * this.s;
    let y = this.y + sin(shipAngle) * this.s;
    let vx = this.vx + cos(shipAngle) * this.bSpeed;
    let vy = this.vy + sin(shipAngle) * this.bSpeed;
    
    const bullet = spawnBullet({
      x, y, vx, vy,
      owner:this,
      type:this.bulletType,
      damageMult:this.damage,
      bCol:this.bCol
    });

    this.bTime += bullet.delay;
    this.ammo = Math.max(this.ammo - bullet.consumes, 0);
  }
  
  addFuel(amount, sender) {
    this.fuel += amount;
    this.fuel = Math.min(this.fuel, 50);
    spawnBonusEffect(`+${amount} fuel`, ship.x, ship.y, color(255, 0, 0), 2);
  }
  
  addAmmo(amount, sender) {
    this.ammo += amount;
    this.ammo = Math.min(this.ammo, 200);
    spawnBonusEffect(`+${amount} ammo`, ship.x, ship.y, color(255, 120, 0), 2);
  }
  
  addHealth(amount, sender) {
    this.health += amount;
    this.health = Math.min(this.health, 100);
    spawnBonusEffect(`+${amount} health`, ship.x, ship.y, color(0, 255, 0), 2);
  }
  
  move(dt, ctx) {
    let startOfGame = scenes.sceneTime < 5;

    // Distance to sun
    let dx = sun.x - this.x;
    let dy = sun.y - this.y;
    let d = Math.sqrt(dx ** 2 + dy ** 2);
    this.stats.distToSun = d;
    
    // Damage from sun
    let damage = Math.max(sun.r - d, 0) / 4;
    damage = round(damage * 10) / 10;
    
    this.damageTime -= dt;
    if (damage > 0 && this.damageTime <= 0) {
      this.damageTime = this.damageDelay;
      ship.takeDamage(damage);
      hud.addCameraShake(damage * 2, 0.1);
    }
    
    // Burning sound
    if (damage != this.burning) {
      this.burning = damage ? true : false;
      if (this.burning) {
        let v = Math.min(damage / 50, 0.2);
        htmlSounds.fadeSound(burningSound, v, 0.2);
      } else {
        htmlSounds.fadeSound(burningSound, 0.0, 0.2);
      }
    }

    
    // Boost
    if (this.control.boost) {
      let shipAngle = this.a + this.control.steeringAngle - PI;
      this.vx -= cos(shipAngle) * this.speed * this.speedMult * dt;
      this.vy -= sin(shipAngle) * this.speed * this.speedMult * dt;
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
    
    // Constrain velocity
    if (!startOfGame) {
      let maxSpeed = this.control.boost ? 100 : 40;
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
  
  takeDamage(damage) {
    this.health = Math.max(this.health - damage, 0);
  }
  
  updateCollisions() {
    let collided = false;
    let collidedAsteroid = null;
    
    for (let asteroid of asteroids) {
      const aSize = asteroid.r / 2;
      const sSize = this.s / 2;
      // const sz = sSize - aSize;
      if (asteroid.x + aSize < this.x - sSize ||
          asteroid.x - aSize > this.x + sSize ||
          asteroid.y + aSize < this.y - sSize ||
          asteroid.y - aSize > this.y + sSize) continue;
      collided = true;
      collidedAsteroid = asteroid;
      break;
    }
    
    if (collided) {
      hud.addCameraShake(20, 5);
    }
    
    if (collided != this.colliding) {
      this.colliding = collided;
      if (collidedAsteroid) {
        let vx = collidedAsteroid.vx;
        let vy = collidedAsteroid.vy;
        let vx2 = this.vx;
        let vy2 = this.vy;
        this.vx += vx / 3 * collidedAsteroid.r / 10;
        this.vy += vy / 3 * collidedAsteroid.r / 10;
        collidedAsteroid.vx /= 2;
        collidedAsteroid.vy /= 2;
        if (collided) {
          let s = Math.sqrt((vx2 - vx) ** 2 + (vx2 - vy) ** 2);
          let damage = s / 10 * collidedAsteroid.r / 10;
          damage = round(damage * 10) / 10;
          this.takeDamage(damage);
          
          // Speed of impact;
          let v = Math.min(damage / 10, 0.5);  
          
          // Sound
          htmlSounds.playSound(collisionSound, damage / 10 * 0.2, true);
          // sounds.playRandomly(collisionSound, damage / 10 * 0.2);
        }
      }
    }
  }
  
  updateStats() {
    this.stats.temp = (100 ** 6) / (this.stats.distToSun ** 5 + 1);
  }
  
  alignCamera() {
    let x = this.x * 0.9;
    let y = this.y * 0.9;
    panzoom.setInView(x, y);
    panzoom.setRotation(-this.a - HALF_PI);
    stars.setViewPosition(x, y);
  }
  
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
  
  reset() {
    this.setPosition(sun.r + 200, 300);
    this.vx = 0;
    this.vy = -40;
    this.fuel = 10;
    this.ammo = 100;
    this.health = 60;
    this.bulletTime = 0;
    this.damageTime = 0;
    this.control.steeringAngle = 0;
    this.control.steerVel = 0;
  }
  
  drawBoost(ctx) {
    // Distance to sun
    let dx = sun.x - this.x;
    let dy = sun.y - this.y;
    let d = Math.sqrt(dx ** 2 + dy ** 2);
    let vx = dx / d;
    let vy = dy / d;
    let speed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
    
    let shipTurnRate = (this.control.boost) ? 0.01 : 0.02;
    let oldAngle = this.a;
    let newAngle = atan2(this.vy, this.vx);
    this.oldAngle = newAngle;
    oldAngle = ((oldAngle % TWO_PI) + TWO_PI) % TWO_PI;
    newAngle = ((newAngle % TWO_PI) + TWO_PI) % TWO_PI;
    let diff = smallestAngleDifference(oldAngle, newAngle);
    // this.a += (newAngle - oldAngle) * shipTurnRate;
    this.a += diff * shipTurnRate;
    this.a = ((this.a % TWO_PI) + TWO_PI) % TWO_PI    

    let shipAngle = this.a + this.control.steeringAngle - PI;
    let exaustDist = this.s * 0.6;
    let exaustVx = 0, exaustVy = 0;
    let exaustDelay = 4;
    let exaustRadius = this.s * 0.5;
    let exaustSpread = 0.1;
    
    if (this.control.boost) {
      exaustVx = cos(shipAngle) * this.s * 0.035;
      exaustVy = sin(shipAngle) * this.s * 0.035;
      exaustDelay = 2;
      exaustRadius = 0.6 * this.s;
      exaustSpread = 0.2;
    }
    
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
    if (this.alpha != 255)
      ctx.noTint();
    
    ctx.pop();
    
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
