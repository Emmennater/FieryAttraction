
enemies = [];

const enemySpawnThresholds = { normal: 0, homing: 100, speed: 100, ultraspeed: 300, mega: 250, black: 300, hurricane: 300 };
const enemyStrengthThresholds = { normal: 500, homing: 800, speed: 800, mega: 1000, black: 1000, hurricane: 1200, ultraspeed: 1200 };
const ENEMY_TYPE_CAPS = { black: 3, mega: 5 };

class Enemy extends Ship {
  constructor(x, y, vx, vy, s = 12) {
    super(x, y, s);
    this.type = "normal";
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.setHealth(15, 15);
    this.speed = 10;
    this.sprite = enemySprite;
    this.bulletType = Bullet;
    this.damage = 2 / 5;
    this.range = 200;
    this.playerRange = 100;
    this.maxSpeed = 100;
    this.turnSpeed = 5;
    this.slainByPlayer = false;
    this.worth = 20;
    this.protocol = "neutral";
    this.combatProtocol = "neutral";
    this.protocolTimer = 0;
    this.combatProtocolTimer = 0;
    this.lookingAtTarget = false;
    this.enemyLockonTimer = 0;
    this.lockonTime = 6;
    this.grantedEffects = [];

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
    this.maxTargetAngleError = 0.6;
  }

  getProtocol(dt) {
    this.control.boost = false;

    const closestStar = system.getClosestStar(this.x, this.y);
    const star = closestStar.star;
    const d = closestStar.dist;
    
    if (d == 0) return "escape star";

    // Calculate projected velocity toward star
    const starDx = star.x - this.x;
    const starDy = star.y - this.y;
    const starNx = starDx / d;
    const starNy = starDy / d;
    
    // Use dot product to find velocity in direction of star
    const starSpeed = this.vx * starNx + this.vy * starNy;

    // Time for correction
    const minDist = this.protocol == "escape star" ? 50 : 20;
    const timeToCorrect = 1;
    const travelDist = Math.max(starSpeed * timeToCorrect, 0);
    const closeToStar = d < star.r + minDist + travelDist;

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
    const getCloseToTarget = inRange && targetAngleDiff < PI * 0.2; // && enemySpeed < 100;
    const ramPlayer = targetAngleDiff < 0.2 && (enemySpeed > RAM_MIN_SPEED || distToTarget > 200) && this.health > 20;

    if (getCloseToTarget || ramPlayer) return "boost";

    return "fire";
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
    let turnAway = star.r / d;
    let angleAway1 = a - HALF_PI - turnAway;
    let angleAway2 = a + HALF_PI + turnAway;
  
    // Find closer angle
    let diff1 = smallestAngleDifference(A, angleAway1);
    let diff2 = smallestAngleDifference(A, angleAway2);
    let targetAngle = Math.abs(diff1) < Math.abs(diff2) ? angleAway1 : angleAway2;
    let angleDelta = targetAngle - A;

    // Boost away from star
    this.steerTargetAngle(dt, angleDelta);
    const angleFromTarget = smallestAngleDifference(this.control.steeringAngle, angleDelta);
    const angleCloseToTarget = Math.abs(angleFromTarget) < 1.2;

    if (angleCloseToTarget) {
      this.boost(dt);
    }
  }

  goNeutral(dt) {
    const closestStar = system.getClosestStar(this.x, this.y);
    const star = closestStar.star;
    const d = closestStar.dist;

    if (d == 0) return;

    // If the ship is moving towards the sun faster than 50u/s, avoid stars
    const starDx = star.x - this.x;
    const starDy = star.y - this.y;
    const starNx = starDx / d;
    const starNy = starDy / d;
    const starSpeed = this.vx * starNx + this.vy * starNy;

    if (starSpeed > 50) this.avoidStars(dt);
    else this.steerTargetAngle(dt, 0);
  }

  applyEffect(Effect, dat = {}, ...rest) {
    const effect = super.applyEffect(Effect, dat, ...rest);
    effect.activate();
    
    let level = dat.level;
    let duration = dat.duration;

    if (Effect === ForceField) duration *= 2;

    this.grantedEffects.push({ Effect, level, duration });
  }

  grantEffect(object) {
    if (!object) return;

    object.addHealth(randInt(7, 15));
    object.addAmmo(randInt(10, 20));
    object.addFuel(randInt(5, 10));

    // If this enemy has an effect give it to the bullet owner
    for (let effect of this.grantedEffects) {
      let { Effect, level, duration } = effect;
      if (duration > 10000) duration = randInt(0, 10) + this.worth;
      object.applyEffect(Effect, { level, duration });
    }
  }

  onDestroy(damageSource) {
    spawnExplosion(this.x, this.y, this);
    if (damageSource && damageSource.owner instanceof Player) {
      this.slainByPlayer = true;
      hud.addScore(this.worth);
      if (damageSource && damageSource.owner) {
        this.grantEffect(damageSource.owner);
      }
    }
  }

  attackPlayer(dt) {
    const target = ship;
    const combatProtocol = this.updateCombatProtocol(dt, target);
    const canSwitch = (this.combatProtocolTimer -= dt) <= 0;

    if (combatProtocol !== this.combatProtocol && canSwitch) {
      this.combatProtocol = combatProtocol;
      this.combatProtocolTimer = 0.5;
    }

    if (this.combatProtocol === "boost") {
      this.lookAtTarget(dt, target);
      this.boost(dt);
    }

    if (this.combatProtocol === "fire") {
      this.aimAtTarget(dt, target);
    }

    // Adding bullet stray
    const DIST_TO_TARGET = dist(this.x, this.y, target.x, target.y);
    const STRAY_MULT = sqrt(DIST_TO_TARGET) / 20 * this.bStray;

    if (this.lookingAtTarget && this.bTime <= 0) {
      this.control.fire = true;
      const bullet = this.fireBullet(STRAY_MULT);
      this.bTime += bullet.delay * this.bDelay;
    }
  }

  aimAtTarget(dt, target) {
    // Variables
    let bSpeedMult = this.lastBullet ? this.lastBullet.speed : 1;

    const finalTargetAngle = getInterceptAngle(this, target, bSpeedMult * this.bSpeed);
    const intercepts = !isNaN(finalTargetAngle);
    
    // Return if no intercepts
    if (!intercepts) return;

    this.steerTargetAngle(dt, finalTargetAngle - this.a);
    const angleFromTarget = smallestAngleDifference(this.control.steeringAngle, finalTargetAngle - this.a);
    const angleCloseToTarget = Math.abs(angleFromTarget) < this.maxTargetAngleError;

    this.lookingAtTarget = angleCloseToTarget;
  }

  lookAtTarget(dt, target) {
    // Max speed is used to lead the target
    let finalTargetAngle = getInterceptAngle(this, target, this.maxSpeed);
    const intercepts = !isNaN(finalTargetAngle);
    
    if (!intercepts) {
      // No immediate intercept so just look at target
      const angleToTarget = atan2(target.y - this.y, target.x - this.x);
      finalTargetAngle = angleToTarget;
    }
    
    // Intercept target
    this.steerTargetAngle(dt, finalTargetAngle - this.a);

    const angleFromTarget = smallestAngleDifference(this.control.steeringAngle, finalTargetAngle - this.a);
    const angleCloseToTarget = Math.abs(angleFromTarget) < this.maxTargetAngleError;

    this.lookingAtTarget = angleCloseToTarget;
  }
  
  strengthen(percent) {
    // Cap percent at 200%
    percent = Math.min(percent, 2);

    this.damage *= percent;
    this.bSpeed *= percent;
    this.speed *= percent;
    this.bImpactForce *= Math.min(percent, 1.5);
    this.range = Math.min(this.range * percent, 500); // Cap range at 500
  }

  move(dt) {
    const protocol = this.getProtocol(dt);
    this.protocol = protocol;

    switch (protocol) {
      case "escape star": this.avoidStars(dt); break;
      case "attack": this.attackPlayer(dt); break;
      case "neutral": this.goNeutral(dt); break;
    }

    super.move(dt);
    this.takeDamageFromStars(dt);
  }
}

class BlackEnemy extends Enemy {
  constructor(x, y, vx, vy, s = 12) {
    super(x, y, vx, vy, s);
    this.type = "black";
    this.bulletType = ExplosiveBullet;
    this.sprite = blackEnemySprite;
    this.setHealth(25, 25);
    this.worth = 30;
    this.turnSpeed = 3;

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
    Enemy.prototype.grantEffect.call(this, object);
    object.applyEffect(ExplosiveRounds, {
      duration: randInt(10, 20)
    })
  }

  drawBoost(ctx, opacity) {
    const exaustCol1 = {
      min: { r: 0, g: 0, b: 0, a: 0 },
      add: { r: 0, g: 0, b: 0, a: 0 }
    };
    const exaustCol2 = {
      min: { r: 0, g: 0, b: 0, a: 100 },
      add: { r: 255, g: 100, b: 0, a: 0 }
    };

    // Alternate exaust color
    this.oldExaustCol = (Math.random() < 0.1) ? exaustCol2 : exaustCol1;
    this.exaustCol = this.oldExaustCol;

    super.drawBoost(ctx, opacity);
  }
}

class SpeedEnemy extends Enemy {
  constructor(x, y, vx, vy, s = 12) {
    super(x, y, vx, vy, s);
    this.type = "speed";
    this.bulletType = SpeedBullet;
    this.sprite = speedEnemySprite;
    this.range = 220;
    this.playerRange = 50;
    this.speed = 40;
    this.turnSpeed = 15;
    this.maxSpeed = 200;
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
    Enemy.prototype.grantEffect.call(this, object);
    object.applyEffect(SpeedRounds, {
      duration: randInt(20, 40)
    });
  }
}

class UltraSpeedEnemy extends SpeedEnemy {
  constructor(x, y, vx, vy, s = 15) {
    super(x, y, vx, vy, s);
    this.type = "ultraspeed";
    this.bulletType = UltraspeedBullet;
    this.sprite = ultraspeedEnemySprite;
    this.range = 400;
    this.playerRange = 100;
    this.speed = 80;
    this.maxSpeed = 200;
    this.turnSpeed = 30;
    this.setHealth(40, 40);
    this.worth = 40;
    this.maneuverability = 10;

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
    Enemy.prototype.grantEffect.call(this, object);
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
  constructor(x, y, vx, vy, s = 12) {
    super(x, y, vx, vy, s);
    this.type = "homing";
    this.bulletType = HomingBullet;
    this.sprite = homingEnemySprite;
    this.setHealth(20, 20);
    this.worth = 25;
    this.turnSpeed = 3;

    // Bullet attributes
    this.bImpactForce = 1;
    this.bDelay = 1;
    this.bSpeed = 200;
    this.bGravity = 0.0;
    this.bDecay = 0.5;
    this.range = 300;
  }

  grantEffect(object) {
    Enemy.prototype.grantEffect.call(this, object);
    object.applyEffect(HomingRounds, {
      duration: randInt(20, 40)
    });
  }
}

class MegaEnemy extends HomingEnemy {
  constructor(x, y, vx, vy) {
    super(x, y, vx, vy, 18);
    this.type = "mega";
    this.bulletType = MegaBullet;
    this.setHealth(35, 35);
    this.range = 300;
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
    super(x, y, vx, vy, 24);
    this.type = "hurricane";
    this.bulletType = HurricaneBullet;
    this.sprite = hurricaneEnemySprite;
    this.setHealth(50, 50);
    this.worth = 50;
    this.speed = 80;
    this.maxSpeed = 300;
    this.maxTargetAngleError = PI;
    this.range = 350;
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

  getProtocol(...args) {
    let protocol = super.getProtocol(...args);
    if (!this.teleported && protocol === "attack") return "neutral";
    return protocol;
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
  // let a = atan2(ship.y, ship.x);
  // const enemy = createEnemy("ultraspeed", ship.x + cos(a) * 150, ship.y + sin(a) * 150, 0, 0);
  // enemies.push(enemy);
  // enemy.applyEffect(ForceField, { duration: 20, level: 1 });
  // enemy.health = 1;
  // ship.applyEffect(HomingRounds, { duration: 100, level: 1 });
  // ship.effects[0].done = true;

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
    case "normal": enemy = new Enemy(x, y, vx, vy); break;
    default: throw new Error(`Unknown enemy type: ${type}`);
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
  let effects = [
    [HomingRounds, SpeedRounds, MegaRounds, ExplosiveRounds],
    [SuperSpeed],
    [MultiShot],
    [Regeneration],
    [ForceField]
  ];

  const effectChance = lateGameWeight(10000, 0.03, 0.25);
  const bonusEffectChance = lateGameWeight(10000, 0.2, 0.5);
  
  if (Math.random() < effectChance) {
    do {
      let rowIdx = 0;
      let allEffects = effects.flat();
      let effectIdx = Math.floor(Math.random() * allEffects.length);

      for (let i = 0; i < effects.length; i++) {
        if (effects[i].includes(allEffects[effectIdx])) {
          rowIdx = i;
          break;
        }
      }

      let RandomEffect = allEffects[effectIdx];
      effects.splice(rowIdx, 1);
      giveEnemyEffect(enemy, RandomEffect);
    } while (Math.random() < bonusEffectChance && effects.length > 0);
  }

  enemies.push(enemy);
}

function giveEnemyEffect(enemy, Effect) {
  const levelSpread = lateGameWeight(6000, 3, 1);
  let level = Math.ceil((Math.random() ** levelSpread) * 3);
  let duration = 10000000;
  
  if (Effect == ForceField) {
    duration = level * 50;
    level = 1;
  }

  enemy.applyEffect(Effect, { duration, level });
}

function destroyEnemy(enemy, i = enemies.indexOf(enemy)) {
  if (i == -1) return;
  enemies.splice(i, 1);
  enemy.removeAllEffects();

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
