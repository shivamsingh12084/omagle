import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager";

export interface User {
    socket: Socket;
    name: string;
}

export class UserManager {
    private users: User[] = [];
    private queue: string[] = [];
    private roomManager = new RoomManager();

    addUser(name: string, socket: Socket) {
        const user: User = { name, socket };
        this.users.push(user);
        this.queue.push(socket.id);

        console.log(`User added: ${name} (${socket.id})`);

        socket.emit("lobby");
        this.initHandlers(socket);
        this.tryToCreateRoom();
    }

    removeUser(socketId: string) {
        console.log(`Removing user: ${socketId}`);
        this.users = this.users.filter(user => user.socket.id !== socketId);
        this.queue = this.queue.filter(id => id !== socketId);
    }

    private tryToCreateRoom() {
        while (this.queue.length >= 2) {
            const id1 = this.queue.shift();
            const id2 = this.queue.shift();

            if (!id1 || !id2) break;

            const user1 = this.users.find(u => u.socket.id === id1);
            const user2 = this.users.find(u => u.socket.id === id2);

            if (!user1 || !user2) {
                console.warn("Could not find both users for the room. Re-queuing.");
                if (id1) this.queue.unshift(id1);
                if (id2) this.queue.unshift(id2);
                break;
            }

            console.log(`Creating room with: ${user1.name} and ${user2.name}`);
            this.roomManager.createRoom(user1, user2);
        }
    }

    private initHandlers(socket: Socket) {
        socket.on("offer", ({ sdp, roomId }: { sdp: RTCSessionDescriptionInit; roomId: string }) => {
            console.log("Received offer from", socket.id);
            this.roomManager.onOffer(roomId, sdp, socket.id);
        });

        socket.on("answer", ({ sdp, roomId }: { sdp: RTCSessionDescriptionInit; roomId: string }) => {
            console.log("Received answer from", socket.id);
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        });

        socket.on("add-ice-candidate", ({
            candidate,
            roomId,
            type,
        }: {
            candidate: RTCIceCandidateInit;
            roomId: string;
            type: "sender" | "receiver";
        }) => {
            console.log(`Received ICE candidate from ${socket.id}, type: ${type}`);
            this.roomManager.onIceCandidate(roomId, socket.id, candidate, type);
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
            this.removeUser(socket.id);
        });
    }
}
