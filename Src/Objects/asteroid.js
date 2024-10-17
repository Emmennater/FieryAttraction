
const ASTEROID_RATIOS = {
  normal: 0.5,
  fuel: 0.2,
  ammo: 0.2,
  health: 0.1
};

const ASTEROID_COUNTS = {
  normal: 0,
  fuel: 0,
  ammo: 0,
  health: 0
};

const ASTEROID_MINIMUMS = {
  normal: 28,
  fuel: 8,
  health: 3,
  ammo: 6
};

class Asteroid extends GravityObject {
  constructor(x, y, r, vx, vy) {
    super(x, y, 100);
    this.r = r;
    this.density = 20;
    this.m = Math.round(PI * this.r ** 2) * this.density;
    this.rot = Math.random() * TWO_PI;
    this.rotVel = Math.random() * 5 - 2.5;
    this.vx = vx;
    this.vy = vy;
    this.sprite = asteroidSprite;
    this.split = 0;
    this.isSplit = false;
    this.type = "normal";
    this.speedMultiplier = 1;
    // this.depth = 1;
    
    // Collision mesh
    this.makeCollisionMesh([114, 10], [64, 22], [40, 54], [43, 145], [97, 191], [131, 181], [164, 123], [167, 61]);
    this.collisionMesh.setOrigin(100, 100);
    this.collisionMesh.setScale(this.r / 200);
  }

  move(dt) {
    dt *= this.speedMultiplier;
    this.attract(dt);

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rot += this.rotVel * dt;

    this.collisionMesh.setPosition(this.x, this.y);
    this.collisionMesh.setRotation(this.rot);
    this.collisionMesh.updateTransform();
  }
  
  drawRock(ctx) {
    ctx.push();
    ctx.translate(width/2, height/2);
    ctx.translate(-width/2, -height/2);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    
    ctx.fill(70);
    ctx.noStroke();
    ctx.imageMode(CENTER);
    ctx.image(this.sprite, 0, 0, this.r, this.r);
    
    ctx.pop();
  }
  
  getScore() {
    // Based on radius
    return this.scaleReward(5);
  }

  onDestroy(bullet) {
    if (this.split)
      this.splitAsteroid(bullet);
    
    spawnExplosion(this.x, this.y, null, this.r / 40 * 0.2, this.r);
    
    const ownerIsJet = bullet && (bullet.owner.name == "ship" || bullet.owner.name == "enemy");
    if (ownerIsJet) this.giveReward(bullet.owner);
  }

  giveReward(object) {
    if (object.name == "ship") hud.addScore(this.getScore());
  }

  splitAsteroid(damageSource) {
    const explodeVel = 20;
    
    let sourceVx = 0, sourceVy = 0;
    if (damageSource instanceof Bullet) {
      sourceVx = damageSource.vx;
      sourceVy = damageSource.vy;
    }

    for (let i = 0; i < 3; i++) {
      let type = randomAsteroidType(this.type);
      let asteroid = null;

      let x = this.x;
      let y = this.y;
      let vx = 0, vy = 0;
      let r = Math.random() * 10 + 10 + 20 * (this.split - 1);
      
      // Initialize velocity
      vx += this.vx * 0.5;
      vy += this.vy * 0.5;

      // Outwards velocity
      let a = Math.random() * TWO_PI;
      let v = (Math.random() + 1) * 0.5 * explodeVel;
      vx += cos(a) * v;
      vy += sin(a) * v;

      // Damage source velocity
      vx += sourceVx * 0.25;
      vy += sourceVy * 0.25;

      asteroid = createAsteroid(type, x, y, vx, vy, r)

      asteroid.split = this.split - 1;
      asteroid.isSplit = true;
      asteroids.push(asteroid);
    }
  }

  scaleReward(amount) {
    // Min and Max radius
    const SCALING_FACTOR = 0.95;
    const MIN = 10;
    const MAX = 20;
    const LOW = 0.5;
    const HIGH = 1.5;
    const R = (this.r ** SCALING_FACTOR) * (MAX - MIN) / ((MAX - MIN) ** SCALING_FACTOR);

    // Map r, min, max, low, high
    let percent = ((R - MIN) / (MAX - MIN)) * (HIGH - LOW) + LOW;

    return Math.round(amount * percent + 0.5);
  }

  draw(ctx) {
    ctx.push();
    ctx.translate(width/2, height/2);
    ctx.scale(panzoom.zoom);
    ctx.rotate(panzoom.rot);
    ctx.translate(panzoom.xoff, panzoom.yoff);
    
    ctx.push();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    
    ctx.fill(70);
    ctx.noStroke();
    ctx.imageMode(CENTER);
    ctx.image(this.sprite, 0, 0, this.r, this.r);
    
    ctx.pop();
    
    // Hitbox
    // this.drawMesh(ctx);
    // ctx.stroke(255, 0, 0);
    // ctx.strokeWeight(1);
    // ctx.noFill();
    // ctx.rectMode(CENTER);
    // ctx.rect(0, 0, r, r);
    
    ctx.pop();
  }
}

class FuelAsteroid extends Asteroid {
  constructor(x, y, r, vx, vy) {
    super(x, y, r, vx, vy);
    this.type = "fuel";
    this.sprite = fuelAsteroidSprite;
  }
  
  getScore() {
    // Based on radius
    return this.scaleReward(8);
  }

  giveReward(object) {
    super.giveReward(object);
    object.addFuel(this.scaleReward(4), this);
  }
}

class HealthAsteroid extends Asteroid {
  constructor(x, y, r, vx, vy) {
    super(x, y, r, vx, vy);
    this.type = "health";
    this.sprite = healthAsteroidSprite;
  }

  getScore() {
    // Based on radius
    return this.scaleReward(10);
  }
  
  giveReward(object) {
    super.giveReward(object);
    object.addHealth(this.scaleReward(20), this);
  }
}

class AmmoAsteroid extends Asteroid {
  constructor(x, y, r, vx, vy) {
    super(x, y, r, vx, vy);
    this.type = "ammo";
    this.sprite = ammoAsteroidSprite;
  }

  getScore() {
    // Based on radius
    return this.scaleReward(8);
  }
  
  giveReward(object) {
    super.giveReward(object);
    object.addAmmo(this.scaleReward(15), this);
  }
}

class SpeedAsteroid extends Asteroid {
  constructor(x, y, r, vx, vy) {
    super(x, y, r, vx, vy);
    this.type = "speed";
    this.sprite = blueAsteroidSprite; // speedAsteroidSprite;
  }
  
  getScore() {
    // Based on radius
    return this.scaleReward(15);
  }

  giveReward(object) {
    super.giveReward(object);
    object.applyEffect(SuperSpeed, {
      duration: this.scaleReward(10)
    }, this);
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

class ExplosiveAsteroid extends Asteroid {
  constructor(x, y, r, vx, vy) {
    super(x, y, r, vx, vy);
    this.type = "explosive";
    this.sprite = explosiveAsteroidSprite;
  }

  getScore() {
    // Based on radius
    return this.scaleReward(15);
  }

  giveReward(object) {
    super.giveReward(object);
    const level = Math.ceil(this.scaleReward(1) ** 0.7 * 0.7);
    object.applyEffect(MultiShot, {
      duration: this.scaleReward(15),
      level
    }, this);
  }

  onDestroy(damageSource) {
    super.onDestroy(damageSource);

    const OWNER = damageSource.owner instanceof Ship && damageSource.owner.name == "ship" ? damageSource.owner : this;

    // Shake screen
    hud.addCameraShake(10, 10);

    const nBullets = this.scaleReward(8);
    const x = this.x;
    const y = this.y;

    // Spawn explosive bullets
    const BULLET_SPEED = 220;
    const ANGLE_GAP = TWO_PI / nBullets;
    for (let i = 0; i < nBullets; i++) {
      let a = ANGLE_GAP * i + Math.random() * ANGLE_GAP;
      let vel = (Math.random() + 0.75) * BULLET_SPEED * 0.5;
      const x2 = x + Math.cos(a) * this.r * 0.35;
      const y2 = y + Math.sin(a) * this.r * 0.35;
      const vx = Math.cos(a) * vel;
      const vy = Math.sin(a) * vel;
      const bullet = spawnBullet({
        x: x2, y: y2, vx, vy,
        owner: OWNER,
        type: "explosive",
        damageMult: 1.5
      });
    }
  }
}

function destroyAllAsteroids() {
  for (let asteroid of asteroids)
    asteroid.takeDamage(100);
}

function spawnAsteroid(type, spawnRadius = 600) {
  // Player check
  // const OPPOSITE_ANGLE = atan2(sun.y - ship.y, sun.x - ship.x);
  // const ANGLE_OFFSET = PI * spawnArc * randSign();
  // spawnAngle = OPPOSITE_ANGLE + Math.random() * ANGLE_OFFSET;
  const { pos, angle } = system.getRandomSpawn(40, 400, spawnRadius, random(PI * 0.4, PI * 0.6));
  const { x, y } = pos;

  let asteroidSpeed = randInt(20, 60);
  let vx = Math.cos(angle) * asteroidSpeed;
  let vy = Math.sin(angle) * asteroidSpeed;
  let asteroid = createAsteroid(type, x, y, vx, vy);

  ASTEROID_COUNTS[asteroid.type]++;
  asteroids.push(asteroid);
}

function initAsteroids() {
  if (noSpawns) return;
  
  // Test
  // asteroids.push(new ExplosiveAsteroid(ship.x - 100, ship.y, ship.vx, ship.vy));
  // const asteroid = createAsteroid("explosive", ship.x + 100, ship.y, ship.vx, ship.vy, 70);
  // asteroids.push(asteroid);

  const SPAWN_RADIUS = 200;
  for (let i = 0; i < 1; ++i) {
    for (let i = 0; i < 28; ++i)
      spawnAsteroid("normal", SPAWN_RADIUS);
    for (let i = 0; i < 8; ++i)
      spawnAsteroid("fuel", SPAWN_RADIUS);
    for (let i = 0; i < 3; ++i)
      spawnAsteroid("health", SPAWN_RADIUS);
    for (let i = 0; i < 6; ++i)
      spawnAsteroid("ammo", SPAWN_RADIUS);
  }
}

function moveAsteroids(dt) {
  const CAP = 70;
  for (let i = asteroids.length - 1; i >= 0; --i) {
    const asteroid = asteroids[i];
    if (asteroid.destroyed) {
      asteroids.splice(i, 1);
      ASTEROID_COUNTS[asteroid.type]--;

      // For every asteroid destroyed, 2 more spawn
      if (!asteroid.isSplit) {

        // Current ratio for this type
        const oldType = asteroid.type || "normal";
        const expectedRatio = ASTEROID_RATIOS[oldType];
        const currentRatio = ASTEROID_COUNTS[oldType] / asteroids.length;
        // let newType = (currentRatio <= expectedRatio) ? asteroid.type : randomAsteroid();

        // Minimum asteroids (preserve asteroid types)
        let newType = randomAsteroidType();
        const TYPE_MIN = ASTEROID_MINIMUMS[oldType];
        if (TYPE_MIN && ASTEROID_COUNTS[asteroid.type] < TYPE_MIN) {
          newType = oldType;
        }

        // Replacement asteroids
        spawnAsteroid(newType);
        if (Math.random() < 0.5 && asteroids.length < CAP) {
          spawnAsteroid(randomAsteroidType());
        }
      }
      
      continue;
    }
    asteroid.move(dt);
  }
}

function drawAsteroids(CTX) {
  for (let asteroid of asteroids) {
    asteroid.draw(CTX);
  }
}

function createAsteroid(type, x, y, vx, vy, r = null) {
  let asteroid = null;
  
  if (!r) {
    r = randInt(10, 20);
    if (Math.random() < 0.05) {
      r += 20;
      if (Math.random() < 0.1) {
        r += 40;
      }
    }
  }

  switch (type) {
    case "fuel":
      asteroid = new FuelAsteroid(x, y, r, vx, vy);
      break;
    case "ammo":
      asteroid = new AmmoAsteroid(x, y, r, vx, vy);
      break;
    case "health":
      asteroid = new HealthAsteroid(x, y, r, vx, vy);
      break;
    case "speed":
      asteroid = new SpeedAsteroid(x, y, r, vx, vy);
      break;
    case "explosive":
      asteroid = new ExplosiveAsteroid(x, y, r, vx, vy);
      break;
    default:
      asteroid = new Asteroid(x, y, r, vx, vy);
  }

  let split = 0;
  if (r > 70) split = 2;
  else if (r > 30) split = 1;
  
  const health = Math.max(r - 5, 5);
  asteroid.setHealth(health, health);
  asteroid.split = split;
  
  return asteroid;
}

function randomAsteroidType(baseType = "normal") {
  const typeChances = {
    normal: 70,
    fuel: 10,
    ammo: 10,
    health: 5,
    speed: 3,
    explosive: 2,
  };

  // Swap normal for base
  const normalChance = typeChances[baseType];
  typeChances[baseType] = typeChances.normal;
  typeChances.normal = normalChance;

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

function trueRandomAsteroid() {
  let rand = Math.floor(Math.random() * 7);
  return ["normal", "fuel", "ammo", "health", "speed", "explosive"][rand];
}

function clearAsteroids() {
  asteroids.length = 0;
  for (let k in ASTEROID_COUNTS)
    ASTEROID_COUNTS[k] = 0;
}

/*




















*/
