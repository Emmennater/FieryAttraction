
class GameObject {
    constructor() {
        this.effects = [];
    }

    applyEffect(Effect, dat = {}, sender = null) {
        const effect = addEffect(Effect, this, dat, sender);
        return effect;
    }

    removeEffect(effect) {
        this.effects.remove(effect);
    }

    // updateEffects(dt) {
    //     for (let i = this.effects.length - 1; i >= 0; --i) {
    //         let effect = this.effects[i];
    //         if (effect.done) {
    //             this.effects.splice(i, 1);
    //             continue;
    //         }
    //         effect.run(dt);
    //     }
    // }
}
