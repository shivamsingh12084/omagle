import { useEffect, useRef, useState } from "react";
import { Room } from "./Room";

export const Landing = () => {
    const [name, setName] = useState("");
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [joined, setJoined] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const getCam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setLocalStream(stream);
            setLocalAudioTrack(stream.getAudioTracks()[0]);
            setLocalVideoTrack(stream.getVideoTracks()[0]);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch((err) => {
                        console.error("Auto-play failed:", err);
                    });
                };
            }
        } catch (err) {
            console.error("Failed to get user media:", err);
            setError("Camera or microphone access denied. Please allow permissions.");
        }
    };

    useEffect(() => {
        getCam();

        return () => {
            localStream?.getTracks().forEach(track => track.stop());
        };
    }, []);

    if (!joined) {
        return (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
                <video autoPlay playsInline muted ref={videoRef} width={400} height={300} style={{ borderRadius: "8px" }} />
                <div>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ marginTop: "1rem", padding: "0.5rem" }}
                        autoFocus
                    />
                </div>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <button
                    onClick={() => setJoined(true)}
                    disabled={!name || !localAudioTrack || !localVideoTrack}
                    style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
                >
                    Join
                </button>
            </div>
        );
    }
    console.log("Local stream tracks", localStream?.getTracks());
    return (
       
        <Room
            name={name}
            localAudioTrack={localAudioTrack}
            localVideoTrack={localVideoTrack}
            localStream={localStream}
        />
    );
};
