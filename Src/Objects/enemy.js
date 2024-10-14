
enemies = [];

const enemyStrengthThresholds = { normal: 500, homing: 800, speed: 800, mega: 1000, black: 1000 };

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
    this.health = 15;
    this.speed = 10;
    this.sprite = enemySprite;
    this.bulletType = "normal";
    this.damage = 2 / 5;
    this.range = 200;
    this.playerRange = 150;
    this.topSpeed = 100;
    this.slainByPlayer = false;

    // Bullet attributes
    this.bDelay = 2;
    this.bSpeed = 100;
    this.bTime = 0;
    this.bImpactForce = 1;
    this.bGravity = 0;
    this.bDecay = 1;
    this.bCol = { r:255, g:80, b:60 };
    this.bStray = 0.6; // 0.2
    this.lastBullet = null;
  }

  grantEffect(object) {
    if (!object) return;
    object.addHealth(randInt(7, 15));
    object.addAmmo(randInt(10, 20));
    object.addFuel(randInt(5, 10));
  }

  onDestroy(damageSource) {
    // Already destroyed
    if (this.destroy) return;

    this.destroy = true;

    spawnExplosion(this.x, this.y, this);
    if (damageSource && damageSource instanceof Bullet && damageSource.owner.name == "ship") {
      this.slainByPlayer = true;
      hud.addScore(25);
      if (damageSource && damageSource.owner)
        this.grantEffect(damageSource.owner);
    }
  }

  takeDamage(damage, bullet) {
    this.health -= damage;
    if (this.health <= 0) {
      this.onDestroy(bullet);
    }
  }

  fireAtPlayer(dirOffset, dt, closeToSun) {
    // Accelerate towards player
    const distToPlayer = dist(this.x, this.y, ship.x, ship.y);
    if (distToPlayer > this.playerRange || closeToSun) {
      this.control.boost = true;
      this.vx += cos(this.a + this.control.steeringAngle) * this.speed * dt;
      this.vy += sin(this.a + this.control.steeringAngle) * this.speed * dt;
    }
    
    // Variables
    let bSpeedMult = this.lastBullet ? this.lastBullet.speed : 1;
    
    // Calculating projectile info
    let angleToTarget = atan2(ship.y - this.y, ship.x - this.x);
    let angleOfTarget = atan2(ship.vy, ship.vx);
    angleToTarget = ((angleToTarget % TWO_PI) + TWO_PI) % TWO_PI;
    angleOfTarget = ((angleOfTarget % TWO_PI) + TWO_PI) % TWO_PI;
    let targetSpeed = Math.sqrt(ship.vx ** 2 + ship.vy ** 2);
    let bulletSpeed = this.bSpeed * bSpeedMult;

    // Calculating target angle
    let B = angleOfTarget - angleToTarget;
    let A = asin(sin(B) * targetSpeed / bulletSpeed);
    let finalTargetAngle = angleToTarget + A;

    this.steerTargetAngle(dt, finalTargetAngle - this.a);

    this.bTime -= dt;
    if (this.bTime > 0) return;

    let bulletAngle = this.control.steeringAngle + this.a;

    // Adding bullet stray
    const DIST_TO_TARGET = dist(this.x, this.y, ship.x, ship.y);
    const STRAY_MULT = sqrt(DIST_TO_TARGET) / 20;
    let stray = (Math.random() * this.bStray - this.bStray / 2) * STRAY_MULT;
    bulletAngle += stray;

    // Setting target angle
    let bvx = cos(bulletAngle) * bulletSpeed;
    let bvy = sin(bulletAngle) * bulletSpeed;

    // Shoot bullet
    const bullet = spawnBullet({
      x:this.x, y:this.y, vx:bvx, vy:bvy,
      owner:this,
      type:this.bulletType,
      damageMult:this.damage,
      bCol:this.bCol,
      gravity:this.bGravity,
      decay:this.bDecay,
      impactForce:this.bImpactForce
    });

    this.bTime = bullet.delay * this.bDelay;
  }
  
  strengthen(percent) {
    this.damage *= percent;
    this.bSpeed *= percent;
    this.speed *= percent;
    this.topSpeed *= percent;
    this.health *= percent;
    this.bImpactForce *= percent;
    this.range = Math.min(this.range * percent, 500); // Cap range at 500
  }

  move(dt) {
    // Gravity
    this.attract(dt, 1);

    // Distance to sun
    let dx = sun.x - this.x;
    let dy = sun.y - this.y;
    let d = sqrt(dx ** 2 + dy ** 2);

    // Damage from sun
    let damage = Math.max(sun.r - d, 0) / 4;
    damage = round(damage * 10) / 10;
    
    if (damage > 0 && this.damageTime++ >= this.damageDelay) {
      this.damageTime = 0;
      this.takeDamage(damage);
    }
    
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
      this.steerTargetAngle(dt, angleDelta);
      this.control.boost = true;
      
      // Acceleration
      this.vx += cos(this.a + this.control.steeringAngle) * this.speed * dt;
      this.vy += sin(this.a + this.control.steeringAngle) * this.speed * dt;
      
    } else if (closeToPlayer) {
      // Aiming at player
      let dir = diff1 < diff2 ? -1 : 1;
      this.fireAtPlayer(dir, dt, closeToSun);
    }
    
    // Constrain velocity
    let maxSpeed = this.control.boost ? this.topSpeed : 40;
    let sp = Math.sqrt(this.vx ** 2 + this.vy ** 2);
    let ns = Math.min(sp, maxSpeed) / sp;
    this.vx = lerp(this.vx, this.vx * ns, 0.1);
    this.vy = lerp(this.vy, this.vy * ns, 0.1);
    
    this.control.steeringAngle += this.control.steerVel * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.updateMesh();
  }
}

class BlackEnemy extends Enemy {
  constructor(x, y, vx, vy) {
    super(x, y, vx, vy);
    this.type = "black";
    this.bulletType = "explosive";
    this.sprite = blackEnemySprite;
    this.health = 25;

    // Boost attributes
    this.oldExaustCol = {
      min: { r: 0, g: 0, b: 0, a: 100 },
      add: { r: 255, g: 255, b: 255, a: 0 }
    };
    this.exaustCol = this.oldExaustCol;

    // Bullet attributes
    this.bCol = { r:100, g:0, b:0 };
    this.damage = 1;
    this.bImpactForce = 3;
    this.exaustDelay = 20;
  }

  grantEffect(object) {
    super.grantEffect(object);
    object.applyEffect(ExplosiveRounds, {
      duration: randInt(10, 20)
    })
  }

  drawBoost(ctx) {
    const exaustCol1 = {
      min: { r: 0, g: 0, b: 0, a: 100 },
      add: { r: 0, g: 0, b: 0, a: 0 }
    };
    const exaustCol2 = {
      min: { r: 0, g: 0, b: 0, a: 100 },
      add: { r: 255, g: 0, b: 0, a: 0 }
    };

    // Alternate exaust color
    this.oldExaustCol = (Math.random() < 0.1) ? exaustCol2 : exaustCol1;
    this.exaustCol = this.oldExaustCol;

    super.drawBoost(ctx);
  }
}

class SpeedEnemy extends Enemy {
  constructor(x, y, vx, vy) {
    super(x, y, vx, vy);
    this.type = "speed";
    this.bulletType = "speed";
    this.sprite = speedEnemySprite;
    this.revive = false;
    this.range = 200;
    this.playerRange = 100;
    this.speed = 80;
    this.topSpeed = 300;
    this.health = 20;
    
    // Bullet attributes
    this.bDelay = 1;
    this.bImpactForce = 0.25;
    this.bGravity = 0.0;
    this.bDecay = 1;
    this.bStray = 0.6;

    this.exaustCol = this.oldExaustCol = {
      min: { r: 30, g: 180, b: 200, a: 100 },
      add: { r: 40, g: 30, b: 50, a: 0 }
    };
  }

  grantEffect(object) {
    super.grantEffect(object);
    object.applyEffect(SpeedRounds, {
      duration: randInt(40, 80)
    });
  }
}

class HomingEnemy extends Enemy {
  constructor(x, y, vx, vy) {
    super(x, y, vx, vy);
    this.type = "homing";
    this.bulletType = "homing";
    this.sprite = homingEnemySprite;
    this.health = 20;

    // Bullet attributes
    this.bDelay = 1;
    this.bSpeed = 200;
    this.bGravity = 0.0;
    this.bDecay = 0.5;
    this.range = 300;
  }

  grantEffect(object) {
    super.grantEffect(object);
    object.applyEffect(HomingRounds, {
      duration: randInt(20, 40)
    });
  }
}

class MegaEnemy extends HomingEnemy {
  constructor(x, y, vx, vy) {
    super(x, y, vx, vy);
    this.type = "mega";
    this.bulletType = "mega";
    this.health = 25;
    this.range = 250;
    this.playerRange = 100;
    this.speed = 80;

    // Bullet attributes
    this.bDelay = 1;
    this.bImpactForce = 0.25;
    this.bGravity = 0.0;
    this.bDecay = 0.75;
    this.bStray = 0.5;
    this.sprite = megaEnemySprite;

    // Speed exaust
    this.exaustCol = this.oldExaustCol = {
      min: { r: 30, g: 180, b: 200, a: 100 },
      add: { r: 40, g: 30, b: 50, a: 0 }
    };
  }

  grantEffect(object) {
    Enemy.prototype.grantEffect.call(this, object);
    object.applyEffect(MegaRounds, {
      duration: randInt(20, 40)
    });
  }
}

function initEnemies() {
  if (noSpawns) return;
  // enemies.push(new Enemy(ship.x, ship.y - 300, 0, 0));
  for (let i = 0; i < 2; i++)
    spawnEnemy(true);
}

function createEnemy(type, x = 0, y = 0, vx = 0, vy = 0) {
  let enemy;
  
  switch (type) {
    case "homing": enemy = new HomingEnemy(x, y, vx, vy); break;
    case "speed": enemy = new SpeedEnemy(x, y, vx, vy); break;
    case "mega": enemy = new MegaEnemy(x, y, vx, vy); break;
    case "black": enemy = new BlackEnemy(x, y, vx, vy); break;
    default: enemy = new Enemy(x, y, vx, vy);
  }

  return enemy;
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
  let enemy = createEnemy(type, x, y, vx, vy);

  // Strength
  const threshold = enemyStrengthThresholds[enemy.type];
  if (!threshold) throw new Error(`Unknown enemy type: ${enemy.type}`);
  const strengthPercent = 1 + Math.floor(hud.score / threshold) * 0.2;
  enemy.strengthen(strengthPercent);

  // Random effect
  const effects = [SuperSpeed, HomingRounds, SpeedRounds, MegaRounds, ExplosiveRounds, MultiShot];
  if (Math.random() < 0.03) {
    let RandomEffect = effects[Math.floor(Math.random() * effects.length)];
    const level = Math.ceil(Math.sqrt(Math.random() * 9));
    enemy.applyEffect(RandomEffect, { duration: 100000000, level });
  }

  enemies.push(enemy);
}

function destroyEnemy(enemy, i = enemies.indexOf(enemy)) {
  if (i == -1) return;
  enemies.splice(i, 1);

  // Respawn (same type if not killed by player)
  let type = (!enemy.slainByPlayer) ? enemy.type : randomEnemyType();
  spawnEnemy(true, type);
}

function moveEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; --i) {
    const enemy = enemies[i];

    if (enemy.destroy) {
      destroyEnemy(enemy, i);
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
  const difficulty = Math.floor(hud.score / 100);

  const typeChances = {
    normal: 75,
    speed: 10 + difficulty,
    homing: 5 + difficulty,
    mega: 2 + difficulty * 0.5,
    black: 4 + difficulty
  };

  // Calculate the total sum of all chances
  let totalChance = Object.values(typeChances).reduce((sum, chance) => sum + chance, 0);

  // Scale rand between 0 and totalChance
  let rand = Math.random() * totalChance;
  let cumulativeChance = 0;
  let type;

  // Iterate through each type and add up the chances
  for (let key in typeChances) {
    cumulativeChance += typeChances[key];
    if (rand <= cumulativeChance) {
      type = key;
      break;
    }
  }

  return type; // Return the randomly selected type
}

function getRandomEnemyIndex() {
  return Math.floor(Math.random() * enemies.length);
}

function upgradeEnemyAt(enemyIndex) {
  const enemy = enemies[enemyIndex];
  const enemyType = enemy.type;
  const upgradePath = ["normal", "speed", "homing", "mega", "black"];
  const newIndex = upgradePath.indexOf(enemyType) + 1;

  if (newIndex >= upgradePath.length) return false;

  const nextType = upgradePath[newIndex];
  const newEnemy = createEnemy(nextType);

  // Copy over the old enemy's properties
  newEnemy.x = enemy.x;
  newEnemy.y = enemy.y;
  newEnemy.vx = enemy.vx;
  newEnemy.vy = enemy.vy;
  newEnemy.health = enemy.health;
  newEnemy.control.steeringAngle = enemy.control.steeringAngle;
  newEnemy.bTime = enemy.bTime;
  newEnemy.lastBullet = enemy.lastBullet;
  newEnemy.slainByPlayer = enemy.slainByPlayer;

  // Replace old enemy with new one
  enemies[enemyIndex] = newEnemy;

  return true;
}

function blacklistEnemyTypes(enemyList, Classes) {
  const newList = enemyList.filter((enemy) => {
    for (let Class of Classes) {
      if (enemy instanceof Class) {
        return false;
      }
    }

    return true;
  });

  return newList;
}

/*





















*/
