
enemies = [];

const enemySpawnThresholds = { normal: 0, homing: 100, speed: 100, ultraspeed: 300, mega: 250, black: 300, hurricane: 300 };
const enemyStrengthThresholds = { normal: 500, homing: 800, speed: 800, mega: 1000, black: 1000, hurricane: 1200, ultraspeed: 1200 };
const ENEMY_TYPE_CAPS = { black: 3, mega: 5 };

class Enemy extends Ship {
  constructor(x, y, vx, vy, s = 10) {
    super(x, y, s);
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
    this.range = 300;
    this.playerRange = 150;
    this.topSpeed = 100;
    this.slainByPlayer = false;
    this.worth = 20;
    this.combatProtocol = "neutral";
    this.lookingAtTarget = false;
    this.enemyLockonTimer = 0;
    this.lockonTime = 5;

    // Bullet attributes
    this.bDelay = 2;
    this.bSpeed = 100;
    this.bTime = 0;
    this.bImpactForce = 1;
    this.bGravity = 0;
    this.bDecay = 1;
    this.bCol = { r:255, g:80, b:60 };
    this.bStray = 1.0; // 0.2 0.6
    this.lastBullet = null;
    this.maxTargetAngleError = 0.4;
  }

  getProtocol(dt) {
    const closestStar = system.getClosestStar(this.x, this.y);
    const star = closestStar.star;
    const d = closestStar.dist;

    const closeToStar = d < star.r + 120;

    if (closeToStar) return "escape star";

    const distToPlayer = dist(this.x, this.y, ship.x, ship.y);
    const closeToPlayer = distToPlayer < this.range;

    this.enemyLockonTimer = Math.max(0, this.enemyLockonTimer - dt);
    if (closeToPlayer || this.enemyLockonTimer > 0) {
      if (closeToPlayer) this.enemyLockonTimer = this.lockonTime;
      return "attack";
    }

    return "neutral";
  }

  updateCombatProtocol(dt, target) {
    const RAM_MIN_SPEED = 80;

    // Enemy attributes
    const enemySpeed = Math.hypot(this.vx, this.vy);

    // Target attributes
    const distToTarget = dist(this.x, this.y, target.x, target.y);
    const angleToTarget = atan2(target.y - this.y, target.x - this.x);
    const angleCloseToTarget = smallestAngleDifference(this.control.steeringAngle + this.a, angleToTarget);
    const targetAngleDiff = Math.abs(angleCloseToTarget);

    // Boost
    const inRange = distToTarget > this.playerRange;
    const getCloseToTarget = inRange && targetAngleDiff < PI * 0.3 && enemySpeed < 100;
    const ramPlayer = targetAngleDiff < 0.2 && (enemySpeed > RAM_MIN_SPEED || distToTarget > 200) && this.health > 20;

    if (getCloseToTarget || ramPlayer) {
      this.lookAtTarget(dt, target, ramPlayer);
      this.boost(dt);
      return "boost";
    }

    // Fire
    this.lookAtTarget(dt, target, false);
    return "fire";
  }

  boost(dt) {
    this.control.boost = true;
    this.vx += cos(this.a + this.control.steeringAngle) * this.speed * dt;
    this.vy += sin(this.a + this.control.steeringAngle) * this.speed * dt;
  }

  takeDamageFromStars() {
    const closestStar = system.getClosestStar(this.x, this.y);
    const star = closestStar.star;
    const d = closestStar.dist;

    // Damage from star
    let damage = Math.max(star.r - d, 0) / 4;
    damage = round(damage * 10) / 10;

    if (damage > 0 && this.damageTime++ >= this.damageDelay) {
      this.damageTime = 0;
      this.takeDamage(damage);
    }
  }

  avoidStars(dt) {
    const closestStar = system.getClosestStar(this.x, this.y);
    const star = closestStar.star;
    const d = closestStar.dist;

    // Distance to star
    let dx = star.x - this.x;
    let dy = star.y - this.y;

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

    // Boost away from star
    this.steerTargetAngle(dt, angleDelta);
    const angleFromTarget = smallestAngleDifference(this.control.steeringAngle, angleDelta);
    const angleCloseToTarget = Math.abs(angleFromTarget) < 1.2;

    if (angleCloseToTarget) {
      this.control.boost = true;
      
      // Acceleration
      this.vx += cos(this.a + this.control.steeringAngle) * this.speed * dt;
      this.vy += sin(this.a + this.control.steeringAngle) * this.speed * dt;
    }
  }

  grantEffect(object) {
    if (!object) return;
    object.addHealth(randInt(7, 15));
    object.addAmmo(randInt(10, 20));
    object.addFuel(randInt(5, 10));

    // If this enemy has an effect give it to the bullet owner
    for (let effect of this.effects) {
      const level = effect.level;
      const Effect = effect.constructor;
      const duration = randInt(0, 10) + this.worth;
      object.applyEffect(Effect, { level, duration });
    }
  }

  onDestroy(damageSource) {
    spawnExplosion(this.x, this.y, this);
    if (damageSource && damageSource.owner && damageSource.owner.name == "ship") {
      this.slainByPlayer = true;
      hud.addScore(this.worth);
      if (damageSource && damageSource.owner) {
        this.grantEffect(damageSource.owner);
      }
    }
  }

  spawnBullet(dat) {
    const bullet = spawnBullet(dat);
    return bullet;
  }

  fireBullet() {
    if (this.bTime > 0) return;

    let bulletAngle = this.control.steeringAngle + this.a;

    // Adding bullet stray
    const DIST_TO_TARGET = dist(this.x, this.y, ship.x, ship.y);
    const STRAY_MULT = sqrt(DIST_TO_TARGET) / 20;
    let stray = (Math.random() * this.bStray - this.bStray / 2) * STRAY_MULT;
    bulletAngle += stray;

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

      let vx = cos(a) * this.bSpeed;
      let vy = sin(a) * this.bSpeed;
      
      // Shoot bullet
      bullet = this.spawnBullet({
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

      // Add velocity of enemy to the bullet
      bullet.vx += this.vx;
      bullet.vy += this.vy;
    }

    this.lastBullet = bullet;

    this.bTime = bullet.delay * this.bDelay;
  }

  attackPlayer(dt) {
    this.bTime -= dt;
    this.combatProtocol = this.updateCombatProtocol(dt, ship);

    if (this.lookingAtTarget) this.fireBullet();
  }

  lookAtTarget(dt, target, directly = true) {
    // Variables
    let bSpeedMult = this.lastBullet ? this.lastBullet.speed : 1;

    const finalTargetAngle = getInterceptAngle(this, target, bSpeedMult * this.bSpeed);
    const intercepts = !isNaN(finalTargetAngle);
    
    // Return if no intercepts
    if (!intercepts) return;

    let aimOffset = 0;

    // if (!directly) {
    //   const distToTarget = Math.hypot(target.x - this.x, target.y - this.y);
    //   const t = millis();
    //   const noiseAmt = Math.min(distToTarget / 300, 1);
    //   aimOffset = noise(t * 0.001) * noiseAmt;
    // }

    this.steerTargetAngle(dt, finalTargetAngle + aimOffset - this.a);
    const angleFromTarget = smallestAngleDifference(this.control.steeringAngle, finalTargetAngle - this.a);
    const angleCloseToTarget = Math.abs(angleFromTarget) < this.maxTargetAngleError;

    this.lookingAtTarget = angleCloseToTarget;
  }

  fireAtPlayer(dt) {
    
    // // Variables
    // let bSpeedMult = this.lastBullet ? this.lastBullet.speed : 1;

    // const finalTargetAngle = getInterceptAngle(this, ship, bSpeedMult * this.bSpeed);
    // const intercepts = !isNaN(finalTargetAngle);
    
    // // Return if no intercepts
    // if (!intercepts) return;

    // this.steerTargetAngle(dt, finalTargetAngle - this.a);
    // const angleFromTarget = smallestAngleDifference(this.control.steeringAngle, finalTargetAngle - this.a);
    // const angleCloseToTarget = Math.abs(angleFromTarget) < this.maxTargetAngleError;

    // this.fireBullet();

    // // Accelerate towards player
    // const BOOST_ANGLE_ERROR = 0.3;
    // const STRAFE_ANGLE = PI * 0.35;
    // const STRAFE_ANGLE_ERROR = HALF_PI;
    // const enemySpeed = Math.hypot(this.vx, this.vy);
    // const angleToPlayer = atan2(ship.y - this.y, ship.x - this.x);
    // const angleCloseToPlayer = smallestAngleDifference(this.control.steeringAngle + this.a, angleToPlayer);
    // const angleDiff = Math.abs(angleCloseToPlayer);
    // const distToPlayer = dist(this.x, this.y, ship.x, ship.y);
    // const closeToPlayer = distToPlayer < this.range;
    // const ramPlayer = angleDiff < BOOST_ANGLE_ERROR && enemySpeed > 100;
    // const strafePlayer = angleDiff > STRAFE_ANGLE && angleDiff < STRAFE_ANGLE + STRAFE_ANGLE_ERROR;
    // const getCloseToTarget = angleDiff < BOOST_ANGLE_ERROR && distToPlayer > this.playerRange;

    // if ((closeToPlayer && (ramPlayer || strafePlayer || getCloseToTarget))) {
    //   this.control.boost = true;
    //   this.vx += cos(this.a + this.control.steeringAngle) * this.speed * dt;
    //   this.vy += sin(this.a + this.control.steeringAngle) * this.speed * dt;
    // }
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

    // Stars
    this.takeDamageFromStars(dt);

    this.control.boost = false;

    const protocol = this.getProtocol(dt);

    switch (protocol) {
      case "escape star": this.avoidStars(dt); break;
      case "attack": this.attackPlayer(dt); break;
      case "neutral": this.steerTargetAngle(dt, 0); break;
    }
    
    // Constrain velocity
    const rate = protocol == "escape star" ? 0.1 : 0.01;
    let maxSpeed = this.control.boost ? this.topSpeed : 60;
    let sp = Math.sqrt(this.vx ** 2 + this.vy ** 2);
    let ns = Math.min(sp, maxSpeed) / sp;
    this.vx = lerp(this.vx, this.vx * ns, rate);
    this.vy = lerp(this.vy, this.vy * ns, rate);
    
    this.control.steeringAngle += this.control.steerVel * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.updateMesh();
  }
}

class BlackEnemy extends Enemy {
  constructor(x, y, vx, vy, s = 10) {
    super(x, y, vx, vy, s);
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
    this.bStray = 1.2;
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
  constructor(x, y, vx, vy, s = 10) {
    super(x, y, vx, vy, s);
    this.type = "speed";
    this.bulletType = SpeedBullet;
    this.sprite = speedEnemySprite;
    this.revive = false;
    this.range = 300;
    this.playerRange = 180;
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

class UltraSpeedEnemy extends SpeedEnemy {
  constructor(x, y, vx, vy, s = 13) {
    super(x, y, vx, vy, s);
    this.type = "ultraspeed";
    this.bulletType = UltraspeedBullet;
    this.sprite = ultraspeedEnemySprite;
    this.range = 400;
    this.playerRange = 0;
    this.speed = 120;
    this.topSpeed = 400;
    this.setHealth(40, 40);
    this.worth = 40;
    this.maneuverability = 5;

    // Bullet attributes
    this.bDelay = 1;
    this.bDecay = 0.5;
    this.bStray = 0.1;

    this.exaustCol = this.oldExaustCol = {
      min: { r: 20, g: 140, b: 220, a: 100 },
      add: { r: 40, g: 30, b: 50, a: 0 }
    };
  }

  grantEffect(object) {
    super.grantEffect(object);
    object.applyEffect(UltraspeedRounds, {
      duration: randInt(20, 40)
    });
    object.applyEffect(SuperSpeed, {
      duration: randInt(15, 25),
      level: 2
    });
  }
}

class HomingEnemy extends Enemy {
  constructor(x, y, vx, vy, s = 10) {
    super(x, y, vx, vy, s);
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
    super(x, y, vx, vy, 15);
    this.type = "mega";
    this.bulletType = MegaBullet;
    this.setHealth(35, 35);
    this.range = 400;
    this.playerRange = 100;
    this.speed = 100;
    this.worth = 40;

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

class HurricaneEnemy extends Enemy {
  constructor(x, y, vx, vy) {
    super(x, y, vx, vy, 20);
    this.type = "hurricane";
    this.bulletType = HurricaneBullet;
    this.sprite = hurricaneEnemySprite;
    this.setHealth(50, 50);
    this.worth = 50;
    this.speed = 80;
    this.topSpeed = 300;
    this.maxTargetAngleError = PI;
    this.range = 500;
    this.playerRange = 200;

    // Bullet attributes
    this.bStray = 20;

    this.exaustCol = this.oldExaustCol = {
      min: { r: 30, g: 180, b: 200, a: 100 },
      add: { r: 40, g: 30, b: 50, a: 0 }
    };

    this.tpDelay = 5;
    this.timeSinceTeleport = Infinity;
    this.teleported = true;
    this.tpTime = 2;
  }

  takeDamage(damage, damageSource) {
    super.takeDamage(damage, damageSource);
    if (damageSource instanceof Bullet && damageSource.owner === ship) {
      this.attemptRTP();
    }
  }

  move(dt) {
    super.move(dt);

    this.timeSinceTeleport += dt;

    const distToPlayer = dist(this.x, this.y, ship.x, ship.y);
    if (distToPlayer < this.range * 1.5) this.attemptRTP();

    if (!this.destroyed) {
      if (this.timeSinceTeleport > this.tpTime && !this.teleported) this.teleport(this.getRandomTeleport());
    }
  }

  getRandomOffset() {
    let x = randSign() * randInt(50, 100) + ship.x;
    let y = randSign() * randInt(50, 100) + ship.y;

    return { x, y };
  }

  getRandomTeleport() {
    // Find a safe spot to teleport
    let { x, y } = this.getRandomOffset();
    let { star, dist } = system.getClosestStar(x, y);
    let iterations = 0;

    while (dist < star.r + 50) {
      if (iterations++ > 10) return false;
      ({ x, y } = this.getRandomOffset());
      ({ star, dist } = system.getClosestStar(x, y));  
    }

    return { x, y };
  }

  attemptRTP() {
    if (this.timeSinceTeleport < this.tpDelay) return;
    this.timeSinceTeleport = 0;
    this.teleported = false;
  }

  teleport(loc) {
    if (loc === false) return;
    this.x = loc.x;
    this.y = loc.y;
    this.teleported = true;
  }

  grantEffect(object) {
    super.grantEffect(object);
    object.applyEffect(HurricaneRounds, {
      duration: randInt(20, 30)
    });
  }

  fireAtPlayer(...args) {
    if (!this.teleported) return;
    super.fireAtPlayer(...args);
  }

  spawnBullet(dat) {
    dat.spawnRadius = 200;
    return super.spawnBullet(dat);
  }

  draw(ctx) {
    const opacity = constrain(1 - this.timeSinceTeleport / this.tpTime, 0, 1) + constrain(this.timeSinceTeleport - this.tpTime, 0, 1);
    super.draw(ctx, opacity);
  }
}

function initEnemies(count) {
  if (noSpawns) return;
  // const a = atan2(ship.y, ship.x);
  // const enemy = createEnemy("ultraspeed", ship.x + cos(a) * 150, ship.y + sin(a) * 150, 0, 0);
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
    case "hurricane": enemy = new HurricaneEnemy(x, y, vx, vy); break;
    case "ultraspeed": enemy = new UltraSpeedEnemy(x, y, vx, vy); break;
    default: enemy = new Enemy(x, y, vx, vy);
  }

  return enemy;
}

function spawnEnemy(type = "normal", respawned = false) {
  const { pos, angle } = system.getRandomSpawn(100, 200, 600);
  const { x, y } = pos;

  if (type == "hurricane" && !respawned) {
    hud.displayMessage("Something is coming from space...");
  }

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
  const respawned = !enemy.slainByPlayer;
  let type = !enemy.slainByPlayer ? enemy.type : randomEnemyType();
  spawnEnemy(type, respawned);
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
    hurricane: 0.5 + difficulty * 0.5,
    ultraspeed: 0.5 + difficulty * 0.5,
    mega: 2 + difficulty * 0.5,
    black: 3 + difficulty
  };

  for (let type in enemySpawnThresholds) {
    const threshold = enemySpawnThresholds[type];
    if (hud.score < threshold) {
      delete typeChances[type];
    }
  }  

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
  const upgradePath = ["normal", "speed", "homing", "black", "mega", "hurricane", "ultraspeed"];
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
