
class TouchList {
    static previousTouches = [];
    static addedTouches = [];
    static removedTouches = [];
    static lastTouch = null;

    static updateTouches() {
        // Create lookups
        let pTouches = {};
        let nTouches = {};
        for (let touch of TouchList.previousTouches)
            pTouches[touch.id] = touch;
        for (let touch of touches)
            nTouches[touch.id] = touch;

        // Find added touches
        let addedTouches = [];
        for (let touch of touches) {
            if (!pTouches[touch.id]) {
                addedTouches.push(touch);
                this.previousTouches.push(touch);
            }
        }

        // Find removed touches
        let removedTouches = [];
        for (let touch of TouchList.previousTouches) {
            if (!nTouches[touch.id]) {
                removedTouches.push(touch);
                this.previousTouches.remove(touch);
            }
        }

        TouchList.addedTouches = addedTouches;
        TouchList.removedTouches = removedTouches;
        return { added: addedTouches, removed: removedTouches };
    }

    static getTouch(id) {
        for (let touch of touches)
            if (touch.id == id) return touch;
        return null;
    }
}

class MobileControls {
    constructor() {
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.joystick = new Joystick();
        this.fireButton = new CircleButton("FIRE");
        this.boostButton = new CircleButton("BOOST");

        this.fireButton.pressed = function(dt) {
            ship.fireBullet(dt);
        }

        this.boostButton.pressed = function(dt) {
            ship.boost();
        }

        if (this.isMobile) {
            // Show fullscreen button
            const BUTTON = document.getElementById("fullscreen-button");
            BUTTON.classList.remove("hide");
        }

        document.addEventListener("fullscreenchange", () => {
            if (!document.fullscreenElement) {
                if (this.isMobile) {
                    const BUTTON = document.getElementById("fullscreen-button");
                    BUTTON.classList.remove("hide");
                }
            }
        });
    }

    touched(addedTouches) {
        if (!this.isMobile) return;
        for (let touch of addedTouches) {
            const TOUCH = TouchList.getTouch(touch.id)
            this.joystick.touched(TOUCH);
            this.fireButton.touched(TOUCH);
            this.boostButton.touched(TOUCH);
        }
    }

    unTouched(removedTouches) {
        if (!this.isMobile) return;
        for (let touch of removedTouches) {
            this.joystick.unTouched(touch.id);
            this.fireButton.unTouched(touch.id);
            this.boostButton.unTouched(touch.id);
        }
    }

    update(dt) {
        if (!this.isMobile) return;
        const MINSCL = Math.min(width, height);
        this.joystick.setRadius(MINSCL * 0.1);
        this.fireButton.setRadius(MINSCL * 0.1);
        this.boostButton.setRadius(MINSCL * 0.1);
        this.joystick.setPosition(width * 0.15, height * 0.65);
        this.fireButton.setPosition(width * 0.78, height * 0.55);
        this.boostButton.setPosition(width * 0.85, height * 0.725);
        this.joystick.update(dt);
        this.fireButton.update(dt);
        this.boostButton.update(dt);
    }

    draw() {
        if (!this.isMobile) return;
        this.joystick.draw();
        this.fireButton.draw();
        this.boostButton.draw();
    }
}

class CircleButton {
    constructor(txt = "") {
        this.x = width / 2;
        this.y = height / 2;
        this.r = Math.min(width, height) * 0.09;
        this.selected = null;
        this.txt = txt;
    }

    touched(touch) {
        // Newest touch
        let d = dist(this.x, this.y, touch.x, touch.y);
        if (d > this.r * 1.0) return;
        this.selected = touch.id;
    }

    unTouched(touchId) {
        if (touchId === this.selected) this.selected = null;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setRadius(r) {
        this.r = r;
    }

    pressed(dt) {

    }

    update(dt) {
        if (this.selected !== null)
            this.pressed(dt);
    }

    draw() {
        let opacity = this.selected === null ? 25 : 30;
        let opacity2 = this.selected === null ? 30 : 60;

        // Button
        fill(255, opacity);
        stroke(255, opacity);
        strokeWeight(6);
        circle(this.x, this.y, this.r * 2);

        // Text
        fill(255, opacity2);
        noStroke();
        textFont(arialBlack);
        textAlign(CENTER, CENTER);

        textSize(10);
        let txtW = textWidth(this.txt);
        const txtS = this.r / txtW * 14;
        textSize(txtS);
        text(this.txt, this.x, this.y);
    }
}

class Joystick {
    constructor() {
        this.x = width / 2;
        this.y = height / 2;
        this.r = Math.min(width, height) * 0.1;
        this.angle = 0;
        this.mag = 0;

        // Controls
        this.selected = null;
    }

    touched(touch) {
        // Newest touch
        let d = dist(this.x, this.y, touch.x, touch.y);
        if (d > this.r * 1.5) return;
        this.selected = touch.id;
    }

    unTouched(touchId) {
        if (touchId === this.selected) this.selected = null;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setRadius(r) {
        this.r = r;
    }

    update(dt) {
        if (this.selected === null) {
            this.mag = 0;
            return;
        }

        // Angle to mouse
        const touch = TouchList.getTouch(this.selected);
        let dx = touch.x - this.x;
        let dy = touch.y - this.y;
        let d = Math.sqrt(dx ** 2 + dy ** 2) / this.r;
        this.angle = atan2(dy, dx);
        this.mag = transformValue(d, 0.5, 1, 1);
        this.updateControls(dt);
    }

    optimalRotationDirection(theta, phi, v, a) {
        return optimalAccel(theta, phi, v, a);
    }

    updateControls(dt) {
        let targetAngle = this.angle - ship.a - panzoom.rot;
        let angleBetween = smallestAngleDifference(ship.control.steeringAngle, targetAngle);
        let steerSpeed = ship.getSteeringAccel();
        // let steerDelta = angleBetween * steerVel / TWO_PI;
        // steerDelta = Math.max(Math.abs(steerDelta), steerVel) * Math.sign(steerDelta);
        
        let dir = this.optimalRotationDirection(
            ship.control.steeringAngle,
            targetAngle,
            ship.control.steerVel,
            steerSpeed
        );

        ship.steer(dt, dir * steerSpeed);

        // ship.control.steeringAngle = targetAngle;
    }

    draw() {
        // Ring
        fill(255, 30);
        stroke(0, 30);
        strokeWeight(6);
        circle(this.x, this.y, this.r * 2);

        // Center
        let L = this.mag * this.r;
        circle(
            this.x + Math.cos(this.angle) * L,
            this.y + Math.sin(this.angle) * L,
            this.r
        );
    }
}

// Returns the signed angle between a1 and a2
function signedAngleBetween(a1, a2) {
    return Math.atan2(Math.sin(a2 - a1), Math.cos(a2 - a1));
}
  
// Params: Initial Angle, Final Angle, Initial Velocity, Absolute Acceleration
function optimalAccel(ri, rf, vi, a) {
    // Already at target
    if (Math.abs(vi) < 0.01 && Math.abs(rf - ri) < 0.01)
        return 0;

    // Final final angle after slowing down to zero velocity
    let deccel = a * -Math.sign(vi);
    let t = Math.abs(vi / a);
    let rf2 = ri + vi * t + 1/2 * deccel * t ** 2;

    // If undershoot accelerate, If overshoot deccelerate
    let theta = signedAngleBetween(rf2, rf);

    // Return direction of acceleration
    return Math.sign(theta);
}
