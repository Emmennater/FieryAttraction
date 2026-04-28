
function updateControls(gameState) {
  let player = gameState.player;
  
  // Steering
  player.controls.steer = 0;
  if (keys.ARROWLEFT || keys.A) {
    player.controls.steer -= 1;
  }
  if (keys.ARROWRIGHT || keys.D) {
    player.controls.steer += 1;
  }

  // Boosting
  player.controls.boost = false;
  if (keys.ARROWUP || keys.W) {
    if (player.fuel > 0) {
      player.controls.boost = true;
    }
  }

  // Firing
  player.controls.fire = false;
  if (keys.SPACE) {
    player.controls.fire = true;
  }
}
