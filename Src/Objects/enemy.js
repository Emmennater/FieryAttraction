
enemies = [];

const enemyStrengthThresholds = { normal: 500, homing: 800, speed: 800, mega: 1000, black: 1000, space: 1200 };
const ENEMY_TYPE_CAPS = { black: 3, mega: 5 };

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
    this.setHealth(15, 15);
    this.speed = 10;
    this.sprite = enemySprite;
    this.bulletType = Bullet;
    this.damage = 2 / 5;
    this.range = 200;
    this.playerRange = 150;
    this.topSpeed = 100;
    this.slainByPlayer = false;
    this.worth = 20;

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
    this.maxTargetAngleError = 0.4;
  }

  grantEffect(object) {
    if (!object) return;
    object.addHealth(randInt(7, 15));
    object.addAmmo(randInt(10, 20));
    object.addFuel(randInt(5, 10));
  }

  onDestroy(damageSource) {
    spawnExplosion(this.x, this.y, this);
    if (damageSource && damageSource.owner && damageSource.owner.name == "ship") {
      this.slainByPlayer = true;
      hud.addScore(this.worth);
      if (damageSource && damageSource.owner) {
        this.grantEffect(damageSource.owner);
        
        // If this enemy has an effect give it to the bullet owner
        for (let effect of this.effects) {
          const level = effect.level;
          const Effect = effect.constructor;
          const duration = randInt(0, 10) + this.worth;
          damageSource.owner.applyEffect(Effect, { level, duration });
        }
      }
    }
  }

  fireAtPlayer(dirOffset, dt, closeToStar) {
    
    // Variables
    let bSpeedMult = this.lastBullet ? this.lastBullet.speed : 1;
    
    const finalTargetAngle = getInterceptAngle(this, ship, bSpeedMult * this.bSpeed);
    const intercepts = !isNaN(finalTargetAngle);

    if (intercepts) {
      this.steerTargetAngle(dt, finalTargetAngle - this.a);
    }
    
    // Accelerate towards player
    const distToPlayer = dist(this.x, this.y, ship.x, ship.y);
    const closeToPlayer = distToPlayer > this.playerRange;
    if (closeToPlayer || closeToStar) {
      this.control.boost = true;
      this.vx += cos(this.a + this.control.steeringAngle) * this.speed * dt;
      this.vy += sin(this.a + this.control.steeringAngle) * this.speed * dt;
    }
    
    // Return if no intercepts
    if (!intercepts) return;

    const angleFromTarget = smallestAngleDifference(this.control.steeringAngle, finalTargetAngle - this.a);
    const angleCloseToTarget = Math.abs(angleFromTarget) < this.maxTargetAngleError;
    
    this.bTime -= dt;
    if (this.bTime > 0 || !angleCloseToTarget) return;

    let bulletAngle = this.control.steeringAngle + this.a;

    // Adding bullet stray
    const DIST_TO_TARGET = dist(this.x, this.y, ship.x, ship.y);
    const STRAY_MULT = sqrt(DIST_TO_TARGET) / 20;
    let stray = (Math.random() * this.bStray - this.bStray / 2) * STRAY_MULT;
    bulletAngle += stray;

    // Setting target angle
    // let bvx = cos(bulletAngle) * this.bSpeed;
    // let bvy = sin(bulletAngle) * this.bSpeed;

    const multishot = this.multishot;
    const spreadAngle = PI * 0.1;
    const angleGap = spreadAngle / multishot;
    let bullet = null;
    
    const s = this.s * 0.75;
    const leftWingX = this.x - cos(bulletAngle - HALF_PI) * s + cos(bulletAngle) * s * 0.5;
    const leftWingY = this.y - sin(bulletAngle - HALF_PI) * s + sin(bulletAngle) * s * 0.5;
    const rightWingX = this.x - cos(bulletAngle + HALF_PI) * s + cos(bulletAngle) * s * 0.5;
    const rightWingY = this.y - sin(bulletAngle + HALF_PI) * s + sin(bulletAngle) * s * 0.5;

    for (let i = 0; i < multishot; i++) {
      let a = bulletAngle - spreadAngle / 2;
      a += angleGap * (i + 0.5);

      let x, y;

      if (Math.abs(a - bulletAngle) < 0.01) {
        x = this.x + cos(a) * this.s;
        y = this.y + sin(a) * this.s;
      } else {
        const t = (a - bulletAngle + spreadAngle / 2) / spreadAngle;
        x = lerp(rightWingX, leftWingX, t);
        y = lerp(rightWingY, leftWingY, t);
      }

      let vx = cos(a) * this.bSpeed; // + this.vx
      let vy = sin(a) * this.bSpeed; // + this.vy
      
      // Shoot bullet
      bullet = spawnBullet({
        x: this.x, y: this.y, vx, vy,
        owner: this,
        Type: this.bulletType,
        damageMult: this.damage,
        level: this.bulletLevel,
        bCol: this.bCol,
        gravity: this.bGravity,
        decay: this.bDecay,
        impactForce: this.bImpactForce
      });
    }

    this.bTime = bullet.delay * this.bDelay;
  }
  
  strengthen(percent) {
    this.damage *= percent;
    this.bSpeed *= percent;
    this.speed *= percent;
    // this.topSpeed *= percent;
    // this.health *= percent;
    this.bImpactForce *= percent;
    this.range = Math.min(this.range * percent, 500); // Cap range at 500
  }

  move(dt) {
    // Gravity
    this.attract(dt, 1);

    const closestStar = system.getClosestStar(this.x, this.y);
    const star = closestStar.star;
    const d = closestStar.dist;

    // Distance to star
    let dx = star.x - this.x;
    let dy = star.y - this.y;

    // Damage from star
    let damage = Math.max(star.r - d, 0) / 4;
    damage = round(damage * 10) / 10;
    
    if (damage > 0 && this.damageTime++ >= this.damageDelay) {
      this.damageTime = 0;
      this.takeDamage(damage);
    }

    // Steer away from star
    let A = this.a;
    let a = atan2(dy, dx);
    A = ((A + TWO_PI) % TWO_PI + TWO_PI);
    a = ((a + TWO_PI) % TWO_PI + TWO_PI);
    let turnAway = star.r / d;
    let angleAway1 = a - HALF_PI - turnAway;
    let angleAway2 = a + HALF_PI + turnAway;
    
    // Find closer angle
    let diff1 = Math.abs(A - angleAway1);
    let diff2 = Math.abs(A - angleAway2);
    let targetAngle = diff1 < diff2 ? angleAway1 : angleAway2;
    let angleDelta = targetAngle - A;
    
    // Attacking priority
    let distToPlayer = dist(this.x, this.y, ship.x, ship.y);
    let closeToStar = d < star.r * 1.3;
    let closeToPlayer = distToPlayer < this.range;
    let escapeStar = false;

    // Conditions for boosting away from star
    if (d < star.r + 80) escapeStar = true;
    if (closeToStar && !closeToPlayer) escapeStar = true;

    // Boosting
    this.control.boost = false;
    if (escapeStar) {
      this.steerTargetAngle(dt, angleDelta);
      const angleFromTarget = smallestAngleDifference(this.control.steeringAngle, angleDelta);
      const angleCloseToTarget = Math.abs(angleFromTarget) < 0.1;

      if (angleCloseToTarget) {
        this.control.boost = true;
        
        // Acceleration
        this.vx += cos(this.a + this.control.steeringAngle) * this.speed * dt;
        this.vy += sin(this.a + this.control.steeringAngle) * this.speed * dt;
      }
    } else if (closeToPlayer) {
      // Aiming at player
      let dir = diff1 < diff2 ? -1 : 1;
      this.fireAtPlayer(dir, dt, closeToStar);
    } else {
      this.steerTargetAngle(dt, 0);
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
    this.bulletType = ExplosiveBullet;
    this.sprite = blackEnemySprite;
    this.setHealth(25, 25);
    this.worth = 30;

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
    this.bulletType = SpeedBullet;
    this.sprite = speedEnemySprite;
    this.revive = false;
    this.range = 200;
    this.playerRange = 100;
    this.speed = 80;
    this.topSpeed = 300;
    this.setHealth(20, 20);
    this.worth = 25;
    
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
      duration: randInt(20, 40)
    });
  }
}

class HomingEnemy extends Enemy {
  constructor(x, y, vx, vy) {
    super(x, y, vx, vy);
    this.type = "homing";
    this.bulletType = HomingBullet;
    this.sprite = homingEnemySprite;
    this.setHealth(20, 20);
    this.worth = 25;

    // Bullet attributes
    this.bImpactForce = 1;
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
    this.bulletType = MegaBullet;
    this.setHealth(25, 25);
    this.range = 250;
    this.playerRange = 100;
    this.speed = 80;
    this.worth = 35;

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

class SpaceEnemy extends Enemy {
  constructor(x, y, vx, vy) {
    super(x, y, vx, vy);
    this.type = "space";
    this.bulletType = SpaceBullet;
    this.sprite = spaceEnemySprite;
    this.setHealth(25, 25);
    this.worth = 35;
    this.speed = 80;
    this.topSpeed = 300;
    this.maxTargetAngleError = PI;

    // Bullet attributes
    this.bStray = 20;

    this.exaustCol = this.oldExaustCol = {
      min: { r: 30, g: 180, b: 200, a: 100 },
      add: { r: 40, g: 30, b: 50, a: 0 }
    };
  }
}

function initEnemies(count) {
  if (noSpawns) return;
  // const a = atan2(ship.y, ship.x);
  // const enemy = createEnemy("space", ship.x + cos(a) * 300, ship.y + sin(a) * 300, 0, 0);
  // enemy.applyEffect(MultiShot, { duration: 10000, level: 1 });
  // enemies.push(enemy);

  if (count == 4) {
    spawnEnemy("speed");
    count--;
  }
  
  for (let i = 0; i < count; i++)
    spawnEnemy();
}

function createEnemy(type, x = 0, y = 0, vx = 0, vy = 0) {
  let enemy;
  
  switch (type) {
    case "homing": enemy = new HomingEnemy(x, y, vx, vy); break;
    case "speed": enemy = new SpeedEnemy(x, y, vx, vy); break;
    case "mega": enemy = new MegaEnemy(x, y, vx, vy); break;
    case "black": enemy = new BlackEnemy(x, y, vx, vy); break;
    case "space": enemy = new SpaceEnemy(x, y, vx, vy); break;
    default: enemy = new Enemy(x, y, vx, vy);
  }

  return enemy;
}

function spawnEnemy(type = "normal") {
  const { pos, angle } = system.getRandomSpawn(100, 200, 600);
  const { x, y } = pos;

  let speed = randInt(20, 40);
  let vx = Math.cos(angle) * speed;
  let vy = Math.sin(angle) * speed;
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
    const level = Math.ceil((Math.random() ** 3) * 3);
    enemy.applyEffect(RandomEffect, { duration: 100000000, level });
  }

  enemies.push(enemy);
}

function destroyEnemy(enemy, i = enemies.indexOf(enemy)) {
  if (i == -1) return;
  enemies.splice(i, 1);

  // Respawn (same type if not killed by player)
  let type = (!enemy.slainByPlayer) ? enemy.type : randomEnemyType();
  spawnEnemy(type);
}

function moveEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; --i) {
    const enemy = enemies[i];

    if (enemy.destroyed) {
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

function getEnemiesOfType(Type) {
  return enemies.filter((enemy) => enemy.constructor === Type);
}

function randomEnemyType() {
  const difficulty = Math.floor(hud.score / 100);

  const typeChances = {
    normal: 75,
    speed: 10 + difficulty,
    homing: 5 + difficulty,
    space: 1 + difficulty * 0.5,
    mega: 2 + difficulty * 0.5,
    black: 3 + difficulty
  };

  // Don't spawn enemies that reached the cap
  for (let key in typeChances) {
    const nEnemies = getEnemiesOfType(key).length;
    if (nEnemies > ENEMY_TYPE_CAPS[key]) {
      delete typeChances[key];
    }
  }

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
  const upgradePath = ["normal", "speed", "homing", "black", "mega", "space"];
  const newIndex = upgradePath.indexOf(enemyType) + 1;

  if (newIndex >= upgradePath.length) return false;

  const nextType = upgradePath[newIndex];

  // Check if the next type is at the cap
  if (getEnemiesOfType(nextType).length >= ENEMY_TYPE_CAPS[nextType]) {
    return false;
  }

  const newEnemy = createEnemy(nextType);

  // Copy over the old enemy's properties
  newEnemy.x = enemy.x;
  newEnemy.y = enemy.y;
  newEnemy.vx = enemy.vx;
  newEnemy.vy = enemy.vy;
  newEnemy.health = newEnemy.maxHealth - (enemy.maxHealth - enemy.health);
  newEnemy.control.steeringAngle = enemy.control.steeringAngle;
  newEnemy.bTime = enemy.bTime;
  newEnemy.lastBullet = enemy.lastBullet;
  newEnemy.slainByPlayer = enemy.slainByPlayer;
  newEnemy.destroyed = enemy.destroyed;

  // Replace old enemy with new one
  enemies[enemyIndex] = newEnemy;

  return true;
}

function upgradeRandomEnemy() {
  let index = getRandomEnemyIndex();
  const initIndex = index;

  while (!upgradeEnemyAt(index)) {
    index = (index + 1) % enemies.length;
    if (index == initIndex) return false;
  }

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
