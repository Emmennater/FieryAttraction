
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
      this.destroy = true;
      spawnExplosion(this.x, this.y);
      if (owner == "player") {
        hud.addScore(5);
      }
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


function spawnAsteroid(type, playerCheck) {
  let t = Math.random() * TWO_PI;
  if (playerCheck) {
    // Ship direction to sun
    let dx = sun.x - ship.x;
    let dy = sun.y - ship.y;
    let a = atan2(dy, dx);
    t = a;
  }
  
  let d = sun.r + 20 + Math.random() * 400;
  let r = Math.random() * 10 + 10;
  let x = Math.cos(t) * d;
  let y = Math.sin(t) * d;
  let s = Math.random() * 20 + 20;
  let dir = Math.random() < 0.5 ? 1 : -1;
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
  
  asteroids.push(asteroid);
}

function initAsteroids() {
  for (let i = 0; i < 30; ++i)
    spawnAsteroid();
  for (let i = 0; i < 10; ++i)
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
      
      // For every asteroid destroyed, 2 more spawn
      spawnAsteroid(asteroid.type, true);
      let type = randomAsteroid();
      spawnAsteroid(type, true);
      
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

/*




















*/
