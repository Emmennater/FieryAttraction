
const objectEffects = [];

class Effect {
  constructor(target, dat) {
    objectEffects.push(this);
    this.name = "effect";
    this.category = "default";
    this.target = target;
    this.duration = dat.duration || 1;
    this.level = dat.level || 1;
    this.timeRemaining = this.duration;
    this.done = false;
    this.color = color(255);
  }

  getText() {
    return this.name + (this.level > 1 ? " " + romanNumeral(this.level) : "");
  }

  update(dt) { }

  stop() {

  }

  run(dt) {
    this.update(dt);

    // Time remaining
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.done = true;
      this.stop();
    }
  }
}

class SuperSpeed extends Effect {
  constructor(target, dat) {
    super(target, dat);
    this.name = "speed";
    this.category = "boost";
    this.color = color(30, 180, 200);
  }

  update(dt) {
    this.target.speedMult = 4 + this.level;
    this.target.exaustCol = {
      min: { r: 30, g: 180, b: 200, a: 100 },
      add: { r: 40, g: 30, b: 50, a: 0 }
    };
  }

  stop() {
    this.target.speedMult = 1;
    this.target.exaustCol = this.target.oldExaustCol;
  }

  run(dt) {
    this.update(dt);

    // Time remaining
    if (!this.target.control.boost) return;
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.done = true;
      this.stop();
    }
  }
}

class CustomRounds extends Effect {
  constructor(target, dat) {
    super(target, dat);
    this.name = "custom";
    this.category = "bullet";
    this.bulletType = "custom";
    this.oldBulletType = Bullet;
    this.oldBulletLevel = 1;
    this.color = color(30, 180, 200);
  }

  update(dt) {
    this.target.bulletType = this.bulletType;
    this.target.bulletLevel = this.level;
  }

  stop() {
    this.target.bulletType = this.oldBulletType;
    this.target.bulletLevel = this.oldBulletLevel;
  }

  run(dt) {
    this.update(dt);

    // Time remaining
    if (!this.target.control.fire) return;
    this.timeRemaining -= this.target.lastBullet.consumes;
    if (this.timeRemaining <= 0) {
      this.done = true;
      this.stop();
    }
  }
}

class HomingRounds extends CustomRounds {
  constructor(target, dat) {
    super(target, dat);
    this.name = "homing rounds";
    this.bulletType = HomingBullet;
    this.color = color(190, 59, 217);
  }
}

class SpeedRounds extends CustomRounds {
  constructor(target, dat) {
    super(target, dat);
    this.name = "sonic rounds";
    this.bulletType = SpeedBullet;
    this.color = color(30, 180, 200);
  }
}

class MegaRounds extends CustomRounds {
  constructor(target, dat) {
    super(target, dat);
    this.name = "mega rounds";
    this.bulletType = MegaBullet;
    this.color = color(114, 66, 245);
  }
}

class ExplosiveRounds extends CustomRounds {
  constructor(target, dat) {
    super(target, dat);
    this.name = "explosive rounds";
    this.bulletType = ExplosiveBullet;
    this.color = color(255, 115, 0);
  }
}

class MultiShot extends Effect {
  constructor(target, dat) {
    super(target, dat);
    this.name = "multishot";
    this.category = "bullet modifier";
    this.color = color(255, 114, 0);
    this.multishotQuantity = 2 + this.level;
  }

  update(dt) {
    this.target.multishot = this.multishotQuantity;
  }

  stop() {
    this.target.multishot = 1;
  }

  run(dt) {
    this.update(dt);

    // Time remaining
    if (!this.target.control.fire) return;
    const ammoConsumed = this.target.lastBullet ? this.target.lastBullet.consumes : 1;
    this.timeRemaining -= ammoConsumed;
    if (this.timeRemaining <= 0) {
      this.done = true;
      this.stop();
    }
  }
}

function updateAllEffects(dt) {
  let affectedObjects = new Map(); // Map to track categories per target

  for (let i = 0; i < objectEffects.length; ++i) {
    const effect = objectEffects[i];
    const target = effect.target;

    // Initialize map for the target if it doesn't exist
    if (!affectedObjects.has(target)) {
      affectedObjects.set(target, new Set());
    }

    const activeCategories = affectedObjects.get(target);

    // Skip this effect if its category is already running on the target
    if (activeCategories.has(effect.category)) {
      continue;
    }

    if (effect.done) {
      effect.target.removeEffect(effect);
      objectEffects.splice(i--, 1);
      continue;
    }

    effect.run(dt);
    activeCategories.add(effect.category); // Mark the category as active for this target
  }
}

function clearAllEffects() {
  for (let i = objectEffects.length - 1; i >= 0; --i) {
    const effect = objectEffects[i];
    effect.stop();
    effect.target.removeEffect(effect);
    objectEffects.splice(i, 1);
  }
}

function addEffect(Effect, target, dat, sender) {
  // Look to see if this effect already exists
  for (let i = 0; i < objectEffects.length; ++i) {
    const effect = objectEffects[i];
    const hasSameTarget = effect.target === target;
    const hasSameLevel = effect.level === (dat.level || 1);
    const hasSameEffect = effect.constructor === Effect;
    if (hasSameTarget && hasSameLevel && hasSameEffect) {
      effect.timeRemaining += dat.duration;
      effect.duration = effect.timeRemaining;
      return effect;
    }
  }

  const effect = new Effect(target, dat);
  objectEffects.push(effect);
  target.effects.push(effect);

  return effect;
}
