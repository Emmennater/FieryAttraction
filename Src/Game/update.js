
class TickEvents {
  constructor() {
    this.events = [];
  }

  add(event) {
    this.events.push(event);
  }

  clear() {
    this.events = [];
  }
}

class Updater {
  constructor() {
    this.collisionMeshes = {};
  }

  update(dt, gameState) {
    // Firing
    shipUpdateFiring(dt, gameState, gameState.player);
    
    // Movement
    moveShip(dt, gameState, gameState.player, this.collisionMeshes);
    moveAsteroidObjects(dt, gameState, this.collisionMeshes);
    moveBulletObjects(dt, gameState);
    moveExplosions(dt, gameState);
    
    // Collisions
    updateCollisions(gameState, this.collisionMeshes);

    // Cleanup
    destroyAsteroidObjects(gameState);
    destroyBulletObjects(gameState);
    destroyExplosions(gameState);
    removeCollisionMeshes(gameState, this.collisionMeshes);
  }

  debugDraw(ctx, gameState) {
    panzoom.begin(ctx);

    for (let id in this.collisionMeshes) {
      let mesh = this.collisionMeshes[id];
      mesh.draw(ctx);
    }

    panzoom.end(ctx);
  }
}

// Asteroids

function spawnAsteroidObject(gameState, type, minPlayerDist, radius = null) {
  const { pos, angle } = getRandomSpawn(gameState, 40, 400, minPlayerDist, random(PI * 0.4, PI * 0.6));
  const { x, y } = pos;

  if (!radius) {
    radius = randInt(10, 20);
    if (Math.random() < 0.05) {
      radius += 20;
      if (Math.random() < 0.1) {
        radius += 40;
      }
    }
  }

  const DENSITY = 20;
  let asteroidSpeed = randInt(20, 60);
  let vx = Math.cos(angle) * asteroidSpeed;
  let vy = Math.sin(angle) * asteroidSpeed;
  let asteroid = createGameObject("asteroid");
  asteroid.type = type;
  asteroid.x = x;
  asteroid.y = y;
  asteroid.vx = vx;
  asteroid.vy = vy;
  asteroid.angle = Math.random() * TWO_PI;
  asteroid.angularVelocity = Math.random() * 5 - 2.5;
  asteroid.radius = radius;
  asteroid.mass = Math.round(PI * radius * radius * DENSITY);
  asteroid.health = Math.max(radius - 5, 5);
  asteroid.maxHealth = asteroid.health;
  gameState.asteroids.push(asteroid);
}

function moveAsteroidObject(dt, gameState, asteroid, collisionMeshes) {
  if (asteroid.destroyed) return;

  attractTowardsSun(dt, gameState.sun, asteroid, 1);

  asteroid.x += asteroid.vx * dt;
  asteroid.y += asteroid.vy * dt;
  asteroid.angle += asteroid.angularVelocity * dt;

  updateCollisionMesh(asteroid, collisionMeshes);
}

function moveAsteroidObjects(dt, gameState, collisionMeshes) {
  for (let asteroid of gameState.asteroids) {
    moveAsteroidObject(dt, gameState, asteroid, collisionMeshes);
  }
}

function destroyAsteroidObjects(gameState) {
  for (let i = gameState.asteroids.length - 1; i >= 0; i--) {
    if (gameState.asteroids[i].destroyed) {
      gameState.asteroids.splice(i, 1);
    }
  }
}

// Explosions

function spawnExplosionObject(gameState, objectId, volume = 0.2, radius = 20) {
  let explosion = createGameObject("explosion");
  explosion.radius = radius;
  explosion.volume = volume;
  explosion.targetId = objectId;
  gameState.explosions.push(explosion);
  return explosion;
}

function moveExplosion(dt, gameState, explosion) {
  if ((explosion.timeRemaining -= dt) < 0) {
    explosion.destroy = true;
  }

  if (explosion.targetId != null) {
    let target = getGameObjectById(gameState, explosion.targetId);
    if (target != null) {
      explosion.x = target.x;
      explosion.y = target.y;
    }
  }
}

function moveExplosions(dt, gameState) {
  for (let explosion of gameState.explosions) {
    moveExplosion(dt, gameState, explosion);
  }
}

function destroyExplosions(gameState) {
  for (let i = gameState.explosions.length - 1; i >= 0; i--) {
    if (gameState.explosions[i].destroy) {
      gameState.explosions.splice(i, 1);
    }
  }
}

// Bullets

function spawnBulletObject(gameState, dat) {
  let objectName = dat.type == "normal" ? "bullet" : dat.type + "_bullet";
  let bullet = createGameObject(objectName);

  bullet.x = dat.x;
  bullet.y = dat.y;
  bullet.vx = dat.vx + cos(dat.angle) * dat.speed * bullet.speed;
  bullet.vy = dat.vy + sin(dat.angle) * dat.speed * bullet.speed;
  bullet.ownerId = dat.ownerId;
  bullet.level = dat.level ?? 1;
  bullet.gravity = dat.gravity ?? true;

  if (dat.type == "normal") {
    bullet.color = dat.color;
  }

  gameState.bullets.push(bullet);

  return bullet;
}

function moveBulletObject(dt, gameState, bullet) {
  if ((bullet.timeRemaining -= dt) < 0) {
    bullet.destroyed = true;
    return;
  }
  
  if (bullet.gravity) {
    attractTowardsSun(dt, gameState.sun, bullet, 10);
  }
  
  bullet.px = bullet.x;
  bullet.py = bullet.y;
  bullet.x += bullet.vx * dt;
  bullet.y += bullet.vy * dt;
}

function moveBulletObjects(dt, gameState) {
  for (let bullet of gameState.bullets) {
    moveBulletObject(dt, gameState, bullet);
  }
}

function destroyBulletObjects(gameState) {
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    let bullet = gameState.bullets[i];
    if (bullet.destroyed) {
      gameState.bullets.splice(i, 1);
    }
  }
}

// Ship

function shipUpdateFiring(dt, gameState, ship) {
  if (ship.controls.fire && ship.timers.firing <= 0) {
    const bullet = shipFireBullet(gameState, ship);
    const ammoConsumed = bullet.consumes * Math.max(ship.multishot - 1, 1);
    ship.ammo = Math.max(0, ship.ammo - ammoConsumed);
    ship.timers.firing += bullet.delay * ship.bullet.delay;
  }

  const outOfAmmoFactor = ship.ammo <= 0 ? 0.5 : 1;
  ship.timers.firing = Math.max(ship.timers.firing - outOfAmmoFactor * dt, 0);
}

function shipFireBullet(gameState, ship) {
  const shipAngle = ship.angle + ship.steering.angle;
  const bulletStray = (Math.random() - 0.5) * getShipBulletStray(ship);
  const bulletAngle = shipAngle + bulletStray;

  const multishot = getShipMultishot(ship);
  const spreadAngle = PI * 0.1;
  const angleGap = spreadAngle / multishot;
  let bullet = null;

  const s = ship.size * 0.75;
  const leftWingX = ship.x - cos(bulletAngle - HALF_PI) * s + cos(bulletAngle) * s * 0.5;
  const leftWingY = ship.y - sin(bulletAngle - HALF_PI) * s + sin(bulletAngle) * s * 0.5;
  const rightWingX = ship.x - cos(bulletAngle + HALF_PI) * s + cos(bulletAngle) * s * 0.5;
  const rightWingY = ship.y - sin(bulletAngle + HALF_PI) * s + sin(bulletAngle) * s * 0.5;

  for (let i = 0; i < multishot; i++) {
    let a = bulletAngle - spreadAngle / 2;
    a += angleGap * (i + 0.5);

    let x, y;

    if (Math.abs(a - bulletAngle) < 0.01) {
      x = ship.x + cos(a) * ship.size;
      y = ship.y + sin(a) * ship.size;
    } else {
      const t = (a - bulletAngle + spreadAngle / 2) / spreadAngle;
      x = lerp(rightWingX, leftWingX, t);
      y = lerp(rightWingY, leftWingY, t);
    }

    bullet = spawnBulletObject(gameState, {
      x, y,
      vx: ship.vx,
      vy: ship.vy,
      angle: a,
      speed: ship.bullet.speed,
      ownerId: ship.id,
      type: ship.bullet.type,
      level: ship.bullet.level,
      color: ship.bullet.color,
    });
  }
  
  return bullet;
}

function moveShip(dt, gameState, ship, collisionMeshes) {
  attractTowardsSun(dt, gameState.sun, ship);

  // Constrain velocity
  let maxSpeed = ship.controls.boost ? ship.maxSpeed : ship.maxSpeed * 0.4;
  let sp = Math.sqrt(ship.vx ** 2 + ship.vy ** 2);
  let ns = Math.min(sp, maxSpeed) / sp;
  ship.vx = lerp(ship.vx, ship.vx * ns, 1.5 * dt);
  ship.vy = lerp(ship.vy, ship.vy * ns, 1.5 * dt);

  // Steering
  let delta = constrain(ship.controls.steer, -1, 1);
  let speed = ship.steering.speed;
  if (ship.fuel <= 0) speed /= 6;
  if (Math.sign(ship.steering.velocity) != Math.sign(delta)) speed *= 2;
  if (delta != 0) ship.fuel = Math.max(0, ship.fuel - 0.003 * dt);
  ship.steering.velocity += delta * speed * dt;

  // Boosting
  if (ship.controls.boost) {
    const speed = getShipSpeed(ship);
    const shipAngle = ship.angle + ship.steering.angle;
    ship.vx += cos(shipAngle) * speed * dt;
    ship.vy += sin(shipAngle) * speed * dt;
    ship.fuel = Math.max(0, ship.fuel - 0.6 * dt);
  }

  // Movement
  ship.steering.angle += ship.steering.velocity * dt;
  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;
  ship.vx *= 1 - ship.drag * dt;
  ship.vy *= 1 - ship.drag * dt;
  
  // Rotation
  let shipTurnRate = ship.controls.boost ? 0.01 : 0.02;
  let newAngle = atan2(ship.vy, ship.vx);
  let diff = smallestAngleDifference(ship.angle, newAngle);
  ship.angle += diff * shipTurnRate;

  updateCollisionMesh(ship, collisionMeshes);
}

function getShipManeauverability() {
  return ship.maneuverability;
}

function getShipSpeed(ship) {
  const maneuverability = getShipManeauverability(ship);
  const currentVelocity = Math.hypot(ship.vx, ship.vy);
  const shipAngle = ship.angle + ship.steering.angle;
  const nvx = ship.vx / currentVelocity;
  const nvy = ship.vy / currentVelocity;
  const projectedVelocity = Math.max(0, nvx * cos(shipAngle) + nvy * sin(shipAngle));
  const speedIncrease = Math.max(1, 3 / (projectedVelocity + 1 / maneuverability));
  return ship.speed * speedIncrease;
}

function getShipBulletStray(ship) {
  return 0;
}

function getShipMultishot(ship) {
  return 1;
}

// Collision mesh

function updateCollisions(gameState, collisionMeshes) {
  const player = gameState.player;
  let collidedObject = null;
  let colliding = false;

  for (let object of [...gameState.asteroids]) {
    if (collisionMeshes[player.id].collides(collisionMeshes[object.id])) {
      collidedObject = object;
      colliding = true;
      break;
    }
  }

  if (colliding != player.colliding) {
    player.colliding = colliding;
    if (colliding) {
      gameObjectElasticCollision(player, collidedObject);
    }
  }

  for (let bullet of gameState.bullets) {
    const vx = bullet.x - bullet.px;
    const vy = bullet.y - bullet.py;
    const x1 = bullet.px;
    const y1 = bullet.py;
    const x2 = bullet.px + vx * 3;
    const y2 = bullet.py + vy * 3;

    // Collide with asteroids
    for (let asteroid of gameState.asteroids) {
      if (asteroid.destroyed) continue;
      if (collisionMeshes[asteroid.id].intersectsLine(x1, y1, x2, y2)) {
        bullet.destroyed = true;
        dealDamage(asteroid, bullet.damage, bullet);
        bulletInelasticCollision(bullet, asteroid);
        htmlSounds.playSound(hitSound, 0.5);
        return;
      }
    }
    
    // Collide with player
    if (!bullet.owner || bullet.owner instanceof Enemy) {
      if (!ship.destroyed && ship.intersectsLine(x1, y1, x2, y2)) {
        bullet.destroy();
        ship.takeDamage(bullet.damage * bullet.damageMult, bullet);
        bullet.transferMomentumTo(ship);
        if (!ship.hasActiveEffect(ForceField))
          hud.addCameraShake(50, 1);
        htmlSounds.playSound(hitSound, 0.5);
        return;
      }
    }
  }
}

function gameObjectElasticCollision(object1, object2) {
  const objectA = {
    x: object1.x,
    y: object1.y,
    vx: object1.vx,
    vy: object1.vy,
    m: object1.mass
  };

  const objectB = {
    x: object2.x,
    y: object2.y,
    vx: object2.vx,
    vy: object2.vy,
    m: object2.mass
  };

  // Force fields boost mass
  const forceFieldA = getRunningEffect(object1, "force field");
  const forceFieldB = getRunningEffect(object2, "force field");
  if (forceFieldA && !forceFieldB) objectB.m = 1;
  if (!forceFieldA && forceFieldB) objectA.m = 1;

  elasticCollision(objectA, objectB);

  // Calculate the change in velocity (post-collision minus pre-collision)
  const object1DeltaVx = object2.vx - objectA.vx;
  const object1DeltaVy = object2.vy - objectA.vy;
  const object2DeltaVx = object1.vx - objectB.vx;
  const object2DeltaVy = object1.vy - objectB.vy;

  // Update velocities
  object1.vx = objectA.vx;
  object1.vy = objectA.vy;
  object2.vx = objectB.vx;
  object2.vy = objectB.vy;

  // Compute damage
  const object1DeltaVel = Math.hypot(object1DeltaVx, object1DeltaVy);
  const object2DeltaVel = Math.hypot(object2DeltaVx, object2DeltaVy);
  const object1DamageTaken = round(object1DeltaVel) * 0.1;
  const object2DamageTaken = round(object2DeltaVel) * 0.1;

  // Damage
  if (!forceFieldA && !forceFieldB) {
    dealDamage(object1, object1DamageTaken, object2);
    dealDamage(object2, object2DamageTaken, object1);
  }

  return [object1DamageTaken, object2DamageTaken];
}

function bulletInelasticCollision(bullet, object) {
  if (!object) return;
  if (getRunningEffect(object, "force field")) return;
  const vx = bullet.vx * bullet.mass / object.mass * bullet.impactForce;
  const vy = bullet.vy * bullet.mass / object.mass * bullet.impactForce;
  object.vx += vx;
  object.vy += vy;
}

function updateCollisionMesh(object, collisionMeshes) {
  let collisionMesh = collisionMeshes[object.id];
  
  // Create collision mesh if one does not exist
  if (!collisionMesh) {
    if (object.inherits.includes("ship")) {
      collisionMesh = makeCollisionMesh([368, 0], [273, 395], [0, 600], [0, 695], [144, 828], [595, 828], [737, 695], [737, 600], [465, 395]);
      collisionMesh.setOrigin(rocketSprite.width/2, rocketSprite.height/2);
      collisionMesh.setScale(object.size * 1.4 / rocketSprite.width);
    } else if (object.inherits.includes("asteroid")) {
      collisionMesh = makeCollisionMesh([114, 10], [64, 22], [40, 54], [43, 145], [97, 191], [131, 181], [164, 123], [167, 61]);
      collisionMesh.setOrigin(100, 100);
      collisionMesh.setScale(object.radius / 200);
    } else {
      throw "Object does not have collision mesh";
    }

    collisionMeshes[object.id] = collisionMesh;
  }

  let x = object.x;
  let y = object.y;
  let angle = object.angle;

  if (object.inherits.includes("ship")) {
    let shipAngle = object.angle + object.steering.angle - PI;
    x = object.x - cos(shipAngle) * object.size / 4;
    y = object.y - sin(shipAngle) * object.size / 4;
    angle = shipAngle - HALF_PI;
  }
  
  collisionMesh.setPosition(x, y);
  collisionMesh.setRotation(angle);
  collisionMesh.updateTransform();
}

function makeCollisionMesh(...pointArrays) {
  const pointObjects = pointArrays.map((points) => {
    return { x: points[0], y: points[1] };
  })

  return new CollisionMesh(pointObjects);
}

function removeCollisionMeshes(gameState, collisionMeshes) {
  for (let id in collisionMeshes) {
    if (!getGameObjectById(gameState, id)) {
      delete collisionMeshes[id];
    }
  }
}

// Sun

function attractTowardsSun(dt, sun, object, strength = 1) {
  const gravityForce = strength;
  const edgeForce = 1;
  const gForce = getGravityForce(sun, object);
  const eForce = getEdgeForce(sun, object);

  object.vx += gForce.x / object.mass * gravityForce * dt;
  object.vy += gForce.y / object.mass * gravityForce * dt;
  object.vx += eForce.x / object.mass * edgeForce * dt;
  object.vy += eForce.y / object.mass * edgeForce * dt;
}

function getGravityForce(sun, object) {
  // Distances
  let dx = sun.x - object.x;
  let dy = sun.y - object.y;
  let d = sqrt(dx ** 2 + dy ** 2);
  let vx = dx / d;
  let vy = dy / d;
  
  // Calculate gravity
  let gravity = object.mass * sun.mass / (d ** 2);
  let netForce = Math.min(gravity, 200 * object.mass);

  // Apply forces
  let ForceX = vx * netForce;
  let ForceY = vy * netForce;

  return { x: ForceX, y: ForceY };
}

function getEdgeForce(sun, object) {
  const RANGE = 1.5;
  const FORCE = 0.05;

  let distance = Math.hypot(sun.x - object.x, sun.y - object.y);
  let edgeForce = Math.max(distance - sun.radius * RANGE, 0) * FORCE * object.mass;
  let angle = atan2(sun.y - object.y, sun.x - object.x);
  let fx = cos(angle) * edgeForce;
  let fy = sin(angle) * edgeForce;

  return { x: fx, y: fy };
}

function getRandomSpawn(gameState, minRadius, maxRadius, minPlayerDist = 200, angleFromSun = HALF_PI) {
  let sun = gameState.sun;
  
  function getRandomPosition() {
    let distFromCenter = sun.radius + random(minRadius, maxRadius);
    let angle = Math.random() * TWO_PI;
    let x = cos(angle) * distFromCenter + sun.x;
    let y = sin(angle) * distFromCenter + sun.y;
    return { x, y };
  }

  function getRandomTangent(x, y) {
    let dx = sun.x - x;
    let dy = sun.y - y;
    return atan2(dy, dx) + angleFromSun * randSign();
  }

  let pos = getRandomPosition();

  // Check if position is valid
  const MAX_ATTEMPTS = 1000;
  let attempts = 0;
  
  while (true) {
    let player = gameState.player;
    let distToPlayer = Math.hypot(player.x - pos.x, player.y - pos.y);
    let distToSun = Math.hypot(sun.x - pos.x, sun.y - pos.y) - sun.radius;
    if (distToPlayer >= minPlayerDist && distToSun >= minRadius) break;
    pos = getRandomPosition();
    if (attempts++ > MAX_ATTEMPTS) break;
  }

  let angle = getRandomTangent(pos.x, pos.y);

  return { pos, angle };
}

// Other

function dealDamage(object, amount, sender) {
  object.health = Math.max(0, object.health - amount);
  if (object.health <= 0) {
    object.destroyed = true;
    object.destroyerId = sender.id;
  }
}
