
class HUD {
  constructor() {
    const version = document.getElementById("version").innerHTML;
    this.motionBlur = 0.5;
    this.temp = 0;
    this.score = 0;
    this.topScore = getItem("fiery-attraction-top-score-" + version) || 0;
    this.guide = new Guide();
    this.radar = new Radar();

    // Check bad values
    if (isNaN(1 + this.topScore))
      this.topScore = 0;

    // Load previous motionblur value from localStorage
    const motionBlurSlider = document.getElementById("motion-blur");
    const motionBlurValue = getItem("fiery-attraction-motion-blur");
    motionBlurSlider.value = motionBlurValue === undefined ? 0.5 : motionBlurValue;
    this.setMotionBlur(parseFloat(motionBlurSlider.value));

    this.cameraShake = { amount: 0, speed: 0 };
  }

  setMotionBlur(amt) {
    this.motionBlur = amt;
    storeItem("fiery-attraction-motion-blur", amt);
  }
  
  addCameraShake(amount, speed) {
    this.cameraShake.amount = amount;
    this.cameraShake.speed = speed;
  }
  
  addScore(amount) {
    this.score += amount;
  }
  
  drawMeter(label, precent, x, y, w, h, col) {
    // Fuel
    let fuelbarW = w;
    let meter = precent;    
    
    noStroke();
    fill(col);
    rect(x - fuelbarW / 2, y - h / 2 - 1, fuelbarW * meter, h);
    
    noFill();
    stroke(50);
    strokeWeight(2);
    rect(x - fuelbarW / 2, y - h / 2 - 1, fuelbarW, h);
    
    textAlign(CENTER, CENTER);
    fill(255);
    noStroke();
    textSize(h * 0.7);
    textFont(arialBlack);
    text(label, x, y);
  }
  
  updateGuides(dt, ctx) {
    this.guide.update(dt);
    this.guide.draw(ctx);
  }

  draw(dt, ctx) {
    // Camera transformations
    const SCALE = max(width, height);
    const MIN_SCALE = min(width, height);

    // Motion blur
    const ALPHA1 = max((1 - ship.stats.temp * 5) * 100, 5) + 10;
    const ALPHA2 = max((1 - ship.stats.temp * 5) * 50, 5) - 10;
    const ALPHA = this.motionBlur < 0.5 ? lerp(255, ALPHA1, this.motionBlur * 2) : lerp(ALPHA1, ALPHA2, (this.motionBlur - 0.5) * 2);
    
    // Shake
    const SHAKE_SCALER = Math.max(panzoom.zoom, 1.5);
    const shakeMult = this.cameraShake.amount * SHAKE_SCALER;
    const shakeSpeed = this.cameraShake.speed;
    let xoff = noise(20 + shakeSpeed * frameCount) * shakeMult;
    let yoff = noise(40 + shakeSpeed * frameCount) * shakeMult;
    this.cameraShake.amount = lerp(this.cameraShake.amount, 0, 0.02);
    this.cameraShake.speed = lerp(this.cameraShake.speed, 0, 0.04);
    
    // Game window
    CTX2.push();
    CTX2.translate(width/2, height/2);
    CTX2.scale(1 + shakeMult * (1.5 / SCALE));
    CTX2.translate(-width/2 + xoff, -height/2 + yoff);
    CTX2.tint(255, ALPHA);
    CTX2.imageMode(CORNER);
    CTX2.image(ctx, 0, 0, width, height);
    CTX2.pop();
    image(CTX2, 0, 0, width, height);

    // Events
    if (!scenes.paused)
      scenes.runEvents(dt, ctx);

    // Radar
    // this.radar.update(dt);
    // this.radar.draw();

    // Health Meter
    let meterH = 30;
    let meterY = meterH / 2 + 10;
    let healthTxt = "Health " + ceil(ship.health*10)/10;
    let healthPercent = min(ship.health / 100, 1);
    this.drawMeter(healthTxt, healthPercent, width * 0.35, meterY, width * 0.2, meterH, color(40, 200, 40, 200));
    
    // Ammo meter
    let ammoTxt = "Ammo " + round(ship.ammo*10)/10;
    let ammoPercent = min(ship.ammo / 200, 1);
    this.drawMeter(ammoTxt, ammoPercent, width * 0.6, meterY, width * 0.2, meterH, color(220, 70, 20, 200));
    
    // Fuel mater
    let fuelTxt = "Fuel " + round(ship.fuel*10)/10;
    let fuelPercent = min(ship.fuel / 50, 1);
    this.drawMeter(fuelTxt, fuelPercent, width * 0.85, meterY, width * 0.2, meterH, color(200, 40, 40, 200));
    
    // Score
    fill(255);
    noStroke();
    textSize(30);
    textFont("monospace");
    textAlign(LEFT, CENTER);
    text("SCORE " + this.score, meterY, meterH);
    
    // Effects
    textAlign(CENTER, CENTER);
    textFont("monospace");
    textSize(16);
    const effectOffX = 10;
    const effectOffY = 46;
    const effectW = width * 0.1;
    const effectH = 20;
    const effectGap = 6;
    for (let i = 0; i < ship.effects.length; ++i) {
      const effect = ship.effects[i];
      const t = effect.timeRemaining / effect.duration;
      const yOff = effectOffY + (effectH + effectGap) * i;
      fill(colorAlpha(effect.color, 200));
      rect(
        effectOffX,
        yOff,
        effectW * t,
        effectH
      );
      noFill();
      stroke(255);
      strokeWeight(1);
      rect(
        effectOffX,
        yOff,
        effectW,
        effectH
      );
      fill(255);
      noStroke();
      text(effect.getText(), effectOffX + effectW / 2, yOff + effectH / 2);
    }

    // Low fuel
    if (ship.fuel < 5) {
      let DELAY = 15;
      let AMT = 8;
      let message = "LOW FUEL";
      if (ship.fuel == 0) {
        DELAY = 7.5;
        AMT = 13;
        message = "NO FUEL";
      }
      const BLARE1 = (sin(frameCount / DELAY) + 1) * AMT;
      const BLARE2 = (sin(frameCount / DELAY + PI) + 1) * AMT;
      noStroke();
      fill(255, BLARE2 * 8, BLARE2 * 8);
      textAlign(CENTER, CENTER);
      textSize(20);
      textFont(arialBlack);
      text(message, width * 0.85, 57);
      fill(255, 0, 0, BLARE1);
      rect(0, 0, width, height);
    }
    
    // Impact iminent message
    if (scenes.impactMessageTime > 0 && !scenes.introSkipped) {
      const t = scenes.impactMessageTime--;
      const OPACITY = Math.min(t * 2, 255);
      const DELAY = 10;
      const AMT = 80;
      const BLARE = (sin(frameCount / DELAY) + 1) * AMT;
      noStroke();
      fill(255, BLARE, BLARE, OPACITY);
      textAlign(CENTER, CENTER);
      textSize(MIN_SCALE * 0.1);
      textFont(arialBlack)
      text("IMPACT IMMINENT!", width / 2, height / 2);
      
      if (t % 20 < 1)
        alarmSound.play();
    }
    
    // Ship temperature
    fill(255, 0, 0, min(ship.stats.temp * 255, 50));
    noStroke();
    rect(0, 0, width, height);
    
  }
}

