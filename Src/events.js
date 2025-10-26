
class EventManager {
  constructor() {
    this.thresholds = [];

    this.addEvent(200, () => {
      const BASELINE_COUNT = 2;
      const MAX_ENEMIES = 15;
      const TARGET_COUNT = Math.floor(hud.score / 100) + BASELINE_COUNT;
      // const UPGRADE_COUNT = Math.floor(hud.score / 400) + 1;

      // Replace enemies with stronger ones
      if (TARGET_COUNT >= MAX_ENEMIES) {
        upgradeRandomEnemy();
        return;
      } else {
        spawnEnemy();
      }
    });

    this.addEvent(500, () => {
      this.startRandomEvent();
    });

    this.addEvent(1000, () => {
      hud.effectsBar.unlockEffectSlot();
    })

    this.activeEvents = [];
  }

  addEvent(threshold, event) {
    const obj = { score: threshold, event: () => event(this), lastTriggered: 0 };
    this.thresholds.push(obj);
  }

  reset() {
    this.thresholds.forEach(t => t.lastTriggered = 0);

    // Stop all active events
    this.activeEvents.forEach(evt => evt.stop());
    this.activeEvents.length = 0;
  }

  startRandomEvent() {
    const eventProbs = [
      [GravityStorm, 1],
      [SpinStorm, 1],
      [SolarStorm, 1],
      [SolarStorm2, 0.5],
      [SolarCage, 0.5]
    ];

    const Event = randomFromProbs(eventProbs);
    this.startEvent(Event);
  }

  checkForEvent(EventConstructor) {
    return this.activeEvents.some(event => event.constructor === EventConstructor);
  }

  startEvent(Event) {
    if (this.checkForEvent(Event)) return false;

    const event = new Event();
    this.activeEvents.push(event);

    return true;
  }

  updateEvents(dt, ctx) {
    // Iterate through the thresholds and check for triggering conditions
    this.thresholds.forEach(threshold => {
      if (hud.score - threshold.lastTriggered >= threshold.score) {
        const timesTriggered = Math.floor((hud.score - threshold.lastTriggered) / threshold.score);
        threshold.lastTriggered = Math.floor(hud.score / threshold.score) * threshold.score;
        for (let i = 0; i < timesTriggered; ++i) {
          threshold.event();
        }
      }
    });

    // Run active events and remove them if they're done
    for (let i = this.activeEvents.length - 1; i >= 0; --i) {
      const event = this.activeEvents[i];
      event.run(dt, ctx);

      if (event.ended) {
        this.activeEvents.splice(i, 1);
      }
    }
  }
}

class WorldEvent {
  constructor() {
    this.col = { r:255, g:255, b:255 };
    this.timeElapsed = 0;
    this.stageTime = 0;
    this.stage = 0;
    this.lastStage = -1;
    this.ended = false;
    this.title = "EVENT";
    this.justTransitioned = false;
    htmlSounds.playSound(sirenSound, 1);
  }

  start(dt, ctx) {
    // Return true to move onto the next stage
    return true;
  }

  middle(dt, ctx) {
    // Return true to move onto the next stage
    return true;
  }

  end(dt, ctx) {
    // Return true to move onto the next stage
    return true;
  }

  stop() {

  }

  showTitle() {
    const MIN_SCL = Math.min(width, height);
    const T = this.timeElapsed;
    let t = Math.min(this.timeElapsed / 5, 1);
    let xoff = noise(T * 10 + 20) * 50;
    let yoff = noise(T * 10 + 40) * 50;

    let FADE = sin(t * PI + 0.1);
    if (FADE >= 0) {
      fill(this.col.r, this.col.g, this.col.b, 255 * FADE);
      noStroke();
      textSize(MIN_SCL * 0.1 * FADE);
      textFont(arialBlack);
      textAlign(CENTER, CENTER);
      text(this.title, width / 2 + xoff, height / 2 + yoff);
    }
  }

  run(dt, ctx) {
    this.justTransitioned = this.lastStage != this.stage;
    this.lastStage = this.stage;

    // Reset elapsed stage time
    if (this.justTransitioned) this.stageTime = 0;

    switch (this.stage) {
      case 0: if (this.start(dt, ctx)) ++this.stage; break;
      case 1: if (this.middle(dt, ctx)) ++this.stage; break;
      case 2: if (this.end(dt, ctx)) ++this.stage; break;
      default: this.ended = true; break;
    }

    this.showTitle();

    // Update time elapsed
    this.timeElapsed += dt;
    this.stageTime += dt;
  }
}

class GravityStorm extends WorldEvent {
  constructor() {
    super();
    this.star = system.getRandomStar();
    this.title = "GRAVITY STORM";

    // Initial and target values
    this.originalSunRadius = this.star.r;
    this.originalSunMass = this.star.m;
    this.originalSunTint = { ...this.star.tint };
    this.bigSunRadius = this.originalSunRadius * 2;
    this.bigSunMass = this.originalSunMass * 4;
    this.bigSunTint = { r: 0, g: 0, b: 0, a: 255 };

    // Transition values
    this.target = { r: 0, m: 0 };
    this.original = { r: 0, m: 0 };
    this.time = 0;
  }

  start(dt) {
    // Wait a bit before starting...
    if (this.stageTime < 5)
      return;

    const TIME = Math.min((this.stageTime - 5) * 0.05, 1);
    const SUN_TIME = Math.min(TIME * 2, 1);

    this.star.tint.r = lerp(this.originalSunTint.r, this.bigSunTint.r, SUN_TIME);
    this.star.tint.g = lerp(this.originalSunTint.g, this.bigSunTint.g, SUN_TIME);
    this.star.tint.b = lerp(this.originalSunTint.b, this.bigSunTint.b, SUN_TIME);
    this.star.tint.a = lerp(this.originalSunTint.a, this.bigSunTint.a, SUN_TIME);
    this.star.r = lerp(this.originalSunRadius, this.bigSunRadius, TIME);
    this.star.m = lerp(this.originalSunMass, this.bigSunMass, TIME);

    return TIME >= 1;
  }

  middle(dt) {
    return this.stageTime >= 10;
  }

  end(dt) {
    const TIME = Math.min(this.stageTime * 0.05, 1);
    const SUN_TIME = Math.min(TIME * 2, 1);

    this.star.tint.r = lerp(this.bigSunTint.r, this.originalSunTint.r, SUN_TIME);
    this.star.tint.g = lerp(this.bigSunTint.g, this.originalSunTint.g, SUN_TIME);
    this.star.tint.b = lerp(this.bigSunTint.b, this.originalSunTint.b, SUN_TIME);
    this.star.tint.a = lerp(this.bigSunTint.a, this.originalSunTint.a, SUN_TIME);
    this.star.r = lerp(this.bigSunRadius, this.originalSunRadius, TIME);
    this.star.m = lerp(this.bigSunMass, this.originalSunMass, TIME);

    return TIME >= 1;
  }

  stop() {
    this.star.r = this.originalSunRadius;
    this.star.m = this.originalSunMass;
    this.star.tint = { ...this.originalSunTint };
  }
}

class SpinStorm extends WorldEvent {
  constructor() {
    super();
    this.title = "SPIN STORM";
    this.time = 0;
    this.star = system.getRandomStar();
    this.reversed = Math.random() < 1/3;
    this.strength = 3;
    this.sunRotationSpeed = 0.01;
  
    // If reversed reverse title
    if (this.reversed) {
      this.strength *= -1;
      this.title = (this.title.split(' ')).reverse().join(' ');
    }
  }

  start(dt) {
    // Wait a bit before starting...
    if (this.stageTime < 5)
      return;

    const time = Math.min((this.stageTime - 5) * 0.1, 1);
    const multiplier = lerp(1, this.strength, this.reversed ? time ** 4 : time);
    const asteroidMultiplier = lerp(1, this.strength, time);

    // Set asteroid speed multiplier
    for (let asteroid of asteroids) {
      asteroid.speedMultiplier = asteroidMultiplier;
    }

    // Rotate sun and stars
    this.star.rot += (multiplier - 1) * this.sunRotationSpeed;
    stars.rot += (multiplier - 1) * this.sunRotationSpeed;

    return time >= 1;
  }

  middle(dt) {
    // Rotate sun and stars
    this.star.rot += this.sunRotationSpeed * this.strength;
    stars.rot += this.sunRotationSpeed * this.strength;

    return this.stageTime >= 15;
  }

  end(dt) {
    // Die down to default speed
    const time = Math.min(this.stageTime * 0.1, 1);
    const multiplier = lerp(this.strength, 1, this.reversed ? time ** 0.25 : time);
    const asteroidMultiplier = lerp(this.strength, 1, time);

    // Set asteroid speed multiplier
    for (let asteroid of asteroids) {
      asteroid.speedMultiplier = asteroidMultiplier;
    }

    // Rotate sun and stars
    this.star.rot += (multiplier - 1) * this.sunRotationSpeed;
    stars.rot += (multiplier - 1) * this.sunRotationSpeed;

    return time >= 1;
  }

  stop() {
    // Reset speed
    for (let asteroid of asteroids) {
      asteroid.speedMultiplier = 1;
    }
  }
}

class SolarStorm extends WorldEvent {
  constructor(type="normal") {
    super();
    this.type = type;
    this.title = "SOLAR STORM";
    this.star = system.getRandomStar();
    this.solarTime = 30;
    this.solarFlairs = [];
    
    if (this.type == "double") this.col = { r:255, g:120, b:0 };
  }

  start(dt) {
    // Wait a bit before starting...
    if (this.stageTime < 5)
      return;

    // Set rotation to behind player
    const shipX = ship.x;
    const shipY = ship.y;
    const shipVX = ship.vx;
    const shipVY = ship.vy;
    const starX = this.star.x;
    const starY = this.star.y;

    const starShipX = shipX - starX;
    const starShipY = shipY - starY;
    const starShipDist = Math.hypot(starShipX, starShipY);
    const starShipNormX = starShipX / starShipDist;
    const starShipNormY = starShipY / starShipDist;
    
    // Tangent is rotated 90 degrees clockwise
    const starTangentX = starShipNormY;
    const starTangentY = -starShipNormX;

    // Use dot product to find which direction the ship is moving around the sun
    const dot = starTangentX * shipVX + starTangentY * shipVY;
    const dir = dot < 0 ? -1 : 1;
    const speed = -0.135 * dir;
    const speedDiff = 0.0225;
    const rot = Math.atan2(starShipY, starShipX) + HALF_PI + PI * dir * 0.2;
    const rotVel1 = this.type == "double" ? speed + speedDiff * 0.5 : speed;
    const rotVel2 = speed - speedDiff * 1.5;

    this.solarFlairs.push(spawnSolarFlair(this.star, rot, rotVel1, this.solarTime));

    if (this.type == "double") {
      // Spawn another solar flair at 90 degrees
      this.solarFlairs.push(spawnSolarFlair(this.star, rot, rotVel2, this.solarTime));
      this.solarFlairs.push(spawnSolarFlair(this.star, rot + HALF_PI, rotVel1, this.solarTime));
      this.solarFlairs.push(spawnSolarFlair(this.star, rot + HALF_PI, rotVel2, this.solarTime));
    }

    return true;
  }

  middle(dt) {
    let destroyed = true;

    for (let solarFlair of this.solarFlairs) {
      if (!solarFlair.destroyed) {
        destroyed = false;
        break;
      }
    }

    return destroyed;
  }

  end(dt) {
    this.stop();
    return true;
  }

  stop() {
    for (let solarFlair of this.solarFlairs) {
      if (!solarFlair.destroyed)
        solarFlair.destroy();
    }

    if (!ship.destroyed && this.type == "double") {
      // Enjoy reward
      hud.addScore(100);
    }
  }
}

class SolarStorm2 extends SolarStorm {
  constructor() {
    super("double");
  }
}

class SolarCage extends WorldEvent {
  constructor() {
    super();
    this.title = "SOLAR CAGE";
    this.star = system.getRandomStar();
    this.solarTime = 30;
    this.dir = 1;
    this.solarFlairs = [];
    this.shipAngle = 0;
    this.shipAngleVel = 0;
    this.solarSpeed = 0.2;
  }

  updateShipAngle() {
    // Set rotation to behind player
    const shipX = ship.x;
    const shipY = ship.y;
    const shipVX = ship.vx;
    const shipVY = ship.vy;
    const starX = this.star.x;
    const starY = this.star.y;

    const starShipX = shipX - starX;
    const starShipY = shipY - starY;
    const starShipDist = Math.hypot(starShipX, starShipY);
    const starShipNormX = starShipX / starShipDist;
    const starShipNormY = starShipY / starShipDist;
    
    // Tangent is rotated 90 degrees counter-clockwise
    const starTangentX = -starShipNormY;
    const starTangentY = starShipNormX;

    // Use dot product to find which direction the ship is moving around the sun
    const dot = starTangentX * shipVX + starTangentY * shipVY;
    const dir = dot < 0 ? -1 : 1;

    // Calculate the angle of the ship around the sun
    const shipRot = Math.atan2(starShipY, starShipX) + PI * dir * 0.5;

    // Calculate the anglular velocity of the ship around the sun
    const shipTanSpeed = dot / starShipDist;
    
    this.shipAngle = shipRot;
    this.shipAngleVel = shipTanSpeed;
    this.dir = dir;
  }

  start(dt) {
    // Wait a bit before starting...
    if (this.stageTime < 5)
      return;

    this.solarFlairs.push(spawnSolarFlair(this.star, 0, 0, this.solarTime));
    this.solarFlairs.push(spawnSolarFlair(this.star, 0, 0, this.solarTime));
    this.solarFlairs.push(spawnSolarFlair(this.star, 0, 0, this.solarTime));
    this.solarFlairs.push(spawnSolarFlair(this.star, 0, 0, this.solarTime));

    return true;
  }

  middle(dt) {
    const rawT = Math.min(1, this.stageTime / 4);
    const t = easeInOutPower(rawT);
    const t2 = Math.min(1, (this.stageTime - 4) / (this.solarTime - 4));

    if (t < 1) {
      this.updateShipAngle();
    } else {
      const angleVel = lerp(this.shipAngleVel, this.solarSpeed * this.dir, t2);
      this.shipAngle += angleVel * dt;
    }

    // Set all solar flairs to solar angle
    const offsetA = lerp(HALF_PI, 0.15, t);
    const offsetB = lerp(HALF_PI, 0.3, t);
    this.solarFlairs[0].rot = this.shipAngle - offsetB * this.dir;
    this.solarFlairs[1].rot = this.shipAngle - offsetA * this.dir;
    this.solarFlairs[2].rot = this.shipAngle + offsetA * this.dir;
    this.solarFlairs[3].rot = this.shipAngle + offsetB * this.dir;

    // If all solar flairs are destroyed, stop
    return this.solarFlairs.every(flair => flair.destroyed);
  }

  end(dt) {
    this.stop();

    if (!ship.destroyed) {
      // Enjoy reward
      hud.addScore(100);
    }

    return true;
  }

  stop() {
    this.solarFlairs.forEach(flair => {
      if (!flair.destroyed) flair.destroy()
    });
  }
}
