
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
    this.serverControls = document.getElementById("server-controls");
    this.controlsButton = document.getElementById("controls");
    this.serverControlsButton = document.getElementById("server");
    this.pauseButton = document.getElementById("pause");
    this.versionTag = document.getElementById("version");
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
    this.cameraMode = getItem("fiery-attraction-camera-mode") ?? "normal";
    document.getElementById("alternate-camera").checked = this.cameraMode == "rotated";

    // Server address and port
    const serverAddress = getItem("fiery-attraction-server-address") ?? "127.0.0.1";
    const serverPort = getItem("fiery-attraction-server-port") ?? 6402;
    const serverAddressInput = document.getElementById("server-address")
    const serverPortInput = document.getElementById("server-port");
  
    serverAddressInput.value = serverAddress;
    serverPortInput.value = serverPort;

    serverAddressInput.addEventListener("input", () => {
      storeItem("fiery-attraction-server-address", serverAddressInput.value);
    });

    serverPortInput.addEventListener("input", () => {
      storeItem("fiery-attraction-server-port", serverPortInput.value);
    });
  }

  setup() {
    this.setScene(this.titleScene);
  }

  toggleControls() {
    if (this.helpControls.style.display == "block") {
      this.helpControls.style.display = "none";
      this.serverControlsButton.style.display = "block";
      this.controlsButton.innerText = "Help + Controls";
      if (this.currentScene == this.gameScene) hud.effectsBar.showButtons();
    } else {
      this.helpControls.style.display = "block";
      this.serverControlsButton.style.display = "none";
      this.controlsButton.innerText = "Back";
      hud.effectsBar.hideButtons();
    }
  }

  toggleServerControls() {
    if (this.serverControls.style.display == "block") {
      this.serverControls.style.display = "none";
      this.controlsButton.style.display = "block";
      this.serverControlsButton.innerText = "Multiplayer";
    } else {
      this.serverControls.style.display = "block";
      this.controlsButton.style.display = "none";
      this.serverControlsButton.innerText = "Back";
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

  runCutScene(dt) {
    if (this.paused) dt = 0;
    super.runCutScene(dt);
  }

  toggleCameraMode() {
    this.cameraMode = this.cameraMode == "normal" ? "rotated" : "normal";
    storeItem("fiery-attraction-camera-mode", this.cameraMode);
  }
}
