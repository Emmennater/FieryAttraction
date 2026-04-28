
class GameAudio {
  constructor() {
    this.playerBoost = false;
    this.lastPlayerBulletId = null;
    this.lastExplosionId = null;
  }

  update(dt, gameState) {
    let player = gameState.player;

    // Player boost sound
    if (this.playerBoost != player.controls.boost) {
      if (player.controls.boost) {
        htmlSounds.fadeSound(rocketSound, 0.075, 0.2);
      } else {
        htmlSounds.fadeSound(rocketSound, 0.0, 0.2);
      }

      this.playerBoost = player.controls.boost;
    }

    // Find latest player bullet id
    let minBulletTime = Infinity;
    let latestBulletId = null;

    for (let bullet of gameState.bullets) {
      if (bullet.ownerId == player.id) {
        let bulletTime = bullet.duration - bullet.timeRemaining;
        if (bulletTime < minBulletTime) {
          minBulletTime = bulletTime;
          latestBulletId = bullet.id;
        }
      }
    }

    // Player bullet sound when fired
    if (latestBulletId != this.lastPlayerBulletId) {
      this.lastPlayerBulletId = latestBulletId;
      if (this.lastPlayerBulletId != null) {
        htmlSounds.playSound(shootSound, 0.02, true);
      }
    }

    // Find latest explosion id
    let minExplosionTime = Infinity;
    let latestExplosionId = null;
    let lastExplosion = null;

    // TODO: Play the loudest most recent explosion
    for (let explosion of gameState.explosions) {
      let explosionTime = explosion.duration - explosion.timeRemaining;
      if (explosionTime < minExplosionTime) {
        minExplosionTime = explosionTime;
        latestExplosionId = explosion.id;
        lastExplosion = explosion;
      }
    }

    // Explosion sound when fired
    if (latestExplosionId != this.lastExplosionId) {
      this.lastExplosionId = latestExplosionId;
      if (this.lastExplosionId != null) {
        htmlSounds.playSound(explodeSound, lastExplosion.volume, true);
      }
    }
  }
}
