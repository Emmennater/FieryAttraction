const port = 6402;
const server = require('http').createServer();
const io = require('socket.io')(server, {
  cors: {origin: "*", methods: ["GET", "POST"]},
  transports: ["websocket"]
});
io.on('connection', client => {
  console.log("Client connected");
  client.on('disconnect', () => {
    console.log("Client disconnected");
  });
});
io.on('error', err => console.log(err));
io.on('connect_error', err => console.log(err));

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});