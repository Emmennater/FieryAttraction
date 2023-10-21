
const objectEffects = [];

class Effect {
    constructor(target, dat) {
        objectEffects.push(this);
        this.name = "effect";
        this.target = target;
        this.duration = dat.duration || 1;
        this.timeRemaining = this.duration;
        this.done = false;
        this.color = color(255);
    }

    update(dt) {}

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
        this.target.speedMult = 5;
        this.target.exaustCol = {
            min: { r: 30, g: 180, b: 200, a: 100 },
            add: { r: 40, g: 30, b: 50, a: 0 }
        };
        this.color = color(30, 180, 200);
    }

    update(dt) {
        
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
        this.bulletType = "custom";
        this.color = color(30, 180, 200);
    }

    update(dt) {
        this.target.bulletType = this.bulletType;
    }

    stop() {
        this.target.bulletType = "normal";
    }

    run(dt) {
        this.update(dt);

        // Time remaining
        if (!this.target.control.fire) return;
        this.timeRemaining -= 1;
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
        this.bulletType = "homing";
        this.color = color(190, 59, 217);
    }
}

class SpeedRounds extends CustomRounds {
    constructor(target, dat) {
        super(target, dat);
        this.name = "speed rounds";
        this.bulletType = "speed";
        this.color = color(30, 180, 200);
    }
}

class MegaRounds extends CustomRounds {
    constructor(target, dat) {
        super(target, dat);
        this.name = "mega rounds";
        this.bulletType = "mega";
        this.color = color(114, 66, 245);
    }
}

function updateAllEffects(dt) {
    let effectedObjects = [];
    for (let i = 0; i < objectEffects.length; ++i) {
        const effect = objectEffects[i];

        // One effect at a time
        if (effectedObjects.indexOf(effect.target) != -1)
            continue;

        if (effect.done) {
            effect.target.removeEffect(effect);
            objectEffects.splice(i--, 1);
            continue;
        }
        effect.run(dt);
        effectedObjects.push(effect.target);
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
