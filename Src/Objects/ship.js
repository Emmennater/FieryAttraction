
class Trail {
  constructor() {
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
    super(x, y, 1000);
    this.name = "ship";
    this.trail = new Trail();
    this.vx = 0;
    this.vy = -35;
    this.a = 0;
    this.s = 10;
    this.drag = 0.9998;
    this.speed = 8;
    this.fuel = 10;
    this.health = 100;
    this.control = { steeringAngle: 0, steerVel: 4, boost: false };
    this.stats = { distToSun: 0, temp: 0 };
    this.colliding = false;
    this.burning = false;
    this.damageDelay = 20;
    this.damageTime = this.damageDelay;
    this.bulletTime = 0;
    this.sprite = rocketSprite;
    this.alpha = 255;
    this.angle = 0;
    this.oldAngle = 0;
    this.speedMult = 1;
    this.speedMultTime = 0;
  }
  
  controls(dt) {
    let oldBoost = this.control.boost;
    this.control.boost = false;

    let steerDelta = 0;
    let turnSpeed = this.fuel > 0 ? 1.2 : 0.2;
    
    if (!scenes.paused) {
      if (keys.ARROWLEFT || keys.A) {
        if (this.control.steerVel > 0)
          steerDelta -= turnSpeed * 2;
        else
          steerDelta -= turnSpeed;
        this.fuel -= 0.0005;
      }
      if (keys.ARROWRIGHT || keys.D) {
        if (this.control.steerVel < 0)
          steerDelta += turnSpeed * 2;
        else
          steerDelta += turnSpeed;
        this.fuel -= 0.0005;
      }
      if (keys.ARROWUP || keys.W) {
        if (this.fuel > 0) {
          this.control.boost = true;
          this.fuel -= 0.01;
        }
      }
      if (keys.SPACE) {
        this.fireBullet();
      }
    }
    
    // Sounds
    if (oldBoost != this.control.boost) {
      if (this.control.boost) {
        htmlSounds.fadeSound(rocketSound, 0.1, 0.2);
        // sounds.startSound(rocketSound);
      } else {
        htmlSounds.fadeSound(rocketSound, 0.0, 0.2);
        // sounds.stopSound(rocketSound);
      }
    }
    
    this.fuel = Math.max(this.fuel, 0);
    this.control.steerVel += steerDelta * 2 * dt;
    this.control.steeringAngle += this.control.steerVel * dt;
  }
  
  fireBullet() {
    const bulletDelay = 20;
    if (this.bulletTime > 0) return;
    if (this.ammo <= 0) {
      this.bulletTime += bulletDelay * 2;
      this.ammo = 0;
    } else this.bulletTime += bulletDelay;
    
    const bSpeed = 120;
    const shipAngle = this.a + this.control.steeringAngle;
    
    let x = this.x + cos(shipAngle) * this.s;
    let y = this.y + sin(shipAngle) * this.s;
    let vx = this.vx + cos(shipAngle) * bSpeed;
    let vy = this.vy + sin(shipAngle) * bSpeed;
    
    this.ammo--;
    if (this.ammo < 0) this.ammo = 0;
    htmlSounds.playSound(shootSound, 0.02, true);
    // sounds.playRandomly(shootSound, 0.02, 0.4);
    spawnBullet(x, y, vx, vy, this);
  }
  
  addFuel(amount) {
    this.fuel += amount;
    this.fuel = Math.min(this.fuel, 100);
  }
  
  addAmmo(amount) {
    this.ammo += amount;
    this.ammo = Math.min(this.ammo, 200);
  }
  
  addHealth(amount) {
    this.health += amount;
    this.health = Math.min(this.health, 100);
  }
  
  move(dt, ctx) {
    // Speed
    if (this.speedMultTime > 0) {
      this.speedMultTime -= dt;
    } else {
      this.speedMult = 1;
    }

    // Distance to sun
    let dx = sun.x - this.x;
    let dy = sun.y - this.y;
    let d = Math.sqrt(dx ** 2 + dy ** 2);
    let vx = dx / d;
    let vy = dy / d;
    let g = this.m * sun.m / (d ** 2);
    
    let damage = Math.max(sun.r - d, 0) / 4;
    damage = round(damage * 10) / 10;
    
    if (damage > 0 && this.damageTime++ >= this.damageDelay) {
      this.damageTime = 0;
      ship.takeDamage(damage);
      hud.addCameraShake(damage * 2, 0.1);
    }
    
    if (damage != this.burning) {
      this.burning = damage ? true : false;
      if (this.burning) {
        let v = Math.min(damage / 50, 0.2);
        htmlSounds.fadeSound(burningSound, v, 0.2);
      } else {
        htmlSounds.fadeSound(burningSound, 0.0, 0.2);
      }
    }

    let shipAngle = this.a + this.control.steeringAngle - PI;

    // Boost
    if (this.control.boost) {
      this.vx -= cos(shipAngle) * this.speed * this.speedMult * dt;
      this.vy -= sin(shipAngle) * this.speed * this.speedMult * dt;
      // this.x += ForceX * dt * 2;
      // this.y += ForceY * dt * 2;
      hud.addCameraShake(5, 10);
    }
    
    // For dramatic effect when the fuel is low
    // make gravity stronger
    // g *= Math.max((-this.fuel + 2) * 1.025, 1)
    // g = Math.min(g / this.m, 40);
    g = g / this.m;
    let ForceX = vx * (g + max(d - sun.r * 1.5, 0) * 0.05);
    let ForceY = vy * (g + max(d - sun.r * 1.5, 0) * 0.05);
    
    this.vx += ForceX * dt;
    this.vy += ForceY * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    this.vx *= this.drag;
    this.vy *= this.drag;
    
    // Constrain velocity
    let maxSpeed = this.control.boost ? 100 : 40;
    let sp = Math.sqrt(this.vx ** 2 + this.vy ** 2);
    let ns = Math.min(sp, maxSpeed) / sp;
    this.vx = lerp(this.vx, this.vx * ns, 0.025);
    this.vy = lerp(this.vy, this.vy * ns, 0.025);
    this.stats.distToSun = d;

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

  goCrazy() {
    this.speedMult = 20;
    this.speedMultTime = 10;
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
    this.setPosition(600, 600);
    this.vx = 0;
    this.vy = -35;
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
        ctx.stroke(255, Math.random() * 100 + 100, 0, 100);
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
