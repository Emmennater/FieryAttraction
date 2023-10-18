
class EventManager {
    constructor() {
        this.threshold = 200;
        this.threshold2 = 100;
        this.activeEvents = [];
        this.lastBigScore = 0;
        this.lastMidScore = 0;
    }

    reset() {
        this.lastBigScore = 0;

        // Stop events
        for (let evt of this.activeEvents)
            evt.stop();
        this.activeEvents.length = 0;
    }

    startRandomEvent() {
        this.startEvent(GravityStorm);
    }

    startEvent(Event) {
        const event = new Event();
        this.activeEvents.push(event);
    }

    updateEvents(dt, ctx) {
        if (hud.score - this.lastBigScore >= this.threshold) {
            this.lastBigScore = Math.floor(hud.score / this.threshold) * this.threshold;
            this.startRandomEvent();
        }

        if (hud.score - this.lastMidScore >= this.threshold2) {
            this.lastMidScore = Math.floor(hud.score / this.threshold2) * this.threshold2;
            spawnEnemy(true, "homing");
        }

        for (let i = this.activeEvents.length - 1; i >= 0; --i) {
            const event = this.activeEvents[i];
            event.run(dt, ctx);

            // Event over
            if (event.ended)
                this.activeEvents.splice(i, 1);
        }
    }
}

class WorldEvent {
    constructor() {
        this.timeElapsed = 0;
        this.stage = 0;
        this.lastStage = -1;
        this.ended = false;
        this.title = "EVENT";
        this.justTransitioned = false;
        htmlSounds.playSound(sirenSound, 1);
    }

    start(dt, ctx) {
        // Return true to move onto the next stage
        return true;
    }

    middle(dt, ctx) {
        // Return true to move onto the next stage
        return true;
    }

    end(dt, ctx) {
        // Return true to move onto the next stage
        return true;
    }

    stop() {

    }

    showTitle() {
        const MIN_SCL = Math.min(width, height);
        const T = this.timeElapsed;
        let t = Math.min(this.timeElapsed / 5, 1);
        let xoff = noise(T * 10 + 20) * 50;
        let yoff = noise(T * 10 + 40) * 50;

        let FADE = sin(t * PI + 0.1);
        if (FADE >= 0) {
            fill(255 * FADE);
            noStroke();
            textSize(MIN_SCL * 0.1 * FADE);
            textFont("Arial Black");
            textAlign(CENTER, CENTER);
            text(this.title, width/2 + xoff, height/2 + yoff);
        }
    }

    run(dt, ctx) {
        this.justTransitioned = this.lastStage != this.stage;
        this.lastStage = this.stage;

        switch (this.stage) {
            case 0: if (this.start(dt, ctx)) ++this.stage; break;
            case 1: if (this.middle(dt, ctx)) ++this.stage; break;
            case 2: if (this.end(dt, ctx)) ++this.stage; break;
            default: this.ended = true; break;
        }

        this.showTitle();

        // Update time elapsed
        this.timeElapsed += dt;
    }
}

class GravityStorm extends WorldEvent {
    constructor() {
        super();
        this.originalSunRadius = sun.r;
        this.originalSunMass = sun.m;
        this.bigSunRadius = this.originalSunRadius * 2;
        this.bigSunMass = this.originalSunMass * 4;
        this.target = { r: 0, m: 0 };
        this.original = { r: 0, m: 0 };
        this.time = 0;
        this.title = "GRAVITY STORM";
        this.bigTint = { r: 20, g: 20, b: 20 };
        this.started = false;
    }

    goToTarget(dt) {
        if (this.justTransitioned)
            this.time = 0;

        this.time += dt * 0.05;

        sun.r = lerp(this.original.r, this.target.r, this.time);
        sun.m = lerp(this.original.m, this.target.m, this.time);
        
        return this.time >= 1;
    }

    start(dt) {
        // Wait a bit before starting...
        if (this.timeElapsed < 5)
            return;

        if (!this.started) {
            this.started = true;
            sun.tintFade(0, 0, 0, 255, 8);
        }

        this.target.r = this.bigSunRadius;
        this.target.m = this.bigSunMass;
        this.original.r = this.originalSunRadius;
        this.original.m = this.originalSunMass;
        return this.goToTarget(dt);
    }

    middle(dt) {
        if (this.justTransitioned)
            this.time = 0;

        this.time += dt * 0.1;
        return this.time >= 1;
    }

    end(dt) {
        if (this.justTransitioned)
            sun.tintReset(10);
        this.target.r = this.originalSunRadius;
        this.target.m = this.originalSunMass;
        this.original.r = this.bigSunRadius;
        this.original.m = this.bigSunMass;
        return this.goToTarget(dt);
    }

    stop() {
        sun.r = this.originalSunRadius;
        sun.m = this.originalSunMass;
        sun.tintReset();
    }
}
