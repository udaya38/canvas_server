require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const app = express();
app.use(
  cors({
    origin: "http://localhost:4200/",
  })
);
const httpServer = createServer(app);
const client = new MongoClient(process.env.MONGO_URL);
let collection = null;
async function startUp() {
  try {
    await client.connect();
    const db = client.db("testdb");
    collection = db.collection("roomDetails");
    const io = new Server(httpServer, {
      cors: "http://localhost:4200",
    });

    io.on("connection", async (socket) => {
      //Join the room
      socket.on("join-room", async (room) => {
        await collection.updateOne(
          { roomId: room.roomId },
          { $addToSet: { users: room.userName } },
          { upsert: true }
        );
        const details = await collection.findOne(
          { roomId: room.roomId },
          { projection: { _id: 0 } }
        );
        details.userName = room.userName;
        socket.join(room.roomId);
        io.to(room.roomId).emit("join-room", details);
      });

      socket.on("beginDraw", (message, room) => {
        socket.broadcast.to(room.roomId).emit("beginDraw", message);
      });

      socket.on("lineDraw", (message, room) => {
        socket.broadcast.to(room.roomId).emit("lineDraw", message);
      });

      socket.on("canvasReset", (room) => {
        io.to(room.roomId).to(room.roomId).emit("canvasReset");
      });

      socket.on("configs", (message, room) => {
        socket.broadcast.to(room.roomId).emit("configs", message);
      });

      //Message Listeners
      socket.on("word-list", (message, room) => {
        io.to(room.roomId).emit("word-list", {
          message,
          userName: room.userName,
        });
      });

      socket.on("user-choosing", (room) => {
        socket.broadcast
          .to(room.roomId)
          .emit(
            "word-list",
            { message: "is choosing the word", userName: room.userName },
            true
          );
      });

      socket.on("selected-word", (room) => {
        socket.broadcast.to(room.roomId).emit("selected-word", room);
      });

      socket.on("score-details", (room) => {
        io.to(room.roomId).emit("score-details", room);
      });

      socket.on("next-user", (room) => {
        io.to(room.roomId).emit("next-user", room);
      });

      socket.on("reload", (room) => {
        io.to(room.roomId).emit("reload", room);
      });

      socket.on("game-end", (room) => {
        socket.broadcast.to(room.roomId).emit("game-end", room);
      });
    });

    httpServer.listen(3000, () => {
      console.log("port is listening to 3000");
    });
  } catch (error) {
    console.log(error);
    client.close();
  }
}

startUp();
