import * as React from "react";
import { Client } from "@stomp/stompjs";
import { connectChat } from "./websocketTest";

const { useEffect, useRef, useState } = React;

export default function ChatTest() {
  const clientRef = useRef(null);
  const adminClientRef = useRef(null);

  const [token, setToken] = useState("");
  const [roomId, setRoomId] = useState("1");
  const [message, setMessage] = useState("");

  const [adminStatus, setAdminStatus] = useState("연결 안 됨");
  const [adminLogs, setAdminLogs] = useState([]);

  const addAdminLog = (text) => {
    setAdminLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${text}`,
    ]);
  };

  // ==========================================
  // 1. 기존 채팅 WebSocket 연결
  // ==========================================
  const connect = () => {
    if (clientRef.current) {
      clientRef.current.deactivate();
    }

    clientRef.current = connectChat(token, roomId);
  };

  // ==========================================
  // 2. 기존 채팅 메시지 전송
  // ==========================================
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

  // ==========================================
  // 3. 관리자 Kafka WebSocket 연결
  // ==========================================
  const connectAdmin = () => {
    const accessToken = token.trim().replace(/^Bearer\s+/i, "");

    if (!accessToken) {
      alert("관리자 Access Token을 입력하세요.");
      return;
    }

    if (adminClientRef.current?.active) {
      alert("이미 관리자 WebSocket이 연결 중입니다.");
      return;
    }

    setAdminStatus("연결 중...");
    addAdminLog("관리자 WebSocket 연결 시도");

    const client = new Client({
      brokerURL: "ws://127.0.0.1:8080/ws",

      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },

      reconnectDelay: 0,
      debug: () => {},

      onConnect: () => {
        console.log("✅ 관리자 WebSocket 연결 성공");

        setAdminStatus("연결됨");
        addAdminLog("WebSocket 연결 성공");

        client.subscribe(
          "/topic/admin/user-actions",
          (message) => {
            try {
              const event = JSON.parse(message.body);

              console.log("🔥 Kafka 행동 로그 수신:", event);

              addAdminLog(
                `Kafka 행동 로그 수신: ${JSON.stringify(event)}`
              );
            } catch (error) {
              console.error("메시지 파싱 오류:", error);
              addAdminLog("메시지 파싱 오류");
            }
          },
          {
            receipt: "admin-user-actions-subscribe",
          }
        );

        addAdminLog("관리자 행동 로그 구독 요청");
      },

      onUnhandledReceipt: (frame) => {
        if (
          frame.headers["receipt-id"] ===
          "admin-user-actions-subscribe"
        ) {
          console.log("✅ 관리자 구독 승인");
          addAdminLog("관리자 행동 로그 구독 승인");
        }
      },

      onStompError: (frame) => {
        console.error("❌ STOMP 오류:", frame);

        setAdminStatus("STOMP 오류");
        addAdminLog(
          `STOMP 오류: ${frame.headers.message || "알 수 없는 오류"}`
        );
      },

      onWebSocketError: (error) => {
        console.error("❌ WebSocket 오류:", error);

        setAdminStatus("연결 오류");
        addAdminLog("WebSocket 연결 오류");
      },

      onWebSocketClose: () => {
        setAdminStatus("연결 종료");
        addAdminLog("WebSocket 연결 종료");
      },
    });

    adminClientRef.current = client;
    client.activate();
  };

  // ==========================================
  // 4. 관리자 WebSocket 연결 해제
  // ==========================================
  const disconnectAdmin = async () => {
    if (!adminClientRef.current) {
      return;
    }

    await adminClientRef.current.deactivate();
    adminClientRef.current = null;

    setAdminStatus("연결 안 됨");
  };

  // ==========================================
  // 5. 컴포넌트 종료 시 연결 해제
  // ==========================================
  useEffect(() => {
    return () => {
      clientRef.current?.deactivate();
      adminClientRef.current?.deactivate();
    };
  }, []);

  return (
    <div style={{ padding: 30, maxWidth: 850 }}>
      <h2>NEED IT WebSocket 테스트</h2>

      <h3>Access Token</h3>

      <input
        type="password"
        placeholder="Access Token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        style={{ width: 500, padding: 8 }}
      />

      <hr />

      {/* 기존 채팅 테스트 */}
      <h3>1. 기존 채팅 WebSocket 테스트</h3>

      <input
        placeholder="채팅방 ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />

      <button onClick={connect}>
        채팅 연결하기
      </button>

      <br /><br />

      <input
        placeholder="메시지 입력"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={sendMessage}>
        전송
      </button>

      <hr />

      {/* 관리자 Kafka 테스트 */}
      <h3>2. Kafka 관리자 WebSocket 테스트</h3>

      <button onClick={connectAdmin}>
        관리자 WebSocket 연결
      </button>

      <button
        onClick={disconnectAdmin}
        style={{ marginLeft: 10 }}
      >
        연결 해제
      </button>

      <p>
        연결 상태: <strong>{adminStatus}</strong>
      </p>

      <p>
        연결한 상태에서 Swagger의 검색 API를 실행하면
        Kafka 행동 로그 수신 여부를 확인할 수 있어.
      </p>

      <h3>3. 관리자 실시간 로그</h3>

      <div
        style={{
          backgroundColor: "#111827",
          color: "#ffffff",
          padding: 20,
          borderRadius: 10,
          minHeight: 200,
          whiteSpace: "pre-wrap",
          fontSize: 14,
          lineHeight: 1.8,
        }}
      >
        {adminLogs.length === 0
          ? "아직 수신된 로그가 없습니다."
          : adminLogs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
      </div>
    </div>
  );
}