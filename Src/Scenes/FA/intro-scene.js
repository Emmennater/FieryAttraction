
class IntroScene extends Scene {
  init() {
    const SCL = Math.min(width, height);
    let collisionDist = width / 2;
    
    // Ship sound
    htmlSounds.fadeSound(rocketSound, 0.04, 0.2);
    // sounds.startSound(rocketSound);
    
    // Ship
    this.ship = new Ship(width / 2 - collisionDist, height / 2);
    this.ship.vx = SCL / 8;
    this.ship.vy = 0;
    this.ship.s = SCL * 0.05;
    this.ship.control.boost = true;
    this.ship.collided = 0;
    this.ship.control.steerVel = 0;
    
    // Asteroid
    this.asteroid = new Asteroid(width / 2, height / 2 - collisionDist * 4, SCL / 5, 0, SCL / 2);
    this.asteroid.rotVel = PI / 2;
  }

  run(dt, ctx) {
    if (!ctx) return;

    const SCL = Math.max(width, height);
    
    // Move
    this.ship.x += this.ship.vx * dt;
    this.ship.y += this.ship.vy * dt;
    this.ship.control.steeringAngle += this.ship.control.steerVel * dt;
    this.asteroid.x += this.asteroid.vx * dt;
    this.asteroid.y += this.asteroid.vy * dt;
    this.asteroid.rot += this.asteroid.rotVel * dt;

    // Check for collision
    if (!this.ship.collided && this.asteroid.y >= height / 2 - this.ship.s) {
      this.ship.collided++;
      this.asteroid.vy /= 2;
      this.ship.vy = this.asteroid.vy;
      this.ship.control.steerVel = 4;
      
      // sounds.playRandomly(collisionSound);
      htmlSounds.playSound(collisionSound, 0.3);
    } else if (this.ship.collided) {
      this.ship.collided++;
    }
    
    // Background
    ctx.background(bgCol);
    panzoom.zoom = 0.5;
    stars.draw(ctx);
    
    // Display
    this.ship.draw(ctx);
    this.asteroid.drawRock(ctx);
    
    // Shake
    let xoff = 0, yoff = 0;
    if (this.ship.collided) {
      let t = frameCount / 5;
      let a = 40 * (1 / (this.ship.collided * 0.03 + 1));
      xoff = noise(20 + t) * a;
      yoff = noise(20 + t) * a;
    }
    
    // Draw scene
    push();
    translate(width/2, height/2);
    scale(1 + 1 / SCL);
    translate(-width/2 + xoff, -height/2 + yoff);
    imageMode(CORNER);
    image(ctx, 0, 0, width, height);
    pop();
    
    // Skip intro
    let nextTxt = mobile.isMobile ? "Tap to Skip Intro" : "Press Space to Skip Intro";
    fill(100);
    noStroke();
    textSize(20);
    textAlign(CENTER, TOP);
    textFont("monospace")
    text(nextTxt, width/2, 6);
    
    // Skip controls
    let nextScene = false;
    if (mobile.isMobile) {
      nextScene = touch.pressed;
    } else {
      nextScene = pressed.SPACE;
    }

    // Scene over
    let sceneOver = this.ship.y > height + this.ship.vy * 1;
    if (nextScene || sceneOver) {
      alarmSound.stop();
      scenes.impactMessageTime = scenes.messageTime;
      htmlSounds.fadeSound(rocketSound, 0.0, 0.2);
      scenes.introSkipped = nextScene;

      // Cut scene
      scenes.cutSceneTo(scenes.gameScene);
    }
  }
}
