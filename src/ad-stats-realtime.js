import { authenticatedClient, usableToken, watchSession } from './ws-auth.js';

// The admin UI is hosted in a same-origin iframe (/needit.html).
let client=null;
let activeToken=null;
let debounce=null;
const iframe=()=>document.querySelector('iframe[title="NEED IT"]');
const adminWindow=()=>iframe()?.contentWindow;
const isDashboard=()=>{
  try {const doc=iframe()?.contentDocument;
   return !!doc?.getElementById('needitStatRows') && !doc?.getElementById('adminArea')?.classList.contains('hidden');
  } catch {return false;}
};
const analysis=()=>{try{return !!adminWindow()?.NEEDIT_FILTER_ANALYSIS?.active()}catch{return false}};
const behavior=()=>{try{return !!adminWindow()?.NEEDIT_CUSTOMER_BEHAVIOR?.active()}catch{return false}};
const status=connected=>{try{adminWindow()?.NEEDIT_AD_STATS_REALTIME?.status(connected);adminWindow()?.NEEDIT_FILTER_ANALYSIS?.status(connected);adminWindow()?.NEEDIT_CUSTOMER_BEHAVIOR?.status(connected)}catch{}};
const refresh=()=>{
 if(!isDashboard())return;
 clearTimeout(debounce);
 debounce=setTimeout(()=>{if(isDashboard())adminWindow()?.NEEDIT_AD_STATS_REALTIME?.refresh()},250);
};
const stop=()=>{
 clearTimeout(debounce);
 if(client){const old=client;client=null;old.deactivate()}
 activeToken=null;
};
const check=()=>{
 let token;
 try{token=usableToken()}catch{return}
 if((!isDashboard()&&!analysis()&&!behavior())||!token){if(client)stop();status(false);return}
 if(client && activeToken===token){status(client.connected);return}
 stop();activeToken=token;
 const current=authenticatedClient({
  brokerURL:import.meta.env.VITE_WS_URL || `${location.protocol==='https:'?'wss':'ws'}://${location.hostname}${import.meta.env.DEV?':8080':''}/ws`,
  connectHeaders:{Authorization:'Bearer '+token},
  reconnectDelay:5000,debug:()=>{},
  onConnect:()=>{
   if(client!==current)return;
   status(true);refresh();if(analysis())adminWindow()?.NEEDIT_FILTER_ANALYSIS?.refresh();
   if(behavior())adminWindow()?.NEEDIT_CUSTOMER_BEHAVIOR?.refresh();
   current.subscribe('/topic/admin/user-actions',()=>adminWindow()?.NEEDIT_CUSTOMER_BEHAVIOR?.changed());
   current.subscribe('/topic/admin/filter-analysis',()=>adminWindow()?.NEEDIT_FILTER_ANALYSIS?.changed());
   current.subscribe('/topic/admin/ad-statistics',message=>{
    try{if(JSON.parse(message.body).type==='AD_STATISTICS_CHANGED')refresh()}
    catch(e){console.warn('광고 통계 이벤트 파싱 실패',e)}
   });
  },
  onStompError:frame=>{status(false);console.warn('광고 통계 STOMP 오류',frame.headers?.message)},
  onWebSocketClose:()=>status(false),
  onWebSocketError:()=>status(false)
 });
 client=current;current.activate();
};
setInterval(check,1000);
window.addEventListener('pagehide',stop);
