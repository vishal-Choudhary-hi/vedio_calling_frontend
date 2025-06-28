import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import MyRTC from "./lib/MyRTC";
import Constants from "./global/Constants";

function App() {
  const localVideoRef = useRef();
  const [remoteStreams, setRemoteStreams] = useState([]);

  useEffect(() => {
    const socket = io(Constants.SOCKET_SERVER_URL);
    
    const rtc = new MyRTC(socket, localVideoRef, (stream) => {
      setRemoteStreams(prev => [...prev, stream]);
    });

    rtc.joinRoom("test-room");
  }, []);

  return (
    <div style={{ display: "flex", gap: "20px", padding: "20px" }}>
      <div>
        <h3>Local Video</h3>
        <video ref={localVideoRef} autoPlay muted style={{ width: "300px", borderRadius: "8px" }} />
      </div>

      {remoteStreams.map((stream, idx) => (
        <div key={idx}>
          <h3>Remote {idx + 1}</h3>
          <VideoPlayer stream={stream} />
        </div>
      ))}
    </div>
  );
}

function VideoPlayer({ stream }) {
  const ref = useRef();

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={ref} autoPlay style={{ width: "300px", borderRadius: "8px" }} />;
}

export default App;
