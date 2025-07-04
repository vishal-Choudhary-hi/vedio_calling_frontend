import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Form, Button, Card, Container } from "react-bootstrap";
import { toast } from "react-toastify";

const JoinForm = () => {
  const [roomId, setRoomId] = useState();
  const [inviteId, setInviteId] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramRoomId = searchParams.get("roomId");
  const paramInviteId = searchParams.get("inviteId");

  useEffect(() => {
    if (paramRoomId) {
      setRoomId(paramRoomId);
    }
    if (paramInviteId) {
      setInviteId(paramInviteId);
    }
  },[]);
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!roomId.trim() || !inviteId.trim()) {
      toast.warn("Both Room ID and Invite ID are required.");
      return;
    }

    navigate(`/meet?roomId=${encodeURIComponent(roomId)}&inviteId=${encodeURIComponent(inviteId)}`);
  };

  const handleCreateRoom = () => {
    navigate("/create-room");
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      <Card style={{ width: "100%", maxWidth: "400px" }} className="shadow p-4">
        <h3 className="text-center mb-4">Join a Room</h3>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formRoomId">
            <Form.Label>Room ID</Form.Label>
            <Form.Control
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              required
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="formInviteId">
            <Form.Label>Invite ID</Form.Label>
            <Form.Control
              type="text"
              value={inviteId}
              onChange={(e) => setInviteId(e.target.value)}
              placeholder="Enter Invite ID"
              required
            />
          </Form.Group>

          <div className="d-grid gap-2">
            <Button variant="primary" type="submit">
              Join Room
            </Button>
            <Button variant="outline-secondary" type="button" onClick={handleCreateRoom}>
              Create New Room
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default JoinForm;
