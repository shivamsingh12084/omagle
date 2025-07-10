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
         // 1) Skip if this exact socket is already in queue
        if (this.queue.includes(socket.id)) return;

        // 2) (Optional) Skip if this name is already queued
        if (this.users.some(u => u.name === name)) return;
        this.users.push({
            name, socket
        })
        this.queue.push(socket.id);
        this.clearQueue();
        this.initHandlers(socket);
    }
    
    removeUser(socketId: string) {
        this.users = this.users.filter(x => x.socket.id !== socketId);
        this.queue = this.queue.filter(x => x !== socketId);
    }

    clearQueue() {
        if(this.queue.length < 2) {
            return;
        }
        console.log("Inside the queue")
        console.log(this.queue.length);
        console.log("Users in queue:", this.queue);

        const socket_id_1 = this.queue.pop();
        const socket_id_2 = this.queue.pop();
        const user1 = this.users.find(x => x.socket.id === socket_id_1);
        const user2 = this.users.find(x => x.socket.id === socket_id_2);

        if(!user1 || !user2) {
            return;
        }
        console.log("Creating room for users:", user1.name, user2.name);
        const room = this.roomManager.createRoom(user1, user2);
        this.clearQueue();
    }

    initHandlers(socket: Socket) {
        socket.on("offer", ({sdp, room_id}: {sdp: string, room_id: string}) => {
            console.log("Received offer for room from user:", room_id);
            this.roomManager.onOffer(room_id, sdp);
        })
        socket.on("answer", ({sdp, room_id}: {sdp: string, room_id: string}) => {
            console.log("Received answer for room:", room_id);
            this.roomManager.onAnswer(room_id, sdp);
        })
    }


}
