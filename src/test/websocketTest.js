import { Client } from "@stomp/stompjs";

export function connectChat(accessToken, chatRoomId) {
  const client = new Client({
    brokerURL: "ws://127.0.0.1:8080/ws",

    connectHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },

    reconnectDelay: 0,

    // JWT 등 민감한 정보가 콘솔에 출력되지 않도록 비활성화
    debug: () => {},

    onConnect: () => {
      console.log("✅ WebSocket 연결 성공!");

      // ==========================================
      // 1. 기존 채팅 메시지 구독
      // ==========================================
      client.subscribe(`/topic/chats/${chatRoomId}`, (message) => {
        console.log("📩 메시지 수신:", JSON.parse(message.body));
      });

      console.log("✅ 채팅방 구독 성공!");

      // ==========================================
      // 2. 기존 채팅 읽음 알림 구독
      // ==========================================
      client.subscribe(`/topic/chats/${chatRoomId}/read`, (message) => {
        console.log("👀 읽음 알림 수신:", JSON.parse(message.body));
      });

      console.log("✅ 읽음 알림 구독 성공!");

      // ==========================================
      // 3. 사용자별 실시간 알림 구독 (추가)
      // ==========================================
      client.subscribe("/user/queue/notifications", (message) => {
        const notification = JSON.parse(message.body);

        console.log("🔔 실시간 알림:", notification);
      });

      console.log("✅ 실시간 알림 구독 성공!");
    },

    onStompError: (frame) => {
      console.error("❌ STOMP 오류:", frame.headers.message);
    },

    onWebSocketError: (error) => {
      console.error("❌ WebSocket 오류:", error);
    },
  });

  client.activate();

  return client;
}