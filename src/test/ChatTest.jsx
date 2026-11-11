import * as React from "react";
import { connectChat } from "./websocketTest";

const { useEffect, useRef, useState } = React;
export default function ChatTest() {
  const clientRef = useRef(null);

  const [token, setToken] = useState("");
  const [roomId, setRoomId] = useState("1");
  const [message, setMessage] = useState("");

  const connect = () => {
    if (clientRef.current) {
      clientRef.current.deactivate();
    }

    clientRef.current = connectChat(token, roomId);
  };

  const sendMessage = () => {
    if (!clientRef.current?.connected) {
      alert("WebSocket 연결이 필요합니다.");
      return;
    }

    clientRef.current.publish({
      destination: `/app/chats/${roomId}/send`,
      body: JSON.stringify({
        content: message,
      }),
    });

    setMessage("");
  };

  useEffect(() => {
    return () => {
      clientRef.current?.deactivate();
    };
  }, []);

  return (
    <div style={{ padding: 30 }}>
      <h2>NEED IT WebSocket 테스트</h2>

      <input
        placeholder="Access Token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="채팅방 ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />

      <button onClick={connect}>연결하기</button>

      <br /><br />

      <input
        placeholder="메시지 입력"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={sendMessage}>전송</button>
    </div>
  );
}