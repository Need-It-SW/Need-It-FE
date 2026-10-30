import { http as apiRequest } from './http';
export const offersApi = {
  create: (postId, payload) => apiRequest(`/requests/${postId}/offers`, {method:'POST',body:JSON.stringify(payload)}),
  listMine: () => apiRequest('/offers/me'),
};
