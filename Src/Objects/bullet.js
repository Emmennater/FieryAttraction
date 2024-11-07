
bullets = [];

class Bullet extends GravityObject {
  constructor(dat) {
    super(dat.x, dat.y, 2000);
    this.dat = dat;
    this.damage = 5;
    this.consumes = 1;
    this.speed = 1;
    this.delay = 0.4;
    this.r = 0.5;
    this.vx = dat.vx;
    this.vy = dat.vy;
    this.px = dat.x;
    this.py = dat.y;
    this.impactForce = dat.impactForce || 1;

    this.level = dat.level || 1;
    this.m = 2000;
    this.owner = dat.owner;
    this.col = dat.bCol || { r: 255, g: 255, b: 255 };
    this.damageMult = dat.damageMult || 1;
    this.time = 4 / (this.dat.decay || 1);
    this.spawnTime = 0;
  }
  
  transferMomentumTo(object) {
    if (!object) return;
    const vx = this.vx * this.m / object.m * this.impactForce;
    const vy = this.vy * this.m / object.m * this.impactForce;
    object.addVelocity(vx, vy);
  }

  checkForHit() {
    const NO_OWNER = this.owner == null || (this.owner.name !== "ship" && this.owner.name !== "enemy");

    for (let asteroid of asteroids) {
      if (asteroid.containsPoint(this.x, this.y)) {
        this.destroy();
        asteroid.takeDamage(this.damage * this.damageMult, this);
        this.transferMomentumTo(asteroid);
        htmlSounds.playSound(hitSound, 0.5);
        return;
      }
    }
    
    if (NO_OWNER || this.owner.name == "enemy") {
      if (ship.containsPoint(this.x, this.y)) {
        this.destroy();
        ship.takeDamage(this.damage * this.damageMult, this);
        this.transferMomentumTo(ship);
        hud.addCameraShake(10, 10);
        htmlSounds.playSound(hitSound, 0.5);
        return;
      }
    }
    
    if (NO_OWNER || this.owner.name == "ship") {
      // Enemies
      for (let enemy of enemies) {
        if (enemy.containsPoint(this.x, this.y)) {
          this.destroy();
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
    this.spawnTime += dt;
    if (this.time < 0) {
      this.destroy();
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
    this.speed = 1.5 + this.level * 0.5;
    this.delay = 0.2 / this.level ** 0.5;
    this.vx *= this.speed;
    this.vy *= this.speed;
    this.damage = 5;
    this.consumes = 0.5 / this.level ** 0.5;
  }
}

class HomingBullet extends Bullet {
  constructor(dat) {
    super(dat);
    this.col = { r: 183, g: 45, b: 247 };
    this.homingVelocity = Math.sqrt(dat.vx ** 2 + dat.vy ** 2) * (1.25 + this.level * 0.25);
    this.homingEnemyBlacklist = [ BlackEnemy, SpaceEnemy ];
    this.homingBulletBlacklist = [ HomingBullet, MegaBullet ];
    this.canHomeOnTarget = true;
    this.lockToAsteroids = true;
    this.pickTarget();
  }

  pickTarget() {
    // Select a target
    let targets;
    this.target = null;
    switch (this.owner.name) {
      case "ship":
        targets = asteroids.concat(enemies);
        this.target = this.selectTarget(targets);
        break;
      case "enemy":
        targets = [ship];
        if (this.lockToAsteroids) targets = targets.concat(asteroids);
        this.target = this.selectTarget(targets);
        break;
    }
  }

  selectTarget(targets) {
    if (!targets) return;
    if (targets.length == 0) return;
    let bulletAngle = atan2(this.vy, this.vx);
    let aimFov = PI * 0.4;
    let targetAliens = this.owner.name == "ship";
    let selectedTarget = selectTarget(this, targets, aimFov, bulletAngle, targetAliens);

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

  validateHomingTarget() {
    if (this.target == null) return;

    // Homing enemy blacklist
    this.canHomeOnTarget = true;
    for (let i = this.level - 1; i < this.homingEnemyBlacklist.length; i++) {
      let Class = this.homingEnemyBlacklist[i];
      if (this.target.constructor == Class) {
        this.canHomeOnTarget = false;
        break;
      }
    }

    // Homing bullet blacklist
    for (let i = this.level - 1; i < this.homingBulletBlacklist.length; i++) {
      let Class = this.homingBulletBlacklist[i];
      if (this.target.bulletType == Class) {
        this.canHomeOnTarget = false;
        break;
      }
    }
  }

  homeOnTarget(dt) {
    // If owner is destroyed stop homing
    if (this.owner.destroyed) {
      this.target = null;
      return;
    }

    if (this.target == null || this.target.destroyed) {
      this.pickTarget();
      return;
    }

    this.validateHomingTarget();

    // Can't home on target
    if (!this.canHomeOnTarget) return;
    
    const targetX = this.target.x;
    const targetY = this.target.y;
    let vx = this.vx;
    let vy = this.vy;
    let velocity = Math.sqrt(vx ** 2 + vy ** 2);
    let currentA = fixAngle(atan2(vy, vx));
    let targetA;

    if (this.level < 2) {
      // Home on targets position
      targetA = fixAngle(atan2(targetY - this.y, targetX - this.x));
    } else {
      // Home on targets future position
      targetA = getInterceptAngle(this, this.target, velocity);
    }
    
    let deltaA = smallestAngleDifference(currentA, targetA);

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

  drawHomingCirlce(ctx) {
    if (!this.target) return;

    let radius = 20;
    if (this.target instanceof Asteroid) {
      radius = this.target.r + 5;
    }

    // Draw homing circle
    const homingCol = color(255, 0, 0, 50);
    const targetX = this.target.x;
    const targetY = this.target.y;
    CTX.noFill();
    CTX.stroke(homingCol);
    CTX.strokeWeight(2);
    CTX.ellipse(targetX, targetY, radius);
    
    // If can't homing on target draw a line through the circle (not sign)
    if (!this.canHomeOnTarget) {
      const LINE_ANGLE = ship.a - PI * 0.25;
      const x1 = targetX + cos(LINE_ANGLE) * 10;
      const y1 = targetY + sin(LINE_ANGLE) * 10;
      const x2 = targetX - cos(LINE_ANGLE) * 10;
      const y2 = targetY - sin(LINE_ANGLE) * 10;
      CTX.line(x1, y1, x2, y2);
    }
  }

  draw(ctx) {
    super.draw(ctx);
    this.drawHomingCirlce(ctx);
  }
}

class SpaceBullet extends HomingBullet {
  constructor(dat) {
    super(dat);
    this.col = { r: 255, g: 255, b: 255 };
    this.consumes = 0.4 / this.level ** 0.5;
    this.speed = 2 + this.level;
    this.delay = 0.1 / this.level ** 0.5;
    this.vx *= this.speed;
    this.vy *= this.speed;
    this.homingVelocity = Math.sqrt(dat.vx ** 2 + dat.vy ** 2) * 4;
    this.lockToAsteroids = false;
    this.target = null;
    this.time *= 2;

    // Teleport
    const spawnRadius = dat.spawnRadius || 10;
    this.x += randSign() * randInt(spawnRadius, spawnRadius * 2);
    this.y += randSign() * randInt(spawnRadius, spawnRadius * 2);
    this.px = this.x;
    this.py = this.y;
    
    // Randomize velocity
    const currentAngle = Math.atan2(this.vy, this.vx);
    const velocityAngle = (Math.random() * 2 - 1) * (PI * spawnRadius / 200) + currentAngle;
    const vel = Math.sqrt(this.vx ** 2 + this.vy ** 2);
    this.vx = Math.cos(velocityAngle) * vel;
    this.vy = Math.sin(velocityAngle) * vel;

    this.prevIdx = 0;
    this.previousPositions = [];

    this.homingEnemyBlacklist = [ BlackEnemy, SpaceEnemy ];
    this.homingBulletBlacklist = [ MegaBullet, SpaceBullet ];
  }

  draw(ctx) {
    const ALPHA = Math.min(this.time * 120, 255);
    let vx = this.x - this.px;
    let vy = this.y - this.py;
    
    ctx.strokeWeight(this.r);
    
    this.previousPositions[this.prevIdx] = { x: this.x, y: this.y };

    let j = 0;
    for (let i = this.prevIdx + 1; i != this.prevIdx; i = (i + 1) % 10) {
      let p1 = this.previousPositions[i];
      let p2 = this.previousPositions[(i + 1) % 10];
      if (!p1 || !p2) continue;
      ++j;

      ctx.stroke(this.col.r, this.col.g, this.col.b, 255 * j / 10);
      ctx.line(p1.x, p1.y, p2.x, p2.y);
    }

    this.prevIdx = (this.prevIdx + 1) % 10;
  }
}

class MegaBullet extends HomingBullet {
  constructor(dat) {
    super(dat);
    this.consumes = 0.5 / this.level ** 0.5;
    this.col = { r: 74, g: 66, b: 227 };
    this.homingVelocity = Math.sqrt(dat.vx ** 2 + dat.vy ** 2) * 4;
    this.speed = 1.5 + this.level * 0.5;
    this.delay = 0.2 / this.level ** 0.5;
    this.vx *= this.speed;
    this.vy *= this.speed;
    this.damage = 7.5;
    this.homingEnemyBlacklist = [ BlackEnemy, SpaceEnemy ];
    this.homingBulletBlacklist = [ MegaBullet ];
  }

  pickTarget() {
    // Select a target
    let targets;
    this.target = null;
    switch (this.owner.name) {
      case "ship":
        targets = asteroids.concat(enemies);
        this.target = this.selectTarget(targets);
        break;
      case "enemy":
        targets = asteroids.concat([ship]);
        this.target = this.selectTarget(targets);
        break;
    }
  }
}

class ExplosiveBullet extends Bullet {
  constructor(dat) {
    super(dat);
    this.level = dat.level ?? 1;
    this.consumes = this.level;
    this.col = { r: 255, g: 115, b: 0 };
    this.delay = 0.4;
    this.damage = 30;
    this.r = 1;
    this.time /= 1.5;
  }

  explode() {
    if (this.level < 2) return;

    const nBullets = 5;
    const x = this.x;
    const y = this.y;

    // Spawn explosive bullets
    const BULLET_SPEED = 50;
    const ANGLE_GAP = TWO_PI / nBullets;
    for (let i = 0; i < nBullets; i++) {
      let a = ANGLE_GAP * i + Math.random() * ANGLE_GAP;
      const vx = Math.cos(a) * BULLET_SPEED + this.vx;
      const vy = Math.sin(a) * BULLET_SPEED + this.vy;
      const bullet = spawnBullet({
        x, y, vx, vy,
        owner: this.owner,
        Type: ExplosiveBullet,
        damageMult: this.damageMult,
        level: this.level - 1,
      });
    }

    if (!this.destroyed) this.destroy();
  }

  checkForHit() {
    super.checkForHit();
    
    const SPAWN_TIME = this.spawnTime;

    if (this.destroyed || this.level < 2 || SPAWN_TIME < 0.3) return;

    // Check if bullet is in range of an enemy
    const enemyExplodeRange = (this.level - 1) * 100;
    for (let object of [...enemies, ship]) {
      if (object === this.owner) continue;     

      const d = Math.hypot(object.x - this.x, object.y - this.y);
      
      if (d < enemyExplodeRange) {
        this.explode();
      }
    }

    // Check if bullet is in range of an asteroid
    const asteroidExplodeRange = 30;
    for (let object of asteroids) {
      if (object === this.owner) continue;     

      const d = Math.hypot(object.x - this.x, object.y - this.y);
      
      if (d < asteroidExplodeRange) {
        this.explode();
      }
    }
  }

  onDestroy() {
    super.onDestroy();

    // Spawn explosion
    if (this.time > 0) {
      spawnExplosion(this.x, this.y);
      hud.addCameraShake(10, 10);
    }
  }
}

function spawnBullet(dat) {
  const BulletType = dat.Type || Bullet;
  let bullet = new BulletType(dat);
  bullets.push(bullet);
  return bullet;
}

function moveBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    if (bullet.destroyed) {
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
function selectTarget(bullet, targets, fov, firingAngle, targetAliens = false) {
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
    
    if (targetAliens) {
      // Increase score for tracking aliens
      if (t.name == "enemy") {
        score *= 1.5;
      }
    }

    t.score = score;
    if (score > best) {
      best = score;
      target = t;
    }
  }

  // console.log(Math.hypot(target.x - T.x, target.y - T.y));
  // console.log(best);

  return target;
}

DEFAULT_BULLET = { Type: Bullet, level: 1 };

/*



















*/
