
bullets = [];

class Bullet extends GravityObject {
  constructor(x, y, vx, vy, owner = "player") {
    super(x, y, 2000);
    this.r = 0.5;
    this.vx = vx;
    this.vy = vy;
    this.time = 60 * 4;
    this.destroy = false;
    this.px = x;
    this.py = y;
    this.owner = owner;
  }
  
  checkForHit() {
    for (let asteroid of asteroids) {
      const sz = asteroid.r / 2;
      if (asteroid.x > this.x - sz &&
          asteroid.x < this.x + sz &&
          asteroid.y > this.y - sz &&
          asteroid.y < this.y + sz) {
        this.destroy = true;
        asteroid.takeDamage(1, this.owner);
        htmlSounds.playSound(hitSound, 0.5);
        // sounds.playRandomly(hitSound, 0.5);
        return;
      }
    }
    
    if (this.owner == "enemy") {
      // Ship
      const sz = ship.s / 2;
      if (ship.x > this.x - sz &&
          ship.x < this.x + sz &&
          ship.y > this.y - sz &&
          ship.y < this.y + sz) {
        this.destroy = true;
        ship.takeDamage(5, this.owner);
        hud.addCameraShake(10, 10);
        htmlSounds.playSound(hitSound, 0.5);
        // sounds.playRandomly(hitSound, 0.5);
        return;
      }
    }
    
    if (this.owner == "player") {
      // Enemies
      for (let enemy of enemies) {
        const sz = enemy.s / 2;
        if (enemy.x > this.x - sz &&
            enemy.x < this.x + sz &&
            enemy.y > this.y - sz &&
            enemy.y < this.y + sz) {
          this.destroy = true;
          enemy.takeDamage(5, this.owner);
          htmlSounds.playSound(hitSound, 0.5);
          // sounds.playRandomly(hitSound, 0.5);
          return;
        }
      }
    }
  }
  
  move(dt) {
    if (this.time-- < 0) {
      this.destroy = true;
    }
    
    this.attract(dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    this.checkForHit();
  }
  
  draw(ctx) {
    const ALPHA = Math.min(this.time * 2, 255);
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

function spawnBullet(x, y, vx, vy, owner = "player") {
  const bullet = new Bullet(x, y, vx, vy, owner);
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
