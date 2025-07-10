import { set } from 'mongoose';
import React, { use } from 'react'
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Socket, io } from 'socket.io-client';


const url = "http://localhost:3000";






export const Room = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const name = searchParams.get("name") || "Guest";
    const [socket, setSocket] = useState<Socket | null>(null);
    const [peerName, setPeerName] = useState<string | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [lobby, setLobby] = useState(true)

    useEffect(() => {
        const socket = io(url, {
          transports: ["websocket"]
        });
        setSocket(socket);
      
        socket.emit("join", { name });
      
        socket.on("send_offer", ({ room_id, peerName }) => {
            console.log("Got send_offer");
            setPeerName(peerName);
            setRoomId(room_id);  // <- ✅
            setLobby(false);
            socket.emit("offer", { sdp: "", room_id });
          });
          
          socket.on("offer", ({ room_id, sdp, peerName }) => {
            console.log("Got offer");
            setPeerName(peerName);
            setRoomId(room_id);  // <- ✅
            setLobby(false);
            socket.emit("answer", { sdp: "", room_id });
          });
          
          socket.on("answer", ({ room_id, sdp, peerName }) => {
            console.log("Got answer, reloading UI");
            setPeerName(peerName);
            setLobby(false);
            // window.location.reload(); // ← uncomment to force refresh (not ideal, but good for testing)
          });
        return () => {
          socket.disconnect();
        };
      }, [name]);

    return (
        <div>
        <h1>Hi {name}!</h1>
        {lobby ? (
            <p>⏳ Waiting for another player to join...</p>
        ) : (
            <p>✅ You are now connected with <strong>{peerName}</strong></p>
        )}
        </div>
      );
}