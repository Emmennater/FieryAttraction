
class Player extends Ship {
  constructor(x, y, s = 12) {
    super(x, y, s);

    // Supplies
    this.fuel = 50;
    this.ammo = 200;
    this.health = 100;
    this.maxFuel = 50;
    this.maxAmmo = 200;
    this.maxHealth = 100;
  }

  resurrect() {
    super.addHealth(this.maxHealth / 4);
    this.destroyed = false;
  }

  addHealth(amount, sender, resurrect = true) {
    let health = super.addHealth(amount, sender);
    
    if (resurrect && amount > 0 && this.destroyed) {
      this.resurrect();
    }

    return health;
  }

  addFuel(amount, sender) {
    amount = Math.min(amount, this.maxFuel - this.fuel);
    if (amount <= 0) return 0;
    this.fuel = this.fuel + amount;
    return amount;
  }

  addAmmo(amount, sender) {
    amount = Math.min(amount, this.maxAmmo - this.ammo);
    if (amount <= 0) return 0;
    this.ammo = this.ammo + amount;
    return amount;
  }

  removeFuel(amount) {
    amount = Math.min(amount, this.fuel);
    this.fuel -= amount;
    return amount;
  }

  removeAmmo(amount) {
    amount = Math.min(amount, this.ammo);
    this.ammo -= amount;
    return amount;
  }
}
