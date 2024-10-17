
class HUD {
  constructor() {
    this.motionBlur = 0.5;
    this.temp = 0;
    this.score = 0;
    this.scoreText = new ScoreText();
    const version = document.getElementById("version").innerHTML.split(".");
    this.topScore = getItem("fiery-attraction-top-score-" + version[0] + "." + version[1]) || 0;
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

    // Meters
    this.meters = [];
    const healthMeter = this.addMeter();
    const ammoMeter = this.addMeter();
    const fuelMeter = this.addMeter();

    healthMeter.setColor(color(40, 200, 40, 200), color(200, 40, 40, 200));
    ammoMeter.setColor(color(220, 70, 20, 200), color(200, 40, 40, 200));
    fuelMeter.setColor(color(200, 40, 40, 200), color(200, 40, 40, 200));
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

  addMeter(col) {
    const meter = new Meter(col);
    this.meters.push(meter);
    return meter;
  }
  
  updateGuides(dt, ctx) {
    this.guide.update(dt);
    this.guide.draw(ctx);
  }

  reset() {
    this.score = 0;
    this.scoreText.reset();
    this.temp = 0;

    for (const meter of this.meters) {
      meter.reset();
    }
  }

  draw(dt, ctx) {
    // Camera transformations
    const SCALE = max(width, height);
    const MIN_SCALE = min(width, height);

    // Motion blur
    this.temp = lerp(this.temp, ship.stats.temp, 0.01);
    const ALPHA1 = max((1 - this.temp * 5) * 100, 5) + 10;
    const ALPHA2 = max((1 - this.temp * 5) * 50, 5) - 10;
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

    const healthMeter = this.meters[0];
    const ammoMeter = this.meters[1];
    const fuelMeter = this.meters[2];

    const meterH = 30;
    const meterY = meterH / 2 + 10;

    // Health Meter
    healthMeter.setLabel("Health " + ceil(ship.health * 10) / 10);
    healthMeter.setRect(width * 0.35, meterY, width * 0.2, meterH);
    healthMeter.setTargetPercent(min(ship.health / 100, 1));
    
    // Ammo meter
    ammoMeter.setLabel("Ammo " + round(ship.ammo*10)/10);
    ammoMeter.setRect(width * 0.6, meterY, width * 0.2, meterH);
    ammoMeter.setTargetPercent(min(ship.ammo / 200, 1));

    // Fuel mater
    fuelMeter.setLabel("Fuel " + round(ship.fuel*10)/10);
    fuelMeter.setRect(width * 0.85, meterY, width * 0.2, meterH);
    fuelMeter.setTargetPercent(min(ship.fuel / 50, 1));

    // Update meters
    for (const meter of this.meters) {
      meter.update(dt);
      meter.draw();
    }

    // Score
    this.scoreText.setScore(this.score);
    this.scoreText.update(dt);
    this.scoreText.draw(meterY, meterH / 2);

    // Effects
    textAlign(CENTER, CENTER);
    textFont("monospace");
    textSize(16);
    const effectOffX = 10;
    const effectOffY = 86; // 46
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
    fill(255, 0, 0, min(this.temp * 255, 50));
    noStroke();
    rect(0, 0, width, height);
    
  }
}

class Meter {
  constructor() {
    this.percent = 0;
    this.t = 2;
  }

  setLabel(label) {
    this.label = label;
  }

  setRect(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  setColor(col, col2 = this.col2) {
    this.col = col;
    this.col2 = col2;
  }

  setTargetPercent(percent) {
    if (this.targetPercent === percent) return;
    this.targetPercent = percent;
    if (this.t < 2) return;
    const diff = Math.abs(this.targetPercent - this.percent);
    this.t = diff < 0.01 ? 2 : (this.targetPercent > this.percent ? 1 : 0);
  }

  update(dt) {
    if (this.percent !== this.targetPercent && this.t > 1) {
      const interp = Math.min(this.t - 1, 1);
      this.percent = lerp(this.percent, this.targetPercent, interp);
    }

    this.t += dt;
  }

  reset() {
    this.percent = 0;
    this.targetPercent = 0;
    this.t = 2;
  }

  draw() {
    const { x, y, w, h, col, col2, label, percent, targetPercent } = this;
    const p0 = w * Math.min(targetPercent, percent);
    const p1 = w * percent; // Math.max(targetPercent, percent);

    // Meter
    noStroke();
    fill(red(col) * 0.4, green(col) * 0.4, blue(col) * 0.4, alpha(col));
    rect(x - w / 2 + p0, y - h / 2 - 1, p1 - p0, h);
    fill(col);
    rect(x - w / 2, y - h / 2 - 1, p0, h);

    // Meter outline
    noFill();
    stroke(50);
    strokeWeight(2);
    rect(x - w / 2, y - h / 2 - 1, w, h);
    
    // Label
    textAlign(CENTER, CENTER);
    fill(255);
    noStroke();
    textSize(h * 0.7);
    textFont(arialBlack);
    text(label, x, y);
  }
}

class ScoreText {
  constructor() {
    this.score = 0;
    this.scoreEarned = 0;
    this.t = 0;
    this.combo = 0;
    this.comboDuration = 5;
    this.comboTimer = this.comboDuration;
  }

  setScore(score) {
    if (this.score === score) return;
    
    if (score > this.score) {
      this.scoreEarned = Math.round((score - this.score) * (1 + this.combo * 0.25));
      score = this.score + this.scoreEarned;
      this.combo += 1;
      this.comboTimer = 0;
    }

    this.score = score;
    this.t = 0;
  }

  reset() {
    this.score = 0;
    this.scoreEarned = 0;
    this.t = 0;
    this.comboTimer = this.comboDuration;
    this.combo = 0;
    this.comboTextValue = this.combo;
  }

  update(dt) {
    this.t += dt;
    this.comboTimer += dt;

    if (this.comboTimer > this.comboDuration) {
      this.combo = 0;
    }
  }

  draw(x, y) {
    const scoreText = "SCORE " + this.score;
    const comboText = "COMBO ";

    fill(255);
    noStroke();
    textSize(30);
    textFont("monospace");
    textAlign(LEFT, TOP);
    text(scoreText, x, y);
    
    // Flash when 3 seconds left
    const flashTime = 3;
    const comboTime = Math.min(Math.max(this.comboTimer - (this.comboDuration - flashTime), 0), flashTime);
    const flashing = 0.5 + 0.5 * sin(comboTime * TWO_PI - HALF_PI);
    const comboColor = color(255, 255 - flashing * 200);

    fill(comboColor);
    text(comboText, x, y + 35);

    const comboScaleValue = 0.25;
    const comboScaleTimeValue = 0.5;
    const comboScaleTime = Math.min(this.comboTimer / comboScaleTimeValue, 1);
    const comboScale = 1 + (1 + sin(comboScaleTime * TWO_PI - HALF_PI)) * comboScaleValue;
    push();
    translate(x + textWidth(comboText), y + 35 + 15);
    scale(comboScale);
    text("×" + (this.combo * 0.25 + 1), 0, -15);
    pop();

    // Score earned
    if (this.scoreEarned > 0 && this.t < 1) {
      const offsetX = textWidth(scoreText);
      const s = 0.5 + 0.5 * sin(this.t * HALF_PI);
      const a = 255 * cos(this.t * HALF_PI);
      const earnedText = "+" + Math.round(this.scoreEarned * 100) / 100;
      fill(255, a);
      push();
      translate(x + offsetX + 10, y + 15);
      scale(s);
      text(earnedText, 0, -15);
      pop();
    }
  }
}
