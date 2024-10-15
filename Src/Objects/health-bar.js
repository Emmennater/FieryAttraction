
healthBars = [];

class HealthBar extends GameObject {
    constructor(obj, t = 1) {
        super();
        this.value = obj.health;
        this.maxValue = obj.maxHealth;
        this.obj = obj;
        this.t = t;
        this.width = 20;
        this.height = 2.5;
        this.duration = t;
    }

    setTime(t) {
        this.duration = t;
        this.t = t;
    }

    updateValue() {
        this.value = this.obj.health;
        this.maxValue = this.obj.maxHealth;
    }

    getAlpha() {
        return Math.min(this.t, 1) * 255 * 0.5;
    }

    run(dt, ctx) {
        const x = this.obj.x;
        const y = this.obj.y;
        const r = this.obj.collisionMesh.getBoundingRadius() + this.height * 0.6;
        const percentFull = this.value / this.maxValue;

        // Display text
        ctx.push();
        ctx.translate(x, y);
        ctx.rotate(-panzoom.rot);
        ctx.fill(0, 80, 0, this.getAlpha());
        ctx.noStroke();
        ctx.rect(-this.width / 2, -this.height / 2 - r, this.width, this.height);
        ctx.fill(0, 255, 0, this.getAlpha());
        ctx.rect(-this.width / 2, -this.height / 2 - r, this.width * percentFull, this.height);
        ctx.pop();

        // Object destroyed
        if (this.obj.health <= 0) {
            this.destroy();
        }

        // Time remaining
        this.t -= dt;
        if (this.t <= 0)
            this.destroy();
    }
}

function findObjectHealthBar(obj) {
    for (let i = healthBars.length - 1; i >= 0; --i) {
        const healthBar = healthBars[i];
        if (healthBar.obj === obj)
            return healthBar;
    }
    return null;
}

function spawnHealthBar(obj, t = 1) {
    // If object is player, don't spawn health bar
    if (obj instanceof Ship && obj.name == "ship") return;

    // Find existing health bar
    let healthBar = findObjectHealthBar(obj);
    if (healthBar) {
        healthBar.setTime(t);
        healthBar.updateValue();
        return healthBar;
    }

    healthBar = new HealthBar(obj, t);
    healthBars.push(healthBar);
    return healthBar;
}

function runHealthBars(dt, ctx) {
    for (let i = healthBars.length - 1; i >= 0; --i) {
        const healthBar = healthBars[i];
        if (healthBar.destroyed) {
            healthBars.splice(i, 1);
            continue;
        }
        healthBar.run(dt, ctx);
    }
}
