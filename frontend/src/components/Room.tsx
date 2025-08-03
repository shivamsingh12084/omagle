import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Socket, io } from 'socket.io-client';

const URL = "http://localhost:3000";

export const Room = ({
    name,
    localAudioTrack,
    localVideoTrack,
    localStream,
}: {
    name: string,
    localAudioTrack: MediaStreamTrack | null,
    localVideoTrack: MediaStreamTrack | null,
    localStream: MediaStream | null
}) => {
    const [searchParams] = useSearchParams();
    const [lobby, setLobby] = useState(true);
    const [remoteName, setRemoteName] = useState<string | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const socket = io(URL);
        socketRef.current = socket;
        const roomId = searchParams.get("roomId") || "default-room";

        socket.emit("join", { roomId, name });

        socket.on("peer-joined", ({ peerName }) => {
            setRemoteName(peerName);
        });

        socket.on("send-offer", async ({ roomId }) => {
            setLobby(false);
            const pc = new RTCPeerConnection();
            peerConnectionRef.current = pc;

            if (localStream) {
                localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
            } else {
                if (localVideoTrack) pc.addTrack(localVideoTrack);
                if (localAudioTrack) pc.addTrack(localAudioTrack);
            }

            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        roomId
                    });
                }
            };

            pc.ontrack = handleRemoteTrack;

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("offer", { sdp: offer, roomId, name });
        });

        socket.on("offer", async ({ roomId, sdp, name: peerName }) => {
            setLobby(false);
            setRemoteName(peerName);

            const pc = new RTCPeerConnection();
            peerConnectionRef.current = pc;

            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        roomId
                    });
                }
            };

            pc.ontrack = handleRemoteTrack;

            if (localStream) {
                localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
            } else {
                if (localVideoTrack) pc.addTrack(localVideoTrack);
                if (localAudioTrack) pc.addTrack(localAudioTrack);
            }

            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { roomId, sdp: answer });
        });

        socket.on("answer", ({ sdp }) => {
            peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(sdp));
        });

        socket.on("add-ice-candidate", async ({ candidate }) => {
            const rtcCandidate = new RTCIceCandidate(candidate);
            try {
                await peerConnectionRef.current?.addIceCandidate(rtcCandidate);
            } catch (err) {
                console.error("Error adding ICE candidate", err);
            }
        });

        socket.on("lobby", () => {
            setLobby(true);
        });

        const setupLocalMedia = () => {
            const stream = new MediaStream();
            if (localVideoTrack) stream.addTrack(localVideoTrack);
            if (localAudioTrack) stream.addTrack(localAudioTrack);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.onloadedmetadata = () => {
                    localVideoRef.current?.play().catch(console.error);
                };
            }
        };

        const handleRemoteTrack = (event: RTCTrackEvent) => {
            const [stream] = event.streams;
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
                remoteVideoRef.current.onloadedmetadata = () => {
                    remoteVideoRef.current?.play().catch(console.error);
                };
            }
            const audio = document.createElement("audio");
            audio.srcObject = stream;
            audio.autoplay = true;
            (audio as any).playsInline = true;
            audio.style.display = "none";
            document.body.appendChild(audio);
        };

        setupLocalMedia();

        return () => {
            socket.disconnect();
            peerConnectionRef.current?.close();
        };
    }, [localAudioTrack, localVideoTrack]);

    return (
        <div style={{ background: 'linear-gradient(to right, #1e3c72, #2a5298)', color: '#fff', minHeight: '100vh', padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2 style={{ fontSize: '2rem' }}>Hi {name}</h2>
        {lobby ? (
            <p style={{ fontSize: '1.2rem' }}>⏳ Waiting to connect you to someone...</p>
        ) : (
            <p style={{ fontSize: '1.2rem' }}>🎉 Connected with <strong>{remoteName || "a peer"}</strong></p>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem' }}>
            <div style={{ background: '#ffffff22', padding: '1rem', borderRadius: '12px' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>You</h4>
                <video autoPlay playsInline muted width={420} height={340} ref={localVideoRef} style={{ borderRadius: '12px', border: '2px solid #ccc' }} />
            </div>
            <div style={{ background: '#ffffff22', padding: '1rem', borderRadius: '12px' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>{remoteName || "Peer"}</h4>
                <video autoPlay playsInline width={420} height={340} ref={remoteVideoRef} style={{ borderRadius: '12px', border: '2px solid #ccc' }} />
            </div>
        </div>
    </div>
    );
};
