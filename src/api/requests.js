import { http } from './http.js';

export const requestsApi = {
  list: () => http('/requests'),
  detail: (id) => http(`/requests/${id}`),
  create: (token, payload) => http('/requests', { method: 'POST', token, body: payload }),
  update: (token, id, payload) => http(`/requests/${id}`, { method: 'PATCH', token, body: payload }),
  remove: (token, id) => http(`/requests/${id}`, { method: 'DELETE', token }),
};
