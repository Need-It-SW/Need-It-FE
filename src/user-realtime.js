import { authenticatedClient, usableToken, watchSession } from './ws-auth.js';

let client = null;
let activeToken = null;

function sync() {
  const token = usableToken();

  if (!token) {
    activeToken = null;

    if (client) {
      const old = client;
      client = null;
      void old.deactivate();
    }

    return;
  }

  if (client?.active && activeToken === token) {
    return;
  }

  if (client) {
    const old = client;
    client = null;
    void old.deactivate();
  }

  activeToken = token;

  const wsUrl =
    `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:8080/ws`;

  const next = authenticatedClient({
    brokerURL: wsUrl,

    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    reconnectDelay: 5000,

    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    debug: () => {},

    onConnect() {
      console.info('[NEED IT] WebSocket 연결 성공');

      // ==========================================
      // 1. 사용자 알림 실시간 구독
      // ==========================================
      next.subscribe(
        '/user/queue/notifications',
        () => {
          window.dispatchEvent(
            new Event('needit:notification')
          );
        }
      );

      // Account suspension is pushed to the affected member only.
      next.subscribe('/user/queue/account-status', (message) => {
        try {
          const event = JSON.parse(message.body);
          if (event?.type !== 'ACCOUNT_SUSPENDED') return;
          // This module runs inside /needit.html (the iframe itself).
          // Deliver the event to this window, not to a nonexistent nested iframe.
          window.dispatchEvent(new CustomEvent('needit:account-status', { detail: event }));
        } catch (error) {
          console.warn('[NEED IT] 제재 이벤트 파싱 실패', error);
        }
      });
      // Recheck server state after reconnect, including missed offline events.
      window.dispatchEvent(new CustomEvent('needit:account-status', {
        detail: { type: 'ACCOUNT_STATUS_CHECK' },
      }));

      // ==========================================
      // 2. 게시글 및 나눔 제안 실시간 구독
      // ==========================================
      next.subscribe(
        '/topic/requests',
        (message) => {
          try {
            const event = JSON.parse(message.body);

            if (typeof event?.type !== 'string') {
              return;
            }

            console.info(
              '[NEED IT] 실시간 변경 수신:',
              event.type,
              event.requestId
            );

            window.dispatchEvent(
              new CustomEvent('needit:request-updated', {
                detail: event,
              })
            );

          } catch (error) {
            console.warn(
              '[NEED IT] 요청글 이벤트 파싱 실패',
              error
            );
          }
        }
      );

      console.info(
        '[NEED IT] 실시간 WebSocket 구독 완료'
      );
    },

    onStompError(frame) {
      console.warn(
        '[NEED IT] STOMP 오류:',
        frame.headers.message,
        frame.body
      );
    },

    onWebSocketError(error) {
      console.warn(
        '[NEED IT] WebSocket 연결 오류:',
        error
      );
    },

    onWebSocketClose() {
      console.info(
        '[NEED IT] WebSocket 연결 종료 · 재연결 대기'
      );
    },
  });

  client = next;
  next.activate();
}

window.addEventListener('needit:auth-changed', sync);
window.addEventListener('storage', sync);
window.addEventListener('pageshow', sync);

sync();
watchSession(sync);
window.addEventListener('pagehide',()=>client?.deactivate());