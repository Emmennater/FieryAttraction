
class GameScene extends Scene {
  constructor() {
    super();
    this.eventManager = new EventManager();
  }
  
  init() {
    if (mobile.isMobile)
      scenes.pauseButton.style.visibility = "visible";

    // Settings
    hud.reset();
    this.eventManager.reset();
    panzoom.zoom = mobile.isMobile ? 1.5 : 3.0;
    bullets.length = 0;
    explosions.length = 0;
    enemies.length = 0;
    healthBars.length = 0;

    // Put player in tough spot if they didn't skip (lol)
    if (!scenes.introSkipped) {
      ship.reset(true);
    } else {
      ship.reset(false);
    }
  
    clearAllEffects();
    clearAsteroids();
    initAsteroids();

    const ENEMY_COUNT = scenes.introSkipped ? 4 : 2;
    initEnemies(ENEMY_COUNT);

    if (mobile.isMobile) {
      // Show effect buttons
      hud.effectsBar.showButtons();
    }
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

    // Events
    this.eventManager.updateEvents(dt, ctx);

    // Background
    ctx.background(bgCol);
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
    
    this.eventManager.drawEvents(ctx);
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
