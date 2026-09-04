
class MainPlayer extends Player {
  constructor(x, y, s = 12) {
    super(x, y, s);
    this.stats = { temp: 0, burning: false, wasBurning: false, bulletsShot: 0 };
  }

  applyEffect(Effect, dat, sender = null) {
    const effect = super.applyEffect(Effect, dat, sender);
    hud.effectsBar.addEffect(effect);
    spawnBonusEffect(`+${dat.duration} ${effect.getText()}`, this.x, this.y, effect.color, 2);
  }

  controls(dt) {
    let oldBoost = this.control.boost;
    this.control.boost = false;
    this.control.fire = false;

    if (!scenes.paused) {
      let turnSpeed = this.getSteeringAccel();
      
      // Steering
      if (keys.ARROWLEFT || keys.A) {
        this.removeFuel(0.003 * dt);
        this.steer(dt, -turnSpeed);
      }
      if (keys.ARROWRIGHT || keys.D) {
        this.removeFuel(0.003 * dt);
        this.steer(dt, turnSpeed);
      }
      
      // Boosting
      if (keys.ARROWUP || keys.W) {
        if (this.fuel > 0) {
          this.removeFuel(0.6 * dt);
          this.boost(dt);
        }
      }

      // Shooting
      if (keys.SPACE) {
        if (this.bTime <= 0) {
          const bullet = this.fireBullet();
          this.control.fire = true;
          this.bTime += bullet.delay * this.bDelay;
          this.removeAmmo(bullet.consumes * Math.max(this.multishot - 1, 1));
          htmlSounds.playSound(shootSound, 0.02, true);
        }
      }
    }
    
    // Sounds
    if (oldBoost != this.control.boost) {
      if (this.control.boost) {
        htmlSounds.fadeSound(rocketSound, 0.075, 0.2);
      } else {
        htmlSounds.fadeSound(rocketSound, 0.0, 0.2);
      }
    }
  }

  boost(dt) {
    super.boost(dt);
    hud.addCameraShake(10, 0.5);
  }

  spawnBullet(dat) {
    const theme = getTheme();
    
    if (theme == "christmas" || theme == "thanksgiving") {
      dat.bCol = [
        { r: 255, g: 100, b: 100 },
        { r: 255, g: 255, b: 255 },
        { r: 100, g: 255, b: 100 }
      ][this.stats.bulletsShot++ % 3];
    }

    return super.spawnBullet(dat);
  }

  resurrect() {
    super.resurrect();
    hud.resurrectEffect();
    htmlSounds.playSound(resurrectionSound, 1, true);
    scenes.gameScene.disruptGameOver();
  }

  addHealth(amount, sender, resurrect = true) {
    amount = super.addHealth(amount, sender);
    if (amount <= 0) return amount;
    spawnBonusEffect(`+${round(amount * 10) / 10} health`, this.x, this.y, color(0, 255, 0), 2);
    return amount;
  }

  addFuel(amount, sender) {
    amount = super.addFuel(amount, sender);
    if (amount <= 0) return amount;
    spawnBonusEffect(`+${round(amount * 10) / 10} fuel`, this.x, this.y, color(255, 0, 0), 2);
    return amount;
  }

  addAmmo(amount, sender) {
    amount = super.addAmmo(amount, sender);
    if (amount <= 0) return amount;
    spawnBonusEffect(`+${round(amount * 10) / 10} ammo`, this.x, this.y, color(255, 120, 0), 2);
    return amount;
  }

  reset(difficultSpawn = false) {
    let { pos, angle } = system.getRandomSpawn(200, 200, -1, 0);

    if (difficultSpawn) {
      this.control.steerVel = 4;
      angle += PI * 0.2;
    } else {
      this.control.steerVel = 0;
      angle += PI * 0.3;
    }
    
    this.setPosition(pos.x, pos.y);
    this.vx = cos(angle) * 40;
    this.vy = sin(angle) * 40;
    this.a = angle;
    this.fuel = 10;
    this.ammo = 100;
    this.health = 60;
    this.damageTime = 0;
    this.control.steeringAngle = 0;
    this.destroyed = false;
    this.bulletType = DEFAULT_BULLET.Type;
    this.bulletLevel = DEFAULT_BULLET.level;
    this.stats.bulletsShot = 0;
  }

  alignCamera() {
    let x = this.x;
    let y = this.y;
    
    const star = system.getClosestStar(this.x, this.y).star;

    // Calculate angle to sun
    const sunAngle = Math.atan2(star.y - this.y, star.x - this.x);
    const r1 = -sunAngle + HALF_PI;
    const r2 = -this.a - HALF_PI;
    const r3 = lerpAngle(r1, r2, 0.25);
    const s = Math.min(width, height) * 0.1;

    switch (scenes.cameraMode) {
      case "rotated":
        x = this.x + cos(this.a) * s / panzoom.zoom;
        y = this.y + sin(this.a) * s / panzoom.zoom;
        panzoom.setRotation(r3);
        break;
      default:
        x = this.x + cos(this.a) * s / panzoom.zoom;
        y = this.y + sin(this.a) * s / panzoom.zoom;
        panzoom.setRotation(-this.a - HALF_PI);
        break;
    }
    
    panzoom.setInView(x, y);
  }

  updateSounds() {
    // Sounds
    if (this.stats.burning != this.stats.wasBurning) {
      if (this.stats.burning) {
        const volume = this.stats.burning * 2;
        htmlSounds.fadeSound(burningSound, volume, 0.1);
      } else {
        htmlSounds.fadeSound(burningSound, 0.0, 0.5);
      }
    }
  }

  takeDamageFromStars(dt) {
    const damage = super.takeDamageFromStars(dt);

    if (damage > 0) {
      hud.addCameraShake(Math.min(damage * 10, 100), 1);
      this.stats.burning += damage / 30;
    }
  }

  elasticCollision(collidedObj) {
    const damages = super.elasticCollision(collidedObj);

    if (!this.hasActiveEffect(ForceField)) {
      // Camera shake
      const amount = damages.playerDamageTaken * 4;
      hud.addCameraShake(amount, 1);
    }

    // Sound
    htmlSounds.playSound(collisionSound, damages.playerDamageTaken / 10 * 0.2, true);

    return damages;
  }

  updateCollisions(dt) {
    let collided = false;
    let collidedObj = null;
    
    // Asteroid collision
    for (let asteroid of asteroids) {
      if (!this.collides(asteroid)) continue;
      collided = true;
      collidedObj = asteroid;
      break;
    }
    
    // Enemy collision
    for (let enemy of enemies) {
      if (!this.collides(enemy)) continue;
      collided = true;
      collidedObj = enemy;
      break;
    }

    // Elastic collisions
    if (collided != this.colliding) {
      this.colliding = collided;
      if (collidedObj) this.elasticCollision(collidedObj);
    }

    // Damage from solar flair
    let solarDamage = 0;
    for (let flair of solarFlairs) {
      if (!this.collides(flair)) continue;
      solarDamage = flair.getDamage();
      break;
    }

    // Damage from solar ring
    for (let ring of solarRings) {
      if (!ring.collides(this)) continue;
      solarDamage = ring.getDamage();
      break;
    }

    if (solarDamage > 0) {
      this.damageTime -= dt;
      if (this.damageTime <= 0) {
        this.damageTime = this.damageDelay * 2;
        this.takeDamage(solarDamage);
        hud.addCameraShake(Math.min(solarDamage * 10, 100), 0.1);
      }
      
      // Burning sound
      this.stats.burning += 0.2;
      this.stats.temp += 0.5;
    }
  }

  resetStats() {
    this.stats.wasBurning = this.stats.burning;
    this.stats.burning = 0;
    this.stats.temp = 0;
  }

  move(dt) {
    this.resetStats();
    super.move(dt);
    this.takeDamageFromStars(dt);
  }
}
