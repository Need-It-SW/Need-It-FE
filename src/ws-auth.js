import { Client } from '@stomp/stompjs';
const KEY='needit_access_token';
const REFRESH='needit_refresh_token';
export function validToken(token=sessionStorage.getItem(KEY)) {
  try { const p=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'); const exp=JSON.parse(atob(p)).exp; return Number.isFinite(exp)&&exp*1000>Date.now()+1000; } catch { return false; }
}
// Same-origin parent and iframe share a single refresh operation.
const shared=window.top;
export async function refreshSession() {
  const old=sessionStorage.getItem(KEY), refresh=sessionStorage.getItem(REFRESH);
  if(validToken(old)) return old;
  if(!old||!refresh) return null;
  if(shared.__needitRefreshPromise) return shared.__needitRefreshPromise;
  shared.__needitRefreshPromise=(async()=>{
    try {
      const r=await fetch('/api/auth/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:refresh})});
      const data=(await r.json()).data;
      if(!r.ok||!validToken(data?.accessToken)||!data?.refreshToken) throw Error('refresh failed');
      if(sessionStorage.getItem(KEY)!==old||sessionStorage.getItem(REFRESH)!==refresh)return null;
      sessionStorage.setItem(REFRESH,data.refreshToken);sessionStorage.setItem(KEY,data.accessToken);
      return data.accessToken;
    } catch { if(sessionStorage.getItem(KEY)===old&&sessionStorage.getItem(REFRESH)===refresh)sessionStorage.removeItem(REFRESH); return null; }
    finally {shared.__needitRefreshPromise=null;}
  })();
  return shared.__needitRefreshPromise;
}
export function usableToken(){const t=sessionStorage.getItem(KEY);if(validToken(t))return t;return null;}
// Never open a socket with an expired token. Preserve ordinary network retries.
export function authenticatedClient(options){
  const client=new Client({...options, beforeConnect:async()=>{
    const token=usableToken()||await refreshSession();
    if(!token||!client.active){void client.deactivate();return;}
    client.connectHeaders={...options.connectHeaders,Authorization:'Bearer '+token};
  }});
  return client;
}
// Existing sessions are renewed by the iframe only; all clients observe storage changes.
export function watchSession(onChange){
  let previous=sessionStorage.getItem(KEY);
  let running=false;
  const tick=async()=>{
    if(running)return;running=true;
    try {
    let current=sessionStorage.getItem(KEY);
    if(current&&!validToken(current)){
      current=await refreshSession();
      if(!current&&sessionStorage.getItem(KEY)&&!validToken(sessionStorage.getItem(KEY))){
        sessionStorage.removeItem(KEY);sessionStorage.removeItem(REFRESH);
        sessionStorage.removeItem('needit_member_session_v2');sessionStorage.removeItem('needit_admin_demo_session');
        window.dispatchEvent(new Event('needit:session-expired'));
      }
    }
    current=sessionStorage.getItem(KEY);
    if(current!==previous){previous=current;onChange();}
    } finally {running=false;}
  };
  const timer=setInterval(tick,1000);
  window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
}
