// App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MeetRoom from "./components/MeetRoom";
import JoinForm from "./components/JoinForm";
import CreateRoomForm from "./components/CreateRoomForm";
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/meet" element={<MeetRoom />} />
        <Route path="/" element={<JoinForm />} />
        <Route path="/create-room" element={<CreateRoomForm />} />
      </Routes>
         <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;
