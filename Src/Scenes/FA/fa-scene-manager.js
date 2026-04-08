
class FASceneManager extends SceneManager {
  constructor() {
    super();

    this.messageTime = 300;
    this.impactMessageTime = this.messageTime;
    this.introSkipped = false;
    this.highScore = "none";
    this.gameOver = false;
    this.paused = false;
    
    // Scenes
    this.titleScene = new TitleScene();
    this.introScene = new IntroScene();
    this.gameScene = new GameScene();
    this.gameOverScene = new GameOverScene();

    // Elements
    this.musicSlider = document.getElementById("music-volume");
    this.helpControls = document.getElementById("help-controls");
    this.controlButton = document.getElementById("controls");
    this.pauseButton = document.getElementById("pause");
    this.versionTag = document.getElementById("version");
    this.controlsOpen = false;
    this.sceneTime = 0;
    
    // Music volume
    this.musicVolume = 0.5;
    this.musicVolume = getItem("fiery-attraction-music-volume") ?? 0.5;
    
    // Bad data test
    if (isNaN(1 + this.musicVolume))
      this.musicVolume = 0.5;

    // Update music slider and volume
    this.musicSlider.value = this.musicVolume * 100;
    this.updateVolume();

    // Ship camera mode
    const cameraMode = getItem("fiery-attraction-camera-mode") || "normal";
    if (cameraMode == "rotated") document.getElementById("alternate-camera").click();
  }

  setup() {
    this.setScene(this.titleScene);
  }

  toggleControls(open = null) {
    if (open === null) open = !this.controlsOpen;
    if (open) {
      this.controlsOpen = true;
      this.controlButton.innerText = "Back";
      this.helpControls.style.visibility = "visible";
      hud.effectsBar.hideButtons();
    } else {
      this.controlsOpen = false;
      this.controlButton.innerText = "Help + Controls";
      this.helpControls.style.visibility = "hidden";
      if (this.currentScene == this.gameScene) hud.effectsBar.showButtons();
    }
  }

  togglePause() {
    this.paused = !this.paused;
    this.toggleControls();
  }

  updateVolume() {
    if (titleScreenTrack.volume > 0)
      titleScreenTrack.volume = 0.4 * this.musicVolume;
    if (soundTrack.volume > 0)
      soundTrack.volume = 0.8 * this.musicVolume;
  }

  changeMusicVolume() {
    const percent = this.musicSlider.value / 100;
    this.musicVolume = percent;
    storeItem("fiery-attraction-music-volume", percent);
    this.updateVolume();
  }
}
