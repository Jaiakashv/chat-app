const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let rooms = {}; // { key: [socket1, socket2] }

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
  });

  // JOIN ROOM
  socket.on("join-room", (key) => {
    if (rooms[key] && rooms[key].length === 1) {
      rooms[key].push(socket.id);
      socket.join(key);

      io.to(key).emit("start-chat", key);
    } else {
      socket.emit("error-msg", "Invalid or Full Room");
    }
  });

  // TEXT MESSAGE
  socket.on("send-message", ({ key, name, message }) => {
    io.to(key).emit("receive-message", { name, message });
  });

  // VOICE MESSAGE
  socket.on("send-voice", ({ key, name, audio }) => {
    io.to(key).emit("receive-voice", { name, audio });
  });

  // CLEANUP
  socket.on("disconnect", () => {
    for (let key in rooms) {
      rooms[key] = rooms[key].filter(id => id !== socket.id);
      if (rooms[key].length === 0) {
        delete rooms[key];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});