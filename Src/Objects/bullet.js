
bullets = [];

class Bullet extends GravityObject {
  constructor(x, y, vx, vy, owner, damage = 1) {
    super(x, y, 2000);
    this.r = 0.5;
    this.vx = vx;
    this.vy = vy;
    this.time = 4;
    this.destroy = false;
    this.px = x;
    this.py = y;
    this.owner = owner;
    this.damage = damage;
  }
  
  transferMomentumTo(object) {
    object.vx += this.vx / object.m * 10;
    object.vy += this.vy / object.m * 10;
  }

  checkForHit() {
    for (let asteroid of asteroids) {
      const sz = asteroid.r / 2;
      if (asteroid.x > this.x - sz &&
          asteroid.x < this.x + sz &&
          asteroid.y > this.y - sz &&
          asteroid.y < this.y + sz) {
        this.destroy = true;
        asteroid.takeDamage(this.damage, this);
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
        ship.takeDamage(this.damage * 5, this);
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
          enemy.takeDamage(this.damage * 5, this);
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
    
    const strength = 10;
    this.attract(dt, strength);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    this.checkForHit();
  }
  
  draw(ctx) {
    const ALPHA = Math.min(this.time * 120, 255);
    let vx = this.x - this.px;
    let vy = this.y - this.py;
    
    if (this.owner == "enemy") {
      ctx.stroke(255, 80, 60, ALPHA);
    } else {
      ctx.stroke(60, 255, 80, ALPHA);
    }
    
    ctx.strokeWeight(this.r);
    ctx.line(this.x - vx * 3, this.y - vy * 3, this.x, this.y);
    
    this.px = this.x;
    this.py = this.y;
  }
}

class HomingBullet extends Bullet {
  constructor(x, y, vx, vy, owner) {
    super(x, y, vx, vy, owner);
    this.homingVelocity = Math.sqrt(vx ** 2 + vy ** 2);
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
    let angle = atan2(this.vy, this.vx) + PI;
    let shortestDist = Infinity;
    let selectedTarget = null;
    for (let target of targets) {
      let angleTo = atan2(target.y - this.y, target.x - this.x) + PI;
      let angleDiff = smallestAngleDifference(angle, angleTo);
      if (Math.abs(angleDiff) > PI * 0.4) continue;
      let d = dist(this.x, this.y, target.x, target.y);
      if (d < shortestDist) {
        shortestDist = d;
        selectedTarget = target;
      }
    }
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

function spawnBullet(x, y, vx, vy, owner, type, damage = 1) {
  let bullet = null;
  switch (type) {
    case "homing": bullet = new HomingBullet(x, y, vx, vy, owner, damage); break;
    default: bullet = new Bullet(x, y, vx, vy, owner, damage); break;
  }
  bullets.push(bullet);
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

/*



















*/
