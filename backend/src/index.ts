import { Socket } from "socket.io";
import http from 'http';


const express = require('express');
const { Server } = require("socket.io");
import { UserManager } from "./managers/UserManager";
import { RoomManager } from "./managers/RoomManager";

const app = express();
const server = http.createServer(app);  

const io = new Server(server, {
    cors: {
        origin: "*",
        
    }
})

const roomManager = new RoomManager();
const userManager = new UserManager( roomManager);


io.on("connection", (socket: Socket) => {
    console.log("A socket connected:", socket.id);
    if (socket.conn.transport.name === "polling") {
        return;
      }
    
  
    socket.on("join", ({ name }) => {
      console.log(`📥 ${name} joined matchmaking`);
      userManager.addUser(socket, name);
    });
  
    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected:", socket.id);
      userManager.removeUser(socket.id);
    });
  });

server.listen(3000, () => {
  console.log("Server is listening on port 3000");
})