import { Socket } from "socket.io";
import http from 'http';


const express = require('express');
const { Server } = require("socket.io");
import { UserManager } from "./managers/UserManager";
import { RoomManager } from "./managers/RoomManager";




const app = express();
const server = http.createServer(http);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const userManager = new UserManager();

io.on('connection', (socket: Socket) => {
  socket.on("join", ({ roomId, name }) => {
    console.log(`${name} joined room ${roomId}`);
    
    // You can now use 'name'
    userManager.addUser(name, socket);
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
    userManager.removeUser(socket.id);
  })
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});