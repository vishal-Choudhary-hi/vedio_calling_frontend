// components/ControlsBar.jsx
import React from "react";
import { ButtonGroup, Button } from "react-bootstrap";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash } from "react-icons/fa";

const ControlsBar = ({ audioEnabled, videoEnabled, onToggleAudio, onToggleVideo, onDisconnect }) => {
  return (
    <div className="text-center mt-4">
      <ButtonGroup>
        <Button
          variant={audioEnabled ? "primary" : "outline-secondary"}
          onClick={onToggleAudio}
          title={audioEnabled ? "Mute" : "Unmute"}
        >
          {audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </Button>

        <Button
          variant={videoEnabled ? "primary" : "outline-secondary"}
          onClick={onToggleVideo}
          title={videoEnabled ? "Turn Video Off" : "Turn Video On"}
        >
          {videoEnabled ? <FaVideo /> : <FaVideoSlash />}
        </Button>

        <Button variant="danger" onClick={onDisconnect} title="Leave Call">
          <FaPhoneSlash />
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default ControlsBar;
