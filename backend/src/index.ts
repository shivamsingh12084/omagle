import { Socket } from "socket.io";

const express = require('express');
const { Server } = require("socket.io");

const app = express();
const http = require('http').createServer(app);
const server = http.createServer(http);  

const io = new Server(server)

io.on("connection", (socket: Socket) => {
  console.log("A user connected");
})

server.listen(3000, () => {
  console.log("Server is listening on port 3000");
})