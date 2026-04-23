
class HostGameScene extends GameScene {
  constructor() {
    super();
  }

  getState() {
    let asteroids = this.asteroids.map(asteroid => asteroid.getState());
    return "state";
  }
}
