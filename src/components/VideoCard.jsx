import React, { useEffect, useRef } from "react";
import { Card } from "react-bootstrap";

const VideoCard = ({ stream, isLocal = false, label = "Participant", isVideoOn = true }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isVideoOn]); // add isVideoOn to trigger refresh

  return (
    <Card className="bg-dark text-white shadow-sm border-0" style={{ borderRadius: "1rem" }}>
      <div style={{ position: "relative" }}>
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          className="w-100"
          style={{
            height: "250px",
            objectFit: "cover",
            borderRadius: "1rem 1rem 0 0",
            display: isVideoOn ? "block" : "none",
          }}
        />
        {!isVideoOn && (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{
              height: "250px",
              backgroundColor: "#343a40",
              borderRadius: "1rem 1rem 0 0",
              position: "absolute",
              top: 0,
              width: "100%",
            }}
          >
            <span className="text-muted">Video Off</span>
          </div>
        )}
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "12px",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            padding: "2px 10px",
            borderRadius: "12px",
            fontSize: "0.85rem",
          }}
        >
          {isLocal ? "You" : label}
        </div>
      </div>
    </Card>
  );
};

export default VideoCard;
