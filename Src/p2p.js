
class Client {
  constructor(address) {
    this.address = address;
    this.isReady = false;
    this.isHost = false;
    this.socket = io(address, {
      transports: ["websocket"]
    });
    this.socket.on("connect", () => {
      console.log("Connected!", this.socket.id);
    });
    this.socket.on("disconnect", () => {
      console.log("Disconnected!");
      this.socket.disconnect();
    })
    this.socket.on("connect_error", (err) => {
      console.error("Connection error:", err.message);
      this.socket.disconnect();
    });
    this.socket.on("host", () => {
      this.isHost = true;
      this.isReady = true;
      scenes.toggleServerControls();
      scenes.controlsButton.style.visibility = "hidden";
      scenes.serverControlsButton.style.visibility = "hidden";
      scenes.versionTag.style.visibility = "hidden";
      scenes.introSkipped = true;
      scenes.cutSceneTo(new HostGameScene());
    });
    this.socket.on("client", () => {
      this.isHost = false;
      this.isReady = true;
      scenes.toggleServerControls();
      scenes.controlsButton.style.visibility = "hidden";
      scenes.serverControlsButton.style.visibility = "hidden";
      scenes.versionTag.style.visibility = "hidden";
      scenes.introSkipped = true;
      scenes.cutSceneTo(new ClientGameScene());
    });
    this.socket.on("request-state", (clientId) => {
      const gameScene = scenes.currentScene instanceof GameScene ? scenes.currentScene : scenes.nextScene;
      const gameState = JSON.stringify(gameScene.getState());
      this.socket.emit("update-state", clientId, gameState);
      
    });
    this.socket.on("update-state", (gameState) => {
      const gameScene = scenes.currentScene instanceof GameScene ? scenes.currentScene : scenes.nextScene;
      gameScene.loadState(JSON.parse(gameState));
    });
  }
}

class Multiplayer {
  constructor() {
    this.client = null;
  }

  join() {
    const serverAddressInput = document.getElementById("server-address")
    const serverPortInput = document.getElementById("server-port");
    const address = `${serverAddressInput.value}:${serverPortInput.value}`;

    this.client = new Client(address);
  }

  isActive() {
    return this.client && this.client.isReady && this.client.socket.connected;
  }

  isInactive() {
    return !this.isActive();
  }

  isClient() {
    return this.client && this.client.isReady && this.client.socket.connected && !this.client.isHost;
  }

  isHost() {
    return this.client && this.client.isReady && this.client.socket.connected && this.client.isHost;
  }
}
