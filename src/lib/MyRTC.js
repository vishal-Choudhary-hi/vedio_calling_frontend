// src/lib/MyRTC.js
import Peer from "simple-peer";

export default class MyRTC {
  constructor(socket, localVideoRef, onRemoteStream) {
    this.socket = socket;
    this.localVideoRef = localVideoRef;
    this.onRemoteStream = onRemoteStream;
    this.peers = {};
    this.localStream = null;
  }

  async initMedia() {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    this.localVideoRef.current.srcObject = this.localStream;
  }

  async joinRoom(roomID) {
    await this.initMedia();
    this.socket.emit("join", roomID);

    this.socket.on("all-users", (users) => {
      users.forEach(userID => {
        const peer = this.createPeer(userID);
        this.peers[userID] = peer;
      });
    });

    this.socket.on("user-joined", (userID) => {
      const peer = this.addPeer(userID);
      this.peers[userID] = peer;
    });

    this.socket.on("user-signal", ({ callerID, signal }) => {
      const peer = this.peers[callerID];
      if (peer) peer.signal(signal);
    });

    this.socket.on("receiving-returned-signal", ({ id, signal }) => {
      const peer = this.peers[id];
      if (peer) peer.signal(signal);
    });
  }

  createPeer(userToSignal) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: this.localStream,
    });

    peer.on("signal", signal => {
      this.socket.emit("sending-signal", {
        userToSignal,
        callerID: this.socket.id,
        signal,
      });
    });

    peer.on("stream", this.onRemoteStream);

    return peer;
  }

  addPeer(callerID) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: this.localStream,
    });

    peer.on("signal", signal => {
      this.socket.emit("returning-signal", {
        signal,
        callerID,
      });
    });

    peer.on("stream", this.onRemoteStream);

    return peer;
  }
}
