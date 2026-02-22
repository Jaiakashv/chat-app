const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let rooms = {}; // { key: [socketId1, socketId2] }

function generateKey() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // CREATE ROOM
  socket.on("create-room", () => {
    const key = generateKey();

    rooms[key] = [socket.id];
    socket.join(key);

    socket.emit("room-created", key);
    socket.emit("start-chat", key);

    console.log("Room created:", key);
  });

  // JOIN ROOM
  socket.on("join-room", (key) => {
    if (rooms[key] && rooms[key].length === 1) {
      rooms[key].push(socket.id);
      socket.join(key);

      io.to(key).emit("start-chat", key);
      console.log("User joined room:", key);
    } else {
      socket.emit("error-msg", "Invalid or Full Room");
    }
  });

  // MESSAGE
 socket.on("send-message", ({ key, name, message }) => {
  io.to(key).emit("receive-message", { name, message });
});

  // DISCONNECT
  socket.on("disconnect", () => {
    for (let key in rooms) {
      rooms[key] = rooms[key].filter(id => id !== socket.id);
      if (rooms[key].length === 0) {
        delete rooms[key];
      }
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});