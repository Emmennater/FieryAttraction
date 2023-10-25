
keys = {};
pressed = {};
touch = {};
mobile = null;

function keyPressed() {
  const c = key == " " ? "SPACE" : key.toUpperCase();
  keys[c] = true;
  pressed[c] = true;

  if (c == "F") {
    let fs = fullscreen();
    fullscreen(!fs);
  }
}

function keyReleased() {
  const c = key == " " ? "SPACE" : key.toUpperCase();
  keys[c] = false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  CTX.resizeCanvas(width, height);
  CTX2.resizeCanvas(width, height);
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
