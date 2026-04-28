
class Renderer {
  constructor() {
    this.camera = new Camera();
    this.gameRenderer = new GameRendering();
  }

  reset() {

  }

  update(dt, gameState) {
    this.camera.alignCameraToPlayer(gameState);
  }

  draw(ctx, gameState) {
    ctx.background(bgCol);
    stars.draw(ctx);
    panzoom.begin(ctx);
    this.gameRenderer.drawSun(ctx, gameState);
    this.gameRenderer.drawAsteroids(ctx, gameState);
    this.gameRenderer.drawPlayer(ctx, gameState);
    this.gameRenderer.drawBullets(ctx, gameState);
    this.gameRenderer.drawExplosions(ctx, gameState);
    panzoom.end(ctx);
  }
}

class Camera {
  alignCameraToPlayer(gameState) {
    let player = gameState.player;
    let sun = gameState.sun;
    let x = player.x;
    let y = player.y;

    // Calculate angle to sun
    const sunAngle = Math.atan2(sun.y - player.y, sun.x - player.x);
    const r1 = -sunAngle + HALF_PI;
    const r2 = -player.angle - HALF_PI;
    const r3 = lerpAngle(r1, r2, 0.25);
    const s = Math.min(width, height) * 0.1;

    switch (scenes.cameraMode) {
      case "rotated":
        x = player.x + cos(player.angle) * s / panzoom.zoom;
        y = player.y + sin(player.angle) * s / panzoom.zoom;
        panzoom.setRotation(r3);
        break;
      default:
        x = player.x + cos(player.angle) * s / panzoom.zoom;
        y = player.y + sin(player.angle) * s / panzoom.zoom;
        panzoom.setRotation(-player.angle - HALF_PI);
        break;
    }
    
    panzoom.setInView(x, y);
  }
}

class EventRendering {
  getSunTint(gameState) {
    return { r: 255, g: 255, b: 255, a: 255 };
  }

  getSolarRingTime(gameState) {
    return 0;
  }
}

class EffectRendering {
  getForceFieldAlpha(effect) {
    if (effect.type != "force field") throw "Effect is not force field";
    return 255;
  }
  
  getExaustColor(ship) {
    return {
      min: { r: 255, g: 100, b: 0, a: 100 },
      add: { r: 0, g: 100, b: 0, a: 0 }
    };
  }
}

class GameRendering {
  constructor() {
    this.eventRendering = new EventRendering();
    this.effectRendering = new EffectRendering();
    this.trails = {};
  }

  drawSun(ctx, gameState) {
    let sun = gameState.sun;
    let sunTint = this.eventRendering.getSunTint(gameState);

    let r = sun.radius * 2.5;
    
    ctx.fill(255, 140, 0);
    ctx.noStroke();
    ctx.imageMode(CENTER);

    ctx.push();
    ctx.translate(sun.x, sun.y);
    ctx.rotate(sun.angle);

    if (sunTint.r == 255 && sunTint.g == 255 && sunTint.b == 255 && sunTint.a == 255) {
      ctx.image(sunSprite, 0, 0, r, r);
    } else {
      ctx.tint(sun.tint.r, sun.tint.g, sun.tint.b, sun.tint.a);
      ctx.image(sunSprite, 0, 0, r, r);
      ctx.noTint();
    }
    
    let solarRingTime = this.eventRendering.getSolarRingTime(gameState);

    if (solarRingTime > 0) {
      const GAP = 800 + (1 - solarRingTime ** 0.2) * 4000;
      ctx.push();
      ctx.rotate(millis() / 4000);
      ctx.image(solarRingSprite, 0, 0, r + GAP, r + GAP);
      ctx.rotate(millis() / 8000);
      ctx.image(solarRingSprite, 0, 0, r + GAP, r + GAP);
      ctx.pop();
    }
    
    ctx.pop();
    
    // ellipse(sun.x, sun.y, sun.r * 2, sun.r * 2);
    // fill(255, 120, 0);
    // ellipse(sun.x, sun.y, sun.r * 1.9, sun.r * 1.9);
    // fill(255, 80, 0);
    // ellipse(sun.x, sun.y, sun.r * 1.8, sun.r * 1.8);
  }

  drawBooster(ctx, ship) {
    const opacity = ship.alpha / 255;
    const shipAngle = ship.angle + ship.steering.angle - PI;
    const exaustDist = ship.size * 0.6;
    let exaustVx = 0;
    let exaustVy = 0;
    let exaustDelay = 4;
    let exaustRadius = ship.size * 0.5;
    let exaustSpread = 0.1;
    
    if (ship.controls.boost) {
      exaustVx = cos(shipAngle) * ship.size * 0.035;
      exaustVy = sin(shipAngle) * ship.size * 0.035;
      exaustDelay /= 2;
      exaustRadius = 0.6 * ship.size;
      exaustSpread *= 2;
    }
    
    // Create the trail if it hasn't been created
    if (!this.trails.hasOwnProperty(ship.id)) {
      this.trails[ship.id] = new Trail();
    }

    // Update smoke trail
    let trail = this.trails[ship.id];
    let trailX = ship.x + cos(shipAngle) * exaustDist;
    let trailY = ship.y + sin(shipAngle) * exaustDist;
    trail.updateTrail(trailX, trailY, exaustVx, exaustVy, exaustDelay, exaustRadius, exaustSpread);
    trail.draw(ctx, ship.alpha / 255);

    // Booster
    const exaustCol = this.effectRendering.getExaustColor(ship);

    if (ship.controls.boost) {
      ctx.strokeWeight(ship.size * 0.1);
      
      for (let i = 0; i < 10; ++i) {
        ctx.stroke(
          exaustCol.min.r + exaustCol.add.r * Math.random(),
          exaustCol.min.g + exaustCol.add.g * Math.random(),
          exaustCol.min.b + exaustCol.add.b * Math.random(),
          (exaustCol.min.a + exaustCol.add.a * Math.random()) * opacity
        );
        let aoff = noise(i + frameCount) * 0.4 - 0.2;
        let len = ship.size * (Math.random() * 1 + 1);
        ctx.line(
          ship.x + cos(shipAngle + aoff) * ship.size * 0.5,
          ship.y + sin(shipAngle + aoff) * ship.size * 0.5,
          ship.x + cos(shipAngle + aoff) * len,
          ship.y + sin(shipAngle + aoff) * len
        );
      }
    }
  }

  drawShip(ctx, ship, shipSprite) {
    this.drawBooster(ctx, ship);

    const SIZE = 12;
    const SCALE = 1.2;
    const SHIELD_SCALE = 2.5;
    let aspect = shipSprite.height / shipSprite.width;

    ctx.push();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(HALF_PI + ship.angle + ship.steering.angle);
    ctx.translate(0, -SIZE / 4);
    ctx.imageMode(CENTER);
    
    if (ship.alpha != 255)
      ctx.tint(255, ship.alpha);
    
    ctx.image(shipSprite, 0, 0, SIZE * SCALE, SIZE * aspect * SCALE);
    
    const forceFieldEffect = getRunningEffect(ship, "force field");
    if (forceFieldEffect != null) {
      const FORCE_FIELD_ALPHA = this.effectRendering.getForceFieldAlpha(forceFieldEffect);
      if (FORCE_FIELD_ALPHA != 255) ctx.tint(255, FORCE_FIELD_ALPHA);
      ctx.image(shieldSprite, 0, 0, SIZE * SCALE * SHIELD_SCALE, SIZE * aspect * SCALE * SHIELD_SCALE);
      if (FORCE_FIELD_ALPHA != 255) ctx.noTint();
    }
      
    if (getRunningEffects(ship).length > 0) {
      ctx.image(jetEnchantmentSprite, 0, 0, SIZE * SCALE, SIZE * aspect * SCALE);
    }

    if (ship.alpha != 255)
      ctx.noTint();
    
    ctx.pop();

    // Draw mesh
    // this.drawMesh(ctx);
  }

  drawPlayer(ctx, gameState) {
    this.drawShip(ctx, gameState.player, rocketSprite);
  }

  drawBullet(ctx, bullet) {
    const ALPHA = Math.min(bullet.timeRemaining * 240, 255);
    const stretch = Math.min(bullet.duration - bullet.timeRemaining, 3/60);
    
    let startX = bullet.px;
    let startY = bullet.py;
    let endX = bullet.x + bullet.vx * stretch;
    let endY = bullet.y + bullet.vy * stretch;

    ctx.stroke(bullet.color.r, bullet.color.g, bullet.color.b, ALPHA);
    ctx.strokeWeight(bullet.radius);
    ctx.line(startX, startY, endX, endY);
  }

  drawBullets(ctx, gameState) {
    for (let bullet of gameState.bullets) {
      this.drawBullet(ctx, bullet);
    }
  }

  drawExplosion(ctx, explosion) {
    const GIF_FRAMES = 5;
    const aspect = explosionSprite.height / explosionSprite.width;
    const time = 1 - explosion.timeRemaining / explosion.duration;
    const frame = floor(time * GIF_FRAMES);
    
    explosionSprite.setFrame(frame);
    ctx.imageMode(CENTER);
    ctx.image(explosionSprite, this.x, this.y, this.r, this.r * aspect);
  }

  drawExplosions(ctx, gameState) {
    for (let explosion of gameState.explosions) {
      this.drawExplosion(ctx, explosion);
    }
  }

  drawAsteroid(ctx, asteroid) {
    ctx.push();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.angle);
    
    ctx.imageMode(CENTER);
    ctx.image(asteroid.sprite, 0, 0, asteroid.radius, asteroid.radius);
    
    ctx.pop();
  }

  drawAsteroids(ctx, gameState) {
    for (let asteroid of gameState.asteroids) {
      this.drawAsteroid(ctx, asteroid);
    }
  }
}
