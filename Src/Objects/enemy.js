
enemies = [];

class Enemy extends Ship {
  constructor(x, y, vx, vy) {
    super(x, y);
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.m = 100;
    this.steerAngle = 0;
    this.bSpeed = 100;
    this.bTime = 0;
    this.bDelay = 20;
    this.health = 20;
    this.speed = 10;
    this.sprite = enemySprite;
  }
  
  takeDamage(damage, owner) {
    this.health -= damage;
    if (this.health <= 0) {
      this.destroy = true;
      spawnExplosion(this.x, this.y, this);
      if (owner == "player") {
        hud.addScore(25);
      }
    }
  }
  
  fireAtPlayer(dirOffset, dt) {

    // Accelerate towards player
    this.control.boost = true;
    this.vx += cos(this.a + this.control.steeringAngle) * this.speed * dt;
    this.vy += sin(this.a + this.control.steeringAngle) * this.speed * dt;

    if (this.bTime-- > 0) return;
    this.bTime = this.bDelay;
    
    let shipSpeed = Math.sqrt(ship.vx ** 2 + ship.vy ** 2);
    let dvx = ship.vx / shipSpeed;
    let dvy = ship.vy / shipSpeed;
    
    let distToSun = dist(this.x, this.y, sun.x, sun.y);
    let distToPlayer = dist(this.x, this.y, ship.x, ship.y);
    let targetY = ship.y + dvy * distToPlayer / 20;
    let targetX = ship.x + dvx * distToPlayer / 20;
    let angleOffset = dirOffset * 0.1;
    
    let angleToPlayer = atan2(targetY - this.y, targetX - this.x);
    let angleDelta = angleToPlayer - this.a + angleOffset;
    // this.control.steeringAngle = lerp(this.control.steeringAngle, angleDelta, 0.1)
    this.control.steeringAngle = angleDelta;
    let A = this.control.steeringAngle + Math.random() * 0.2 - 0.1;
    let bvx = cos(this.a + A) * this.bSpeed + this.vx;
    let bvy = sin(this.a + A) * this.bSpeed + this.vy;
    spawnBullet(this.x, this.y, bvx, bvy, "enemy");

    // CTX.stroke(255, 0, 0);
    // CTX.strokeWeight(2);
    // CTX.line(
    //   this.x,
    //   this.y,
    //   this.x + cos(this.a + A) * 100,
    //   this.y + sin(this.a + A) * 100
    // );
  }
  
  move(dt) {
    // Distance to sun
    let dx = sun.x - this.x;
    let dy = sun.y - this.y;
    let d = sqrt(dx ** 2 + dy ** 2);
    let vx = dx / d;
    let vy = dy / d;
    let g = this.m * sun.m / (d ** 2);
    let grav = (g + Math.max(d - sun.r * 1.5, 0) * 0.05);
    
    let damage = Math.max(sun.r - d, 0) / 4;
    damage = round(damage * 10) / 10;
    
    if (damage > 0 && this.damageTime++ >= this.damageDelay) {
      this.damageTime = 0;
      this.takeDamage(damage);
    }
    
    let ForceX = vx * grav;
    let ForceY = vy * grav;
    this.vx += ForceX * dt;
    this.vy += ForceY * dt;
    
    // Steer away from sun
    let A = this.a;
    let a = atan2(dy, dx);
    A = ((A + TWO_PI) % TWO_PI + TWO_PI);
    a = ((a + TWO_PI) % TWO_PI + TWO_PI);
    let turnAway = sun.r / d;
    let angleAway1 = a - HALF_PI - turnAway;
    let angleAway2 = a + HALF_PI + turnAway;
    
    // Find closer angle
    let diff1 = Math.abs(A - angleAway1);
    let diff2 = Math.abs(A - angleAway2);
    let targetAngle = diff1 < diff2 ? angleAway1 : angleAway2;
    let angleDelta = targetAngle - A;
    
    // Boosting
    if (d < sun.r * 1.3) {
      this.steerAngle = lerp(this.steerAngle, angleDelta, 0.05);
      this.control.steeringAngle = this.steerAngle;
      this.control.boost = true;
      
      // Acceleration
      this.vx += cos(this.a + this.control.steeringAngle) * this.speed * dt;
      this.vy += sin(this.a + this.control.steeringAngle) * this.speed * dt;
      
    } else {
      this.control.boost = false;
      
      // Aiming at player
      let distToPlayer = dist(this.x, this.y, ship.x, ship.y);
      if (distToPlayer < 200) {
        let dir = diff1 < diff2 ? -1 : 1;
        this.fireAtPlayer(dir, dt);
      }
    }
    
    // Constrain velocity
    let maxSpeed = 40;
    let sp = Math.sqrt(this.vx ** 2 + this.vy ** 2);
    let ns = Math.min(sp, maxSpeed) / sp;
    this.vx = this.vx * ns;
    this.vy = this.vy * ns;
    
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

function initEnemies() {
  for (let i = 0; i < 3; i++)
    spawnEnemy();
}

function spawnEnemy(playerCheck = true) {
  let t = Math.random() * TWO_PI;
  
  // Player check
  if (playerCheck) {
    let dx = sun.x - ship.x;
    let dy = sun.y - ship.y;
    let a = atan2(dy, dx);
    t = a + Math.random() * HALF_PI - QUARTER_PI;
  }
  
  let d = sun.r + 100 + Math.random() * 100;
  let r = Math.random() * 10 + 10;
  let x = Math.cos(t) * d;
  let y = Math.sin(t) * d;
  let s = Math.random() * 20 + 20;
  let dir = Math.random() < 0.5 ? 1 : -1;
  let vx = Math.cos(t + HALF_PI) * s * dir;
  let vy = Math.sin(t + HALF_PI) * s * dir;
  let enemy = new Enemy(x, y, vx, vy);
  
  enemies.push(enemy);
}

function moveEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; --i) {
    const enemy = enemies[i];
    if (enemy.destroy) {
      enemies.splice(i, 1);
      spawnEnemy();
      if (Math.random() < 0.5)
        spawnEnemy();
      continue;
    }
    enemy.move(dt);
  }
}

function drawEnemies(ctx) {
  for (let enemy of enemies) {
    enemy.draw(ctx);
  }
}

/*





















*/
