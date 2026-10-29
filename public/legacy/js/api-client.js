/* NEED IT 공통 HTTP 클라이언트. 현재 app.js는 시연용 로직을 유지합니다.
   기능별 API를 구현하면서 app.js의 저장/조회 부분을 이 클라이언트로 교체하세요. */
window.NEEDIT_API = (() => {
  const base = () => window.NEEDIT_CONFIG.API_BASE_URL.replace(/\/$/, '');
  async function request(path, { method='GET', body, headers={}, ...rest } = {}) {
    const isForm = body instanceof FormData;
    const options = { method, credentials: 'include', ...rest, headers: {...headers} };
    if (body !== undefined) {
      options.body = isForm ? body : JSON.stringify(body);
      if (!isForm) options.headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(base() + path, options);
    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${message || response.statusText}`);
    }
    if (response.status === 204) return null;
    const type = response.headers.get('content-type') || '';
    return type.includes('application/json') ? response.json() : response.text();
  }
  return {
    request,
    auth: { login: data => request('/auth/login', {method:'POST',body:data}), signup: data => request('/auth/signup',{method:'POST',body:data}), me:()=>request('/members/me') },
    requests: { list:()=>request('/requests'), get:id=>request(`/requests/${id}`), create:data=>request('/requests',{method:'POST',body:data}), update:(id,data)=>request(`/requests/${id}`,{method:'PATCH',body:data}), remove:id=>request(`/requests/${id}`,{method:'DELETE'}) },
    offers: { create:(requestId,data)=>request(`/requests/${requestId}/offers`,{method:'POST',body:data}) },
    uploads: { image:formData=>request('/uploads',{method:'POST',body:formData}) }
  };
})();
