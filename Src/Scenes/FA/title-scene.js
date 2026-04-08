
class TitleScene extends Scene {
  init() {
    const SCL = Math.min(width, height);
    this.ship = new Ship(0, height * 0.3);
    this.ship.s = SCL * 0.05;
    this.titleScreenShipDir = Math.random() < 0.1 ? -1 : 1;
    
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

    const MIN_SCL = Math.min(width * 0.8 - 20, height - 20);
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
      let topScoreY = mobile.isMobile ? bounds.y : bounds.y + MIN_SCL * 0.02;
      let topScoreX = MIN_SCL * 0.04;
      fill(255);
      noStroke();
      textSize(MIN_SCL * 0.04);
      textFont("monospace");
      textAlign(LEFT, CENTER);
      text("HIGH SCORE " + hud.getHighscore(), topScoreX, topScoreY);
      text("DAILY HS " + hud.getDailyHighscore(), topScoreX, topScoreY + MIN_SCL * 0.04 + 4);

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
