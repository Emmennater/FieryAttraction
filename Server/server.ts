import { BaseServer } from "./base-server.ts";
import { Socket } from "socket.io";

class Server extends BaseServer {
  hostClient: Socket | null = null;
  
  constructor() {
    super(6402);
  }

  addHostListeners(client: Socket) {
    client.on("update-state", (clientId, gameState) => {
      const client = this.getClient(clientId);

      if (!client) return;

      client.emit("update-state", gameState);
    });
  }

  connected(client: Socket) {
    console.log(client.id, "connected");

    
    if (this.hostClient == null) {
      this.hostClient = client;
      this.addHostListeners(client);
      client.emit("host");
      // client.emit("client");
    } else {
      client.emit("client");
      this.hostClient.emit("request-state", client.id);
    }
  }

  disconnected(client: Socket) {
    console.log(client.id, "disconnected");

    if (client == this.hostClient) {
      this.hostClient = null;

      for (let client of this.clients) {
        client.disconnect();
      }
    }
  }
}

new Server();