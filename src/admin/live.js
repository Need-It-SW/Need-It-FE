import { authenticatedClient, usableToken, watchSession } from '../ws-auth.js';

const state = {client:null, rows:[], stats:null, filters:{memberId:'',filterResult:'',filterReason:'',search:''}, page:0, size:20, totalPages:1, status:'대기 중', error:'', debounce:null, requestSeq:0};
const $ = id => document.getElementById(id);
const escapeHtml = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const token = () => sessionStorage.getItem('needit_access_token');
const api = async path => {
 const response=await fetch('/api'+path,{headers:{Authorization:'Bearer '+token()},cache:'no-store'});
 if(!response.ok)throw new Error(`API 요청 실패 (HTTP ${response.status})`);
 const json=await response.json();return json?.data??json;
};
function visible(){return !!$('adminContent') && !$('adminArea')?.classList.contains('hidden') && !!$('adminContent').querySelector('#liveActionLog');}
function badge(result){const v=String(result||'UNCLASSIFIED').toUpperCase();return `<span class="live-pill ${v==='INCLUDED'?'included':v==='EXCLUDED'?'excluded':'pending'}">${v==='INCLUDED'?'정상':v==='EXCLUDED'?'제외':'미분류'}</span>`;}
function time(value){if(!value)return '-';return escapeHtml(String(value).replace('T',' ').replace(/\..*$/,''));}
function draw(){
 if(!visible())return;
 const s=state.stats||{};const reasons=s.reasonCounts||{};
 $('liveStatus').textContent=state.status;
 $('liveStatus').dataset.state=state.client?.connected?'connected':'offline';
 $('liveError').textContent=state.error;
 for(const [id,value] of Object.entries({liveTotal:s.totalCount??'-',liveIncluded:s.includedCount??'-',liveExcluded:s.excludedCount??'-',liveUnclassified:s.unclassifiedCount??'-',liveRate:s.exclusionRate==null?'-':`${Number(s.exclusionRate).toFixed(1)}%`}))$(id).textContent=value;
 $('liveReasons').textContent=Object.entries(reasons).map(([key,count])=>`${key} ${count}건`).join(' · ')||'제외 사유 없음';
 $('liveRows').innerHTML=state.rows.map(r=>{
 const result=r.filterResult||r.filterStatus;const reason=r.filterReason||r.exclusionReason||'';const sanction=r.actualSanctionReason||r.sanctionReason||r.reason||'';
 return `<tr><td>${escapeHtml(r.memberId??r.userId??'-')}</td><td>${escapeHtml(r.action??'-')}</td><td>${escapeHtml(r.keyword||'-')}</td><td>${escapeHtml(r.category||'-')}</td><td>${badge(result)}</td><td>${escapeHtml(reason||'NONE')}${sanction?`<div class="live-detail">${escapeHtml(sanction)}</div>`:''}</td><td>${time(r.createdAt||r.occurredAt||r.timestamp)}</td></tr>`;
 }).join('')||'<tr><td colspan="7" class="admin-empty">조건에 맞는 행동 로그가 없습니다.</td></tr>';
 $('livePage').textContent=`${state.page+1} / ${Math.max(1,state.totalPages)} 페이지`;
 $('livePrev').disabled=state.page===0;$('liveNext').disabled=state.page+1>=state.totalPages;
}
async function refresh(){
 if(!visible()||!token())return;
 const seq=++state.requestSeq;
 const params=new URLSearchParams({page:String(state.page),size:String(state.size)});
 Object.entries(state.filters).forEach(([k,v])=>{if(v!=='')params.set(k,v)});
 try{
  const [page,stats]=await Promise.all([api('/admin/user-actions?'+params),api('/admin/user-actions/filter-statistics')]);
  if(seq!==state.requestSeq||!visible())return;
  state.rows=Array.isArray(page.content)?page.content:Array.isArray(page)?page:[];
  state.totalPages=page.totalPages??1;state.stats=stats;state.error='';draw();
 }catch(e){if(seq!==state.requestSeq)return;state.error=e.message;draw()}
}
function start(){
 if(state.client?.active||!usableToken()||!visible())return;
 state.status='연결 중';draw();
 const client=authenticatedClient({
  brokerURL:import.meta.env.VITE_WS_URL || `${location.protocol==='https:'?'wss':'ws'}://${location.hostname}${import.meta.env.DEV?':8080':''}/ws`,
  connectHeaders:{Authorization:'Bearer '+token()},reconnectDelay:5000,debug:()=>{},
  onConnect:()=>{state.status='실시간 연결됨';draw();client.subscribe('/topic/admin/user-actions',message=>{
   try{const event=JSON.parse(message.body);if(event.type==='USER_ACTION_CREATED')refresh()}catch(e){console.warn('행동 로그 메시지 오류',e)}
  });},
  onStompError:frame=>{state.status='구독 오류';state.error=frame.headers.message||'STOMP 오류';draw()},
  onWebSocketClose:()=>{state.status='연결 끊김 · 재연결 중';draw()},
  onWebSocketError:()=>{state.status='연결 오류';draw()}
 });state.client=client;client.activate();
}
function stop(){clearTimeout(state.debounce);state.requestSeq++;if(state.client){const client=state.client;state.client=null;client.deactivate()}state.status='대기 중';}
function exportCsv(){
 const columns=[['memberId','회원 ID'],['action','행동'],['keyword','검색어'],['category','카테고리'],['filterResult','필터 결과'],['filterReason','제외 사유'],['sanctionReason','실제 제재 사유'],['createdAt','발생 시각']];
 const csv=[columns.map(c=>c[1]).join(','),...state.rows.map(row=>columns.map(([key])=>'"'+String(row[key]??'').replace(/"/g,'""')+'"').join(','))].join('\r\n');
 const a=document.createElement('a');const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.href=url;a.download='needit-user-actions-current-page.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function render(){
 const root=$('adminContent');if(!root)return;
 root.innerHTML=`<section class="admin-panel" id="liveActionLog">
 <div class="admin-section-title"><div><h2>사용자 행동 로그</h2><p>Kafka 수집 로그 · 제재 회원 제외 이력 · 실제 제재 사유</p></div><button class="outline" id="liveExport">CSV 내보내기</button></div>
 <div class="live-connection"><span class="live-dot"></span><span id="liveStatus">연결 확인 중</span><span class="live-subtitle">새 행동이 저장되면 목록과 통계를 자동 갱신합니다.</span></div>
 <div class="live-stats">${[['전체','liveTotal'],['정상','liveIncluded'],['제외','liveExcluded'],['미분류','liveUnclassified'],['제외율','liveRate']].map(([label,id])=>`<div class="live-stat"><span>${label}</span><strong id="${id}">-</strong></div>`).join('')}</div>
 <p class="live-reasons">제외 사유별: <span id="liveReasons">-</span></p>
 <div class="live-filters"><input type="number" id="liveMember" min="1" placeholder="회원 ID" value="${escapeHtml(state.filters.memberId)}"><select id="liveResult"><option value="">전체 상태</option><option value="INCLUDED">정상</option><option value="EXCLUDED">제외</option><option value="UNCLASSIFIED">미분류</option></select><select id="liveReason"><option value="">전체 제외 사유</option>${['MEMBER_SUSPENDED','MEMBER_WITHDRAWN','MEMBER_BANNED','OTHER'].map(x=>`<option value="${x}">${x}</option>`).join('')}</select><input id="liveSearch" placeholder="행동 / 키워드 검색" value="${escapeHtml(state.filters.search)}"><button class="outline" id="liveReset">초기화</button></div>
 <p id="liveError" class="live-error" role="alert"></p>
 <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>회원 ID</th><th>행동</th><th>검색어</th><th>카테고리</th><th>필터링</th><th>제외 사유 / 실제 제재 사유</th><th>발생 시각</th></tr></thead><tbody id="liveRows"><tr><td colspan="7">로그 불러오는 중...</td></tr></tbody></table></div>
 <div class="live-pagination"><button class="outline" id="livePrev">이전</button><span id="livePage">1 / 1 페이지</span><button class="outline" id="liveNext">다음</button></div></section>`;
 $('liveResult').value=state.filters.filterResult;$('liveReason').value=state.filters.filterReason;
 const update=(key,value,delay=0)=>{state.filters[key]=value;state.page=0;clearTimeout(state.debounce);state.debounce=setTimeout(refresh,delay)};
 $('liveMember').oninput=e=>update('memberId',e.target.value,400);
 $('liveSearch').oninput=e=>update('search',e.target.value,350);
 $('liveResult').onchange=e=>update('filterResult',e.target.value);
 $('liveReason').onchange=e=>update('filterReason',e.target.value);
 $('liveReset').onclick=()=>{state.filters={memberId:'',filterResult:'',filterReason:'',search:''};state.page=0;render()};
 $('livePrev').onclick=()=>{if(state.page>0){state.page--;refresh()}};
 $('liveNext').onclick=()=>{if(state.page+1<state.totalPages){state.page++;refresh()}};
 $('liveExport').onclick=exportCsv;
 draw();refresh();start();
}
window.NEEDIT_ADMIN_LIVE={render,stop};

watchSession(()=>{stop();if(visible())start();});
window.addEventListener("needit:auth-changed",()=>{if(!usableToken())stop();});
window.addEventListener("pagehide",stop);
