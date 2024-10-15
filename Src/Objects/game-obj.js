
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

  takeDamage(damage, damageSource) {
    this.health = Math.max(this.health - damage, 0);
    spawnHealthBar(this, 3);

    if (this.health <= 0 && !this.destroyed) {
      this.destroyed = true;
      this.onDestroy(damageSource);
    }
  }

  applyEffect(Effect, dat = {}, sender = null) {
    const effect = addEffect(Effect, this, dat, sender);
    return effect;
  }

  removeEffect(effect) {
    this.effects.remove(effect);
  }
}
