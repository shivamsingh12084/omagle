import { User } from "./UserManager";

let GLOBAL_ROOM_ID = 1;

interface Room {
    user1: User,
    user2: User,
}

export 
class RoomManager {
    private rooms: Map<string, Room> = new Map();

    createRoom(user1: User, user2: User) {
        const roomId = (GLOBAL_ROOM_ID++).toString();
        this.rooms.set(roomId, { user1, user2 });
    
        user1.socket.emit("peer-joined", { peerName: user2.name });
        user2.socket.emit("peer-joined", { peerName: user1.name });
    
        // ✅ Only user2 should initiate offer
        user1.socket.emit("lobby"); // wait
        user2.socket.emit("send-offer", { roomId }); // initiator
    }

    onOffer(roomId: string, sdp: RTCSessionDescriptionInit, senderSocketId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
        const sendingUser = room.user1.socket.id === senderSocketId ? room.user1 : room.user2;
        receivingUser.socket.emit("offer", { sdp, roomId, name: sendingUser.name });
    }

    onAnswer(roomId: string, sdp: RTCSessionDescriptionInit, senderSocketId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
        receivingUser.socket.emit("answer", { sdp, roomId });
    }

    onIceCandidate(
        roomId: string,
        senderSocketId: string,
        candidate: RTCIceCandidateInit,
        type: "sender" | "receiver"
    ) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
        receivingUser.socket.emit("add-ice-candidate", { candidate, type });
    }
}