
class DummyProjectile extends GravityObject {
    constructor(x, y, vx, vy) {
        super(x, y, 2000);
        this.vx = vx;
        this.vy = vy;
    }

    move(dt) {
        this.attract(dt, 10);
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }
}

class Guide {
    constructor() {
        this.toggle = getItem("fiery-attraction-toggle-aim") ?? false;
        this.enabled = false;

        if (this.toggle) {
            const button = document.getElementById("toggle-aim");
            button.checked = this.toggle;
        }
    }

    toggleGuide() {
        if (!this.toggle) return;
        this.enabled = !this.enabled;
    }

    toggleGuideToggle() {
        this.toggle = !this.toggle;

        storeItem("fiery-attraction-toggle-aim", this.toggle);
    }

    update(dt) {

    }

    traceBulletPath(ctx) {
        const shipAngle = ship.a + ship.control.steeringAngle;
        let x = ship.x + cos(shipAngle) * ship.s;
        let y = ship.y + sin(shipAngle) * ship.s;
        let vx = cos(shipAngle) * ship.bSpeed + ship.vx;
        let vy = sin(shipAngle) * ship.bSpeed + ship.vy;
        const DUMMY = new DummyProjectile(x, y, vx, vy);
        const DT = 0.1;
        let dx = 0;
        let dy = 0;

        ctx.noFill();
        ctx.stroke(0, 255, 0, 100);
        ctx.strokeWeight(0.5);
        ctx.beginShape();
        
        for (let i = 0; i < 2; i += DT) {
            ctx.vertex(DUMMY.x, DUMMY.y);
            DUMMY.move(DT);
        }
        ctx.endShape();
    }

    draw(ctx) {
        if (!keys.SHIFT && !(mobile.isMobile && mobile.joystick.selected !== null) && !(this.enabled && this.toggle)) return;

        const target = ship;
        let A = ship.a + ship.control.steeringAngle;
        let L = 100;

        let angle = frameCount / 20;
        let x = ship.x + Math.cos(A) * (target.s - 1);
        let y = ship.y + Math.sin(A) * (target.s - 1);
        let aspect = aimArcSprite.height / aimArcSprite.width;
        let w = 100;
        let h = w * aspect;

        ctx.push();
        ctx.translate(x, y);
        ctx.rotate(A + HALF_PI);
        ctx.image(aimArcSprite, 0, -h / 2, w, h);
        ctx.pop();

        // this.traceBulletPath(ctx);
    }
}

function fadeLine(ctx, x1, y1, x2, y2) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    let d = Math.sqrt(dx ** 2 + dy ** 2);
    let vx = dx / d;
    let vy = dy / d;

    ctx.stroke(0, 255, 0, 10);
    for (let alpha = 255; alpha > 0; alpha -= 10) {
        let dt = (255 - alpha) * d / 255;
        let x = x1 + vx * dt;
        let y = y1 + vy * dt;
        ctx.line(x1, y1, x, y);
    }
}