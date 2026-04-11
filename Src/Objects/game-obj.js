
class GameObject extends CollisionObject {
  constructor() {
    super();
    this.effects = [];
    this.health = 1;
    this.maxHealth = 1;
    this.destroyed = false;
  }

  onDestroy(damageSource) {

  }

  destroy() {
    this.destroyed = true;
    this.onDestroy();
  }

  setHealth(health, maxHealth = -1) {
    this.health = health;
    if (maxHealth > 0)
      this.maxHealth = maxHealth;
  }

  addHealth(amount, sender) {
    if (amount < 0) return this.takeDamage(-amount, sender);
    amount = Math.min(amount, this.maxHealth - this.health);
    if (amount <= 0) return 0;
    this.health = this.health + amount;
    if (!(this instanceof Player)) spawnHealthBar(this, 3);
    return amount;
  }

  takeDamage(damage, damageSource) {
    damage = Math.min(damage, this.health);
    this.health -= damage;

    if (!(this instanceof Player))
      spawnHealthBar(this, 3);

    if (this.health <= 0 && !this.destroyed) {
      this.destroyed = true;
      this.onDestroy(damageSource);
    }

    return damage;
  }

  applyEffect(Effect, dat = {}, sender = null) {
    const effect = addEffect(Effect, this, dat, sender);
    return effect;
  }

  removeEffect(effect) {
    effect.done = true;
  }

  removeAllEffects() {
    for (let effect of this.effects) {
      this.removeEffect(effect);
    }
  }

  hasActiveEffect(Effect = null) {
    if (Effect !== null) return this.getActiveEffect(Effect) !== null;
    for (let effect of this.effects) {
      if (effect.active) return true;
    }
    return false;
  }

  getActiveEffect(Effect) {
    for (let effect of this.effects) {
      if (effect.constructor == Effect && effect.active) return effect;
    }
    return null;
  }
}
