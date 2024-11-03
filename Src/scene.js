
class Scenes {
  constructor() {
    this.currentScene = null;
    this.nextScene = null;
    this.fade = 0;
    this.fadeTime = 1;
    this.messageTime = 300;
    this.impactMessageTime = this.messageTime;
    this.introSkipped = false;
    this.highScore = "none";
    this.gameOver = false;
    this.paused = false;
    
    // Events
    this.eventManager = new EventManager();

    // Scenes
    this.titleScene = new TitleScene();
    this.introScene = new IntroScene();
    this.gameScene = new GameScene();
    this.gameOverScene = new GameOverScene();

    // Elements
    this.musicSlider = document.getElementById("music-volume");
    this.helpControls = document.getElementById("help-controls");
    this.controlButton = document.getElementById("controls");
    this.pauseButton = document.getElementById("pause");
    this.versionTag = document.getElementById("version");
    this.controlsOpen = false;
    this.sceneTime = 0;
    
    // Music volume
    this.musicVolume = 0.5;
    this.musicVolume = getItem("fiery-attraction-music-volume") ?? 0.5;
    
    // Bad data test
    if (isNaN(1 + this.musicVolume))
      this.musicVolume = 0.5;

    // Update music slider and volume
    this.musicSlider.value = this.musicVolume * 100;
    this.updateVolume();

    // Ship camera mode
    const cameraMode = getItem("fiery-attraction-camera-mode") || "normal";
    if (cameraMode == "rotated") document.getElementById("alternate-camera").click();
  }

  setup() {
    this.setScene(this.titleScene);
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

  togglePause() {
    this.paused = !this.paused;
    this.toggleControls();
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

  //////////////////////
  // Switching scenes //
  //////////////////////

  setScene(scene) {
    this.currentScene = scene;
    this.currentScene.init();
  }

  cutSceneTo(scene, fadeTime = 1) {
    if (this.nextScene == scene) return;
    this.nextScene = scene;
    this.fadeTime = fadeTime;
    this.sceneTime = 0;
  }
  
  runCutScene(dt) {
    if (this.nextScene != null) {
      this.fade += 0.025 / this.fadeTime;
    } else {
      this.fade -= 0.025 / this.fadeTime;
      if (this.fade < 0)
        this.fade = 0;
    }
    
    if (this.fade >= 1) {
      if (this.nextScene) {
        this.sceneTime = 0;

        // Set new scene
        this.currentScene = this.nextScene;
        this.nextScene = null;

        // Initiate scene
        this.currentScene.init();
      }
    }
    
    background(0, this.fade * 255);
  }
  
  abortCutScene() {
    this.nextScene = null;
  }

  runCurrentScene(dt, ctx) {
    if (this.currentScene == null) return;
    this.sceneTime += dt;
    this.currentScene.run(dt, ctx);
    this.runCutScene(dt);
  }

  runEvents(dt, ctx) {
    this.eventManager.updateEvents(dt, ctx);
  }
}

class Scene {
  constructor() {

  }

  init() {

  }

  run(dt, ctx) {

  }
}

class TitleScene extends Scene {
  init() {
    const SCL = Math.min(width, height);
    this.ship = new Ship(0, height * 0.3);
    this.ship.s = SCL * 0.05;
    this.titleScreenShipDir = Math.random() < 0.1 ? -1 : 1;
    // this.ship.vx = SCL / 8;
    // this.ship.vy = 0;
    scenes.highScore = "none";
    scenes.gameOver = false;

    // Elements
    scenes.controlButton.style.visibility = "visible";
    scenes.versionTag.style.visibility = "visible";
    scenes.pauseButton.style.visibility = "hidden";

    // Start soundtrack
    titleScreenTrack.currentTime = 0;
    htmlSounds.fadeSound(titleScreenTrack, 0.4 * scenes.musicVolume, 1);
  }

  run(dt, ctx) {

    const MIN_SCL = Math.min(width - 20, height - 20);
    const MAX_SCL = Math.max(width - 20, height - 20);
    const BLARE = (sin(frameCount / 14) + 1) / 2;
    let sunRotation = frameCount / 2000;
    
    // Move ship
    let shipTheta = frameCount / 300 * this.titleScreenShipDir - sunRotation;
    shipTheta = ((shipTheta % PI) + PI) % PI;
    let shipX = width / 2 + cos(-shipTheta) * height * 0.65;
    let shipY = height + sin(-shipTheta) * height * 0.5 + height * 0.1;
    this.ship.vx = (shipX - this.ship.x) * 50;
    this.ship.vy = (shipY - this.ship.y) * 50;
    this.ship.x = shipX;
    this.ship.y = shipY;
    this.ship.a = atan2(this.ship.vy, this.ship.vx);
    
    // Rotating sun
    let viewX = 0;
    let viewY = 0;
    viewX += cos(-sunRotation - HALF_PI) * height / 2;
    viewY += sin(-sunRotation - HALF_PI) * height / 2;
    
    ctx.background(bgCol);

    panzoom.zoom = 1;
    stars.setViewPosition(viewX, viewY);
    panzoom.setInView(viewX, viewY);
    panzoom.setRotation(sunRotation);
    stars.draw(ctx);
    
    // Display context
    ctx.push();
    ctx.translate(width / 2, height * 1.3);
    ctx.rotate(sunRotation);
    ctx.imageMode(CENTER);
    ctx.image(sunSprite, 0, 0, height * 1.5, height * 1.5);
    ctx.pop();

    this.ship.draw(ctx);
    
    imageMode(CORNER);
    image(ctx, 0, 0, width, height);
    
    // Testing
    // mobile.update(dt);
    // mobile.draw();
    // hud.draw(dt, ctx);

    if (!scenes.controlsOpen) {
      
      // Top score
      let bounds = scenes.controlButton.getBoundingClientRect();
      let topScoreY = bounds.y + bounds.height / 2;
      fill(255);
      noStroke();
      textSize(MIN_SCL * 0.04);
      textFont("monospace");
      textAlign(LEFT, CENTER);
      text("HIGH SCORE " + hud.getHighscore(), 20, topScoreY);
      text("DAILY HS " + hud.getDailyHighscore(), 20, topScoreY + MIN_SCL * 0.04 + 4);


      // Title
      textFont(futureFont);
      textSize(MIN_SCL * 0.08);
      textAlign(CENTER, CENTER);
      text("FIERY ATTRACTION", width / 2, height * 0.25);
      
      // Space to start
      const txtSize = MIN_SCL * 0.05
      const startTxt = mobile.isMobile ? "Tap to Start" : "Press Space to Start";
      fill(BLARE * 130 + 125);
      textAlign(CENTER, CENTER);
      textSize(txtSize);
      textFont("Trebuchet MS");
      text(startTxt, width / 2, height * 0.45);

      // Start button logic
      let started = false;
      if (mobile.isMobile) {
        if (touch.pressed) {
          let txtW = textWidth(startTxt);
          started = Math.abs(mouseX - width / 2) < txtW / 2 &&
            Math.abs(mouseY - height * 0.45) < txtSize / 2;
        }
      } else {
        started = pressed.SPACE;
      }

      if (started) {
        scenes.controlButton.style.visibility = "hidden";
        scenes.versionTag.style.visibility = "hidden";

        // Stop title soundtrack
        htmlSounds.fadeSound(titleScreenTrack, 0.0, 1);
        
        // Next scene
        scenes.cutSceneTo(scenes.introScene);
      }
    }
  }
}

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
    stars.draw(ctx, false);
    
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

class GameScene extends Scene {
  constructor() {
    super();
  }
  
  init() {
    if (mobile.isMobile)
      scenes.pauseButton.style.visibility = "visible";

    // Settings
    ship.reset();
    hud.reset();
    ship.control.steerVel = 2;
    panzoom.zoom = mobile.isMobile ? 1.5 : 3.0;
    bullets.length = 0;
    explosions.length = 0;
    enemies.length = 0;
    healthBars.length = 0;

    // Put player in tough spot if they didn't skip (lol)
    if (!scenes.introSkipped) {
      ship.control.steerVel = 4;
      ship.reset(true);
      // ship.vx = 0;
      // ship.vy = -45;
      // ship.setPosition(600, 600);
    } else {
      ship.reset(false);
    }

    // Set ship angle at start
    ship.a = atan2(ship.vy, ship.vx);
  
    clearAllEffects();
    clearAsteroids();
    initAsteroids();

    const ENEMY_COUNT = scenes.introSkipped ? 4 : 2;
    initEnemies(ENEMY_COUNT);
  }

  run(dt, ctx) {
    // Pausing
    if (pressed.P || pressed.ESCAPE) {
      scenes.paused = !scenes.paused;
      scenes.toggleControls();
    }
    if (scenes.paused)
      dt = 0;

    ship.controls(dt);
    mobile.update(dt);
    ship.alignCamera();

    // Background
    ctx.background(bgCol);
    
    // Space background
    // const aspect = spacebg.height / spacebg.width;
    // const MIN_SCL = Math.min(width, height);
    // const imgW = 4 * MIN_SCL;
    // const imgH = 4 * MIN_SCL * aspect;
    // ctx.push();
    // ctx.translate(width/2, height/2);
    // ctx.scale(panzoom.zoom);
    // ctx.rotate(panzoom.rot);
    // ctx.imageMode(CENTER);
    // ctx.tint(10, 15, 30);
    // ctx.image(spacebg, 0, 0, imgW, imgH);
    // ctx.noTint();
    // ctx.pop();

    stars.draw(ctx);
    
    panzoom.begin(ctx);
    updateSolarFlairs(dt);
    drawSolarFlairs(ctx);
    panzoom.end(ctx);
    
    system.update(dt);
    system.draw(ctx);
    
    panzoom.begin(ctx);
    updateAllEffects(dt);
    moveAsteroids(dt);
    moveEnemies(dt);
    moveBullets(dt);
    moveExplosions(dt);
    
    ship.resetStats();
    ship.move(dt, ctx);
    ship.updateCollisions(dt);
    ship.updateSounds();
    
    drawEnemies(ctx);
    ship.draw(ctx);
    drawBullets(ctx);
    panzoom.end(ctx);

    drawAsteroids(ctx);
    
    panzoom.begin(ctx);
    drawExplosions(ctx);
    runBonusEffects(dt, ctx);
    runHealthBars(dt, ctx);
    hud.updateGuides(dt, ctx);
    panzoom.end(ctx);
    
    hud.draw(dt, ctx);
    mobile.draw();

    // Ship health
    if (ship.destroyed && !scenes.gameOver) {
      scenes.gameOver = true;
      spawnExplosion(ship.x, ship.y, ship, 0.3);
      setTimeout(() => {
        scenes.cutSceneTo(scenes.gameOverScene, 1);
      }, 500);
    } else if (ship.health > 0 && ship.destroyed && scenes.nextScene == scenes.gameOverScene) {
      // Resurrect ship
      ship.resurrect();
      hud.resurrectEffect();
      htmlSounds.playSound(resurrectionSound, 1, true);
      scenes.abortCutScene();
      scenes.gameOver = false;
    }
    
    // Start of sound track
    if ((scenes.sceneTime > 120 || scenes.introSkipped) && soundTrack.volume == 0) {
      soundTrack.currentTime = 0;
      htmlSounds.fadeSound(soundTrack, 0.8 * scenes.musicVolume, 1);
    }

    // Pause screen
    if (scenes.paused) {
      background(0, 100);
      if (!mobile.isMobile) {
        let MIN_SCL = min(width, height);
        let bounds = scenes.helpControls.getBoundingClientRect();
        fill(255);
        noStroke();
        textFont(futureFont);
        textSize(MIN_SCL * 0.1);
        textAlign(CENTER, CENTER);
        text("PAUSED", width / 2, (bounds.y + bounds.height + height) / 2);
      }
    }
  }
}

class GameOverScene extends Scene {
  init() {
    scenes.pauseButton.style.visibility = "hidden";
    scenes.versionTag.style.visibility = "visible";
    htmlSounds.stopSound(rocketSound);
    htmlSounds.removeSoundFromQueue(burningSound);
    htmlSounds.fadeSound(burningSound, 0, 0.2);
    htmlSounds.fadeSound(soundTrack, 0, 1);
    scenes.eventManager.reset();
    clearAllEffects();
    alarmSound.stop();
    if (scenes.paused) scenes.togglePause();
    scenes.highScore = hud.updateHighscores();
  }

  run(dt, ctx) {
    const MIN_SCL = Math.min(width - 20, height - 20);
    const MAX_SCL = Math.max(width - 20, height - 20);
    const BLARE = (sin(frameCount / 14) + 1) / 2;

    // Background
    background(bgCol);
    ctx.background(bgCol);
    
    // Rotating sun
    let sunRotation = frameCount / 2000;
    let viewX = cos(-sunRotation - HALF_PI) * height / 2;
    let viewY = sin(-sunRotation - HALF_PI) * height / 2;
    
    panzoom.zoom = 1;
    stars.setViewPosition(viewX, viewY);
    panzoom.setInView(viewX, viewY);
    panzoom.setRotation(sunRotation);
    stars.draw(ctx);
    
    ctx.imageMode(CENTER);
    ctx.push();
    ctx.translate(width / 2, height * 1.3);
    ctx.rotate(sunRotation);
    ctx.image(sunSprite, 0, 0, height * 1.5, height * 1.5);
    ctx.pop();

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

    if (scenes.highScore !== "none") {
      let lightness = BLARE * 130 + 125;
      fill(lightness);
      textAlign(CENTER, CENTER);
      textSize(MIN_SCL * 0.06);
      textFont(arialBlack);

      let highScoreText = scenes.highScore === "highscore" ? "HIGH SCORE!" : "DAILY HIGH SCORE!";
      text(highScoreText, width / 2, height * 0.2);
    }

    // Space to continue
    let nextTxt = mobile.isMobile ? "Tap to Continue" : "Press Space to Continue";
    let txtSize = MIN_SCL * 0.03;
    fill(BLARE * 130 + 125);
    textAlign(CENTER, CENTER);
    textSize(txtSize);
    text(nextTxt, width / 2, height * 0.52);
    
    // Next scene controls
    let nextScene = false;
    if (mobile.isMobile) {
      if (touch.pressed) {
        let txtW = textWidth(nextTxt);
        nextScene = Math.abs(mouseX - width / 2) < txtW / 2 &&
          Math.abs(mouseY - height * 0.52) < txtSize / 2;
      }
    } else {
      nextScene = pressed.SPACE;
    }

    // Next scene
    if (nextScene && scenes.sceneTime > 0.25) {
      scenes.cutSceneTo(scenes.titleScene);
    }
  }
}

/*

















  # Loving principal

*/
