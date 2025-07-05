// Fixed version of MeetRoomModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { Modal, Container, Row, Col } from "react-bootstrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import VideoCard from "../components/VideoCard";
import ControlsBar from "../components/ControlsBar";
import { io } from "socket.io-client";
import Constants from "../global/Constants";
import { toast } from "react-toastify";

const MeetRoomModal = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [candidateQueue, setCandidateQueue] = useState({});
  const [remoteStreams, setRemoteStreams] = useState([]);
  const peerConnectionsRef = useRef({});
  const answeredPeersRef = useRef({});
  const hasJoinedRef = useRef(false);
  const [allInvites,setAllInvites]=useState([]);

  const roomId = searchParams.get("roomId");
  const inviteId = searchParams.get("inviteId");

  const localVideoRef = useRef();
  const [localStream, setLocalStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  useEffect(() => {
    if (!roomId || !inviteId) navigate("/");
  }, []);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        const socketInstance = io(Constants.SOCKET_SERVER_URL);
        setSocket(socketInstance);

        socketInstance.on("connect", () => {
          if (!hasJoinedRef.current) {
            socketInstance.emit("join-room", { roomId, inviteId });
            hasJoinedRef.current = true;
          }
        });

        socketInstance.on("all-users", async (otherInvite) => {
          setAllInvites(otherInvite);
          for (let target of otherInvite) {
            let targetId = target.uid;
            if (targetId === inviteId) continue;
            const pc = createPeerConnection(targetId, socketInstance, stream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketInstance.emit("sending-signal", {
              targetInviteId: targetId,
              fromInviteId: inviteId,
              signal: offer,
            });
          }
        });

        socketInstance.on("user-signal", async ({ fromInviteId, signal }) => {
          let pc = peerConnectionsRef.current[fromInviteId] || createPeerConnection(fromInviteId, socketInstance, stream);

          if (signal.type === "offer") {
            if (!pc.remoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(signal));
              await flushCandidateQueue(pc, fromInviteId);
            }
            if (pc.signalingState === "have-remote-offer" && !answeredPeersRef.current[fromInviteId]) {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socketInstance.emit("returning-signal", {
                targetInviteId: fromInviteId,
                signal: answer,
              });
              answeredPeersRef.current[fromInviteId] = true;
            }
          }
        });

        socketInstance.on("receiving-returned-signal", async ({ fromInviteId, signal }) => {
          const pc = peerConnectionsRef.current[fromInviteId];
          if (pc?.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            await flushCandidateQueue(pc, fromInviteId);
          }
        });

        socketInstance.on("error", ( errorMessage ) => {
          toast.error("Error: " + errorMessage);
          navigate("/");
        });

        socketInstance.on("ice-candidate", ({ from, candidate }) => {
          const pc = peerConnectionsRef.current[from];
          if (pc?.remoteDescription?.type) {
            pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
          } else {
            setCandidateQueue(prev => ({
              ...prev,
              [from]: [...(prev[from] || []), candidate],
            }));
          }
        });

        socketInstance.on("user-left", (leftId) => {
          setRemoteStreams((prev) => prev.filter((r) => r.id !== leftId));
          if (peerConnectionsRef.current[leftId]) {
            peerConnectionsRef.current[leftId].close();
            delete peerConnectionsRef.current[leftId];
          }
        });

        window.addEventListener("beforeunload", () => {
          socketInstance.disconnect();
          window.parent.postMessage({ type: "close" }, "*");
          stream.getTracks().forEach(track => track.stop());
        });
      })
      .catch(() => {
        alert("Camera/Mic access is required.");
        navigate("/");
      });

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, videoEnabled]);

  const createPeerConnection = (targetId, socket, stream) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          targetInviteId: targetId,
          candidate: e.candidate,
          from: inviteId,
        });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams((prev) => {
        if (prev.find((r) => r.id === targetId)) return prev;
        return [...prev, { id: targetId, stream: remoteStream }];
      });
    };

    peerConnectionsRef.current[targetId] = pc;
    return pc;
  };

  const flushCandidateQueue = async (pc, fromId) => {
    if (candidateQueue[fromId]) {
      for (const c of candidateQueue[fromId]) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      setCandidateQueue(prev => {
        const updated = { ...prev };
        delete updated[fromId];
        return updated;
      });
    }
  };

  const toggleAudio = () => {
    const track = localStream?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setAudioEnabled(track.enabled);
    }
  };

  const toggleVideo = () => {
    const track = localStream?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideoEnabled(track.enabled);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
        localVideoRef.current.srcObject = localStream;
      }
    }
  };

  const disconnectCall = () => {
    window.parent.postMessage({ type: "close" }, "*");
    localStream?.getTracks().forEach((track) => track.stop());
    navigate("/");
  };

  return (
    <Modal show fullscreen backdrop="static" keyboard={false}>
      <Modal.Body className="bg-dark text-white" style={{ padding: "2rem" }}>
        <Container fluid>
          <Row className="g-4 justify-content-center">
            <Col md={5}>
              <VideoCard
                stream={localStream}
                isLocal
                isVideoOn={videoEnabled}
                label="You"
                videoRef={localVideoRef}
              />
            </Col>
            {remoteStreams.map(({ id, stream }) => {
              const matchedInvite = allInvites.find((inv) => inv.uid === id);
              const displayName = matchedInvite?.name || "Remote";

              return (
                <Col md={5} key={id}>
                  <VideoCard
                    stream={stream}
                    isLocal={false}
                    isVideoOn={true}
                    label={displayName}
                  />
                </Col>
              );
            })}

          </Row>
          <ControlsBar
            audioEnabled={audioEnabled}
            videoEnabled={videoEnabled}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onDisconnect={disconnectCall}
          />
        </Container>
      </Modal.Body>
    </Modal>
  );
};

export default MeetRoomModal;