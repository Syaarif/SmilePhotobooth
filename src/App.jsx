import { useState } from "react";
import Home from "./components/Home";
import Room from "./components/Room";

const fromHash = () => decodeURIComponent(window.location.hash.slice(1));

export default function App() {
  const [room, setRoom] = useState(null);
  const [initial] = useState(fromHash);

  const enter = (code) => {
    window.location.hash = code;
    setRoom(code);
  };
  const leave = () => {
    history.replaceState(null, "", window.location.pathname);
    setRoom(null);
  };

  return room ? (
    <Room key={room} room={room} onLeave={leave} />
  ) : (
    <Home initial={initial} onEnter={enter} />
  );
}
