const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();
app.use(
  cors({
    origin: "http://localhost:4200/",
  })
);
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: "http://localhost:4200",
});

io.on("connection", (socket) => {
  console.log(socket.id, "connected");
  socket.on("beginDraw", (message) => {
    socket.broadcast.emit("beginDraw", message);
  });

  socket.on("lineDraw", (message) => {
    socket.broadcast.emit("lineDraw", message);
  });

  socket.on("canvasReset", () => {
    socket.broadcast.emit("canvasReset");
  });

  socket.on("configs", (message) => {
    socket.broadcast.emit("configs", message);
  });
});

httpServer.listen(3000);
