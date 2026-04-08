
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

    // Hide effect buttons
    hud.effectsBar.hideButtons();
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
