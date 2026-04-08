
class SceneManager {
  constructor() {
    this.currentScene = null;
    this.nextScene = null;
    this.fade = 0;
    this.fadeTime = 0.75;
  }

  //////////////////////
  // Switching scenes //
  //////////////////////

  setScene(scene) {
    this.currentScene = scene;
    this.currentScene.init();
  }

  cutSceneTo(scene, fadeTime = 0.5) {
    if (this.nextScene == scene) return;
    this.nextScene = scene;
    this.fadeTime = fadeTime;
    this.sceneTime = 0;
  }
  
  runCutScene(dt) {
    if (this.nextScene != null) {
      this.fade += dt / this.fadeTime;
    } else {
      this.fade -= dt / this.fadeTime;
      if (this.fade < 0)
        this.fade = 0;
    }
    
    if (this.fade >= 1) {
      if (this.nextScene) {
        this.sceneTime = 0;

        // Set new scene
        this.currentScene = this.nextScene;
        this.nextScene = null;

        // Initiate scene
        this.currentScene.init();
      }
    }
    
    background(0, this.fade * 255);
  }
  
  abortCutScene() {
    this.nextScene = null;
  }

  runCurrentScene(dt, ctx) {
    if (this.currentScene == null) return;
    this.sceneTime += dt;
    this.currentScene.run(dt, ctx);
    this.runCutScene(dt);
  }
}
