import { request, tokenStore } from './client.js';

// These paths are proposed contracts. Match them to your Spring Boot controllers.
export const authApi = {
  login: credentials => request('/auth/login', { method: 'POST', body: credentials, auth: false }),
  signup: details => request('/auth/signup', { method: 'POST', body: details, auth: false }),
  me: () => request('/members/me'),
  logout: () => tokenStore.clear()
};
export const postsApi = {
  list: (query = '') => request(`/posts${query ? `?${query}` : ''}`),
  detail: id => request(`/posts/${encodeURIComponent(id)}`),
  create: data => request('/posts', { method: 'POST', body: data }),
  update: (id, data) => request(`/posts/${encodeURIComponent(id)}`, { method: 'PATCH', body: data }),
  remove: id => request(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' })
};
export const offersApi = {
  list: () => request('/offers'),
  create: data => request('/offers', { method: 'POST', body: data }),
  respond: (id, status) => request(`/offers/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } })
};
export const chatApi = {
  rooms: () => request('/chats'),
  messages: roomId => request(`/chats/${encodeURIComponent(roomId)}/messages`),
  send: (roomId, content) => request(`/chats/${encodeURIComponent(roomId)}/messages`, { method: 'POST', body: { content } })
};
export const adminApi = {
  campaigns: () => request('/admin/campaigns'),
  saveCampaign: data => request('/admin/campaigns', { method: 'POST', body: data }),
  audienceRuns: campaignId => request(`/admin/campaigns/${encodeURIComponent(campaignId)}/audience-runs`),
  runAudience: (campaignId, filters) => request(`/admin/campaigns/${encodeURIComponent(campaignId)}/audience-runs`, { method: 'POST', body: filters }),
  adEvents: campaignId => request(`/admin/ad-events?campaignId=${encodeURIComponent(campaignId)}`)
};
export const adsApi = {
  impression: event => request('/ad-events/impressions', { method: 'POST', body: event }),
  click: event => request('/ad-events/clicks', { method: 'POST', body: event })
};
