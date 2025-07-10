import { User } from "./UserManager";

let GLOBAL_ROOM_ID = 1;

export interface Room {
    user1: User,
    user2: User,
}

export class RoomManager {
    private rooms: Map<string, Room>

    constructor() {
        this.rooms = new Map<string, Room>();
    }

    /**
     * creates a new room with two users
     * generates a room id
     * stores both users in the rooom's map using the room id as the key
     * emmits a sends an offer to user1's socket with the room id
     * @param user1 
     * @param user2 
     */
    createRoom(user1: User, user2: User) {
        const room_id = this.generate();
        this.rooms.set(room_id.toString(), {
            user1,
            user2,
        });
    
        user1.socket.emit("send_offer", {
            room_id,
            peerName: user2.name, // ✅ FIXED: assign user2's name
        });
    }

    onOffer(room_id: string, sdp: string) {
        const room = this.rooms.get(room_id.toString());
        if (!room) {
          console.log("❌ No room found for", room_id);
          return;
        }
      
        const { user1, user2 } = room;
      
        console.log(`📤 Emitting 'offer' to ${user2.name}`);
        user2.socket.emit("offer", {
          sdp,
          room_id,
          peerName: user1.name,
        });
      }

    onAnswer(room_id: string, sdp: string) {
        
        const room = this.rooms.get(room_id.toString());
        if (!room) {
            console.log("❌ No room found for", room_id);
            return;
        }
    
        const { user1, user2 } = room;
    
        console.log(`🔁 Sending answer from ${user2.name} to ${user1.name}`);
        
        user1.socket.emit("answer", {
            sdp,
            room_id,
            peerName: user2.name,
        });
    }

    generate() {
        return GLOBAL_ROOM_ID++;
    }

}