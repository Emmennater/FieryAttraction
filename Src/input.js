
keys = {};
pressed = {};
touch = {};
mobile = null;

function updateCanvasSize() {
  const WIDTH = document.body.clientWidth;
  const HEIGHT = document.body.clientHeight;
  resizeCanvas(WIDTH, HEIGHT);
  CTX.resizeCanvas(WIDTH, HEIGHT);
  CTX2.resizeCanvas(WIDTH, HEIGHT);
}

function keyPressed() {
  const c = key == " " ? "SPACE" : key.toUpperCase();
  keys[c] = true;
  pressed[c] = true;

  if (c == "F") {
    toggleFullscreen();
  }

  // Numerical keys
  if (c >= "1" && c <= "9") {
    const num = parseInt(c);
    hud.effectsBar.activateEffect(num - 1);
  }

  if (c == "SHIFT") {
    hud.guide.toggleGuide();
  }
}

function keyReleased() {
  const c = key == " " ? "SPACE" : key.toUpperCase();
  keys[c] = false;
}

function windowResized() {
  updateCanvasSize();
}

function mouseWheel(e) {
  const rate = 0.9;
  if (e.delta > 0) {
    panzoom.zoom *= rate;
  } else {
    panzoom.zoom /= rate;
  }
}

function clearPressed() {
  touch.pressed = false;
  for (let k in pressed) {
    pressed[k] = false;
  }
}

function touchStarted() {
  if (!mobile) return;
  touch.pressed = true;
  const TOUCH = touches[touches.length - 1];
  TouchList.updateTouches();
  mobile.touched(TouchList.addedTouches);
}

function touchEnded(touch) {
  if (!mobile) return;
  TouchList.updateTouches();
  mobile.unTouched(TouchList.removedTouches);
}
