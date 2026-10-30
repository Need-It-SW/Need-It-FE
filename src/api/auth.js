import { http as apiRequest } from './http';
// Spring Boot endpoints (contract proposal): configure to match your controllers.
export const authApi = {
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  signup: (payload) => apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => apiRequest('/members/me'),
  status: () => apiRequest('/members/me/status'),
};
