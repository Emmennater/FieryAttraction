
class GameScene2 extends Scene {
  constructor() {
    super();
    this.gameState = null;
    this.updater = new Updater();
    this.renderer = new Renderer();
    this.ui = new UI();
    this.audio = new GameAudio();
  }

  init() {
    this.gameState = createGameState();
    this.renderer.reset();

    panzoom.zoom = mobile.isMobile ? 1.5 : 3.0;
  }

  run(dt, ctx) {
    if (pressed.P || pressed.ESCAPE) scenes.togglePause();
    if (scenes.paused) dt = 0;
    updateControls(this.gameState);
    this.updater.update(dt, this.gameState);
    this.renderer.update(dt, this.gameState);
    this.renderer.draw(ctx, this.gameState);
    // this.updater.debugDraw(ctx, this.gameState);
    this.ui.update(dt, this.gameState);
    this.ui.draw(ctx, this.gameState);
    this.audio.update(dt, this.gameState);
  }
}
