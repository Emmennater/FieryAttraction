import http from 'http';
import { Server, Socket } from 'socket.io';

export class BaseServer {
  port: number;
  server: http.Server;
  io: Server;
  clients: Socket[];

  constructor(port: number) {
    this.port = port;
    this.server = http.createServer();
    this.clients = [];
    
    this.io = new Server(this.server, {
      cors: {origin: "*", methods: ["GET", "POST"]},
      transports: ["websocket"]
    });
    
    this.io.on('connection', client => {
      this.connected(client);
      this.clients.push(client);
      client.on('disconnect', () => {
        this.disconnected(client);
        this.clients.splice(this.clients.indexOf(client), 1);
      });
    });

    this.io.on('error', err => console.log(err));
    this.io.on('connect_error', err => console.log(err));

    this.server.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }

  connected(client: Socket) {
    throw "connected() not implemented";
  }

  disconnected(client: Socket) {
    throw "disconnected() not implemented";
  }

  getClient(id: string) {
    return this.io.sockets.sockets.get(id);
  }
}