
class Scenes {
  constructor() {
    this.currentScene = null;
    this.nextScene = null;
    this.nextInitScene = null;
    this.fade = 0;
    this.fadeTime = 1;
    this.messageTime = 300;
    this.impactMessageTime = this.messageTime;
    this.introSkipped = false;
    this.highScore = false;

    // Elements
    this.musicSlider = document.getElementById("music-volume");
    this.helpControls = document.getElementById("help-controls");
    this.controlButton = document.getElementById("controls");
    this.controlsOpen = false;
    this.sceneTime = 0;
    
    // Music volume
    this.musicVolume = getItem("fiery-attraction-music-volume");
    this.musicSlider.value = this.musicVolume * 100;
    this.updateVolume();

    // this.toggleControls(true);
    // this.cutSceneTo(this.loseScreen);
    // this.cutSceneTo(this.scene2, this.initScene2);
  }
  
  toggleControls(open = null) {
    if (open === null) open = !this.controlsOpen;
    if (open) {
      this.controlsOpen = true;
      this.controlButton.innerText = "Back";
      this.helpControls.style.visibility = "visible";
    } else {
      this.controlsOpen = false;
      this.controlButton.innerText = "Help + Controls";
      this.helpControls.style.visibility = "hidden";
    }
  }

  updateVolume() {
    if (titleScreenTrack.volume > 0)
      titleScreenTrack.volume = 0.4 * this.musicVolume;
    if (soundTrack.volume > 0)
      soundTrack.volume = 0.8 * this.musicVolume;
  }

  changeMusicVolume() {
    const percent = this.musicSlider.value / 100;
    this.musicVolume = percent;
    storeItem("fiery-attraction-music-volume", percent);

    this.updateVolume();
  }
  
  loseScreen(dt, ctx) {
    const MIN_SCL = Math.min(width - 20, height - 20);
    const MAX_SCL = Math.max(width - 20, height - 20);
    const BLARE = (sin(frameCount / 14) + 1) / 2;
    
    // Stop sounds
    // sounds.stopSound(rocketSound);
    // sounds.stopSound(burningSound);
    htmlSounds.stopSound(rocketSound);
    htmlSounds.stopSound(burningSound);
    htmlSounds.fadeSound(soundTrack, 0.0, 1);
    // collisionSound.stop();
    // burningSound.stop();
    // shootSound.stop();
    // hitSound.stop();
    // rocketSound.stop();
    alarmSound.stop();

    // Background
    background(0);
    
    // Rotating sun
    let sunRotation = frameCount / 2000;
    ctx.background(0);
    ctx.imageMode(CENTER);
    ctx.push();
    ctx.translate(width / 2, height * 1.3);
    ctx.rotate(sunRotation);
    ctx.image(sunSprite, 0, 0, height * 1.5, height * 1.5);
    ctx.pop();
    
    let viewX = cos(-sunRotation - HALF_PI) * height / 2;
    let viewY = sin(-sunRotation - HALF_PI) * height / 2;
    
    panzoom.zoom = 1;
    stars.setViewPosition(viewX, viewY);
    panzoom.setInView(viewX, viewY);
    panzoom.setRotation(sunRotation);
    stars.draw(ctx);
    
    // Ship
    // this.ship0.draw(ctx);
    
    imageMode(CORNER);
    image(ctx, 0, 0, width, height);
    
    // Game over text
    fill(255);
    noStroke();
    textSize(MIN_SCL * 0.1);
    textFont(futureFont);
    text("GAME OVER", width / 2, height / 3);
    
    // Score
    textSize(MIN_SCL * 0.05);
    textFont("monospace");
    text("SCORE " + hud.score, width / 2, height * 0.45);
    
    // Space to continue
    fill(BLARE * 130 + 125);
    textAlign(CENTER, CENTER);
    textSize(MIN_SCL * 0.03);
    text("Press Space to Continue", width / 2, height * 0.52);

    // Top score
    if (hud.score > hud.topScore) {
      this.highScore = true;
      hud.topScore = hud.score;
      storeItem("fiery-attraction-top-score", hud.topScore);
    }

    if (this.highScore) {
      let lightness = BLARE * 130 + 125;
      fill(lightness);
      textAlign(CENTER, CENTER);
      textSize(MIN_SCL * 0.06);
      textFont("Arial Black");
      text("HIGH SCORE!", width / 2, height * 0.2);
    }
    
    if (keys.SPACE && this.sceneTime > 60) {
      this.cutSceneTo(this.scene0, this.initScene0);
    }
  }
  
  initScene0() {
    const SCL = Math.min(width, height);
    this.currentScene = this.scene0;
    this.ship0 = new Ship(0, height * 0.3);
    this.ship0.s = SCL * 0.05;
    this.ship0.vx = SCL / 8;
    this.ship0.vy = 0;
    this.highScore = false;

    // Elements
    this.controlButton.style.visibility = "visible";
    
    // Start soundtrack
    titleScreenTrack.currentTime = 0;
    htmlSounds.fadeSound(titleScreenTrack, 0.4 * this.musicVolume, 1);
  }
  
  initScene1() {
    const SCL = Math.min(width, height);
    let collisionDist = width / 2;
    
    // Ship sound
    htmlSounds.fadeSound(rocketSound, 0.04, 0.2);
    // sounds.startSound(rocketSound);
    
    // Ship
    this.ship0 = new Ship(width / 2 - collisionDist, height / 2);
    this.ship0.vx = SCL / 8;
    this.ship0.vy = 0;
    this.ship0.s = SCL * 0.05;
    this.ship0.control.boost = true;
    this.ship0.collided = 0;
    this.ship0.control.steerVel = 0;
    
    // Asteroid
    this.asteroid0 = new Asteroid(width / 2, height / 2 - collisionDist * 4, SCL / 5, 0, SCL / 2);
    
    this.currentScene = this.scene0;
  }
  
  initScene2() {
    // Settings
    ship.reset();
    ship.control.steerVel = 2;
    panzoom.zoom = 3.0;
    hud.score = 0;
    asteroids.length = 0;
    bullets.length = 0;
    explosions.length = 0;
    enemies.length = 0;
    initAsteroids();
    initEnemies();
  }
  
  scene0(dt, ctx) {
    const MIN_SCL = Math.min(width - 20, height - 20);
    const MAX_SCL = Math.max(width - 20, height - 20);
    const BLARE = (sin(frameCount / 14) + 1) / 2;
    
    // Move ship
    let shipTheta = frameCount / 300 + 0.3;
    shipTheta = shipTheta % (PI - 0.2);
    let shipX = width / 2 + cos(-shipTheta) * height * 0.65;
    let shipY = height + sin(-shipTheta) * height * 0.5 + height * 0.1;
    this.ship0.vx = (shipX - this.ship0.x) * 50;
    this.ship0.vy = (shipY - this.ship0.y) * 50;
    this.ship0.x = shipX;
    this.ship0.y = shipY;
    
    // Rotating sun
    let sunRotation = frameCount / 2000;
    
    // Display context
    ctx.background(0);
    ctx.push();
    ctx.translate(width / 2, height * 1.3);
    ctx.rotate(sunRotation);
    ctx.imageMode(CENTER);
    ctx.image(sunSprite, 0, 0, height * 1.5, height * 1.5);
    ctx.pop();
    
    // ctx.push();
    // ctx.translate(width/2, height);
    // ctx.rotate(sunRotation);
    // ctx.translate(-width/2, -height/2);
    // stars.draw(ctx, false);
    // ctx.pop();
    // let viewX = cos(starRotation) * height;
    // let viewY = sin(starRotation) * height;
    let viewX = 0;
    let viewY = 0;
    viewX += cos(-sunRotation - HALF_PI) * height / 2;
    viewY += sin(-sunRotation - HALF_PI) * height / 2;
    
    panzoom.zoom = 1;
    stars.setViewPosition(viewX, viewY);
    panzoom.setInView(viewX, viewY);
    panzoom.setRotation(sunRotation);
    stars.draw(ctx);
    
    this.ship0.draw(ctx);
    
    imageMode(CORNER);
    image(ctx, 0, 0, width, height);
    
    if (!this.controlsOpen) {
      
      // Top score
      let bounds = this.controlButton.getBoundingClientRect();
      let topScoreY = bounds.y + bounds.height / 2;
      fill(255);
      noStroke();
      textSize(MIN_SCL * 0.04);
      textFont("monospace");
      textAlign(LEFT, CENTER);
      text("TOP SCORE " + hud.topScore, 20, topScoreY);

      // Title
      textFont(futureFont);
      textSize(MIN_SCL * 0.08);
      textAlign(CENTER, CENTER);
      text("FIERY ATTRACTION", width / 2, height * 0.25);
      
      // Space to start
      fill(BLARE * 130 + 125);
      textAlign(CENTER, CENTER);
      textSize(MIN_SCL * 0.05);
      textFont("Trebuchet MS");
      text("Press Space to Start", width / 2, height * 0.45);

      if (pressed.SPACE) {
        this.controlButton.style.visibility = "hidden";
        
        // Stop title soundtrack
        htmlSounds.fadeSound(titleScreenTrack, 0.0, 1);
        
        this.cutSceneTo(this.scene1, this.initScene1);
      }
    }
  }
  
  scene1(dt, ctx) {
    if (!ctx) return;
    
    const SCL = Math.max(width, height);
    
    // Move
    this.ship0.x += this.ship0.vx * dt;
    this.ship0.y += this.ship0.vy * dt;
    this.ship0.control.steeringAngle += this.ship0.control.steerVel * dt;
    this.asteroid0.x += this.asteroid0.vx * dt;
    this.asteroid0.y += this.asteroid0.vy * dt;
    
    // Check for collision
    if (!this.ship0.collided && this.asteroid0.y >= height / 2 - this.ship0.s) {
      this.ship0.collided++;
      this.asteroid0.vy /= 2;
      this.ship0.vy = this.asteroid0.vy;
      this.ship0.control.steerVel = 4;
      
      // sounds.playRandomly(collisionSound);
      htmlSounds.playSound(collisionSound, 0.3);
    } else if (this.ship0.collided) {
      this.ship0.collided++;
    }
    
    // Background
    ctx.background(0);
    panzoom.zoom = 0.5;
    stars.draw(ctx, false);
    
    // Display
    this.ship0.draw(ctx);
    this.asteroid0.drawRock(ctx);
    
    // Shake
    let xoff = 0, yoff = 0;
    if (this.ship0.collided) {
      let t = frameCount / 5;
      let a = 40 * (1 / (this.ship0.collided * 0.03 + 1));
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
    fill(100);
    noStroke();
    textSize(20);
    textAlign(CENTER, TOP);
    textFont("monospace")
    text("Press Space to Skip Intro", width/2, 6);
    
    // Scene over
    if (this.ship0.y > height + this.ship0.vy * 1 || pressed.SPACE) {
      alarmSound.stop();
      this.impactMessageTime = this.messageTime;
      htmlSounds.fadeSound(rocketSound, 0.0, 0.2);
      // sounds.stopSound(rocketSound);
      this.introSkipped = pressed.SPACE;
      
      // Cut scene
      this.cutSceneTo(this.scene2, this.initScene2);
    }
  }
  
  scene2(dt, ctx) {
    ctx.background(0);
    
    ship.controls(dt);
    ship.alignCamera();

    panzoom.begin(ctx);

    panzoom.end(ctx);
    sun.draw(ctx);
    stars.draw(ctx);
    panzoom.begin(ctx);

    moveAsteroids(dt);
    moveEnemies(dt);
    moveBullets(dt);
    moveExplosions(dt);
    
    ship.move(dt, ctx);
    ship.updateCollisions();
    ship.updateStats();
    
    drawEnemies(ctx);
    ship.draw(ctx);

    drawBullets(ctx);
    panzoom.end(ctx);

    drawAsteroids(ctx);
    
    panzoom.begin();
    drawExplosions(ctx);
    panzoom.end();
    
    hud.draw(ctx);
    
    // Ship health
    if (ship.health <= 0) {
      this.cutSceneTo(this.loseScreen, null, 1);
    }
    
    // Start of sound track
    if ((this.sceneTime > 120 || this.introSkipped) && soundTrack.volume == 0) {
      soundTrack.currentTime = 0;
      htmlSounds.fadeSound(soundTrack, 0.8 * this.musicVolume, 1);
    }
  }
  
  cutSceneTo(scene, initScene = null, fadeTime = 1) {
    if (this.nextScene == scene) return;
    this.nextScene = scene;
    this.nextInitScene = initScene;
    this.fadeTime = fadeTime;
    this.sceneTime = 0;
  }
  
  runCutScene(dt) {
    if (this.nextScene != null) {
      this.fade += 0.025;
    } else {
      this.fade -= 0.025;
      if (this.fade < 0)
        this.fade = 0;
    }
    
    if (this.fade >= this.fadeTime) {
      if (this.nextScene) {
        if (this.nextInitScene) {
          this.nextInitScene();
          this.nextInitScene = null;
          this.sceneTime = 0;
        }
        this.currentScene = this.nextScene;
        this.nextScene = null;
      }
    }
    
    background(0, this.fade * 255);
  }
  
  runCurrentScene(dt, ctx) {
    if (this.currentScene == null) return;
    this.sceneTime++;
    this.currentScene(dt, ctx);
    this.runCutScene(dt);
  }
}

/*

















  # Loving principal

*/
