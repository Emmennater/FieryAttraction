
bullets = [];

class Bullet extends GravityObject {
  constructor(dat) {
    super(dat.x, dat.y, 2000);
    this.dat = dat;
    this.damage = 5;
    this.consumes = 1;
    this.speed = 1;
    this.delay = 2 / 5;
    this.r = 0.5;
    this.vx = dat.vx;
    this.vy = dat.vy;
    this.px = dat.x;
    this.py = dat.y;
    
    this.owner = dat.owner;
    this.col = dat.bCol || { r: 255, g: 255, b: 255 };
    this.damageMult = dat.damageMult || 1;
    this.time = 4 / (this.dat.decay || 1);
    this.destroy = false;
  }
  
  transferMomentumTo(object) {
    object.vx += this.vx / object.m * 400;
    object.vy += this.vy / object.m * 400;
  }

  checkForHit() {
    for (let asteroid of asteroids) {
      const sz = asteroid.r / 2;
      if (asteroid.x > this.x - sz &&
          asteroid.x < this.x + sz &&
          asteroid.y > this.y - sz &&
          asteroid.y < this.y + sz) {
        this.destroy = true;
        asteroid.takeDamage(this.damage * this.damageMult, this);
        this.transferMomentumTo(asteroid);
        htmlSounds.playSound(hitSound, 0.5);
        // sounds.playRandomly(hitSound, 0.5);
        return;
      }
    }
    
    if (this.owner.name == "enemy") {
      // Ship
      const sz = ship.s / 2;
      if (ship.x > this.x - sz &&
          ship.x < this.x + sz &&
          ship.y > this.y - sz &&
          ship.y < this.y + sz) {
        this.destroy = true;
        ship.takeDamage(this.damage * this.damageMult, this);
        this.transferMomentumTo(ship);
        hud.addCameraShake(10, 10);
        htmlSounds.playSound(hitSound, 0.5);
        // sounds.playRandomly(hitSound, 0.5);
        return;
      }
    }
    
    if (this.owner.name == "ship") {
      // Enemies
      for (let enemy of enemies) {
        const sz = enemy.s / 2;
        if (enemy.x > this.x - sz &&
            enemy.x < this.x + sz &&
            enemy.y > this.y - sz &&
            enemy.y < this.y + sz) {
          this.destroy = true;
          enemy.takeDamage(this.damage * this.damageMult, this);
          this.transferMomentumTo(enemy);
          htmlSounds.playSound(hitSound, 0.5);
          // sounds.playRandomly(hitSound, 0.5);
          return;
        }
      }
    }
  }
  
  move(dt) {
    this.time -= dt;
    if (this.time < 0) {
      this.destroy = true;
    }
    
    const strength = 10 * (this.dat.gravity ?? 1);
    this.attract(dt, strength);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    this.checkForHit();
  }
  
  draw(ctx) {
    const ALPHA = Math.min(this.time * 120, 255);
    let vx = this.x - this.px;
    let vy = this.y - this.py;
    
    // if (this.owner == "enemy") {
    //   ctx.stroke(255, 80, 60, ALPHA);
    // } else {
    //   ctx.stroke(60, 255, 80, ALPHA);
    // }
    
    ctx.stroke(this.col.r, this.col.g, this.col.b, ALPHA);
    ctx.strokeWeight(this.r);
    ctx.line(this.x - vx * 3, this.y - vy * 3, this.x, this.y);
    
    this.px = this.x;
    this.py = this.y;
  }
}

class SpeedBullet extends Bullet {
  constructor(dat) {
    super(dat);
    this.col = { r: 68, g: 223, b: 235 };
    this.speed = 2;
    this.delay = 0.2;
    this.vx *= this.speed;
    this.vy *= this.speed;
    this.damage = 5;
    this.consumes = 0.5;
  }
}

class HomingBullet extends Bullet {
  constructor(dat) {
    super(dat);
    this.col = { r: 183, g: 45, b: 247 };
    this.homingVelocity = Math.sqrt(dat.vx ** 2 + dat.vy ** 2) * 1.5;
    this.pickTarget();
  }

  pickTarget() {
    // Select a target
    this.target = null;
    switch (this.owner.name) {
      case "ship":
        this.target = this.selectTarget(asteroids.concat(enemies));
        break;
      case "enemy":
        this.target = ship;
        break;
    }
  }

  selectTarget(targets) {
    if (!targets) return;
    if (targets.length == 0) return;
    let bulletAngle = atan2(this.vy, this.vx);
    let aimFov = PI * 0.4;
    let selectedTarget = selectTarget(this, targets, aimFov, bulletAngle);

    // let shortestDist = Infinity;
    // for (let target of targets) {
    //   let angleTo = atan2(target.y - this.y, target.x - this.x) + PI;
    //   let angleDiff = smallestAngleDifference(angle, angleTo);
    //   if (Math.abs(angleDiff) > PI * 0.4) continue;
    //   let d = dist(this.x, this.y, target.x, target.y);
    //   if (d < shortestDist) {
    //     shortestDist = d;
    //     selectedTarget = target;
    //   }
    // }
    return selectedTarget;
  }

  homeOnTarget(dt) {
    if (this.target == null || this.target.destroy) {
      this.pickTarget();
      return;
    }
    
    let vx = this.vx;
    let vy = this.vy;
    let targetX = this.target.x;
    let targetY = this.target.y;
    let velocity = Math.sqrt(vx ** 2 + vy ** 2);
    let currentA = atan2(vy, vx);
    let targetA = atan2(targetY - this.y, targetX - this.x);
    currentA = ((currentA % TWO_PI) + TWO_PI) % TWO_PI;
    targetA = ((targetA % TWO_PI) + TWO_PI) % TWO_PI;
    let deltaA = smallestAngleDifference(currentA, targetA);

    CTX.noFill();
    CTX.stroke(255, 0, 0, 50);
    CTX.strokeWeight(2);
    CTX.ellipse(targetX, targetY, 20, 20);

    // Calculating the maximum turning angle
    // Centripetal acceleration
    let maxTurnA = atan(this.homingVelocity * dt / velocity);
    deltaA = Math.min(Math.abs(deltaA), maxTurnA) * Math.sign(deltaA);
    vx = Math.cos(currentA + deltaA) * velocity;
    vy = Math.sin(currentA + deltaA) * velocity;

    // let a = currentA + deltaA;
    // CTX.stroke(255, 0, 0);
    // CTX.strokeWeight(2);
    // CTX.line(this.x, this.y, this.x + cos(a) * 50, this.y + sin(a) * 50);
    
    this.vx = vx;
    this.vy = vy;
  }

  move(dt) {
    this.homeOnTarget(dt);
    super.move(dt);
  }
}

class MegaBullet extends HomingBullet {
  constructor(dat) {
    super(dat);
    this.consumes = 0.5;
    this.col = { r: 74, g: 66, b: 227 };
    this.homingVelocity = Math.sqrt(dat.vx ** 2 + dat.vy ** 2) * 4;
    this.speed = 2;
    this.delay = 0.2;
    this.vx *= this.speed;
    this.vy *= this.speed;
    this.damage = 7.5;
  }
}

function spawnBullet(dat) {
  let bullet = null;
  switch (dat.type) {
    case "homing": bullet = new HomingBullet(dat); break;
    case "speed": bullet = new SpeedBullet(dat); break;
    case "mega": bullet = new MegaBullet(dat); break;
    default: bullet = new Bullet(dat); break;
  }
  bullets.push(bullet);
  return bullet;
}

function moveBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    if (bullet.destroy) {
      bullets.splice(i, 1);
      continue;
    }
    bullet.move(dt);
  }
}

function drawBullets(ctx) {
  for (let bullet of bullets) {
    bullet.draw(ctx);
  }
}

// Bullet functions
function selectTarget(bullet, targets, fov, firingAngle) {
  if (targets.length == 0) return;
  const T = bullet;
  let target = null;
  let best = -Infinity;
  
  for (let t of targets) {
    // The algorithm
    let dx = t.x - T.x;
    let dy = t.y - T.y;
    let d = Math.sqrt(dx ** 2 + dy ** 2);
    let angleToTarget = atan2(dy, dx);
    let angleDiff = smallestAngleDifference(angleToTarget, firingAngle);
    let score = map(Math.abs(angleDiff), 0, fov, 1, 0) / d;
    
    t.score = score;
    if (score > best) {
      best = score;
      target = t;
    }
  }
  
  return target;
}

/*



















*/
