/* Server-backed filter analysis; never replaces admin click handlers. */
(()=>{
 'use strict';
 const state={timer:null,requestId:0,page:0,size:10,totalPages:0};
 const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const labels={ACTION:'행동 조건 불일치',FATIGUE:'노출 한도 초과',REGION:'지역 불일치',KEYWORD:'키워드 불일치',CATEGORY:'카테고리 불일치'};
 const label=v=>labels[v]??v;
 const token=()=>sessionStorage.getItem('needit_access_token');
 const get=async path=>{
  const response=await fetch('/api/admin/filter-analysis/'+path,{headers:token()?{Authorization:'Bearer '+token()}: {},cache:'no-store'});
  const json=await response.json().catch(()=>null);
  if(!response.ok)throw new Error(path+' HTTP '+response.status+' '+(json?.message||''));
  return json?.data??json;
 };
 function target(){
  const root=document.getElementById('adminContent');
  if(!root||document.getElementById('adminArea')?.classList.contains('hidden'))return null;
  return [...root.querySelectorAll('.admin-panel')].find(p=>p.querySelector('.ad-auto-summary'))||null;
 }
 function render(summary,reasons,exclusions){
  const panel=target();if(!panel)return;
  const total=summary?.totalEvaluations??summary?.totalCount??summary?.total??0;
  const selected=summary?.selectedCount??summary?.selected??0;
  const excluded=summary?.excludedCount??summary?.excluded??0;
  const summaryEl=panel.querySelector('.ad-auto-summary');
  if(summaryEl)summaryEl.innerHTML=`<span>자동 평가 <b>${Number(total).toLocaleString()}건</b></span><span>선정 <b>${Number(selected).toLocaleString()}건</b></span><span>제외 <b>${Number(excluded).toLocaleString()}건</b></span>`;
  const chips=panel.querySelector('.ad-reason-chips');
  if(chips)chips.innerHTML=(Array.isArray(reasons)?reasons:[]).map(r=>`<span>${escape(label(r.reason??r.reasonType??'-'))} <b>${escape(r.count??0)}</b></span>`).join('')||'<span>제외된 기록이 없습니다.</span>';
  const tbody=panel.querySelector('table tbody');
  const rows=Array.isArray(exclusions)?exclusions:(exclusions?.content||[]);
  if(tbody)tbody.innerHTML=rows.slice(0,state.size).map(r=>`<tr><td>${escape(String(r.createdAt??'-').replace('T',' ').slice(0,19))}</td><td>${escape(r.memberId??'-')}</td><td>${escape(r.campaignId??'-')}</td><td>${r.result==='SELECTED'?'선정':'제외'}</td><td>${escape((r.reasons??r.exclusionReasons??[]).map(x=>label(x.reason??x.detail??x)).join(', ')||'-')}</td></tr>`).join('')||'<tr><td colspan="5" class="admin-empty">자동 평가 기록이 없습니다.</td></tr>';
  state.totalPages=Number(exclusions?.totalPages??(Array.isArray(exclusions)?1:Math.ceil(Number(exclusions?.totalElements??total)/state.size)));
  let pager=panel.querySelector('#filterAnalysisPager');
  if(!pager){pager=document.createElement('div');pager.id='filterAnalysisPager';pager.style.cssText='display:flex;justify-content:flex-end;align-items:center;gap:12px;margin-top:16px';panel.querySelector('table')?.after(pager);}
  pager.innerHTML=`<button class="outline" type="button" data-step="-1" ${state.page===0?'disabled':''}>이전</button><span>${state.page+1} / ${Math.max(1,state.totalPages)} 페이지</span><button class="outline" type="button" data-step="1" ${state.page+1>=state.totalPages?'disabled':''}>다음</button>`;
  pager.onclick=e=>{const b=e.target.closest('button[data-step]');if(!b||b.disabled||state.busy)return;state.page+=Number(b.dataset.step);refresh();};
  let status=panel.querySelector('#needitFilterAnalysisStatus');
  if(!status){status=document.createElement('p');status.id='needitFilterAnalysisStatus';status.style.cssText='font-size:12px;color:#60796c;margin:8px 0';panel.querySelector('.admin-section-title')?.after(status)}
  status.style.color='#60796c';status.textContent='서버 분석 데이터 조회 완료';
 }
 async function refresh(){
  if(!target()||!token()||state.busy)return;
  state.busy=true;
  const id=++state.requestId;
  try{
   const [summary,reasons,exclusions]=await Promise.all([get('summary'),get('reasons'),get('evaluations?size='+state.size+'&page='+state.page)]);
   if(id===state.requestId)render(summary,reasons,exclusions);
  }catch(error){
   if(id!==state.requestId)return;
   const panel=target();if(!panel)return;
   let status=panel.querySelector('#needitFilterAnalysisStatus');
   if(!status){status=document.createElement('p');status.id='needitFilterAnalysisStatus';panel.querySelector('.admin-section-title')?.after(status)}
   status.style.color='#b42318';status.textContent='분석 API 오류: '+error.message;
   console.warn('[NEED IT] 필터 분석 조회 실패',error);
  }finally{state.busy=false;}
 }
 // No wrapping or replacing renderCampaigns: preserve existing admin buttons.
 let lastPanel=null;
 const observer=new MutationObserver(()=>{const panel=target();if(panel!==lastPanel){lastPanel=panel;if(panel){state.page=0;refresh();}}});
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 refresh();
 window.NEEDIT_FILTER_ANALYSIS={refresh,active:()=>!!target(),status:()=>{},changed:()=>{if(target()&&!state.timer)state.timer=setTimeout(()=>{state.timer=null;refresh();},1000);}};
 window.addEventListener('pagehide',()=>{clearTimeout(state.timer);observer.disconnect();});
})();
