
enemies = [];

class Enemy extends Ship {
  constructor(x, y, vx, vy) {
    super(x, y);
    this.name = "enemy";
    this.type = "normal";
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.steerAngle = 0;
    this.health = 20;
    this.speed = 10;
    this.sprite = enemySprite;
    this.bulletType = "normal";
    this.damage = 1;
    this.range = 200;
    this.topSpeed = 100;

    // Bullet attributes
    this.bSpeed = 100;
    this.bTime = 0;
    this.bDelay = 20 / 60;
    this.bImpactForce = 1;
    this.bGravity = 1;
    this.bDecay = 1;
    this.bCol = { r:255, g:80, b:60 };
    this.bStray = 0.2;
    this.lastBullet = null;
  }
  
  takeDamage(damage, bullet) {
    this.health -= damage;
    if (this.health <= 0) {
      this.destroy = true;
      spawnExplosion(this.x, this.y, this);
      if (bullet && bullet.owner.name == "ship") {
        hud.addScore(25);
      }
    }
  }
  
  fireAtPlayer(dirOffset, dt) {

    // Accelerate towards player
    const distToPlayer = dist(this.x, this.y, ship.x, ship.y);
    if (distToPlayer > 100) {
      this.control.boost = true;
      this.vx += cos(this.a + this.control.steeringAngle) * this.speed * dt;
      this.vy += sin(this.a + this.control.steeringAngle) * this.speed * dt;
    } else {
      // Slow down
      // this.vx *= 0.99;
      // this.vy *= 0.99;
    }

    this.bTime -= dt;
    if (this.bTime > 0) return;
    
    let shipSpeed = Math.sqrt(ship.vx ** 2 + ship.vy ** 2);
    let dvx = ship.vx / shipSpeed;
    let dvy = ship.vy / shipSpeed;
    
    let distToSun = dist(this.x, this.y, sun.x, sun.y);
    let targetY = ship.y + dvy * distToPlayer / 20;
    let targetX = ship.x + dvx * distToPlayer / 20;
    let angleOffset = dirOffset * 0.1;
    
    // Variables
    let bulletSpeed = this.lastBullet ? this.lastBullet.speed : 1;

    // Finding aim angle
    let angleToPlayer = atan2(targetY - this.y, targetX - this.x);
    // let playerAngle = atan2(ship.vy, ship.vx);
    // let B = playerAngle - angleToPlayer;
    // let tv = Math.sqrt(ship.vx ** 2 + ship.vy ** 2);
    // let bv = this.bSpeed + Math.sqrt(this.vx ** 2 + this.vy ** 2);
    // bv *= bulletSpeed;
    // let leadAngle = asin(sin(B) * tv / bv);
    let finalTargetAngle = angleToPlayer;
    // finalTargetAngle += leadAngle;


    // Using final angle to get bullet velocity
    let angleDelta = finalTargetAngle - this.a + angleOffset;
    this.control.steeringAngle = angleDelta;
    let A = this.control.steeringAngle + Math.random() * this.bStray - this.bStray / 2;
    // let A = this.control.steeringAngle;
    let bvx = cos(this.a + A) * this.bSpeed + this.vx;
    let bvy = sin(this.a + A) * this.bSpeed + this.vy;
    
    // let ang = this.a + this.control.steeringAngle;
    // CTX.stroke(255);
    // CTX.strokeWeight(1);
    // CTX.line(
    //   this.x,
    //   this.y,
    //   this.x + cos(ang) * 100,
    //   this.y + sin(ang) * 100
    // );

    // this.bTime -= dt;
    // if (this.bTime > 0) return;

    // Shoot bullet
    const bullet = spawnBullet({
      x:this.x, y:this.y, vx:bvx, vy:bvy,
      owner:this,
      type:this.bulletType,
      damage:this.damage,
      bCol:this.bCol,
      gravity:this.bGravity,
      decay:this.bDecay,
      impactForce:this.bImpactForce
    });

    this.bTime = bullet.delay;
  }
  
  move(dt) {
    // Distance to sun
    let dx = sun.x - this.x;
    let dy = sun.y - this.y;
    let d = sqrt(dx ** 2 + dy ** 2);
    let vx = dx / d;
    let vy = dy / d;
    let g = this.m * sun.m / (d ** 2) / this.m;
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
    
    // Attacking priority
    let distToPlayer = dist(this.x, this.y, ship.x, ship.y);
    let closeToSun = d < sun.r * 1.3;
    let closeToPlayer = distToPlayer < this.range;
    let escapeSun = false;

    // Conditions for boosting away from sun
    if (d < sun.r + 50) escapeSun = true;
    if (closeToSun && !closeToPlayer) escapeSun = true;

    // Boosting
    this.control.boost = false;
    if (escapeSun) {
      this.steerAngle = lerp(this.steerAngle, angleDelta, 0.05);
      this.control.steeringAngle = this.steerAngle;
      this.control.boost = true;
      
      // Acceleration
      this.vx += cos(this.a + this.control.steeringAngle) * this.speed * dt;
      this.vy += sin(this.a + this.control.steeringAngle) * this.speed * dt;
      
    } else if (closeToPlayer) {
      // Aiming at player
      let dir = diff1 < diff2 ? -1 : 1;
      this.fireAtPlayer(dir, dt);
    }
    
    // Constrain velocity
    let maxSpeed = this.control.boost ? this.topSpeed : 40;
    let sp = Math.sqrt(this.vx ** 2 + this.vy ** 2);
    let ns = Math.min(sp, maxSpeed) / sp;
    this.vx = lerp(this.vx, this.vx * ns, 0.1);
    this.vy = lerp(this.vy, this.vy * ns, 0.1);
    
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

class SpeedEnemy extends Enemy {
  constructor(x, y, vx, vy) {
    super(x, y, vx, vy);
    this.type = "speed";
    this.bulletType = "speed";
    this.sprite = speedEnemySprite;
    this.revive = false;
    this.damage = 0.5;
    this.range = 200;
    this.speed = 80;
    this.topSpeed = 300;
    this.health = 15;
    
    // Bullet attributes
    this.bDelay = 0.2;
    this.bImpactForce = 0.25;
    this.bGravity = 0.0;
    this.bDecay = 1;
    this.bStray = 0.1;

    this.exaustCol = this.oldExaustCol = {
      min: { r: 30, g: 180, b: 200, a: 100 },
      add: { r: 40, g: 30, b: 50, a: 0 }
    };
  }

  takeDamage(damage, bullet) {
    super.takeDamage(damage, bullet);
    if (this.destroy) {
      this.revive = !bullet || bullet.owner.name != "ship";
      if (bullet && bullet.owner.name == "ship")
        bullet.owner.applyEffect(SpeedRounds, {
          duration: 40
        });
    }
  }
}

class HomingEnemy extends Enemy {
  constructor(x, y, vx, vy) {
    super(x, y, vx, vy);
    this.type = "homing";
    this.bulletType = "homing";
    this.sprite = homingEnemySprite;
    this.revive = false;
    this.health = 25;
    this.damage = 0.25;
    this.bDelay = 0.2;
    this.bSpeed = 300;
    this.bGravity = 0.5;
    this.bDecay = 0.5;
    this.range = 300;
  }

  takeDamage(damage, bullet) {
    super.takeDamage(damage, bullet);
    if (this.destroy) {
      this.revive = !bullet || bullet.owner.name != "ship";
      if (bullet && bullet.owner.name == "ship")
        bullet.owner.applyEffect(HomingRounds, {
          duration: 40
        });
    }
  }
}

function initEnemies() {
  for (let i = 0; i < 3; i++)
    spawnEnemy(true);
}

function spawnEnemy(playerCheck = true, type = "normal") {
  let t = Math.random() * TWO_PI;
  
  // Player check
  if (playerCheck) {
    let dx = sun.x - ship.x;
    let dy = sun.y - ship.y;
    let a = atan2(dy, dx);
    t = a + Math.random() * 4 - 2;
  }
  
  let d = sun.r + 100 + Math.random() * 100;
  let r = Math.random() * 10 + 10;
  let x = Math.cos(t) * d;
  let y = Math.sin(t) * d;
  let s = Math.random() * 20 + 20;
  let dir = Math.random() < 0.5 ? 1 : -1;
  let vx = Math.cos(t + HALF_PI) * s * dir;
  let vy = Math.sin(t + HALF_PI) * s * dir;
  let enemy = null;
  
  switch (type) {
    case "homing": enemy = new HomingEnemy(x, y, vx, vy); break;
    case "speed": enemy = new SpeedEnemy(x, y, vx, vy); break;
    default: enemy = new Enemy(x, y, vx, vy); break;
  }

  enemies.push(enemy);
}

function moveEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; --i) {
    const enemy = enemies[i];
    if (enemy.destroy) {
      enemies.splice(i, 1);

      // Respawn
      let type = "normal";
      if (enemy.revive)
        type = enemy.type;
      spawnEnemy(true, type);

      // Chance for more
      if (Math.random() < 0.5) {
        let type = randomEnemyType();
        spawnEnemy(true, type);
      }

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

function randomEnemyType() {
  let rand = Math.random();
  if (rand < 0.25) return "homing";
  else if (rand < 0.5) return "speed";
  else return "normal";
}

/*





















*/
