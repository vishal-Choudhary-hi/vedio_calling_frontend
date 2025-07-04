import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPlus, FaTrash } from "react-icons/fa";
import Constants from "../global/Constants";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";

const CreateRoomForm = () => {
  const [invites, setInvites] = useState([
    { uid: "", name: "", host: true },   // Host always first
    { uid: "", name: "", host: false },  // At least one guest
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (index, field, value) => {
    const updated = [...invites];
    updated[index][field] = value;
    setInvites(updated);
  };

  const addInvite = () =>
    setInvites([...invites, { uid: "", name: "", host: false }]);

  const removeInvite = (index) => {
    const updated = [...invites];
    updated.splice(index, 1);
    setInvites(updated);
  };

  const handleCreateRoom = async () => {
    try {
      const filteredInvites = invites.filter(inv => inv.uid.trim() && inv.name.trim());
      if (filteredInvites.length === 0) {
        toast.warning("Please enter at least one valid invite.");
        return;
      }

      setIsLoading(true);
      const response = await axios.post(`${Constants.BACKEND_URL}/create-room`, {
        invites: filteredInvites,
      }, {
        headers: {
          authorization: Constants.BACKEND_AUTH_KEY
        }
      });

      const { roomId } = response.data.data;
      const { uid, name } = filteredInvites.find(i => i.host);
      toast.success("Room created!");
      navigate(`/meet?roomId=${encodeURIComponent(roomId)}&inviteId=${encodeURIComponent(uid)}&name=${encodeURIComponent(name)}`);
    } catch (err) {
      console.error("Room creation error", err);
      toast.error("Failed to create room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show centered scrollable size="md">
      <Modal.Header closeButton>
        <Modal.Title>Create New Room</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {/* Host UI */}
          <h5 className="text-primary mb-3">Host Details</h5>
          <Row className="mb-4">
            <Col xs={5}>
              <Form.Control
                placeholder="Host UID"
                value={invites[0].uid}
                onChange={(e) => handleChange(0, "uid", e.target.value)}
                required
              />
            </Col>
            <Col xs={5}>
              <Form.Control
                placeholder="Host Name"
                value={invites[0].name}
                onChange={(e) => handleChange(0, "name", e.target.value)}
                required
              />
            </Col>
            <Col xs={2} className="d-flex align-items-center justify-content-center">
              <span className="badge bg-info">Host</span>
            </Col>
          </Row>

          {/* Guest UI */}
          <h6 className="mb-2">Invite Guests</h6>
          {invites.slice(1).map((invite, idx) => (
            <Row className="mb-3" key={idx + 1}>
              <Col xs={5}>
                <Form.Control
                  placeholder="Guest UID"
                  value={invite.uid}
                  onChange={(e) => handleChange(idx + 1, "uid", e.target.value)}
                />
              </Col>
              <Col xs={5}>
                <Form.Control
                  placeholder="Guest Name"
                  value={invite.name}
                  onChange={(e) => handleChange(idx + 1, "name", e.target.value)}
                />
              </Col>
              <Col xs={2} className="d-flex align-items-center">
                <Button
                  variant="danger"
                  onClick={() => removeInvite(idx + 1)}
                  title="Remove Guest"
                >
                  <FaTrash />
                </Button>
              </Col>
            </Row>
          ))}

          <Button variant="primary" onClick={addInvite} className="mb-3 w-100">
            <FaPlus className="me-2" /> Add Guest
          </Button>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={() => navigate("/")} disabled={isLoading}>
          Join Room
        </Button>
        <Button variant="success" onClick={handleCreateRoom} disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Room"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateRoomForm;
