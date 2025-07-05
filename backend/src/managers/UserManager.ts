import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager";


export interface User {
    socket: Socket;
    name: string;
}

export class UserManager {
    private users: User[];
    private queue: string[];
    private roomManager: RoomManager;
    
    constructor(roomManager: RoomManager) {
        this.users = [];
        this.queue = [];
        this.roomManager = roomManager;
    }

    addUser(socket: Socket, name: string) {
        this.users.push({
            name, socket
        })
        this.queue.push(socket.id);
    }
    
    removeUser(socketId: string) {
        this.users = this.users.filter(x => x.socket.id === socketId);
        this.queue = this.queue.filter(x => x === socketId);
    }

    
}
