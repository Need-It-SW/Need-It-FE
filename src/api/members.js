import { http } from './http.js';

// Example contracts: adjust paths and DTOs to your Spring Boot controllers.
export const membersApi = {
  signup: (payload) => http('/members', { method: 'POST', body: payload }),
  me: (token) => http('/members/me', { token }),
  updateMe: (token, payload) => http('/members/me', { method: 'PATCH', token, body: payload }),
};
