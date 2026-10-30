import { http as apiRequest } from './http';
export const chatApi = {
  rooms: () => apiRequest('/chats'),
  messages: (roomId) => apiRequest(`/chats/${roomId}/messages`),
  send: (roomId, payload) => apiRequest(`/chats/${roomId}/messages`,{method:'POST',body:JSON.stringify(payload)}),
};
