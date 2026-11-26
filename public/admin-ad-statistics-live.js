(function(){
'use strict';
const escapeHTML = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = n => Number(n||0).toLocaleString('ko-KR');
const state={start:'',end:'',campaign:'',rows:[],requestSeq:0};
function today(){return new Date().toLocaleDateString('sv-SE');}
function toParam(d,end){return d+'T'+(end?'23:59:59':'00:00:00');}
async function getStats(){
 const token=sessionStorage.getItem('needit_access_token');
 const url=state.start&&state.end?'/api/admin/campaigns/statistics/period?'+new URLSearchParams({start:toParam(state.start,false),end:toParam(state.end,true)}):'/api/admin/campaigns/statistics';
 const response=await fetch(url,{headers:token?{Authorization:'Bearer '+token}:{},cache:'no-store'});
 const json=await response.json().catch(()=>null);
 if(!response.ok||json?.success===false)throw new Error(json?.message||'통계 조회 실패 ('+response.status+')');
 return Array.isArray(json?.data)?json.data:[];
}
function csvDownload(rows){
 const cells=[['캠페인 ID','캠페인명','노출 수','클릭 수','CTR (%)','조회 시작일','조회 종료일'],...rows.map(r=>[r.campaignId,r.campaignName,r.impressions,r.clicks,r.ctr,state.start,state.end])];
 const csv='\uFEFF'+cells.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const a=document.createElement('a'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.href=url;a.download='needit-campaign-statistics-'+today()+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function renderRows(){
 const target=document.getElementById('needitStatRows');if(!target)return;
 const rows=state.rows.filter(r=>!state.campaign||String(r.campaignId)===state.campaign);
 const sumI=rows.reduce((a,r)=>a+Number(r.impressions||0),0),sumC=rows.reduce((a,r)=>a+Number(r.clicks||0),0);
 document.getElementById('needitStatImpressions').textContent=number(sumI);
 document.getElementById('needitStatClicks').textContent=number(sumC);
 document.getElementById('needitStatCTR').textContent=(sumI?sumC/sumI*100:0).toFixed(2)+'%';
 const count=document.getElementById('needitStatCampaignCount');if(count)count.textContent=number(rows.length);
 renderCharts(rows);
 target.innerHTML=rows.length?rows.map(r=>`<tr><td>${escapeHTML(r.campaignId)}</td><td>${escapeHTML(r.campaignName)}</td><td>${number(r.impressions)}</td><td>${number(r.clicks)}</td><td>${Number(r.ctr||0).toFixed(2)}%</td></tr>`).join(''):'<tr><td colspan="5" class="admin-empty">해당 조건의 캠페인 통계가 없습니다.</td></tr>';
}
function renderCharts(rows){
 const bar=document.getElementById('needitCampaignChart');
 if(!bar)return;
 if(!rows.length){bar.innerHTML='<div class="needit-chart-empty">표시할 캠페인 데이터가 없습니다.</div>';return;}
 const max=Math.max(1,...rows.map(r=>Number(r.impressions)||0));
 bar.innerHTML=rows.map(r=>{const impressions=Math.max(0,Number(r.impressions)||0),clicks=Math.max(0,Number(r.clicks)||0);
  return `<div class="needit-chart-row"><div class="needit-chart-label" title="${escapeHTML(r.campaignName)}">${escapeHTML(r.campaignName||'캠페인')} <span>#${escapeHTML(r.campaignId)}</span></div><div class="needit-chart-bars"><div class="needit-bar-line"><div class="needit-bar-track"><div class="needit-bar needit-bar-impression" style="width:${Math.min(100,impressions/max*100)}%"></div></div><b>${number(impressions)}</b></div><div class="needit-bar-line"><div class="needit-bar-track"><div class="needit-bar needit-bar-click" style="width:${Math.min(100,clicks/max*100)}%"></div></div><b>${number(clicks)}</b></div></div></div>`;
 }).join('');

}
async function load(){
 const status=document.getElementById('needitStatStatus');if(!status)return;
 const seq=++state.requestSeq;
 if(state.start&&state.end&&state.start>state.end){status.textContent='시작일이 종료일보다 늦을 수 없습니다.';return;}
 status.textContent='실제 광고 통계를 조회하고 있습니다…';
 try{
  const rows=await getStats();
  if(seq!==state.requestSeq||!document.getElementById('needitStatRows'))return;
  state.rows=rows;
  const select=document.getElementById('needitStatCampaign');
  select.innerHTML='<option value="">전체 캠페인</option>'+state.rows.map(r=>`<option value="${escapeHTML(r.campaignId)}">${escapeHTML(r.campaignName||'캠페인')} (#${escapeHTML(r.campaignId)})</option>`).join('');
  if(!state.rows.some(r=>String(r.campaignId)===state.campaign))state.campaign='';select.value=state.campaign;
  status.textContent='서버 통계 조회 완료 · '+state.rows.length+'개 캠페인';renderRows();
 }catch(e){if(seq!==state.requestSeq||!document.getElementById('needitStatRows'))return;status.textContent='통계 조회 실패: '+e.message;state.rows=[];renderRows();}
}
function renderDashboardStats(){
 const root=document.getElementById('adminContent');if(!root)return;
 if(!document.getElementById("needit-ad-dashboard-style"))document.head.insertAdjacentHTML("beforeend",'<style id="needit-ad-dashboard-style">\n.needit-kpi-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important}.needit-chart-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:18px;margin-top:24px}.needit-chart-card{min-width:0;background:#fff;border:1px solid #e1ebe4;border-radius:20px;padding:24px}.needit-chart-heading h3,.needit-table-heading h3{margin:0;font-size:19px;color:#213a2e}.needit-chart-heading p,.needit-table-heading p{margin:7px 0 18px;color:#718478;font-size:13px}.needit-chart-legend{display:flex;gap:15px;margin-bottom:20px;color:#5c7467;font-size:12px}.needit-chart-legend span{display:flex;align-items:center;gap:6px}.needit-chart-legend i{width:10px;height:10px;border-radius:3px;display:inline-block}.needit-legend-impression{background:#207a58}.needit-legend-click{background:#a2cbb3}.needit-chart-row{margin:0 0 20px}.needit-chart-label{font-weight:650;font-size:13px;color:#2b4839;margin-bottom:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.needit-chart-label span{font-weight:400;color:#87998e}.needit-chart-bars{display:grid;gap:6px}.needit-bar-line{display:flex;align-items:center;gap:9px}.needit-bar-line b{min-width:32px;font-size:12px;color:#476756;font-weight:650;text-align:right}.needit-bar-track{flex:1;background:#edf3ef;height:11px;border-radius:7px;overflow:hidden}.needit-bar{height:100%;border-radius:7px;transition:width .4s ease}.needit-bar-impression{background:#207a58}.needit-bar-click{background:#a2cbb3}.needit-ctr-row{margin-bottom:22px}.needit-ctr-label{display:flex;justify-content:space-between;gap:10px;font-size:13px;margin-bottom:10px;color:#496354}.needit-ctr-label span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.needit-ctr-label strong{color:#176443}.needit-ctr-track{height:13px}.needit-bar-ctr{background:linear-gradient(90deg,#65b58a,#16805a)}.needit-chart-empty{color:#8a9b90;padding:35px 0;text-align:center}.needit-table-heading{margin-top:26px}@media(max-width:900px){.needit-chart-grid{grid-template-columns:1fr}.needit-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:480px){.needit-chart-card{padding:16px}.needit-kpi-grid{gap:8px!important}}\n</style>');
 root.innerHTML=`<div class="admin-panel"><div class="admin-section-title"><div><h2>광고 성과 통계</h2><p>MySQL에 저장된 실제 광고 노출·클릭 이벤트 기준</p></div><button class="outline" id="needitStatExport">CSV 다운로드</button></div>
 <div class="aud-actions" style="display:flex;flex-wrap:wrap;gap:12px;margin:20px 0;align-items:end"><label>시작일<br><input type="date" id="needitStatStart" style="height:44px"></label><label>종료일<br><input type="date" id="needitStatEnd" style="height:44px"></label><label>캠페인<br><select id="needitStatCampaign" style="height:44px;min-width:190px"><option value="">전체 캠페인</option></select></label><button class="outline" id="needitStatClear" style="height:44px">전체 기간</button></div>
 <p id="needitStatRealtime" style="color:#16835a">● 실시간 연결 중…</p><p id="needitStatStatus" role="status" style="color:#587264;margin-bottom:18px">통계를 불러오는 중…</p><div class="admin-grid needit-kpi-grid"><div class="metric"><small>노출 수</small><strong id="needitStatImpressions">-</strong></div><div class="metric"><small>클릭 수</small><strong id="needitStatClicks">-</strong></div><div class="metric"><small>CTR</small><strong id="needitStatCTR">-</strong></div><div class="metric"><small>캠페인 수</small><strong id="needitStatCampaignCount">-</strong></div></div>
 <div class="needit-chart-grid"><section class="needit-chart-card"><div class="needit-chart-heading"><h3>캠페인별 광고 성과</h3><p>노출 수와 클릭 수를 비교합니다.</p><div class="needit-chart-legend"><span><i class="needit-legend-impression"></i> 노출</span><span><i class="needit-legend-click"></i> 클릭</span></div></div><div id="needitCampaignChart" aria-label="캠페인별 노출 및 클릭 막대그래프"></div></section></div><div class="needit-table-heading"><h3>캠페인 상세 통계</h3><p>실시간으로 집계된 광고 성과</p></div><div class="admin-table-wrap" style="margin-top:20px"><table class="admin-table"><thead><tr><th>캠페인 ID</th><th>캠페인</th><th>노출 수</th><th>클릭 수</th><th>CTR</th></tr></thead><tbody id="needitStatRows"></tbody></table></div></div>`;
 document.getElementById('needitStatStart').value=state.start;document.getElementById('needitStatEnd').value=state.end;
 const onDateChange=()=>{
  const start=document.getElementById('needitStatStart').value;
  const end=document.getElementById('needitStatEnd').value;
  state.start=start;state.end=end;
  if(Boolean(start)!==Boolean(end)){
   document.getElementById('needitStatStatus').textContent='기간 조회는 시작일과 종료일을 모두 선택해 주세요.';
   return;
  }
  load();
 };
 document.getElementById('needitStatStart').onchange=onDateChange;
 document.getElementById('needitStatEnd').onchange=onDateChange;
 document.getElementById('needitStatClear').onclick=()=>{state.start='';state.end='';state.campaign='';renderDashboardStats()};
 document.getElementById('needitStatCampaign').onchange=e=>{state.campaign=e.target.value;renderRows()};
 document.getElementById('needitStatExport').onclick=()=>csvDownload(state.rows.filter(r=>!state.campaign||String(r.campaignId)===state.campaign));
 load();
}
// Called by the parent Vite STOMP client when the server commits an ad event.
window.NEEDIT_AD_STATS_REALTIME={
 refresh:()=>{if(document.getElementById('needitStatRows'))load()},
 status:(connected)=>{const el=document.getElementById('needitStatRealtime');if(el){el.textContent=connected?'● 실시간 연결됨':'○ 연결 끊김 · 재연결 중';el.style.color=connected?'#16835a':'#98631d'}}
};
// Override the demo-only dashboard with server-backed campaign statistics.
if(typeof renderDashboard==='function')renderDashboard=renderDashboardStats;
})();