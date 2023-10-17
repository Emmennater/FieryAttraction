
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

class Asteroid extends GravityObject {
  constructor(x, y, r, vx, vy) {
    super(x, y, 100);
    this.r = r;
    this.rot = Math.random() * TWO_PI;
    this.rotVel = Math.random() * 0.1 - 0.05;
    this.vx = vx;
    this.vy = vy;
    this.depth = 1;
    this.graphicx = 0;
    this.graphicy = 0;
    this.sprite = asteroidSprite;
    this.destroy = false;
    this.health = 3;
    this.split = false;
    this.isSplit = false;
    this.type = "normal";
  }
  
  move(dt) {
    this.attract(dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
  
  drawRock(ctx) {
    this.rot += this.rotVel;
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
  
  takeDamage(damage, owner) {
    this.health -= damage;
    if (this.health <= 0) {
      if (!this.destroy && this.split) {
        this.splitAsteroid();
      }
      this.destroy = true;
      spawnExplosion(this.x, this.y, null, this.r / 40 * 0.2);
      if (owner == "player") {
        hud.addScore(5);
      }
    }
  }

  splitAsteroid() {
    for (let i = 0; i < 3; i++) {
      let type = randomAsteroid();
      let asteroid = null;

      let x = this.x;
      let y = this.y;
      let vx = this.vx + Math.random() * 20 - 10;
      let vy = this.vy + Math.random() * 20 - 10;
      let r = Math.random() * 10 + 10;

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
        default:
          asteroid = new Asteroid(x, y, r, vx, vy);
      }

      asteroid.isSplit = true;
      asteroids.push(asteroid);
    }
  }
  
  draw(ctx) {
    this.rot += this.rotVel;
    
    let r = this.r / this.depth;
    let x = (this.x + panzoom.xoff) / this.depth;
    let y = (this.y + panzoom.yoff) / this.depth;
    this.graphicx = x;
    this.graphicy = y;
    
    ctx.push();
    ctx.translate(width/2, height/2);
    ctx.scale(panzoom.zoom);
    ctx.rotate(panzoom.rot);
    ctx.translate(x, y);
    ctx.rotate(this.rot);
    
    ctx.fill(70);
    ctx.noStroke();
    ctx.imageMode(CENTER);
    ctx.image(this.sprite, 0, 0, r, r);
    
    ctx.pop();
  }
}

class FuelAsteroid extends Asteroid {
  constructor(x, y, r, vx, vy) {
    super(x, y, r, vx, vy);
    this.type = "fuel";
    this.sprite = fuelAsteroidSprite;
  }
  
  takeDamage(damage, owner) {
    super.takeDamage(damage, owner);
    if (this.destroy && owner == "player") {
      ship.addFuel(5);
      hud.addScore(5);
    }
  }
}

class HealthAsteroid extends Asteroid {
  constructor(x, y, r, vx, vy) {
    super(x, y, r, vx, vy);
    this.type = "health";
    this.sprite = healthAsteroidSprite;
  }
  
  takeDamage(damage, owner) {
    super.takeDamage(damage, owner);
    if (this.destroy && owner == "player") {
      ship.addHealth(20);
      hud.addScore(5);
    }
  }
}

class AmmoAsteroid extends Asteroid {
  constructor(x, y, r, vx, vy) {
    super(x, y, r, vx, vy);
    this.type = "ammo";
    this.sprite = ammoAsteroidSprite;
  }
  
  takeDamage(damage, owner) {
    super.takeDamage(damage, owner);
    if (this.destroy && owner == "player") {
      ship.addAmmo(40);
      hud.addScore(5);
    }
  }
}

function destroyAllAsteroids() {
  for (let asteroid of asteroids)
    asteroid.takeDamage(100);
}

function spawnAsteroid(type, playerCheck) {
  let t = Math.random() * TWO_PI;
  let dir = Math.random() < 0.5 ? 1 : -1;
  if (playerCheck) {
    // Ship direction to sun
    let dx = sun.x - ship.x;
    let dy = sun.y - ship.y;
    let a = atan2(dy, dx);
    t = a + Math.random() * 0.5 * dir;
  }
  
  let d = sun.r + 20 + Math.random() * 200;
  let r = Math.random() * 10 + 10;
  let health = 3;
  let split = false;

  // Random massive asteroid
  if (Math.random() < 0.05) {
    r += 20;
    health = 6;
    split = true;
  }

  let x = Math.cos(t) * d;
  let y = Math.sin(t) * d;
  let s = Math.random() * 20 + 20;
  let vx = Math.cos(t + HALF_PI) * s * dir;
  let vy = Math.sin(t + HALF_PI) * s * dir;
  let asteroid = null;
  
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
    default:
      asteroid = new Asteroid(x, y, r, vx, vy);
  }
  
  // Set health
  asteroid.health = health;
  asteroid.split = split;

  ASTEROID_COUNTS[asteroid.type]++;
  asteroids.push(asteroid);
}

function initAsteroids() {
  for (let i = 0; i < 28; ++i)
    spawnAsteroid();
  for (let i = 0; i < 12; ++i)
    spawnAsteroid("fuel");
  for (let i = 0; i < 5; ++i)
    spawnAsteroid("health");
  for (let i = 0; i < 10; ++i)
    spawnAsteroid("ammo");
}

function moveAsteroids(dt) {
  for (let i = asteroids.length - 1; i >= 0; --i) {
    const asteroid = asteroids[i];
    if (asteroid.destroy) {
      asteroids.splice(i, 1);
      ASTEROID_COUNTS[asteroid.type]--;

      // For every asteroid destroyed, 2 more spawn
      if (!asteroid.isSplit) {

        // Current ratio for this type
        const oldType = asteroid.type || "normal";
        const expectedRatio = ASTEROID_RATIOS[oldType];
        const currentRatio = ASTEROID_COUNTS[oldType] / asteroids.length;
        let newType = (currentRatio <= expectedRatio) ? asteroid.type : randomAsteroid();

        // Replacement asteroids
        spawnAsteroid(newType, true);
        if (Math.random() < 0.5) {
          spawnAsteroid(newType, true)
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

function randomAsteroid() {
  let rand = Math.random();
  if (rand < 0.025) {
    return "health";
  } else if (rand < 0.1) {
    return "fuel";
  } else if (rand < 0.2) {
    return "ammo";
  } else {
    return null;
  }
}

function trueRandomAsteroid() {
  let rand = Math.floor(Math.random() * 5);
  return ["normal", "fuel", "ammo", "health"][rand];
}

function clearAsteroids() {
  asteroids.length = 0;
  for (let k in ASTEROID_COUNTS)
    ASTEROID_COUNTS[k] = 0;
}

/*




















*/
