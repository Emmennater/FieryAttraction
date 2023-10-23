
bonusEffects = [];

class BonusEffect extends GameObject {
    constructor(txt, x, y, c, t = 1) {
        super();
        this.txt = txt;
        this.x = x;
        this.y = y;
        this.c = c;
        this.t = t;
        this.duration = t;
        this.destroy = false;

        // Randomness
        this.x += Math.random() * 20 - 10;
        this.y += Math.random() * 20 - 10;
    }

    getAlpha() {
        return Math.min(this.t, 1);
    }

    run(dt, ctx) {
        // Display text
        ctx.fill(colorAlpha(this.c, this.getAlpha() * 255));
        ctx.noStroke();
        ctx.textSize(6);
        ctx.push();
        ctx.translate(this.x, this.y);
        ctx.rotate(-panzoom.rot);
        ctx.text(this.txt, 0, 0);
        ctx.pop();

        // Time remaining
        this.t -= dt;
        if (this.t <= 0)
            this.destroy = true;
    }
}

function spawnBonusEffect(txt, x, y, c, t = 1) {
    const effect = new BonusEffect(txt, x, y, c, t);
    bonusEffects.push(effect);
    return effect;
}

function runBonusEffects(dt, ctx) {
    for (let i = bonusEffects.length - 1; i >= 0; --i) {
        const effect = bonusEffects[i];
        if (effect.destroy) {
            bonusEffects.splice(i, 1);
            continue;
        }
        effect.run(dt, ctx);
    }
}
