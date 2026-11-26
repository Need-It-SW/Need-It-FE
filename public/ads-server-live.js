/* NEED IT: server-backed ads with rotating main banner. */
(()=>{
 'use strict';
 const slots={MAIN_001:'#mainAdSlot',SEARCH_001:'#searchAdSlot',FEED_001:'#feedAdSlot',DETAIL_001:'#detailAdSlot'};
 const cache=new Map(),sent=new Set(),pending=new Map(),indexes=new Map();
 const animating=new Set(), animationTimers=new Map(), rotationTimers=new Map();
 const auth=()=>sessionStorage.getItem('needit_access_token');
 const blocked=()=>!!auth() && (sessionStorage.getItem('needit_admin_demo_session')==='true' || (typeof isAdmin==='function' && isAdmin()));
 const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function api(path,method='GET',body){
  const token=auth();const response=await fetch('/api'+path,{method,cache:'no-store',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const json=await response.json().catch(()=>null);
  if(!response.ok||json?.success===false)throw new Error(json?.message||`광고 API HTTP ${response.status}`);
  return json?.data??json;
 }
 function track(ad,slot,kind){
  if(blocked()||!ad?.impressionId)return;
  const key=`${kind}:${ad.impressionId}`;if(sent.has(key))return;
  sent.add(key);
  api('/ads/'+(kind==='impression'?'impressions':'clicks'),'POST',{campaignId:ad.campaignId,bannerId:ad.bannerId,impressionId:ad.impressionId,placement:slot}).catch(e=>{sent.delete(key);console.warn('[NEED IT] 광고 '+kind+' 기록 실패',e)});
 }
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting&&entry.intersectionRatio>=.5){const ad=entry.target.__needitServerAd;if(ad){track(ad,entry.target.__needitServerSlot,'impression');observer.unobserve(entry.target)}}}},{threshold:[.5]});
 function show(slot,ads){
  if(blocked())return;
  const el=document.querySelector(slots[slot]);if(!el)return;
  if(!ads?.length){el.classList.add('hidden');el.replaceChildren();delete el.dataset.serverImpression;clearInterval(rotationTimers.get(slot));rotationTimers.delete(slot);return;}
  const idx=(indexes.get(slot)||0)%ads.length;
  const ad=ads[idx];
  if(el.dataset.serverBanner===String(ad.bannerId)&&el.dataset.serverCampaign===String(ad.campaignId)&&el.querySelector('[data-server-ad]')){const card=el.querySelector('[data-server-ad]');if(card?.__needitServerAd){card.__needitServerAd=ad;}return;}
  const oldFrame=el.querySelector('[data-server-ad]');
  const oldIndex=Number(el.dataset.currentIndex??-1);
  const isSlide=oldFrame&&oldIndex!==idx&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.classList.remove('hidden');el.style.removeProperty('opacity');el.dataset.serverImpression=ad.impressionId;el.dataset.serverBanner=String(ad.bannerId);el.dataset.serverCampaign=String(ad.campaignId);
  const name=escapeHtml(ad.bannerName||'광고');
  const image=ad.imageUrl?`<div class="needit-ad-art"><div class="needit-ad-art-blur" style="background-image:url('${escapeHtml(ad.imageUrl)}')" aria-hidden="true"></div><div class="needit-ad-art-shade" aria-hidden="true"></div><img class="needit-ad-art-original" src="${escapeHtml(ad.imageUrl)}" alt="${name} 광고"></div>`:`<strong>${name}</strong>`;
  if(slot==='MAIN_001'){
   el.dataset.currentIndex=String(idx);
   const controls=ads.length>1?`<button type="button" class="hero-ad-prev" data-ad-prev aria-label="이전 광고">‹</button><button type="button" class="hero-ad-next" data-ad-next aria-label="다음 광고">›</button><div class="needit-ad-dots" style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:3">${ads.map((_,i)=>`<button type="button" data-ad-index="${i}" aria-label="${i+1}번째 광고" style="width:${i===idx?17:7}px;height:7px;border-radius:8px;border:0;background:${i===idx?'#fff':'#ffffff99'};padding:0;cursor:pointer"></button>`).join('')}</div>`:'';
   el.innerHTML=`<div class="hero-ad-frame" data-server-ad style="position:relative"><div class="hero-ad-creative" style="height:100%;cursor:${ad.targetUrl?'pointer':'default'}">${image}</div><span class="hero-ad-label">광고</span>${controls}${ads.length>1?`<span class="hero-ad-counter">${idx+1} / ${ads.length}</span>`:''}</div>`;
  }else{
   el.dataset.currentIndex=String(idx);
   el.innerHTML=`<div class="ad-compact ad-compact-polished is-visible" data-server-ad style="cursor:${ad.targetUrl?'pointer':'default'};position:relative"><div class="ad-compact-copy"><span class="ad-kicker">SPONSORED · 광고</span><h3>${name}</h3>${ad.targetUrl?'<span class="ad-go">광고 자세히 보기 ↗</span>':''}</div>${ad.imageUrl?`<div class="ad-compact-media"><div class="needit-ad-art"><div class="needit-ad-art-blur" style="background-image:url('${escapeHtml(ad.imageUrl)}')" aria-hidden="true"></div><div class="needit-ad-art-shade" aria-hidden="true"></div><img class="needit-ad-art-original" src="${escapeHtml(ad.imageUrl)}" alt="${name} 광고 이미지"></div></div>`:''}${ads.length>1?'<div style="position:absolute;bottom:8px;right:12px;display:flex;gap:8px;z-index:4"><button type="button" data-ad-prev aria-label="이전 광고" style="border:1px solid #ddd;background:white;border-radius:50%;width:27px;height:27px;cursor:pointer">‹</button><button type="button" data-ad-next aria-label="다음 광고" style="border:1px solid #ddd;background:white;border-radius:50%;width:27px;height:27px;cursor:pointer">›</button></div>':''}</div>`;
  }
  if(isSlide){
   // Slide the previous and next creatives together instead of fading an image swap.
   // Animate on the compositor, retaining a stable banner height.
   clearTimeout(animationTimers.get(slot));
   const nextFrame=el.querySelector('[data-server-ad]');
   const oldLayer=oldFrame.cloneNode(true);
   oldLayer.removeAttribute('data-server-ad');
   oldLayer.querySelectorAll('button').forEach(button=>button.disabled=true);
   const direction=el.dataset.slideDirection==='prev'?-1:1;
   el.style.position='relative';
   el.style.overflow='hidden';
   oldLayer.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;transition:none;opacity:1;transform:translateX(0);will-change:transform';
   nextFrame.style.transition='none';
   nextFrame.style.opacity='1';
   nextFrame.style.transform=`translateX(${direction*100}%)`;
   nextFrame.style.willChange='transform';
   el.appendChild(oldLayer);
   animating.add(slot);
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const transition='transform 680ms cubic-bezier(.22,1,.36,1)';
    oldLayer.style.transition=transition;
    nextFrame.style.transition=transition;
    oldLayer.style.transform=`translateX(${-direction*100}%)`;
    nextFrame.style.transform='translateX(0)';
   }));
   animationTimers.set(slot,setTimeout(()=>{
    oldLayer.remove();nextFrame.style.transform='';nextFrame.style.transition='';nextFrame.style.willChange='';
    animating.delete(slot);
   },740));
  }
  const card=el.querySelector('[data-server-ad]');card.__needitServerAd=ad;card.__needitServerSlot=slot;observer.observe(card);
  if(ad.targetUrl)card.querySelector('.hero-ad-creative, .ad-compact-copy')?.addEventListener('click',()=>{track(ad,slot,'click');try{const u=new URL(ad.targetUrl,location.href);if(['http:','https:'].includes(u.protocol))window.open(u.href,'_blank','noopener,noreferrer')}catch{}});
  if(ads.length>1){
   const change=(step)=>{if(animating.has(slot))return;el.dataset.slideDirection=step<0?'prev':'next';indexes.set(slot,((indexes.get(slot)||0)+step+ads.length)%ads.length);show(slot,ads);restartRotation(slot)};
   el.querySelector('[data-ad-prev]')?.addEventListener('click',e=>{e.stopPropagation();change(-1)});
   el.querySelector('[data-ad-next]')?.addEventListener('click',e=>{e.stopPropagation();change(1)});
   el.querySelectorAll('[data-ad-index]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();if(animating.has(slot))return;el.dataset.slideDirection=Number(b.dataset.adIndex)<(indexes.get(slot)||0)?'prev':'next';indexes.set(slot,Number(b.dataset.adIndex));show(slot,ads);restartRotation(slot)}));
  }
 }
 function restartRotation(slot){
  clearInterval(rotationTimers.get(slot));rotationTimers.delete(slot);
  const ads=cache.get(slot)||[];
  if(ads.length<2)return;
  rotationTimers.set(slot,setInterval(()=>{
   if(blocked()||document.hidden||animating.has(slot))return;
   const currentAds=cache.get(slot)||[];
   const el=document.querySelector(slots[slot]);
   if(currentAds.length<2||!el||!el.isConnected||el.classList.contains('hidden'))return;
   el.dataset.slideDirection='next';
   indexes.set(slot,((indexes.get(slot)||0)+1)%currentAds.length);
   show(slot,currentAds);
  },5000));
 }
 async function refresh(slot){
  if(blocked())return;
  if(!slots[slot]||pending.has(slot))return pending.get(slot);
  const requestToken=auth();
  const job=api('/ads?placement='+encodeURIComponent(slot)).then(data=>{
   if(blocked()||auth()!==requestToken)return;
   const ads=Array.isArray(data)?data:[];
   const previous=cache.get(slot)||[];
   const current=previous[(indexes.get(slot)||0)%Math.max(previous.length,1)];
   const matchingIndex=current?ads.findIndex(a=>a.bannerId===current.bannerId&&a.campaignId===current.campaignId):-1;
   indexes.set(slot,matchingIndex>=0?matchingIndex:0);
   cache.set(slot,ads);show(slot,ads);
   if(slot==='FEED_001'&&!ads.length)console.info('[NEED IT] 요청 목록 광고(FEED_001): 서버가 광고 0개 반환. 캠페인 영역·타깃 조건을 확인하세요.');
   if(!rotationTimers.has(slot))restartRotation(slot);
  }).catch(e=>{console.warn('[NEED IT] '+slot+' 광고 조회 실패',e);show(slot,[])}).finally(()=>pending.delete(slot));
  pending.set(slot,job);return job;
 }
 function paint(slot){if(blocked())return;const el=document.querySelector(slots[slot]);if(!el)return;const ads=cache.get(slot);if(ads)show(slot,ads);else refresh(slot)}
 // The request feed is rebuilt with innerHTML when filters/posts change,
 // so its ad slot is a *new DOM node*. Reapply the server ad after each rebuild.
 let feedPaintQueued=false;
 const feedObserver=new MutationObserver(()=>{
  if(feedPaintQueued)return;
  const el=document.querySelector(slots.FEED_001);
  if(!el||el.querySelector('[data-server-ad]'))return;
  feedPaintQueued=true;
  requestAnimationFrame(()=>{feedPaintQueued=false;paint('FEED_001')});
 });
 const attachFeedObserver=()=>{const feed=document.getElementById('feed');if(feed)feedObserver.observe(feed,{childList:true})};
 const detailObserver=new MutationObserver(()=>{
  const el=document.querySelector(slots.DETAIL_001);
  if(el&&!el.querySelector('[data-server-ad]')&&(cache.get('DETAIL_001')||[]).length)paint('DETAIL_001');
 });
 const attachDetailObserver=()=>{detailObserver.observe(document.body,{childList:true,subtree:true})};
 document.addEventListener('DOMContentLoaded',attachDetailObserver);
 if(document.readyState!=='loading')attachDetailObserver();
 document.addEventListener('DOMContentLoaded',attachFeedObserver);
 if(document.readyState!=='loading')attachFeedObserver();
 window.renderMainAd=()=>{paint('MAIN_001');paint('SEARCH_001');paint('FEED_001')};
 window.renderAdPlacement=slot=>paint(slot);
 window.needitAdObserve=()=>{};window.needitAdClick=()=>{};
 const all=()=>Promise.all(Object.keys(slots).map(refresh));
 let previousToken=auth();setInterval(()=>{const current=auth();if(current!==previousToken){previousToken=current;cache.clear();sent.clear();indexes.clear();rotationTimers.forEach(clearInterval);rotationTimers.clear();all()}},1000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)all()});
 document.addEventListener('DOMContentLoaded',all);if(document.readyState!=='loading')all();
 window.NEEDIT_SERVER_ADS={refresh:all,paint};
 // Refresh server data periodically without resetting the slide clock.
 setInterval(()=>{if(!document.hidden)all()},60000);
})();
