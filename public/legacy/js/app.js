
/* NEED IT: ordered application modules, combined into one script to preserve initialization order. */

const STAGE_SAFETY_KEY='needit_safety_v1';
let stageSafety={reports:[],blocked:[]};
try{const v=JSON.parse(localStorage.getItem(STAGE_SAFETY_KEY)||'{}');stageSafety={reports:Array.isArray(v.reports)?v.reports:[],blocked:Array.isArray(v.blocked)?v.blocked:[]}}catch{}
const categories=[['전체','🗂️'],['전자기기','💻'],['가구','🪑'],['생활용품','🧴'],['도서','📚'],['주방용품','🍳'],['의류','👕'],['취미용품','🎨']];
const posts=[
{id:1,title:'사용하지 않는 모니터 있으신 분 계실까요?',category:'전자기기',body:'집에서 공부할 때 사용할 모니터를 찾고 있어요.\n사용하지 않는 모니터가 있으시면 감사히 나눔받겠습니다.',region:'상암동',time:'2시간 전',state:'open',author:'공부하는이웃'},
{id:2,title:'자바 입문 책 나눔 부탁드립니다',category:'도서',body:'자바를 처음 공부하고 있습니다. 예전에 보셨던 입문서가 있다면 나눔 부탁드려요.',region:'성산동',time:'4시간 전',state:'open',author:'새싹개발자'},
{id:3,title:'작은 책상 필요하신 분 계실까요?',category:'가구',body:'제목 수정 예시를 위한 게시글입니다. 혼자 쓰기 좋은 작은 책상이 필요합니다.',region:'상암동',time:'6시간 전',state:'open',author:'동네친구'},
{id:4,title:'사용하지 않는 전자레인지 찾고 있어요',category:'주방용품',body:'고장 나지 않은 작은 전자레인지가 필요합니다. 가까운 곳이면 직접 가지러 갈 수 있어요.',region:'망원동',time:'어제',state:'open',author:'따뜻한식탁'},
{id:5,title:'아이 겨울 외투를 구하고 있습니다',category:'의류',body:'초등학생 아이가 입을 겨울 외투를 찾습니다. 상태가 괜찮다면 감사히 사용하겠습니다.',region:'연남동',time:'어제',state:'open',author:'햇살맘'},
{id:6,title:'접이식 의자 나눔받았습니다. 감사합니다!',category:'가구',body:'이웃분 덕분에 의자를 구했습니다. 따뜻한 나눔 감사합니다.',region:'상암동',time:'2일 전',state:'done',author:'오늘도웃자'},
{id:7,title:'사용하지 않는 공구함이 있을까요?',category:'생활용품',body:'간단한 집수리를 하려는데 공구함을 나눔받을 수 있을까요?',region:'합정동',time:'3일 전',state:'open',author:'수리왕'},
{id:8,title:'뜨개질 바늘과 실을 찾습니다',category:'취미용품',body:'취미로 뜨개질을 시작해 보려고 합니다. 안 쓰는 도구가 있으시면 연락 부탁드려요.',region:'상암동',time:'4일 전',state:'open',author:'겨울취미'}
];
let activeCategory='전체',activeState='all',visible=6,lastFocus=null;const $=s=>document.querySelector(s);const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notify(msg){const n=$('#toast');n.textContent=msg;n.classList.remove('hidden');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>n.classList.add('hidden'),3200)}
function showModal(title,html){lastFocus=document.activeElement;$('#dialogTitle').textContent=title;$('#dialogBody').innerHTML=html;$('#overlay').classList.remove('hidden');$('#dialogBody').scrollTop=0;document.body.style.overflow='hidden';$('#closeDialog').focus()}
function closeModal(){$('#overlay').classList.add('hidden');document.body.style.overflow='';if(lastFocus)lastFocus.focus()}
$('#closeDialog').addEventListener('click',closeModal);$('#overlay').addEventListener('click',e=>{if(e.target.id==='overlay')closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#overlay').classList.contains('hidden'))closeModal()});
function renderCats(){$('#categoryGrid').innerHTML=categories.map(([name,icon])=>`<button class="category ${activeCategory===name?'active':''}" data-cat="${name}" aria-pressed="${activeCategory===name}"><span class="icon" aria-hidden="true">${icon}</span><span>${name}</span></button>`).join('');document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{activeCategory=b.dataset.cat;visible=6;renderCats();renderFeed();renderAdPlacement('SEARCH_001','#searchAdSlot',activeCategory);$('#feedArea').scrollIntoView({behavior:'smooth',block:'start'})})}
function renderFeed(){const q=$('#searchInput').value.trim().toLowerCase();let list=posts.filter(p=>!stageSafety.blocked.includes(p.author)&&(activeCategory==='전체'||p.category===activeCategory)&&(activeState==='all'||p.state===activeState)&&(!q||[p.title,p.body,p.category,p.region].some(v=>v.toLowerCase().includes(q))));if($('#sortSelect').value==='oldest')list=[...list].reverse();$('#resultCount').textContent=list.length;$('#feed').innerHTML=list.length?list.slice(0,visible).map(p=>`<button class="post" data-post="${p.id}" aria-label="${esc(p.title)}, 상세 보기"><div class="post-top"><span class="tag">${p.category}</span><span class="state ${p.state==='done'?'done':''}">${p.state==='open'?'요청 중':p.state==='closed'?'요청 마감':'나눔 완료'}</span></div><h3>${esc(p.title)}</h3>${p.photos?.length?`<img class="post-thumb" src="${p.photos[0]}" alt="첨부된 요청 물품 참고 사진">`:''}<div class="post-foot"><span>📍 ${esc(p.region)} · ${esc(p.time)} · 👤 ${postViewCount(p.id)}</span><span>자세히 보기 →</span></div></button>`).map((card,i)=>i===Math.min(3,Math.max(0,Math.min(visible,list.length)-1))?card+(activeBanner('FEED_001',activeCategory)?'<div id="feedAdSlot" class="feed-ad-wrap"></div>':''):card).join(''):`<div class="empty"><div class="icon">🔎</div><h3>해당하는 요청 글이 없어요.</h3><p>다른 검색어나 카테고리로 찾아보세요.</p><button class="outline" id="resetBtn">전체 요청 보기</button></div>`;$('#moreBtn').classList.toggle('hidden',list.length<=visible);renderAdPlacement('FEED_001','#feedAdSlot',activeCategory);document.querySelectorAll('[data-post]').forEach(b=>b.onclick=()=>detail(+b.dataset.post));$('#resetBtn')?.addEventListener('click',()=>{activeCategory='전체';activeState='all';visible=6;$('#searchInput').value='';document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x.dataset.state==='all'));renderCats();renderFeed()})}
$('#searchInput').addEventListener('input',()=>{visible=6;renderFeed()});$('#sortSelect').addEventListener('change',renderFeed);document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{activeState=b.dataset.state;visible=6;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));renderFeed()});$('#moreBtn').onclick=()=>{visible+=6;renderFeed()};
function detail(id){const p=posts.find(x=>x.id===id);if(!p)return;showModal(p.title,`<p class="detail-meta"><span class="tag">${p.category}</span> &nbsp; ${esc(p.region)} · ${esc(p.time)} · <button type="button" class="neighbor-name-link" id="detailAuthorProfile">${esc(p.author)}</button> · 👤 조회 ${postViewCount(p.id)}</p><div class="detail-text">${esc(p.body)}</div>${p.photos?.length?`<div class="detail-images">${p.photos.map(src=>`<img src="${src}" alt="요청 물품 참고 사진">`).join('')}</div>`:''}<div id="detailAdSlot" class="detail-ad-wrap hidden"></div><div class="detail-actions">${p.state==='open'?'<button class="primary" id="offerBtn">이 요청에 나눔 제안하기</button>':'<button class="outline" disabled>완료된 나눔이에요</button>'}<button class="outline" id="detailBack">닫기</button></div><p class="help" style="color:var(--muted);font-size:13px">현재 게시글은 화면 시연용 데이터입니다.</p>`);renderAdPlacement('DETAIL_001','#detailAdSlot',p.category);$('#detailBack').onclick=closeModal;$('#detailAuthorProfile')?.addEventListener('click',()=>openNeighborProfile(p.author));$('#offerBtn')?.addEventListener('click',()=>{showModal('나눔 제안하기',`<p class="demo-note">「${esc(p.title)}」 요청에 제안합니다.</p><form id="offerForm"><div class="field"><label for="offerItem">나눔할 물품 설명</label><input id="offerItem" required maxlength="80" placeholder="예: 24인치 모니터, 정상 작동"></div><div class="field"><label for="offerMsg">전달할 메시지</label><textarea id="offerMsg" required placeholder="물품 상태와 전달 가능한 방법을 알려주세요."></textarea></div><p class="demo-note">※ 시연용 화면입니다. 제안은 실제로 전송되지 않아요.</p><div class="form-actions"><button class="outline" type="button" id="cancelOffer">취소</button><button class="primary" type="submit">제안 보내기</button></div></form>`);$('#cancelOffer').onclick=closeModal;$('#offerForm').onsubmit=e=>{e.preventDefault();closeModal();notify('제안 작성 화면 시연이 완료되었어요. 실제로 전송되지는 않았습니다.')}})}
function categoryChoices(selectId, selected){
 const choices=categories.slice(1);
 return `<div class="category-choice-grid" role="radiogroup" aria-label="카테고리 선택">${choices.map(([name,icon],i)=>`<label class="category-choice"><input type="radio" name="${selectId}Choice" value="${esc(name)}" ${selected===name||(!selected&&i===0)?'checked':''}><span class="choice-face"><span class="choice-icon" aria-hidden="true">${icon}</span><span>${esc(name)}</span></span></label>`).join('')}</div><select id="${selectId}" required tabindex="-1" aria-hidden="true" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none">${choices.map(([name])=>`<option value="${esc(name)}" ${selected===name?'selected':''}>${esc(name)}</option>`).join('')}</select>`;
}
function bindCategoryChoices(selectId){
 const select=document.getElementById(selectId);
 document.querySelectorAll(`input[name="${selectId}Choice"]`).forEach(r=>r.addEventListener('change',()=>{if(r.checked)select.value=r.value}));
}
function createDialog(){
  let photos=[];
  showModal('물건 요청하기',`<p class="request-intro">어떤 물건이 필요한지 알려주세요.</p>
  <form id="requestForm">
    <div class="field"><label for="reqTitle">요청 제목 *</label><input id="reqTitle" required maxlength="70" placeholder="예: 사용하지 않는 모니터 있으신가요?"></div>
    <div class="field"><label for="reqCat">카테고리 *</label>${categoryChoices('reqCat')}</div>
    <div class="field"><label for="reqBody">요청 내용 *</label><textarea id="reqBody" required minlength="10" placeholder="어떤 물건이 필요한지 자세히 알려주세요."></textarea></div>
    <div class="field"><label for="reqPhotos">사진 첨부 <span class="optional-label">선택 · 최대 3장</span></label><div class="photo-upload"><label class="photo-pick" for="reqPhotos"><span aria-hidden="true">＋</span> 사진 추가하기</label><input id="reqPhotos" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-describedby="photoStatus"><span class="photo-meta">JPG, PNG, WEBP · 장당 5MB 이하</span></div><div id="photoStatus" class="help" aria-live="polite">첨부된 사진이 없어요.</div><div id="photoPreview" class="photo-preview"></div></div>
    <div class="field"><label for="reqRegion">활동 지역</label><input id="reqRegion" value="${esc($('#regionText').textContent)}" readonly><p class="help">가입 시 설정한 활동 지역이 기본으로 표시됩니다.</p></div>
    <p class="request-disclaimer">시연용 화면으로, 실제 서버에 등록되지 않습니다.</p>
    <div class="form-actions"><button class="outline" type="button" id="cancelReq">취소</button><button class="primary" type="submit">요청 등록하기</button></div>
  </form>`);
  bindCategoryChoices('reqCat');
  const input=$('#reqPhotos'),preview=$('#photoPreview'),status=$('#photoStatus');
  function updatePreview(){preview.innerHTML=photos.map((p,i)=>`<div><img src="${p.data}" alt="선택한 사진 ${i+1}"><button type="button" data-remove="${i}" aria-label="사진 ${i+1} 삭제">× 삭제</button></div>`).join('');status.textContent=`${photos.length} / 3장 첨부됨`;preview.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{photos.splice(+b.dataset.remove,1);input.value='';updatePreview()})}
  input.addEventListener('change',async()=>{const files=Array.from(input.files);input.value='';for(const file of files){if(photos.length>=3){notify('사진은 최대 3장 첨부할 수 있어요.');break}if(!['image/jpeg','image/png','image/webp'].includes(file.type)){notify('JPG, PNG, WEBP 사진만 첨부할 수 있어요.');continue}if(file.size>5*1024*1024){notify('사진 한 장은 5MB 이하여야 해요.');continue}const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)}).catch(()=>null);if(data)photos.push({data})}updatePreview()});
  $('#cancelReq').onclick=closeModal;
  $('#requestForm').onsubmit=e=>{e.preventDefault();const title=$('#reqTitle').value.trim(),body=$('#reqBody').value.trim();if(!title||body.length<10)return notify('제목과 10자 이상의 내용을 입력해 주세요.');posts.unshift({id:Date.now(),title,body,photos:photos.map(p=>p.data),category:$('#reqCat').value,region:$('#regionText').textContent.split(' ').slice(-1)[0],time:'방금 전',state:'open',author:'나(시연)'});try{localStorage.setItem('needit_my_posts_v2',JSON.stringify(posts.filter(p=>p.author==='나(시연)')))}catch{};activeCategory='전체';activeState='all';visible=6;$('#searchInput').value='';$('#sortSelect').value='latest';document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x.dataset.state==='all'));closeModal();renderCats();renderFeed();renderAdPlacement('SEARCH_001','#searchAdSlot',activeCategory);showUser('requests');notify('요청 글이 등록됐어요. 내 요청에서 확인할 수 있어요!')};
}
// Hero CTA click is handled by the role-specific navigation controller below.
let selectedNeighborhood = null;
function regionSearch(){
 selectedNeighborhood=null;
 showModal('우리 동네 인증·변경',`<p class="demo-note">📍 <b>동네 인증 후에만 활동 지역을 변경할 수 있어요.</b><br>먼저 동네를 선택한 다음, 현재 위치로 그 동네에 있는지 확인합니다.</p>
 <div class="field"><label>현재 활동 지역</label><div class="region-picked" id="currentRegion">${esc($('#regionText').textContent)} <span>기존 지역</span></div></div>
 <div class="field"><label>1. 인증할 동네 선택</label><button class="outline" type="button" id="pickNeighborhood" style="width:100%">🔎 주소 검색으로 동네 선택하기</button><p class="help" id="chosenNeighborhood">선택한 동네가 없어요.</p></div>
 <div class="field"><label>2. 현재 위치로 동네 인증</label><button class="primary" type="button" id="verifyNeighborhood" disabled style="width:100%">📍 내 위치 확인하기</button><p class="help" id="verifyMessage" role="status">동네를 선택하면 위치 확인을 시작할 수 있어요.</p></div>
 <div class="region-demo"><strong>화면 설계 미리보기</strong><p>이 HTML에는 위치를 동네로 변환해 대조할 서버가 연결되어 있지 않아요. 아래 버튼은 <b>시연용 인증</b>이며 실제 동네 인증이 아닙니다.</p><button class="outline" type="button" id="demoVerifyNeighborhood" disabled>시연용 인증 완료 후 변경</button></div>
 <div class="form-actions"><button class="outline" id="cancelRegion" type="button">취소</button></div>`);
 $('#cancelRegion').onclick=closeModal;
 $('#pickNeighborhood').onclick=()=>{
  if(!(window.daum && window.daum.Postcode)){notify('주소 검색을 불러올 수 없어요. 인터넷 연결을 확인해 주세요.');return;}
  new window.daum.Postcode({oncomplete(data){
   const name=(data.bname||data.bname1||'').trim();
   if(!name){$('#chosenNeighborhood').textContent='동 정보를 확인할 수 없는 주소예요. 다른 주소를 선택해 주세요.';return;}
   selectedNeighborhood=[data.sido,data.sigungu,name].filter(Boolean).join(' ');
   $('#chosenNeighborhood').textContent='선택한 동네: '+selectedNeighborhood;
   $('#verifyNeighborhood').disabled=false;
   $('#demoVerifyNeighborhood').disabled=false;
   $('#verifyMessage').textContent='현재 위치 확인을 눌러 동네 인증을 진행해 주세요.';
  }}).open();
 };
 $('#verifyNeighborhood').onclick=()=>{
  if(!navigator.geolocation){$('#verifyMessage').textContent='이 브라우저에서는 위치 확인을 지원하지 않아요.';return;}
  $('#verifyMessage').textContent='현재 위치를 확인하고 있어요…';
  navigator.geolocation.getCurrentPosition(pos=>{
   $('#verifyMessage').textContent='✅ 기기 위치를 확인했어요. 다만 선택한 동네와 일치하는지 검증하려면 서버의 좌표→행정동 변환 API가 필요해요. 아직 지역은 변경되지 않았어요.';
  },err=>{
   $('#verifyMessage').textContent=err.code===1?'위치 권한이 거부되었어요. 브라우저에서 위치 권한을 허용해 주세요.':'위치를 확인할 수 없어요. HTTPS 또는 localhost 환경과 위치 설정을 확인해 주세요.';
  },{enableHighAccuracy:true,timeout:12000,maximumAge:0});
 };
 $('#demoVerifyNeighborhood').onclick=()=>{
  if(!selectedNeighborhood)return;
  $('#regionText').textContent=selectedNeighborhood;
  $('#regionStatus').textContent='● 시연용 인증';
  $('#regionStatus').classList.add('demo');
  closeModal();notify('시연용으로 활동 동네를 변경했어요. 실제 인증이나 서버 저장은 되지 않았어요.');
 };
}
$('#regionBtn').onclick=regionSearch;$('#browseBtn').onclick=()=>$('#feedArea').scrollIntoView({behavior:'smooth'});$('#requestsNav').onclick=()=>$('#feedArea').scrollIntoView({behavior:'smooth'});$('#homeNav').onclick=()=>scrollTo({top:0,behavior:'smooth'});
// 독립 실행형 HTML 시연 계정: 서버 인증이 아닌 이 브라우저의 localStorage 기반입니다.
const MEMBER_ACCOUNTS_KEY='needit_member_accounts_v2';
const MEMBER_SESSION_KEY='needit_member_session_v2';
function memberAccounts(){try{const v=JSON.parse(localStorage.getItem(MEMBER_ACCOUNTS_KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}}
function memberSession(){try{return JSON.parse(sessionStorage.getItem(MEMBER_SESSION_KEY)||'null')}catch{return null}}
async function memberHash(password){
 if(!window.crypto?.subtle)throw new Error('이 브라우저 환경에서 안전한 해시 기능을 사용할 수 없어요. localhost 또는 HTTPS에서 열어주세요.');
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password));
 return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
}
function memberRefreshHeader(){
 const me=memberSession(),login=$('#loginBtn'),signup=$('#signupBtn');
 if(!login||!signup)return;
 login.textContent=me?'로그아웃':'로그인';
 signup.textContent=me?(me.nickname+'님'):'회원가입';
 signup.title=me?'현재 로그인한 사용자: '+me.nickname:'';
 signup.disabled=!!me;
 signup.classList.toggle('member-name-label',!!me);
 signup.setAttribute('aria-label',me?'로그인 사용자: '+me.nickname:'회원가입');
}
function memberLogin(){
 showModal('로그인',`<p class="demo-note">NEED IT 회원 계정으로 로그인하세요. <b>이 브라우저에서만 동작하는 시연용 로그인</b>입니다.</p>
 <form id="memberLoginForm" autocomplete="on"><div class="field"><label for="memberLoginId">아이디</label><input id="memberLoginId" autocomplete="username" required placeholder="아이디를 입력하세요"></div>
 <div class="field"><label for="memberLoginPw">비밀번호</label><input id="memberLoginPw" type="password" autocomplete="current-password" required placeholder="비밀번호를 입력하세요"></div>
 <p class="help" id="memberLoginError" role="alert"></p><div class="form-actions"><button type="button" class="outline" id="memberToSignup">회원가입</button><button type="submit" class="primary">로그인</button></div></form>
 <div class="need-auth-admin"><button type="button" class="need-auth-link" id="memberAdminChoice">관리자 로그인 →</button></div>`);
 $('#memberToSignup').onclick=memberSignup;
 $('#memberAdminChoice').onclick=adminLogin;
 $('#memberLoginForm').onsubmit=async e=>{e.preventDefault();const btn=e.submitter||$('#memberLoginForm button[type="submit"]');btn.disabled=true;try{
  const id=$('#memberLoginId').value.trim(),pw=$('#memberLoginPw').value;
  const account=memberAccounts().find(x=>x.id===id);
  if(!account||account.passwordHash!==await memberHash(pw)){ $('#memberLoginError').textContent='아이디 또는 비밀번호가 올바르지 않습니다.';return; }
  sessionStorage.setItem(MEMBER_SESSION_KEY,JSON.stringify({id:account.id,nickname:account.nickname}));
  if(typeof profileData!=='undefined'){profileData.id=account.id;profileData.nickname=account.nickname;if(typeof saveProfile==='function')saveProfile();}
  closeModal();memberRefreshHeader();notify(account.nickname+'님, 환영합니다!');
 }catch(err){$('#memberLoginError').textContent=err.message||'로그인 중 오류가 발생했습니다.'}finally{btn.disabled=false}};
}
function memberSignup(){
 showModal('회원가입',`<p class="demo-note">동네 이웃과 나눔을 시작해 보세요. <b>현재는 시연용으로 이 브라우저에만 계정이 저장됩니다.</b></p>
 <form id="memberSignupForm" autocomplete="on"><div class="field"><label for="memberSignupId">아이디</label><div class="profile-check-row"><input id="memberSignupId" autocomplete="username" minlength="4" maxlength="32" required placeholder="영문·숫자·밑줄 4~32자"><button class="outline" type="button" id="memberIdCheck">중복확인</button></div><small id="memberIdMsg" aria-live="polite">영문·숫자·밑줄만 사용 가능</small></div>
 <div class="field"><label for="memberSignupNick">닉네임</label><div class="profile-check-row"><input id="memberSignupNick" minlength="2" maxlength="20" required placeholder="닉네임 2~20자"><button class="outline" type="button" id="memberNickCheck">중복확인</button></div><small id="memberNickMsg" aria-live="polite"></small></div>
 <div class="field"><label for="memberSignupPw">비밀번호</label><input id="memberSignupPw" type="password" autocomplete="new-password" required placeholder="영문·숫자·특수문자 포함 8자 이상"><small>8자 이상 · 영문, 숫자, 특수문자 각각 포함</small></div>
 <div class="field"><label for="memberSignupPw2">비밀번호 확인</label><input id="memberSignupPw2" type="password" autocomplete="new-password" required placeholder="비밀번호 다시 입력"></div>
 <div class="field"><label for="memberSignupRegion">활동 동네</label><div class="signup-region-row"><input id="memberSignupRegion" maxlength="80" required readonly placeholder="주소 검색으로 활동 동네를 선택하세요"><button type="button" class="outline" id="memberSignupAddressBtn">🔎 주소 검색</button><button type="button" class="outline" id="memberSignupLocationBtn">📍 현재 위치</button></div><small id="memberSignupRegionHelp" aria-live="polite">주소 검색 또는 현재 위치로 활동 동네를 선택하세요. 위치 정보는 동네 확인에만 사용됩니다.</small></div>
 <p class="help" id="memberSignupError" role="alert"></p><div class="form-actions"><button class="outline" type="button" id="memberToLogin">로그인</button><button class="primary" type="submit">가입하기</button></div></form>`);
 let checkedId='',checkedNick='';
 $('#memberToLogin').onclick=memberLogin;
 $('#memberSignupAddressBtn').onclick=()=>{
  if(!(window.daum&&window.daum.Postcode)){notify('주소 검색을 불러올 수 없어요. 인터넷 연결을 확인해 주세요.');return;}
  new window.daum.Postcode({oncomplete(data){
   const district=(data.bname||data.bname1||'').trim();
   const region=[data.sido,data.sigungu,district].filter(Boolean).join(' ').trim();
   if(!region){$('#memberSignupRegionHelp').textContent='동네 정보를 확인할 수 없는 주소예요. 다른 주소를 선택해 주세요.';return;}
   $('#memberSignupRegion').value=region;
   $('#memberSignupRegionHelp').textContent='✓ 선택한 활동 동네: '+region+' · 실제 위치 인증은 별도로 필요합니다.';
   $('#memberSignupRegion').dispatchEvent(new Event('change',{bubbles:true}));
  }}).open();
 };
 $('#memberSignupLocationBtn').onclick=()=>{
  const button=$('#memberSignupLocationBtn'),help=$('#memberSignupRegionHelp');
  if(!navigator.geolocation){help.textContent='이 브라우저는 위치 확인을 지원하지 않아요. 주소 검색을 이용해 주세요.';return;}
  if(!window.isSecureContext){help.textContent='현재 위치 기능은 HTTPS 또는 localhost에서 사용할 수 있어요. 주소 검색을 이용해 주세요.';return;}
  button.disabled=true;button.textContent='위치 확인 중…';
  help.textContent='위치 권한을 허용하면 현재 위치를 동네 이름으로 변환합니다. 좌표는 저장하지 않아요.';
  const finish=()=>{button.disabled=false;button.textContent='📍 현재 위치';};
  navigator.geolocation.getCurrentPosition(async pos=>{
   try{
    help.textContent='현재 위치를 확인했어요. 동네 이름을 찾는 중이에요…';
    const url='https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&addressdetails=1&accept-language=ko&lat='+encodeURIComponent(pos.coords.latitude)+'&lon='+encodeURIComponent(pos.coords.longitude);
    const response=await fetch(url,{headers:{'Accept':'application/json'}});
    if(!response.ok)throw new Error('주소 변환 서비스에 연결할 수 없어요.');
    const result=await response.json(),a=result.address||{};
    const neighborhood=a.suburb||a.quarter||a.neighbourhood||a.village||a.town||a.city_district||a.borough||'';
    const city=a.city||a.county||a.municipality||'';
    const province=a.state||a.province||'';
    const region=[province,city,neighborhood].filter((v,i,arr)=>v&&arr.indexOf(v)===i).join(' ').trim();
    if(!neighborhood||!region)throw new Error('현재 위치의 동네 이름을 찾지 못했어요. 주소 검색으로 선택해 주세요.');
    $('#memberSignupRegion').value=region;
    $('#memberSignupRegion').dispatchEvent(new Event('change',{bubbles:true}));
    help.textContent='✓ 현재 위치 기준 활동 동네: '+region+' · 정확한 행정동 인증은 별도로 필요합니다.';
   }catch(error){help.textContent=(error.message||'동네를 찾지 못했어요.')+' 주소 검색을 이용할 수 있어요.';}
   finally{finish();}
  },err=>{
   help.textContent=err.code===1?'위치 권한이 거부되었어요. 브라우저 설정에서 허용하거나 주소 검색을 이용해 주세요.':err.code===3?'위치 확인 시간이 초과됐어요. 다시 시도하거나 주소 검색을 이용해 주세요.':'위치를 확인하지 못했어요. 주소 검색을 이용해 주세요.';
   finish();
  },{enableHighAccuracy:false,timeout:12000,maximumAge:60000});
 };
 $('#memberSignupId').oninput=()=>{checkedId='';$('#memberIdMsg').textContent='중복확인을 눌러주세요.'};
 $('#memberSignupNick').oninput=()=>{checkedNick='';$('#memberNickMsg').textContent='중복확인을 눌러주세요.'};
 $('#memberIdCheck').onclick=()=>{const v=$('#memberSignupId').value.trim();if(!/^[a-zA-Z0-9_]{4,32}$/.test(v)){$('#memberIdMsg').textContent='영문·숫자·밑줄 4~32자로 입력하세요.';return}if(v.toLowerCase()==='admin'||memberAccounts().some(a=>a.id.toLowerCase()===v.toLowerCase())){$('#memberIdMsg').textContent='이미 사용 중인 아이디입니다.';return}checkedId=v;$('#memberIdMsg').textContent='✓ 사용할 수 있는 아이디입니다.'};
 $('#memberNickCheck').onclick=()=>{const v=$('#memberSignupNick').value.trim();if(v.length<2||v.length>20){$('#memberNickMsg').textContent='닉네임은 2~20자로 입력하세요.';return}if(memberAccounts().some(a=>a.nickname===v)){$('#memberNickMsg').textContent='이미 사용 중인 닉네임입니다.';return}checkedNick=v;$('#memberNickMsg').textContent='✓ 사용할 수 있는 닉네임입니다.'};
 $('#memberSignupForm').onsubmit=async e=>{e.preventDefault();const btn=e.submitter||$('#memberSignupForm button[type="submit"]');btn.disabled=true;try{
  const id=$('#memberSignupId').value.trim(),nickname=$('#memberSignupNick').value.trim(),pw=$('#memberSignupPw').value,pw2=$('#memberSignupPw2').value,region=$('#memberSignupRegion').value.trim();
  if(checkedId!==id||checkedNick!==nickname)throw new Error('아이디와 닉네임 중복확인을 완료해 주세요.');
  if(!/^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])[^\s]{8,}$/.test(pw))throw new Error('비밀번호는 8자 이상이며 영문·숫자·특수문자를 모두 포함해야 합니다.');
  if(pw!==pw2)throw new Error('비밀번호 확인이 일치하지 않습니다.');
  const accounts=memberAccounts();if(accounts.some(a=>a.id.toLowerCase()===id.toLowerCase()||a.nickname===nickname))throw new Error('이미 등록된 아이디 또는 닉네임입니다. 다시 중복확인해 주세요.');
  accounts.push({id,nickname,passwordHash:await memberHash(pw),region,createdAt:new Date().toISOString()});localStorage.setItem(MEMBER_ACCOUNTS_KEY,JSON.stringify(accounts));
  sessionStorage.setItem(MEMBER_SESSION_KEY,JSON.stringify({id,nickname}));
  if(typeof profileData!=='undefined'){profileData.id=id;profileData.nickname=nickname;if(typeof saveProfile==='function')saveProfile();}
  if($('#regionText'))$('#regionText').textContent=region;
  closeModal();memberRefreshHeader();notify('회원가입이 완료되었습니다. 환영합니다!');
 }catch(err){$('#memberSignupError').textContent=err.message||'가입 중 오류가 발생했습니다.'}finally{btn.disabled=false}};
}
$('#loginBtn').onclick=()=>{if(memberSession()){if(confirm('로그아웃하시겠어요?')){sessionStorage.removeItem(MEMBER_SESSION_KEY);memberRefreshHeader();notify('로그아웃했습니다.')}return}memberLogin()};
$('#signupBtn').onclick=()=>{if(memberSession()){if(typeof showUserTab==='function')showUserTab('profile');else notify('내 메뉴에서 내 정보를 선택해 주세요.')}else memberSignup()};
$('#activityNav').onclick=()=>notify('내 활동 화면은 내 메뉴에서 확인하세요.');$('#myNav').onclick=()=>notify('내 메뉴에서 내 정보를 선택해 주세요.');
memberRefreshHeader();
// === 관리자 시연용 UI: 실제 운영에서는 Spring Security ROLE_ADMIN 인증 필수 ===
const ADMIN_DEMO_ID='admin', ADMIN_DEMO_PASSWORD='admin1234';
const ADMIN_KEY='needit_admin_demo_session';
const STORE_CAMPAIGNS='needit_campaigns_v1',STORE_BANNERS='needit_banners_v1',STORE_LOGS='needit_behavior_v1';
const safeLoad=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key));return Array.isArray(v)?v:fallback}catch{return fallback}};
let campaigns=safeLoad(STORE_CAMPAIGNS,[]),banners=safeLoad(STORE_BANNERS,[]),behaviorLogs=safeLoad(STORE_LOGS,[]);
let adminTab='dashboard',adminMode=false,editCampaignId=null,editBannerId=null;
const saveAdmin=()=>{try{localStorage.setItem(STORE_CAMPAIGNS,JSON.stringify(campaigns));localStorage.setItem(STORE_BANNERS,JSON.stringify(banners));localStorage.setItem(STORE_LOGS,JSON.stringify(behaviorLogs.slice(-400)))}catch(e){notify('브라우저 저장 공간이 부족합니다.')}};
let adminSessionFallback=false;
const isAdmin=()=>{try{return sessionStorage.getItem(ADMIN_KEY)==='true'||adminSessionFallback}catch{return adminSessionFallback}};
const setAdminSession=()=>{adminSessionFallback=true;try{sessionStorage.setItem(ADMIN_KEY,'true')}catch{}};
const clearAdminSession=()=>{adminSessionFallback=false;try{sessionStorage.removeItem(ADMIN_KEY)}catch{}};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const today=()=>new Date().toISOString().slice(0,10);
const prettyTime=stamp=>new Date(stamp).toLocaleString('ko-KR');
function collectBehavior(action,detail={}){
 const log={id:uid(),action,keyword:detail.keyword||'',category:detail.category||'',postId:detail.postId||null,region:$('#regionText').textContent,timestamp:new Date().toISOString()};
 behaviorLogs.push(log);behaviorLogs=behaviorLogs.slice(-400);saveAdmin();
 // 실제 서버 연결 시 이곳에서 POST /api/v1/logs 로 비동기 전송하고 Kafka producer로 전달
}
function adminLogin(){showModal('관리자 전용 로그인',`<p class="demo-note">관리자 계정으로 로그인하면 캠페인 관리 화면이 열립니다. 현재는 <b>HTML 시연용 로그인</b>이며 서버 인증이 아닙니다.</p><form id="adminLoginForm"><div class="field"><label for="adminId">관리자 아이디</label><input id="adminId" autocomplete="username" required placeholder="아이디"></div><div class="field"><label for="adminPw">비밀번호</label><input id="adminPw" type="password" autocomplete="current-password" required placeholder="비밀번호"></div><p class="admin-login-note">시연 계정: <b>admin / admin1234</b><br>실제 서비스에서는 백엔드에서 관리자 권한을 검증해야 합니다.</p><div class="form-actions"><button type="button" class="outline" id="cancelAdminLogin">취소</button><button type="submit" class="primary">관리자 로그인</button></div></form>`);
 $('#cancelAdminLogin').onclick=closeModal;
 $('#adminLoginForm').onsubmit=e=>{e.preventDefault();if($('#adminId').value===ADMIN_DEMO_ID&&$('#adminPw').value===ADMIN_DEMO_PASSWORD){setAdminSession();closeModal();showAdmin('dashboard');notify('관리자 시연 계정으로 로그인했습니다.')}else notify('관리자 아이디 또는 비밀번호가 올바르지 않습니다.')};
}
function updateAdminNav(){const ok=isAdmin();$('#adminNav').classList.toggle('hidden',!ok);$('#adminLogout').classList.toggle('hidden',!ok);}
function showAdmin(tab='dashboard'){
 if(!isAdmin())return adminLogin();document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));$('#adminNav').classList.add('active');adminMode=true;adminTab=tab;$('#top').classList.add('hidden');document.querySelector('main').classList.add('hidden');$('#adminArea').classList.remove('hidden');document.querySelectorAll('#adminTabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));updateAdminNav();renderAdmin();window.scrollTo(0,0);
}
function leaveAdmin(){adminMode=false;$('#adminNav').classList.remove('active');document.querySelector('main').classList.remove('hidden');$('#adminArea').classList.add('hidden');window.scrollTo(0,0)}
function badge(status){return `<span class="pill ${status==='중지'?'off':status==='예정'?'wait':''}">${esc(status)}</span>`}
function campaignStatus(c){if(!c.enabled)return '중지';if(c.start>today())return '예정';if(c.end<today())return '종료';return '진행 중'}
function campaignMatch(c,l){const keys=c.keywords.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);return c.enabled&&l.timestamp.slice(0,10)>=c.start&&l.timestamp.slice(0,10)<=c.end&&(c.category==='전체'||c.category===l.category)&&(c.action==='ALL'||c.action===l.action)&&(!keys.length||keys.some(k=>[l.keyword,l.category].join(' ').toLowerCase().includes(k)))}
function renderAdmin(){if(adminTab==='dashboard')renderDashboard();if(adminTab==='campaigns')renderCampaigns();if(adminTab==='banners')renderBanners();if(adminTab==='logs')renderLogs();if(adminTab==='reports')renderReports();updateReportBadge()}
function updateReportBadge(){const el=document.getElementById('reportPendingBadge');if(el){const n=stageSafety.reports.filter(r=>(r.status||'pending')==='pending').length;el.textContent=n?'('+n+')':'';}}
function renderReports(){
 const all=stageSafety.reports.slice().reverse();const filter=window.adminReportFilter||'all';
 const rows=all.filter(r=>filter==='all'||(r.status||'pending')===filter);
 const statusName={pending:'접수',reviewing:'검토 중',resolved:'처리 완료',dismissed:'반려'};
 const box=document.getElementById('adminContent');if(!box)return;
 box.innerHTML=`<div class="admin-panel report-panel"><div class="admin-section-title"><div><h2>신고 관리</h2><p>접수된 게시글 신고를 확인하고 처리합니다.</p></div><span class="report-summary">미처리 ${all.filter(r=>(r.status||'pending')==='pending').length}건 · 전체 ${all.length}건</span></div><div class="admin-notice">시연용 신고 내역입니다. 처리 상태만 이 브라우저에 저장되며 실제 게시글 숨김이나 계정 제한은 수행하지 않습니다.</div><div class="report-toolbar"><label for="reportFilter">처리 상태별 보기</label><select id="reportFilter"><option value="all">전체</option>${Object.entries(statusName).map(([k,v])=>`<option value="${k}" ${filter===k?'selected':''}>${v}</option>`).join('')}</select></div><div class="report-list">${rows.map(r=>{const post=posts.find(p=>String(p.id)===String(r.postId));return `<article class="report-card"><div class="report-card-top"><strong class="report-reason">${esc(r.reason||'사유 없음')}</strong><span class="report-status">${statusName[r.status||'pending']||'접수'}</span></div><h3 class="report-post-title">${esc(post?.title||'삭제되었거나 찾을 수 없는 게시글')}</h3><div class="report-meta">작성자 ${esc(r.author||'알 수 없음')} · ${esc(r.createdAt?new Date(r.createdAt).toLocaleString('ko-KR'):'날짜 없음')} · 신고 ID ${esc(r.id)}</div>${r.detail?`<div class="report-detail">${esc(r.detail)}</div>`:''}<div class="report-card-bottom"><label>처리 상태 <select data-report-status="${esc(r.id)}">${Object.entries(statusName).map(([k,v])=>`<option value="${k}" ${(r.status||'pending')===k?'selected':''}>${v}</option>`).join('')}</select></label><button type="button" class="outline" data-report-view="${esc(r.postId)}" ${post?'':'disabled'}>게시글 확인</button></div></article>`}).join('')||'<p class="admin-empty">해당 상태의 신고가 없습니다.</p>'}</div></div>`;
 document.getElementById('reportFilter').onchange=e=>{window.adminReportFilter=e.target.value;renderReports()};
 box.querySelectorAll('[data-report-status]').forEach(el=>el.onchange=()=>{const r=stageSafety.reports.find(x=>String(x.id)===el.dataset.reportStatus);if(!r)return;r.status=el.value;r.handledAt=new Date().toISOString();saveStageSafety();renderReports();updateReportBadge();notify('신고 처리 상태를 변경했어요.')});
 box.querySelectorAll('[data-report-view]').forEach(el=>el.onclick=()=>{const post=posts.find(x=>String(x.id)===el.dataset.reportView);if(post)detail(post.id)});
}
function renderDashboard(){const matched=behaviorLogs.filter(l=>campaigns.some(c=>campaignMatch(c,l)));const counts={};behaviorLogs.forEach(l=>{if(l.category)counts[l.category]=(counts[l.category]||0)+1});const max=Math.max(1,...Object.values(counts));$('#adminContent').innerHTML=`<div class="admin-notice">현재 수치는 이 브라우저에서 발생한 <b>시연용 행동 로그</b> 기준입니다. Kafka/MySQL 서버 연결 전이며 실제 광고 성과가 아닙니다.</div><div class="admin-grid"><div class="metric"><small>수집 행동 로그</small><strong>${behaviorLogs.length.toLocaleString()}</strong></div><div class="metric"><small>전체 캠페인</small><strong>${campaigns.length}</strong></div><div class="metric"><small>진행 중 캠페인</small><strong>${campaigns.filter(c=>campaignStatus(c)==='진행 중').length}</strong></div><div class="metric"><small>조건 일치 로그</small><strong>${matched.length}</strong></div></div><div class="admin-panel"><div class="admin-section-title"><h2>카테고리별 행동 분석</h2><p>현재 브라우저 기록</p></div>${Object.keys(counts).length?`<div class="admin-bars">${Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="admin-bar"><b>${esc(k)}</b><div class="admin-track"><div class="admin-fill" style="width:${v/max*100}%"></div></div><b>${v}건</b></div>`).join('')}</div>`:'<div class="admin-empty">아직 수집된 행동 로그가 없어요. 서비스 화면에서 검색하거나 게시글을 클릭해 보세요.</div>'}</div><div class="admin-panel"><h2>캠페인별 조건 충족 로그</h2><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>캠페인</th><th>상태</th><th>타깃 카테고리</th><th>매칭 건수</th></tr></thead><tbody>${campaigns.map(c=>`<tr><td>${esc(c.name)}</td><td>${badge(campaignStatus(c))}</td><td>${esc(c.category)}</td><td>${behaviorLogs.filter(l=>campaignMatch(c,l)).length}건</td></tr>`).join('')||'<tr><td colspan="4">등록된 캠페인이 없습니다.</td></tr>'}</tbody></table></div></div>`}
const AD_SLOTS=[['MAIN_001','메인 최상단'],['SEARCH_001','검색창 아래'],['FEED_001','요청 목록 중간'],['DETAIL_001','요청 상세 하단']];
// 이전 시연 데이터의 배너→캠페인 연결을 캠페인→배너 배치 구조로 1회 변환합니다.
function migrateAdAssignments(){let changed=false;campaigns.forEach(c=>{if(!Array.isArray(c.bannerPlacements)){c.bannerPlacements=banners.filter(b=>b.campaignId===c.id).map(b=>({bannerId:b.id,slot:b.slot||'MAIN_001'}));changed=true}});if(changed)saveAdmin()}
function campaignUsesBanner(c,id){return (c.bannerPlacements||[]).some(p=>p.bannerId===id)}
function bannerLocks(id){return campaigns.filter(c=>campaignUsesBanner(c,id)&&c.end>=today())}
function renderCampaigns(){migrateAdAssignments();const q=(window.adminCampaignQuery||'').toLowerCase(),status=window.adminCampaignStatus||'all';const rows=campaigns.filter(c=>(c.name+' '+c.category+' '+c.keywords).toLowerCase().includes(q)&&(status==='all'||campaignStatus(c)===status));$('#adminContent').innerHTML=`<div class="admin-panel"><div class="admin-section-title"><div><h2>캠페인 관리</h2><p>캠페인 기간·타깃 조건·사용할 광고 배너와 노출 영역을 관리합니다.</p></div></div><div class="campaign-controls"><div class="campaign-search"><label for="campaignQuery">캠페인 검색</label><input id="campaignQuery" placeholder="캠페인명 또는 키워드 검색" value="${esc(window.adminCampaignQuery||'')}"></div><div class="campaign-filter"><label for="campaignStatus">진행 상태</label><select id="campaignStatus"><option value="all">전체 상태</option>${['진행 중','예정','중지','종료'].map(v=>`<option value="${v}" ${status===v?'selected':''}>${v}</option>`).join('')}</select></div><button class="primary" id="addCampaign">＋ 캠페인 등록</button></div><div class="admin-table-wrap campaign-table-wrap"><table class="admin-table campaign-table"><thead><tr><th>캠페인 ID / 이름</th><th>카테고리 · 행동</th><th>키워드</th><th>연결 배너 / 영역</th><th>수행 기간</th><th>상태</th><th>조건 일치</th><th>관리</th></tr></thead><tbody>${rows.map(c=>`<tr><td><b>${esc(c.name)}</b><div class="mini">${esc(c.id)}</div></td><td>${esc(c.category)}<div class="mini">${esc(c.action)}</div></td><td>${esc(c.keywords||'전체')}</td><td>${(c.bannerPlacements||[]).map(p=>{const b=banners.find(x=>x.id===p.bannerId);return b?`<div class="mini">${esc(b.name)} · ${esc(AD_SLOTS.find(x=>x[0]===p.slot)?.[1]||p.slot)}</div>`:''}).join('')||'<span class="mini">미지정</span>'}</td><td class="campaign-date"><span>${esc(c.start)}</span><span class="date-separator">~</span><span>${esc(c.end)}</span></td><td>${badge(campaignStatus(c))}</td><td>${behaviorLogs.filter(l=>campaignMatch(c,l)).length}건</td><td class="campaign-actions"><button class="admin-btn" data-edit-c="${esc(c.id)}">수정</button> <button class="admin-btn danger" data-del-c="${esc(c.id)}">삭제</button></td></tr>`).join('')||'<tr><td colspan="8" class="admin-empty">등록된 캠페인이 없습니다.</td></tr>'}</tbody></table></div></div>`;
$('#addCampaign').onclick=()=>campaignDialog();$('#campaignQuery').oninput=e=>{window.adminCampaignQuery=e.target.value;renderCampaigns();$('#campaignQuery').focus();$('#campaignQuery').setSelectionRange(e.target.value.length,e.target.value.length)};$('#campaignStatus').onchange=e=>{window.adminCampaignStatus=e.target.value;renderCampaigns()};document.querySelectorAll('[data-edit-c]').forEach(b=>b.onclick=()=>campaignDialog(b.dataset.editC));document.querySelectorAll('[data-del-c]').forEach(b=>b.onclick=()=>{if(confirm('이 캠페인을 삭제할까요?')){campaigns=campaigns.filter(c=>c.id!==b.dataset.delC);saveAdmin();renderAdmin();renderMainAd()}})}
function campaignDialog(id){migrateAdAssignments();const c=campaigns.find(x=>x.id===id)||{name:'',category:'전체',action:'ALL',keywords:'',start:today(),end:new Date(Date.now()+14*86400000).toISOString().slice(0,10),description:'',enabled:true,bannerPlacements:[]};let placements=(c.bannerPlacements||[]).map(x=>({...x}));const placementRows=()=>placements.map((p,i)=>`<div class="campaign-placement"><select data-placement-banner="${i}" aria-label="배너 선택"><option value="">배너 선택</option>${banners.map(b=>`<option value="${esc(b.id)}" ${p.bannerId===b.id?'selected':''}>${esc(b.name)}</option>`).join('')}</select><select data-placement-slot="${i}" aria-label="노출 영역">${AD_SLOTS.map(([key,name])=>`<option value="${key}" ${p.slot===key?'selected':''}>${name}</option>`).join('')}</select><button type="button" class="admin-btn danger" data-remove-placement="${i}">삭제</button></div>`).join('');showModal(id?'캠페인 수정':'새 캠페인 등록',`<form id="campaignForm"><div class="admin-form-grid"><div class="field full"><label>캠페인 이름 *</label><input id="cName" required maxlength="80" value="${esc(c.name)}" placeholder="예: 가구 관심 사용자 캠페인"></div><div class="field"><label>타깃 카테고리</label><select id="cCategory">${categories.map(x=>`<option ${c.category===x[0]?'selected':''}>${x[0]}</option>`).join('')}</select></div><div class="field"><label>수집 행동 유형</label><select id="cAction">${[['ALL','전체 행동'],['SEARCH','검색'],['CATEGORY_CLICK','카테고리 클릭'],['POST_VIEW','게시글 조회'],['REQUEST_CREATE','요청 등록']].map(([v,t])=>`<option value="${v}" ${c.action===v?'selected':''}>${t}</option>`).join('')}</select></div><div class="field full"><label>타깃 키워드 (쉼표로 구분)</label><input id="cKeywords" value="${esc(c.keywords)}" placeholder="예: 책상, 의자, 소파"><p class="help">키워드를 비우면 카테고리·행동 조건만 적용됩니다.</p></div><div class="field"><label>시작일 *</label><input type="date" id="cStart" required value="${esc(c.start)}"></div><div class="field"><label>종료일 *</label><input type="date" id="cEnd" required value="${esc(c.end)}"></div><div class="field full"><label>캠페인 설명</label><textarea id="cDescription" placeholder="캠페인 목적을 입력하세요">${esc(c.description||'')}</textarea></div><div class="field full"><div class="placement-heading"><label>광고 배너 및 노출 영역</label><button type="button" class="outline" id="addPlacement">＋ 배너 배치 추가</button></div><p class="help">등록된 배너를 선택하세요. 동일한 배너를 여러 캠페인이나 여러 영역에서 재사용할 수 있습니다.</p><div id="campaignPlacements"></div>${banners.length?'':'<p class="help">배너가 없습니다. 먼저 광고 배너 메뉴에서 배너를 등록하세요.</p>'}</div><div class="field full"><label><input id="cEnabled" type="checkbox" ${c.enabled?'checked':''} style="width:auto;min-height:0;margin-right:8px">캠페인 활성화</label></div></div><p class="demo-note" style="margin-top:18px">시연용 데이터입니다. 실제 광고 송출 및 Kafka 연결은 백엔드에서 구현해야 합니다.</p><div class="form-actions"><button type="button" class="outline" id="cancelCampaign">취소</button><button class="primary" type="submit">${id?'변경 저장':'캠페인 등록'}</button></div></form>`);const draw=()=>{const box=$('#campaignPlacements');box.innerHTML=placementRows();box.querySelectorAll('[data-placement-banner]').forEach(el=>el.onchange=()=>placements[+el.dataset.placementBanner].bannerId=el.value);box.querySelectorAll('[data-placement-slot]').forEach(el=>el.onchange=()=>placements[+el.dataset.placementSlot].slot=el.value);box.querySelectorAll('[data-remove-placement]').forEach(el=>el.onclick=()=>{placements.splice(+el.dataset.removePlacement,1);draw()})};draw();$('#addPlacement').onclick=()=>{if(!banners.length)return notify('먼저 광고 배너를 등록해 주세요.');placements.push({bannerId:banners[0].id,slot:'MAIN_001'});draw()};$('#cancelCampaign').onclick=closeModal;$('#campaignForm').onsubmit=e=>{e.preventDefault();if($('#cEnd').value<$('#cStart').value)return notify('종료일은 시작일보다 빠를 수 없습니다.');if(placements.some(p=>!p.bannerId||!banners.some(b=>b.id===p.bannerId)))return notify('연결할 배너를 선택해 주세요.');const pairs=placements.map(p=>p.bannerId+'|'+p.slot);if(new Set(pairs).size!==pairs.length)return notify('같은 배너와 같은 영역이 중복되었습니다.');const obj={id:id||'CMP-'+uid().toUpperCase(),name:$('#cName').value.trim(),category:$('#cCategory').value,action:$('#cAction').value,keywords:$('#cKeywords').value.trim(),start:$('#cStart').value,end:$('#cEnd').value,description:$('#cDescription').value.trim(),enabled:$('#cEnabled').checked,bannerPlacements:placements};if(id)campaigns=campaigns.map(x=>x.id===id?obj:x);else campaigns.unshift(obj);saveAdmin();closeModal();renderAdmin();renderMainAd();notify('캠페인이 저장되었습니다.')}}
function renderBanners(){migrateAdAssignments();$('#adminContent').innerHTML=`<div class="admin-panel"><div class="admin-section-title"><div><h2>광고 배너 관리</h2><p>배너 이미지를 등록하고 관리합니다. 배너의 사용 캠페인과 노출 영역은 캠페인 관리에서 설정하세요.</p></div><button class="primary" id="addBanner">＋ 배너 등록</button></div><div class="admin-notice" style="margin-top:18px">하나의 배너를 여러 캠페인·여러 영역에서 사용할 수 있습니다. 연결된 캠페인의 종료일이 모두 지나야 배너를 삭제할 수 있습니다.</div><div class="admin-table-wrap banner-management-wrap"><table class="admin-table banner-management-table"><thead><tr><th>미리보기</th><th>배너 정보</th><th>사용 캠페인</th><th>사용 영역</th><th>상태</th><th>관리</th></tr></thead><tbody>${banners.map(b=>{const linked=campaigns.filter(c=>campaignUsesBanner(c,b.id));const locks=bannerLocks(b.id);return `<tr><td>${b.image?`<img class="banner-thumb" src="${esc(b.image)}" alt="배너 미리보기">`:'🖼️'}</td><td><b>${esc(b.name)}</b><div class="mini">${esc(b.id)}</div></td><td>${linked.map(c=>`<div class="mini">${esc(c.name)} (${esc(campaignStatus(c))})</div>`).join('')||'연결 없음'}</td><td>${[...new Set(linked.flatMap(c=>(c.bannerPlacements||[]).filter(p=>p.bannerId===b.id).map(p=>AD_SLOTS.find(x=>x[0]===p.slot)?.[1]||p.slot)))].map(esc).join(', ')||'-'}</td><td>${badge(b.enabled?'활성':'중지')}</td><td><button class="admin-btn" data-edit-b="${esc(b.id)}">수정</button> <button class="admin-btn danger" data-del-b="${esc(b.id)}" ${locks.length?'disabled title="캠페인 종료 후 삭제할 수 있습니다"':''}>삭제</button>${locks.length?'<div class="mini">캠페인 종료 후 삭제 가능</div>':''}</td></tr>`}).join('')||'<tr><td colspan="6" class="admin-empty">등록된 배너가 없습니다.</td></tr>'}</tbody></table></div></div>`;$('#addBanner').onclick=()=>bannerDialog();document.querySelectorAll('[data-edit-b]').forEach(b=>b.onclick=()=>bannerDialog(b.dataset.editB));document.querySelectorAll('[data-del-b]').forEach(b=>b.onclick=()=>{const locks=bannerLocks(b.dataset.delB);if(locks.length)return notify('사용 중인 캠페인이 종료된 후 삭제할 수 있습니다.');if(confirm('배너를 삭제할까요?')){banners=banners.filter(x=>x.id!==b.dataset.delB);campaigns.forEach(c=>c.bannerPlacements=(c.bannerPlacements||[]).filter(p=>p.bannerId!==b.dataset.delB));saveAdmin();renderAdmin();renderMainAd()}})}
function bannerDialog(id){const b=banners.find(x=>x.id===id)||{name:'',link:'',image:'',enabled:true};let imageData=b.image;showModal(id?'배너 수정':'새 배너 등록',`<form id="bannerForm"><div class="admin-form-grid"><div class="field full"><label>배너 이름 *</label><input id="bName" required value="${esc(b.name)}" placeholder="예: 가구 나눔 홍보 배너"></div><div class="field full"><label>광고 클릭 이동 주소 (선택)</label><input type="url" id="bLink" value="${esc(b.link||'')}" placeholder="https://example.com"></div><div class="field full"><label>광고 이미지 (JPG/PNG/WEBP, 최대 1MB)</label><input type="file" id="bImage" accept="image/jpeg,image/png,image/webp"><div id="bannerPreview" class="banner-preview">${imageData?`<img src="${esc(imageData)}" alt="배너 이미지 미리보기">`:'<span>이미지를 선택하면 이곳에서 미리 볼 수 있습니다.</span>'}</div></div><div class="field full"><label><input type="checkbox" id="bEnabled" ${b.enabled?'checked':''} style="width:auto;min-height:0;margin-right:8px">배너 활성화</label></div></div><p class="help">캠페인과 노출 영역은 캠페인 관리에서 선택합니다.</p><div class="form-actions"><button type="button" class="outline" id="cancelBanner">취소</button><button class="primary" type="submit">배너 저장</button></div></form>`);$('#cancelBanner').onclick=closeModal;$('#bImage').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>1024*1024){e.target.value='';return notify('JPG/PNG/WEBP 1MB 이하 파일을 선택하세요.')}imageData=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(f)});$('#bannerPreview').innerHTML=`<img src="${imageData}" alt="업로드한 배너 미리보기">`};$('#bannerForm').onsubmit=e=>{e.preventDefault();const link=$('#bLink').value.trim();if(link&&!/^https?:\/\//i.test(link))return notify('http 또는 https 주소만 입력하세요.');const obj={id:id||'BNR-'+uid().toUpperCase(),name:$('#bName').value.trim(),link,image:imageData,enabled:$('#bEnabled').checked};if(id)banners=banners.map(x=>x.id===id?obj:x);else banners.unshift(obj);saveAdmin();closeModal();renderAdmin();renderMainAd();notify('광고 배너가 저장되었습니다.')}}
function renderLogs(){const q=(window.adminLogQuery||'').toLowerCase();const logs=behaviorLogs.filter(l=>(l.keyword+' '+l.category+' '+l.action).toLowerCase().includes(q)).slice().reverse();$('#adminContent').innerHTML=`<div class="admin-panel"><div class="admin-section-title"><div><h2>사용자 행동 로그</h2><p>NEED IT 화면에서 수집한 검색·카테고리·게시글 조회 이벤트</p></div><button class="outline" id="exportLogs">CSV 내보내기</button></div><div class="admin-toolbar"><input id="logQuery" placeholder="키워드, 카테고리, 행동 유형 검색" value="${esc(window.adminLogQuery||'')}"></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>발생 시각</th><th>행동 유형</th><th>검색 키워드</th><th>카테고리</th><th>활동 지역</th><th>매칭 캠페인</th></tr></thead><tbody>${logs.map(l=>`<tr><td>${esc(prettyTime(l.timestamp))}</td><td>${esc(l.action)}</td><td>${esc(l.keyword||'-')}</td><td>${esc(l.category||'-')}</td><td>${esc(l.region)}</td><td>${esc(campaigns.filter(c=>campaignMatch(c,l)).map(c=>c.name).join(', ')||'-')}</td></tr>`).join('')||'<tr><td colspan="6" class="admin-empty">수집된 행동 로그가 없습니다.</td></tr>'}</tbody></table></div></div>`;$('#logQuery').oninput=e=>{window.adminLogQuery=e.target.value;renderLogs();$('#logQuery').focus();$('#logQuery').setSelectionRange(e.target.value.length,e.target.value.length)};$('#exportLogs').onclick=()=>{const cols=['timestamp','action','keyword','category','postId','region'];const csv=[cols.join(','),...logs.map(l=>cols.map(k=>'"'+String(l[k]??'').replace(/"/g,'""')+'"').join(','))].join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='needit-behavior-logs.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}}
function activeBanner(slot,category='전체'){
 migrateAdAssignments();const eligible=[];
 campaigns.filter(c=>campaignStatus(c)==='진행 중').forEach(c=>(c.bannerPlacements||[]).filter(p=>p.slot===slot).forEach(p=>{const b=banners.find(x=>x.id===p.bannerId&&x.enabled);if(b)eligible.push({b,c})}));
 const preferred=eligible.find(({c})=>category!=='전체'&&(c.category===category||c.category==='전체'));
 return (preferred||eligible[0])?.b||null;
}
function renderAdPlacement(slot,selector,category='전체'){
 const el=$(selector);if(!el)return;
 const b=activeBanner(slot,category);
 if(!b){el.classList.add('hidden');el.innerHTML='';return;}
 el.classList.remove('hidden');
 el.innerHTML=`<div class="ad-compact"><div><span class="ad-kicker">광고 · SPONSORED</span><h3>${esc(b.name)}</h3><p>${slot==='SEARCH_001'?'지금 찾는 물건과 함께 살펴볼 만한 동네 정보':slot==='FEED_001'?'우리 동네 나눔에 도움이 되는 추천 정보':'나눔 이후에 도움이 될 수 있는 추천 정보'}</p>${b.link?`<button type="button" class="ad-go">광고 자세히 보기 ↗</button>`:''}</div>${b.image?`<img src="${esc(b.image)}" alt="${esc(b.name)} 광고 이미지">`:''}</div>`;
 el.querySelector('.ad-go')?.addEventListener('click',()=>{window.open(b.link,'_blank','noopener,noreferrer')});
}
function renderMainAd(){
 const slot=$('#mainAdSlot');if(!slot)return;
 migrateAdAssignments();
 const items=[];const seen=new Set();
 campaigns.filter(c=>campaignStatus(c)==='진행 중').forEach(c=>(c.bannerPlacements||[]).filter(p=>p.slot==='MAIN_001').forEach(p=>{
  const b=banners.find(x=>x.id===p.bannerId&&x.enabled);
  if(b&&!seen.has(b.id)){seen.add(b.id);items.push(b)}
 }));
 if(!items.length){slot.classList.add('hidden');slot.innerHTML=''}else{
  slot.classList.remove('hidden');
  let index=Math.min(Number(slot.dataset.slide||0),items.length-1);
  const draw=()=>{
   const b=items[index];slot.dataset.slide=index;
   const content=b.image?`<img class="hero-ad-image" src="${esc(b.image)}" alt="${esc(b.name)} 광고 배너">`:`<div class="hero-ad-fallback"><span>NEED IT · 이웃과 함께하는 나눔</span><strong>${esc(b.name)}</strong><small>우리 동네에서 필요한 물건을 함께 나눠요.</small></div>`;
   slot.innerHTML=`<div class="hero-ad-frame"><div class="hero-ad-creative" ${b.link?'role="link" tabindex="0"':''} aria-label="${esc(b.name)} 광고">${content}</div><span class="hero-ad-label">광고</span>${items.length>1?`<button type="button" class="hero-ad-prev" aria-label="이전 광고">‹</button><button type="button" class="hero-ad-next" aria-label="다음 광고">›</button><span class="hero-ad-counter">${index+1} / ${items.length}</span>`:''}</div>`;
   const go=()=>{if(b.link)window.open(b.link,'_blank','noopener,noreferrer')};
   const creative=slot.querySelector('.hero-ad-creative');creative.style.cursor=b.link?'pointer':'default';
   creative.addEventListener('click',go);creative.addEventListener('keydown',e=>{if(b.link&&(e.key==='Enter'||e.key===' ')){e.preventDefault();go()}});
   slot.querySelector('.hero-ad-prev')?.addEventListener('click',()=>{index=(index-1+items.length)%items.length;draw()});
   slot.querySelector('.hero-ad-next')?.addEventListener('click',()=>{index=(index+1)%items.length;draw()});
  };draw();
 }
 renderAdPlacement('SEARCH_001','#searchAdSlot',activeCategory);
 renderAdPlacement('FEED_001','#feedAdSlot',activeCategory);
}
$('#adminNav').onclick=()=>showAdmin('dashboard');$('#adminBack').onclick=leaveAdmin;$('#adminLogout').onclick=()=>{clearAdminSession();updateAdminNav();leaveAdmin();notify('관리자 로그아웃되었습니다.')};document.querySelectorAll('#adminTabs button').forEach(b=>b.onclick=()=>showAdmin(b.dataset.tab));
// 기존 서비스 화면의 이벤트에 비침투적으로 로그 수집 연결
let searchTimer;$('#searchInput').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{const keyword=$('#searchInput').value.trim();if(keyword)collectBehavior('SEARCH',{keyword,category:activeCategory==='전체'?'':activeCategory})},650)});
$('#categoryGrid').addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(b)collectBehavior('CATEGORY_CLICK',{category:b.dataset.cat})});
$('#feed').addEventListener('click',e=>{const b=e.target.closest('[data-post]');if(b){const p=posts.find(x=>x.id===Number(b.dataset.post));if(p)collectBehavior('POST_VIEW',{keyword:p.title,category:p.category,postId:p.id})}});
$('#heroCreateBtn').addEventListener('click',()=>{if(!document.body.classList.contains('request-mode'))return;const formWait=setInterval(()=>{const form=$('#requestForm');if(form){clearInterval(formWait);form.addEventListener('submit',()=>{if(form.checkValidity())collectBehavior('REQUEST_CREATE',{keyword:$('#reqTitle').value.trim(),category:$('#reqCat').value})})}},25);setTimeout(()=>clearInterval(formWait),1000)});
const POST_VIEWS_KEY='needit_post_views_v1';
let postViews={};
try{const saved=JSON.parse(localStorage.getItem(POST_VIEWS_KEY)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))postViews=saved;}catch{}
renderCats();renderFeed();updateAdminNav();renderMainAd();





// === 사용자 기능: 단일 HTML에서 시연 가능한 로컬 상태 (서버 연동 전) ===
const USER_STORE='needit_user_flow_v2';
const userLoad=()=>{try{return JSON.parse(localStorage.getItem(USER_STORE))||{}}catch{return {}}};
let userData=Object.assign({offers:[],favorites:[],messages:[],notifications:[],adStats:{}},userLoad());
for(const key of ['offers','favorites','messages','notifications'])if(!Array.isArray(userData[key]))userData[key]=[];
if(!userData.adStats||typeof userData.adStats!=='object')userData.adStats={};
const userSave=()=>{try{localStorage.setItem(USER_STORE,JSON.stringify(userData))}catch{notify('저장 공간이 부족합니다.')}};
try{const saved=JSON.parse(localStorage.getItem('needit_my_posts_v2')||'[]');if(Array.isArray(saved))saved.forEach(p=>{if(!posts.some(x=>x.id===p.id))posts.unshift(p)})}catch{}
const PROFILE_STORE='needit_demo_profile_v1';
let profileData={id:'needit_user',nickname:'나(시연)',photo:''};
try{const saved=JSON.parse(localStorage.getItem(PROFILE_STORE)||'{}');if(saved&&typeof saved==='object')profileData={...profileData,...saved}}catch{}
function saveProfile(){try{localStorage.setItem(PROFILE_STORE,JSON.stringify(profileData));return true}catch{notify('저장 공간이 부족해 프로필을 저장하지 못했어요.');return false}}
// 시연용 중복 검사: 현재 브라우저에 등록된 프로필/회원 데이터만 확인합니다.
let checkedProfileId=null,checkedProfileNick=null;
function demoTaken(value,kind){
 const keys=['needit_demo_profile_v1','needit_users','needit_demo_users','needit_accounts'];
 for(const key of keys){try{const raw=JSON.parse(localStorage.getItem(key)||'null');const list=Array.isArray(raw)?raw:Array.isArray(raw?.users)?raw.users:raw&&typeof raw==='object'?[raw]:[];
 for(const row of list){if(!row||typeof row!=='object')continue;const target=kind==='id'?(row.id||row.username):(row.nickname||row.nick);if(target===value&&target!==profileData[kind])return true;}
 }catch{}}
 return false;
}
function checkProfileDuplicate(kind){
 const input=document.getElementById(kind==='id'?'profileId':'profileNick');const feedback=document.getElementById(kind==='id'?'profileIdStatus':'profileNickStatus');if(!input||!feedback)return;
 const value=input.value.trim();const valid=kind==='id'?/^[a-zA-Z0-9_]{4,32}$/.test(value):value.length>=2&&value.length<=20;
 if(!valid){feedback.textContent=kind==='id'?'영문·숫자·밑줄 4~32자로 입력해 주세요.':'닉네임은 2~20자로 입력해 주세요.';feedback.style.color='#c2410c';return}
 if(demoTaken(value,kind)){feedback.textContent='이미 사용 중입니다.';feedback.style.color='#c2410c';return}
 if(kind==='id')checkedProfileId=value;else checkedProfileNick=value;
 feedback.textContent='✓ 사용 가능한 '+(kind==='id'?'아이디':'닉네임')+'입니다.';feedback.style.color='#16835b';
}
function updatePasswordRules(){const pw=document.getElementById('profilePass')?.value||'';const node=document.getElementById('profilePasswordStatus');if(!node)return;
 if(!pw){node.textContent='영문, 숫자, 특수문자 포함 · 8자 이상';node.style.color='';return}
 const tests=[pw.length>=8,/[a-zA-Z]/.test(pw),/[0-9]/.test(pw),/[^a-zA-Z0-9\s]/.test(pw),!(/\s/.test(pw))];
 node.textContent=tests.every(Boolean)?'✓ 비밀번호 조건을 모두 충족했어요.':'필요한 조건: '+['8자 이상','영문','숫자','특수문자','공백 없음'].filter((_,i)=>!tests[i]).join(', ');
 node.style.color=tests.every(Boolean)?'#16835b':'#c2410c';
}
function bindProfileEvents(){
 checkedProfileId=null;checkedProfileNick=null;
 for(const [kind,inputId,statusId] of [['id','profileId','profileIdStatus'],['nickname','profileNick','profileNickStatus']]){
  const input=document.getElementById(inputId);input?.addEventListener('input',()=>{if(kind==='id')checkedProfileId=null;else checkedProfileNick=null;const status=document.getElementById(statusId);if(status){status.textContent='변경했다면 중복확인을 눌러주세요.';status.style.color='';}});
  document.getElementById(kind==='id'?'profileIdCheck':'profileNickCheck')?.addEventListener('click',()=>checkProfileDuplicate(kind==='id'?'id':'nickname'));
 }
 document.getElementById('profilePass')?.addEventListener('input',updatePasswordRules);
 const photo=document.getElementById('profilePhoto');
 photo?.addEventListener('change',()=>{const file=photo.files?.[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2*1024*1024){notify('JPG, PNG, WEBP 이미지(2MB 이하)만 등록할 수 있어요.');photo.value='';return}const reader=new FileReader();reader.onload=()=>{profileData.photo=String(reader.result||'');if(saveProfile())renderUser()};reader.readAsDataURL(file)});
 document.getElementById('profilePhotoRemove')?.addEventListener('click',()=>{profileData.photo='';saveProfile();renderUser()});
 document.getElementById('profileForm')?.addEventListener('submit',async e=>{e.preventDefault();const id=document.getElementById('profileId').value.trim(),nickname=document.getElementById('profileNick').value.trim(),pw=document.getElementById('profilePass').value,pw2=document.getElementById('profilePassCheck').value;
 if(!/^[a-zA-Z0-9_]{4,32}$/.test(id)){notify('아이디는 영문·숫자·밑줄 4~32자로 입력해 주세요.');return}
 if(nickname.length<2||nickname.length>20){notify('닉네임은 2~20자로 입력해 주세요.');return}
 if(id!==profileData.id&&checkedProfileId!==id){notify('아이디 중복확인을 먼저 해주세요.');return}
 if(nickname!==profileData.nickname&&checkedProfileNick!==nickname){notify('닉네임 중복확인을 먼저 해주세요.');return}
 if(pw||pw2){if(!/^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])[^\s]{8,}$/.test(pw)){notify('비밀번호는 8자 이상, 영문·숫자·특수문자를 모두 포함해야 합니다.');return}if(pw!==pw2){notify('새 비밀번호와 확인란이 일치하지 않습니다.');return}if(!window.crypto?.subtle){notify('현재 환경에서는 비밀번호 시연 저장을 지원하지 않아요.');return}const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(pw));profileData.passwordDemoHash=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('')}
 profileData.id=id;profileData.nickname=nickname;if(saveProfile()){
  // 내 정보 수정 결과를 현재 로그인 세션과 계정 목록에도 반영
  const activeMember=memberSession();
  if(activeMember){
    const accounts=memberAccounts();
    const oldId=activeMember.id;
    const account=accounts.find(a=>a.id===oldId);
    if(account){account.id=id;account.nickname=nickname;if(profileData.passwordDemoHash)account.passwordHash=profileData.passwordDemoHash;localStorage.setItem(MEMBER_ACCOUNTS_KEY,JSON.stringify(accounts));}
    sessionStorage.setItem(MEMBER_SESSION_KEY,JSON.stringify({...activeMember,id,nickname}));
  }
  memberRefreshHeader();
  notify('내 정보가 저장되었어요.');renderUser()
}
 });
}
let userTab='requests';
if(!Array.isArray(userData.hiddenSentOfferIds))userData.hiddenSentOfferIds=[];
const ownPost=p=>p.author==='나(시연)';
const statusText=p=>p.state==='done'?'나눔 완료':userData.offers.some(o=>o.postId===p.id&&o.status==='accepted')?'나눔 진행 중':'요청 중';
function leaveUser(){document.querySelector('main').classList.remove('hidden');$('#userArea').classList.add('hidden');$('#adminArea').classList.add('hidden');renderCats();renderFeed();window.scrollTo(0,0)}
function showUser(tab='requests'){
 if(adminMode)leaveAdmin();document.querySelector('main').classList.add('hidden');$('#adminArea').classList.add('hidden');$('#userArea').classList.remove('hidden');userTab=tab;renderUser();window.scrollTo(0,0);
}
$('#userBack').onclick=leaveUser;
$('#activityNav').onclick=()=>showUser('requests');$('#myNav').onclick=()=>showUser('profile');
function chatUnreadCount(offerId){
 if(!Array.isArray(userData.messages))userData.messages=[];
 return userData.messages.filter(m=>m&&!m.mine&&!m.read&&String(m.offerId)===String(offerId)).length;
}
function updateChatUnread(){
 if(!Array.isArray(userData.messages))userData.messages=[];
 if(!Array.isArray(userData.offers))userData.offers=[];
 const accepted=new Set(userData.offers.filter(o=>o&&o.status==='accepted').map(o=>String(o.id)));
 const n=userData.messages.filter(m=>m&&!m.mine&&!m.read&&accepted.has(String(m.offerId))).length;
 const badge=document.getElementById('chatUnread');
 if(badge){badge.textContent=n>99?'99+':String(n);badge.classList.toggle('hidden',n===0);}
 const button=document.getElementById('headerChats');
 if(button)button.setAttribute('aria-label',n?`채팅방 목록, 읽지 않은 메시지 ${n}개`:'채팅방 목록');
}
function simulateIncomingChat(offerId){
 const offer=userData.offers.find(o=>o&&String(o.id)===String(offerId)&&o.status==='accepted');
 if(!offer){notify('수락된 제안에서만 시연 메시지를 받을 수 있어요.');return;}
 userData.messages.push({id:uid(),offerId:offer.id,text:'안녕하세요! 나눔 관련해서 연락드렸어요. 😊',mine:false,read:false,time:new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})});
 userSave();updateChatUnread();renderUser();notify('시연용 새 메시지가 도착했어요.');
}

function addNotice(message,tab='received',offerId=null){if(tab==='received'&&message.includes('완료'))tab='requests';userData.notifications.unshift({id:uid(),message,tab,offerId,time:new Date().toLocaleString('ko-KR'),read:false});userSave();updateChatUnread()}
function offerLabel(o){return ({pending:'대기 중',accepted:'수락됨',rejected:'거절됨',cancelled:'제안 취소됨',accept_cancelled:'수락 취소됨'})[o.status]||'대기 중'}
function requestStage(p){if(p.state==='closed')return '요청 마감';if(p.state==='done')return '나눔 완료';if(userData.offers.some(o=>o.postId===p.id&&o.status==='accepted'))return '나눔 진행 중';if(userData.offers.some(o=>o.postId===p.id&&o.status==='pending'))return '제안 도착';return '요청 중'}
function saveAndRefresh(){persistPosts();userSave();renderFeed();if(typeof renderQuickSearch==='function')renderQuickSearch();if(!$('#userArea').classList.contains('hidden'))renderUser();if(document.body.classList.contains('request-mode')&&$('#userArea').classList.contains('hidden'))document.getElementById('viewRequest')?.click()}
function editRequest(id){
 const p=posts.find(x=>x.id===id);if(!p||!ownPost(p))return;
 if(p.state==='done')return notify('완료된 요청은 수정할 수 없어요.');
 let editPhotos=Array.isArray(p.photos)?[...p.photos]:[];
 showModal('요청 글 수정',`<form id="editRequestForm"><div class="field"><label for="editTitle">요청 제목 *</label><input id="editTitle" required maxlength="70" value="${esc(p.title)}"></div><div class="field"><label for="editCategory">카테고리 *</label>${categoryChoices('editCategory',p.category)}</div><div class="field"><label for="editBody">요청 내용 *</label><textarea id="editBody" minlength="10" required>${esc(p.body)}</textarea></div><div class="field"><label for="editPhotos">사진 첨부 <span class="optional-label">선택 · 최대 3장</span></label><div class="photo-upload"><label class="photo-pick" for="editPhotos"><span aria-hidden="true">＋</span> 사진 추가하기</label><input id="editPhotos" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-describedby="editPhotoStatus"><span class="photo-meta">JPG · PNG · WEBP / 장당 5MB 이하</span></div><div id="editPhotoStatus" class="help" aria-live="polite"></div><div id="editPhotoPreview" class="photo-preview"></div></div><div class="form-actions"><button class="outline" type="button" id="editCancel">취소</button><button class="primary" type="submit">변경 저장</button></div></form>`);
 bindCategoryChoices('editCategory');
 const input=$('#editPhotos'),preview=$('#editPhotoPreview'),status=$('#editPhotoStatus');
 function updateEditPreview(){
  preview.innerHTML=editPhotos.map((src,i)=>`<div><img src="${esc(src)}" alt="첨부 사진 ${i+1}"><button type="button" data-edit-remove="${i}" aria-label="사진 ${i+1} 삭제">× 삭제</button></div>`).join('');
  status.textContent=editPhotos.length?`${editPhotos.length} / 3장 첨부됨`:'';
  preview.querySelectorAll('[data-edit-remove]').forEach(btn=>btn.onclick=()=>{editPhotos.splice(Number(btn.dataset.editRemove),1);updateEditPreview()});
 }
 input.addEventListener('change',async()=>{
  const files=Array.from(input.files||[]);input.value='';
  for(const file of files){
   if(editPhotos.length>=3){notify('사진은 최대 3장 첨부할 수 있어요.');break;}
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)){notify('JPG, PNG, WEBP 사진만 첨부할 수 있어요.');continue;}
   if(file.size>5*1024*1024){notify('사진 한 장은 5MB 이하여야 해요.');continue;}
   const data=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>resolve('');reader.readAsDataURL(file)});
   if(data)editPhotos.push(data);else notify('사진을 읽지 못했어요. 다시 선택해 주세요.');
  }
  updateEditPreview();
 });
 updateEditPreview();
 $('#editCancel').onclick=closeModal;
 $('#editRequestForm').onsubmit=e=>{
  e.preventDefault();const title=$('#editTitle').value.trim(),body=$('#editBody').value.trim();
  if(!title||body.length<10)return notify('제목과 10자 이상의 내용을 입력해 주세요.');
  const old={title:p.title,body:p.body,category:p.category,photos:p.photos};
  p.title=title;p.body=body;p.category=$('#editCategory').value;p.photos=[...editPhotos];
  try{localStorage.setItem('needit_my_posts_v2',JSON.stringify(posts.filter(ownPost)))}catch(err){Object.assign(p,old);notify('저장 공간이 부족해 사진을 저장하지 못했어요. 사진 수나 크기를 줄여 주세요.');return;}
  closeModal();saveAndRefresh();addNotice('요청 글이 수정되었습니다.');notify('수정했어요.');
 };
}
function deleteRequest(id){
 const idx=posts.findIndex(x=>x.id===id&&ownPost(x));if(idx<0)return;
 const p=posts[idx];if(!confirm('「'+p.title+'」 요청 글을 삭제할까요? 관련 제안과 대화도 함께 삭제됩니다.'))return;
 const offerIds=new Set(userData.offers.filter(o=>o.postId===id).map(o=>o.id));
 userData.offers=userData.offers.filter(o=>o.postId!==id);userData.messages=userData.messages.filter(m=>!offerIds.has(m.offerId));userData.favorites=userData.favorites.filter(x=>x!==id);
 posts.splice(idx,1);delete postViews[String(id)];try{localStorage.setItem(POST_VIEWS_KEY,JSON.stringify(postViews))}catch{}closeModal();saveAndRefresh();notify('요청 글을 삭제했어요.');
}
function finishRequest(id){
 const p=posts.find(x=>x.id===id&&ownPost(x));if(!p||p.state==='done')return;
 if(!userData.offers.some(o=>o.postId===id&&o.status==='accepted'))return notify('제안을 먼저 수락한 후 나눔을 완료할 수 있어요.');
 showModal('나눔 완료 및 후기',`<div class="review-finish"><p class="demo-note">「${esc(p.title)}」 물건을 실제로 받으셨나요? <b>요청자만</b> 나눔을 완료할 수 있어요.</p><p class="review-title">나눔은 어떠셨나요? <span class="optional-label">선택</span></p><div class="review-options" role="group" aria-label="나눔 만족도"><label><input type="radio" name="reviewRating" value="good"><span>😊 좋아요</span></label><label><input type="radio" name="reviewRating" value="normal"><span>😐 보통이에요</span></label><label><input type="radio" name="reviewRating" value="bad"><span>🙁 아쉬워요</span></label></div><div class="field"><label for="reviewText">한 줄 후기 <span class="optional-label">선택</span></label><textarea id="reviewText" maxlength="200" placeholder="나눔해 주신 이웃에게 감사의 마음을 전해 보세요."></textarea><small>최대 200자 · 작성하지 않아도 완료할 수 있어요.</small></div><div class="form-actions"><button type="button" class="outline" id="reviewCancel">취소</button><button type="button" class="primary" id="reviewConfirm">물건 받았어요 · 완료</button></div></div>`);
 document.getElementById('reviewCancel').onclick=closeModal;
 document.getElementById('reviewConfirm').onclick=()=>{
  if(p.state==='done')return notify('이미 완료된 나눔이에요.');
  const rating=document.querySelector('input[name="reviewRating"]:checked')?.value||'';
  const reviewText=document.getElementById('reviewText').value.trim();
  p.state='done';
  if(rating||reviewText)p.review={rating,text:reviewText,createdAt:new Date().toISOString()};
  persistPosts();addNotice('「'+p.title+'」 나눔이 완료되었습니다.','requests');collectBehavior('SHARE_COMPLETE',{category:p.category,postId:p.id});closeModal();saveAndRefresh();notify('나눔이 완료됐어요.');
 };
}
function userCard(p,extra=''){
 const review=p.state==='done'&&p.review&&(p.review.rating||p.review.text)?`<div class="request-review-line"><span>후기 · ${({good:'😊 좋아요',normal:'😐 보통이에요',bad:'🙁 아쉬워요'})[p.review.rating]||'작성됨'}</span>${p.review.text?`<span class="request-review-text">${esc(p.review.text)}</span>`:''}</div>`:'';
 return `<article class="user-card request-compact-card"><div class="user-heading"><button type="button" class="request-title-link" data-open-post="${p.id}" aria-label="${esc(p.title)} 게시글 상세 보기">${esc(p.title)} <span aria-hidden="true">›</span></button><span class="mini-tag">${requestStage(p)}</span></div><p class="request-meta">📍 ${esc(p.region)} · ${esc(p.category)} · ${esc(p.time)} · 👤 ${postViewCount(p.id)}</p>${extra}${review}<div class="user-card-actions request-secondary-actions">${ownPost(p)&&p.state==='open'?`<button class="request-text-action" data-edit-post="${p.id}">수정</button><button class="request-text-action" data-close-post="${p.id}">요청 마감</button>`:ownPost(p)&&p.state==='closed'?`<button class="request-text-action" data-reopen-post="${p.id}">요청 재개</button>`:''}${ownPost(p)?`<button class="request-text-action request-delete-action" data-delete-post="${p.id}">삭제</button>`:''}</div></article>`
}

function saveStageSafety(){try{localStorage.setItem(STAGE_SAFETY_KEY,JSON.stringify(stageSafety))}catch{notify('신고 정보를 저장하지 못했어요.')}}
function closeRequest(id){const p=posts.find(x=>String(x.id)===String(id));if(!p||!ownPost(p)||p.state!=='open')return;if(userData.offers.some(o=>String(o.postId)===String(id)&&o.status==='accepted'))return notify('진행 중인 나눔은 먼저 수락 취소해야 마감할 수 있어요.');if(!confirm('이 요청을 마감할까요? 새로운 제안을 받을 수 없어요.'))return;p.state='closed';persistPosts();saveAndRefresh();notify('요청을 마감했어요.')}
function reopenRequest(id){const p=posts.find(x=>String(x.id)===String(id));if(!p||!ownPost(p)||p.state!=='closed')return;p.state='open';persistPosts();saveAndRefresh();notify('요청을 다시 열었어요.')}
function openSafetyDialog(p){showModal('게시글 신고',`<p class="demo-note">이 게시글에 문제가 있다면 신고 사유를 선택해 주세요.</p><form id="stageReportForm"><div class="field"><label for="stageReportReason">신고 사유</label><select id="stageReportReason" required><option value="허위 게시글">허위 게시글</option><option value="부적절한 언행">부적절한 언행</option><option value="광고·도배">광고·도배</option><option value="기타">기타</option></select></div><div class="field"><label for="stageReportDetail">상세 내용 (선택)</label><textarea id="stageReportDetail" maxlength="300" placeholder="상황을 간단히 알려주세요."></textarea></div><div class="form-actions"><button class="primary" type="submit">신고 접수</button><button type="button" class="outline" id="stageReportClose">닫기</button></div></form>`);$('#stageReportForm').onsubmit=e=>{e.preventDefault();stageSafety.reports.unshift({id:uid(),postId:p.id,author:p.author,reason:$('#stageReportReason').value,detail:$('#stageReportDetail').value.trim(),createdAt:new Date().toISOString()});saveStageSafety();updateReportBadge();closeModal();notify('신고가 시연용으로 접수됐어요.')};$('#stageReportClose').onclick=closeModal}
function stageResizePhoto(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error('사진을 읽을 수 없어요.'));reader.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error('사진 형식을 확인해 주세요.'));img.onload=()=>{const scale=Math.min(1,900/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',0.72))};img.src=reader.result};reader.readAsDataURL(file)})}
let sentFilter='active';
function renderUser(){
 const tabs={requests:'내가 요청한 물건',received:'받은 나눔 제안',sent:'내가 제안한 나눔',favorites:'관심 글',profile:'마이페이지',notifications:'알림',chats:'채팅'};
 $('#userTitle').textContent=tabs[userTab]||'내 요청';
 $('#userSubtitle').textContent=({requests:'내가 요청한 물건의 진행 상태를 확인하고 관리하세요.',received:'도착한 제안을 확인하고 수락하거나 거절하세요.',sent:'내가 제안한 나눔의 진행 상태를 확인하세요.',favorites:'관심 있는 요청을 모아보세요.',profile:'내 정보를 확인하고 관리하세요.',chats:'이웃과 나눈 대화를 확인하세요.'})[userTab]||'';
 const empty=t=>`<div class="user-empty">${t}</div>`;let html='';
 if(userTab==='requests'){
  const arr=posts.filter(ownPost);
  html=arr.length?arr.map(p=>{
   const steps=['요청 중','제안 도착','나눔 진행 중','나눔 완료'];
   const current=Math.max(0,steps.indexOf(requestStage(p)));
   const received=userData.offers.filter(o=>String(o.postId)===String(p.id));
   const accepted=received.some(o=>o.status==='accepted');
   return userCard(p,`<div class="request-progress" aria-label="진행 상태: ${esc(steps[current])}"><div class="request-progress-track">${steps.map((step,i)=>`<span class="${i<=current?'filled':''}${i===current?' active':''}" title="${step}"></span>`).join('')}</div><div class="request-progress-label"><span>${esc(steps[current])}</span><span>${current+1}/4 단계</span></div></div><div class="request-main-actions"><button class="request-offers-link" data-user-tab="received">받은 제안 ${received.length}건 <span aria-hidden="true">›</span></button>${p.state!=='done'&&accepted?`<button class="primary request-complete-btn" data-done="${p.id}">물건 받았어요 · 나눔 완료</button>`:''}</div>`);
  }).join(''):empty('아직 작성한 요청이 없어요. 물건 요청하기에서 글을 작성해 보세요.');
 }
 if(userTab==='received'||userTab==='sent'){
  const sentHistory=['cancelled','rejected','accept_cancelled'];
  if(userTab==='sent'){
   html=`<div class="sent-view-tabs" role="tablist" aria-label="제안 내역 분류"><button type="button" role="tab" data-sent-filter="active" aria-selected="${sentFilter==='active'}" class="${sentFilter==='active'?'selected':''}">진행 중</button><button type="button" role="tab" data-sent-filter="history" aria-selected="${sentFilter==='history'}" class="${sentFilter==='history'?'selected':''}">지난 내역</button></div>`;
  }
  const arr=userData.offers.filter(o=>userTab==='received'?posts.some(p=>String(p.id)===String(o.postId)&&ownPost(p)):(o.mine&&!userData.hiddenSentOfferIds.some(id=>String(id)===String(o.id))&&(sentFilter==='history'?(sentHistory.includes(o.status)||posts.some(p=>String(p.id)===String(o.postId)&&p.state==='done')):(!sentHistory.includes(o.status)&&!posts.some(p=>String(p.id)===String(o.postId)&&p.state==='done')))));
  html+=arr.length?arr.map(o=>{const p=posts.find(x=>String(x.id)===String(o.postId));if(!p)return '';const acceptedOther=userData.offers.some(x=>x.postId===o.postId&&x.id!==o.id&&x.status==='accepted');return `<div class="user-card"><span class="mini-tag">${offerLabel(o)}</span><h3><button type="button" class="offer-title-link" data-open-post="${p.id}" aria-label="${esc(p.title)} 게시글 상세 보기">${esc(p.title)} <span aria-hidden="true">›</span></button></h3><p><b>${esc(o.item)}</b> · ${esc(o.message)}</p>${o.photos?.length?`<div class="stage-offer-images">${o.photos.map(src=>`<img src="${src}" alt="제안 물품 사진">`).join('')}</div>`:''}<p>제안자: <button type="button" class="neighbor-name-link" data-neighbor-name="${esc(o.sender)}" data-neighbor-offer="${esc(String(o.id))}">${esc(o.sender)}</button></p><div class="user-card-actions">${userTab==='received'&&o.status==='pending'&&p.state==='open'&&!acceptedOther?`<button class="primary" data-accept="${o.id}">수락</button><button class="outline" data-reject="${o.id}">거절</button>`:''}${userTab==='received'&&o.status==='pending'&&acceptedOther?'<span class="help">다른 제안이 수락되어 대기 중입니다.</span>':''}${o.status==='accepted'?`<button class="outline" data-chat="${o.id}">대화하기</button>${userTab==='received'&&p.state!=='done'?`<button class="outline" data-undo-accept="${o.id}">수락 취소</button>`:''}`:''}${o.status==='accept_cancelled'?`<p class="help">취소 사유: ${esc(o.cancelReason||'기타')}</p>`:''}${userTab==='sent'&&o.status==='pending'?`<button class="outline" data-cancel-offer="${o.id}">제안 취소</button>`:''}${userTab==='sent'&&['cancelled','rejected','accept_cancelled'].includes(o.status)?`<button class="outline" data-hide-sent="${o.id}">목록에서 삭제</button>`:''}</div></div>`}).join(''):empty(userTab==='received'?'아직 받은 제안이 없어요.':sentFilter==='history'?'지난 제안 내역이 없어요.':'현재 진행 중인 제안이 없어요.');
  if(userTab==='received'){const eligible=posts.filter(p=>ownPost(p)&&p.state==='open'&&!userData.offers.some(o=>String(o.postId)===String(p.id)&&o.status==='accepted'));if(eligible.length)html+=`<div class="demo-offer-panel"><label for="demoOfferPost">시연할 요청 글</label><select id="demoOfferPost">${eligible.map(p=>`<option value="${esc(String(p.id))}">${esc(p.title)}</option>`).join('')}</select><button type="button" class="outline" id="demoOffer">＋ 시연용 제안 도착시키기</button><p class="help">선택한 내 요청에 테스트용 나눔 제안이 도착합니다.</p></div>`;}
 }
 if(userTab==='chats'){
  const arr=userData.offers.filter(o=>o&&o.status==='accepted'&&posts.some(p=>String(p.id)===String(o.postId)));
  const lastFor=o=>userData.messages.filter(m=>m&&String(m.offerId)===String(o.id)).slice(-1)[0];
  const sorted=arr.slice().sort((a,b)=>{
   const am=lastFor(a),bm=lastFor(b);
   return (bm?userData.messages.indexOf(bm):-1)-(am?userData.messages.indexOf(am):-1);
  });
  html=sorted.length?`<div class="need-chat-compact-list">${sorted.map(o=>{
   const p=posts.find(x=>String(x.id)===String(o.postId));
   const unread=chatUnreadCount(o.id);
   const lastMessage=lastFor(o);
   const preview=lastMessage?(lastMessage.image?'📷 사진':lastMessage.text||'메시지'):'대화를 시작해 보세요.';
   const name=o.sender||'이웃';
   const time=lastMessage?.time||'';
   return `<div class="need-chat-compact-row"><button type="button" class="need-chat-main" data-chat="${esc(String(o.id))}" aria-label="${esc(name)}님과 대화 열기"><span class="need-chat-person-avatar" aria-hidden="true">${esc(name.slice(0,1))}</span><span class="need-chat-person-body"><span class="need-chat-person-top"><strong>${esc(name)}</strong><span class="need-chat-status">${p.state==='done'?'나눔 완료':'나눔 진행 중'}</span></span><span class="need-chat-person-preview">${esc(preview)}</span></span><span class="need-chat-side"><span class="need-chat-time">${esc(time)}</span>${unread?`<span class="need-chat-unread" aria-label="읽지 않은 메시지 ${unread}개">${unread>99?'99+':unread}</span>`:''}</span></button><button type="button" class="need-chat-demo-compact" data-demo-chat="${esc(String(o.id))}" title="시연용 메시지 받기">시연 메시지</button></div>`;
  }).join('')}</div>`:empty('아직 채팅방이 없어요. 제안을 수락하면 여기서 대화할 수 있어요.');
 }
 if(userTab==='favorites'){const arr=posts.filter(p=>userData.favorites.includes(p.id));html=arr.length?arr.map(p=>userCard(p,`<button class="favorite-toggle saved" data-favorite="${p.id}">♥ 관심 해제</button>`)).join(''):empty('관심 등록한 글이 없어요.');}
 if(userTab==='notifications'){html=userData.notifications.length?userData.notifications.map(x=>`<div class="user-card"><span class="mini-tag">${x.read?'확인함':'새 알림'}</span><p>${esc(x.message)}</p><small>${esc(x.time)}</small></div>`).join(''):empty('아직 알림이 없어요.');html+=`<button class="outline" id="readAll">모든 알림 읽음 처리</button>`;}
 if(userTab==='profile')html=`<div class="need-profile">
 <div class="need-profile-top"><div class="need-avatar" id="profileAvatar">${profileData.photo?`<img src="${profileData.photo}" alt="프로필 사진">`:'<span>👤</span>'}</div><div><h3>${esc(profileData.nickname)}</h3><p>내 계정 정보를 관리하세요</p><label class="need-photo-btn" for="profilePhoto">사진 변경</label><input id="profilePhoto" type="file" accept="image/png,image/jpeg,image/webp" hidden><button class="need-photo-remove" id="profilePhotoRemove" type="button">사진 삭제</button></div></div>
 <form id="profileForm" autocomplete="off"><h3 class="need-profile-section">기본 정보</h3><div class="need-profile-grid"><div class="field"><label for="profileId">아이디</label><div class="profile-check-row"><input id="profileId" maxlength="32" value="${esc(profileData.id)}" required autocomplete="username"><button type="button" class="outline" id="profileIdCheck">중복확인</button></div><small>영문, 숫자, 밑줄 4~32자</small><small id="profileIdStatus" aria-live="polite"></small></div><div class="field"><label for="profileNick">닉네임</label><div class="profile-check-row"><input id="profileNick" maxlength="20" value="${esc(profileData.nickname)}" required><button type="button" class="outline" id="profileNickCheck">중복확인</button></div><small id="profileNickStatus" aria-live="polite"></small></div></div>
 <h3 class="need-profile-section">비밀번호 변경</h3><div class="need-profile-grid"><div class="field"><label for="profilePass">새 비밀번호</label><input id="profilePass" type="password" minlength="8" autocomplete="new-password" placeholder="변경할 때만 입력"><small id="profilePasswordStatus" aria-live="polite">영문, 숫자, 특수문자 포함 · 8자 이상</small></div><div class="field"><label for="profilePassCheck">새 비밀번호 확인</label><input id="profilePassCheck" type="password" autocomplete="new-password" placeholder="비밀번호 다시 입력"></div></div>
 <h3 class="need-profile-section">활동 지역</h3><div class="need-region-line"><div><strong>${esc($('#regionText').textContent)}</strong><small>${esc($('#regionStatus').textContent)}</small></div><button class="outline" type="button" id="profileRegion">동네 인증·변경</button></div>
 <div class="need-profile-bottom"><span>시연용 정보이며 실제 계정 인증에는 사용되지 않습니다.</span><button class="primary" type="submit">변경사항 저장</button></div></form></div>`;
 $('#userContent').innerHTML=html;
 const bind=(selector,fn)=>$('#userContent').querySelectorAll(selector).forEach(b=>b.addEventListener('click',e=>{e.preventDefault();try{fn(b)}catch(err){console.error('NEED IT 버튼 오류:',err);notify('오류: '+(err?.message||String(err)))}}));
 bind('[data-sent-filter]',b=>{sentFilter=b.dataset.sentFilter;renderUser()});bind('[data-user-tab]',b=>{userTab=b.dataset.userTab;renderUser()});bind('[data-open-post]',b=>detail(+b.dataset.openPost));bind('[data-edit-post]',b=>editRequest(+b.dataset.editPost));bind('[data-close-post]',b=>closeRequest(+b.dataset.closePost));bind('[data-reopen-post]',b=>reopenRequest(+b.dataset.reopenPost));bind('[data-delete-post]',b=>deleteRequest(+b.dataset.deletePost));bind('[data-favorite]',b=>{toggleFavorite(+b.dataset.favorite);renderUser()});bind('[data-accept]',b=>changeOffer(b.dataset.accept,'accepted'));bind('[data-reject]',b=>changeOffer(b.dataset.reject,'rejected'));bind('[data-cancel-offer]',b=>changeOffer(b.dataset.cancelOffer,'cancelled'));bind('[data-hide-sent]',b=>hideSentOffer(b.dataset.hideSent));bind('[data-undo-accept]',b=>undoAcceptedOffer(b.dataset.undoAccept));bind('[data-chat]',b=>openChat(b.dataset.chat));bind('[data-neighbor-name]',b=>openNeighborProfile(b.dataset.neighborName,b.dataset.neighborOffer));bind('[data-demo-chat]',b=>simulateIncomingChat(b.dataset.demoChat));bind('[data-done]',b=>finishRequest(+b.dataset.done));
 $('#demoOffer')?.addEventListener('click',()=>{
  const selectedId=$('#demoOfferPost')?.value;
  const p=posts.find(x=>ownPost(x)&&String(x.id)===String(selectedId));
  if(!p)return notify('제안을 받을 요청 글을 먼저 선택해 주세요.');
  if(p.state!=='open')return notify('진행 중인 요청에만 제안을 보낼 수 있어요.');
  if(userData.offers.some(o=>String(o.postId)===String(p.id)&&o.status==='accepted'))return notify('이미 수락된 제안이 있어요.');
  const offer={id:uid(),postId:p.id,item:'상태 좋은 '+p.category+' 물품',message:'나눔할 수 있어요. 편하신 시간 알려주세요!',sender:'이웃나눔왕',mine:false,status:'pending'};
  userData.offers.unshift(offer);
  addNotice('「'+p.title+'」에 제안이 도착했습니다.','received',offer.id);
  userSave();renderUser();notify('시연용 제안이 도착했어요. 아래에서 확인하세요.');
});
 $('#readAll')?.addEventListener('click',()=>{userData.notifications.forEach(x=>x.read=true);userSave();renderUser()});$('#profileRegion')?.addEventListener('click',regionSearch);if(userTab==='profile')bindProfileEvents();
}
function persistPosts(){try{localStorage.setItem('needit_my_posts_v2',JSON.stringify(posts.filter(ownPost)))}catch{}}
function toggleFavorite(id){const i=userData.favorites.indexOf(id);if(i<0)userData.favorites.push(id);else userData.favorites.splice(i,1);userSave();notify(i<0?'관심 글에 저장했어요.':'관심 글에서 해제했어요.')}
function hideSentOffer(id){
 const o=userData.offers.find(x=>String(x.id)===String(id));
 if(!o||!o.mine)return;
 if(!['cancelled','rejected','accept_cancelled'].includes(o.status))return notify('진행 중인 제안은 먼저 취소해야 해요. 수락된 제안은 임의로 삭제할 수 없어요.');
 if(!confirm('이 제안을 내 목록에서 삭제할까요? 시연용 목록에서만 숨겨지며 제안 기록은 유지됩니다.'))return;
 if(!Array.isArray(userData.hiddenSentOfferIds))userData.hiddenSentOfferIds=[];
 if(!userData.hiddenSentOfferIds.some(x=>String(x)===String(id)))userData.hiddenSentOfferIds.push(String(id));
 userSave();renderUser();notify('목록에서 삭제했어요.');
}
function changeOffer(id,status){
 const o=userData.offers.find(x=>String(x.id)===String(id));if(!o)return;
 const p=posts.find(x=>x.id===o.postId);if(!p)return;
 if(status==='accepted'){
  if(p.state!=='open')return notify('마감되거나 완료된 요청입니다.');
  if(userData.offers.some(x=>x.postId===p.id&&x.id!==o.id&&x.status==='accepted'))return notify('이미 수락한 제안이 있어요.');
  if(o.status!=='pending')return notify('대기 중인 제안만 수락할 수 있어요.');
  // 다른 대기 제안은 보류: 수락된 제안을 거절하면 다시 선택할 수 있습니다.
 }
 if(status==='rejected'&&o.status!=='pending')return notify('처리할 수 없는 제안입니다.');
 if(status==='cancelled'&&(!o.mine||o.status!=='pending'))return notify('대기 중인 내 제안만 취소할 수 있어요.');
 o.status=status;userSave();addNotice('「'+p.title+'」 제안 상태: '+offerLabel(o));saveAndRefresh();notify(status==='accepted'?'제안을 수락했어요.':status==='rejected'?'제안을 거절했어요.':'제안을 취소했어요.');
}
function undoAcceptedOffer(id){
 const o=userData.offers.find(x=>String(x.id)===String(id));
 if(!o||o.status!=='accepted')return notify('수락된 제안만 취소할 수 있어요.');
 const p=posts.find(x=>x.id===o.postId);
 if(!p||!ownPost(p)||p.state==='done')return notify('완료된 나눔은 수락을 취소할 수 없어요.');
 showModal('나눔 수락 취소',`<p class="demo-note">「${esc(p.title)}」의 수락을 취소하면 다른 대기 중인 제안을 다시 선택할 수 있어요.</p><form id="undoAcceptForm"><div class="field"><label for="cancelReason">취소 사유 *</label><select id="cancelReason" required><option value="">사유를 선택해 주세요</option><option value="일정 문제">일정 문제</option><option value="연락 두절">연락 두절</option><option value="물건 상태">물건 상태</option><option value="기타">기타</option></select></div><div class="field hidden" id="cancelExtraWrap"><label for="cancelExtra">상세 사유</label><textarea id="cancelExtra" maxlength="200" placeholder="취소 사유를 간단히 알려주세요."></textarea></div><div class="form-actions"><button class="outline" type="button" id="undoBack">돌아가기</button><button class="primary" type="submit">수락 취소하기</button></div></form>`);
 $('#undoBack').onclick=closeModal;
 $('#cancelReason').onchange=()=>$('#cancelExtraWrap').classList.toggle('hidden',$('#cancelReason').value!=='기타');
 $('#undoAcceptForm').onsubmit=e=>{
  e.preventDefault();const reason=$('#cancelReason').value;
  if(!reason)return notify('취소 사유를 선택해 주세요.');
  if(!confirm('수락을 취소할까요? 취소 기록은 남고 다른 제안을 다시 수락할 수 있어요.'))return;
  o.status='accept_cancelled';o.cancelReason=reason;o.cancelDetail=reason==='기타'?$('#cancelExtra').value.trim():'';
  o.cancelledAt=new Date().toISOString();
  addNotice('「'+p.title+'」 수락이 취소되었습니다. 사유: '+reason);
  collectBehavior('OFFER_ACCEPT_CANCEL',{category:p.category,postId:p.id,reason});
  closeModal();saveAndRefresh();showUser('received');notify('수락을 취소했어요. 다른 제안을 선택할 수 있어요.');
 };
}
/* 채팅은 아래의 개선된 openChat에서 처리 */
// 게시글 조회수: 시연용 브라우저 저장소 기반 집계

function postViewCount(id){return Math.max(0,Number(postViews[String(id)])||0)}
function recordPostView(id){const key=String(id);postViews[key]=postViewCount(id)+1;try{localStorage.setItem(POST_VIEWS_KEY,JSON.stringify(postViews))}catch{}}
// 기존 상세 팝업을 나눔 흐름 중심으로 확장
function detail(id,countView=true){const p=posts.find(x=>x.id===id);if(!p)return;if(countView){recordPostView(id);renderFeed();if(!$('#userArea').classList.contains('hidden'))renderUser()}const isFav=userData.favorites.includes(id),offerCount=userData.offers.filter(o=>o.postId===id).length;
 showModal(p.title,`<p class="detail-meta"><span class="tag">${esc(p.category)}</span> &nbsp; 📍 ${esc(p.region)} · ${esc(p.time)} · <button type="button" class="neighbor-name-link" id="detailAuthorProfile">${esc(p.author)}</button> · 👤 조회 ${postViewCount(p.id)}</p><div class="detail-text">${esc(p.body)}</div>${p.photos?.length?`<div class="detail-images">${p.photos.map(src=>`<img src="${src}" alt="요청 물품 참고 사진">`).join('')}</div>`:''}<div class="need-detail-status"><span class="mini-tag">${requestStage(p)}</span><span>제안 ${offerCount}건</span></div><div id="detailAdSlot" class="detail-ad-wrap hidden"></div><div class="detail-actions need-detail-clean-actions">${p.state==='open'&&!ownPost(p)?'<button class="primary" id="offerBtn">나눔 제안하기</button>':''}${ownPost(p)?`<button class="outline" id="viewReceived">받은 제안 ${offerCount}건 보기</button>`:''}<button class="favorite-toggle ${isFav?'saved':''}" id="detailFavorite" aria-label="관심 등록">${isFav?'♥ 관심 해제':'♡ 관심'}</button>${!ownPost(p)?'<button type="button" class="need-detail-more" id="detailMoreBtn" aria-label="더보기" aria-expanded="false">⋯</button><div class="need-detail-more-menu" id="detailMoreMenu" hidden><button type="button" id="reportPostBtn">신고 · 차단</button></div>':''}</div>`);
 renderAdPlacement('DETAIL_001','#detailAdSlot',p.category);$('#detailBack')?.addEventListener('click',closeModal);$('#detailAuthorProfile')?.addEventListener('click',()=>openNeighborProfile(p.author));
 $('#detailFavorite').onclick=()=>{toggleFavorite(id);detail(id,false)};$('#detailMoreBtn')?.addEventListener('click',(event)=>{event.stopPropagation();const menu=$('#detailMoreMenu'),btn=$('#detailMoreBtn');const opening=menu.hidden;menu.hidden=!opening;btn.setAttribute('aria-expanded',String(opening));if(opening){const r=btn.getBoundingClientRect();const width=160;menu.style.left=Math.max(12,Math.min(window.innerWidth-width-12,r.right-width))+'px';const menuHeight=54;menu.style.top=(r.bottom+menuHeight+12<window.innerHeight?r.bottom+8:Math.max(12,r.top-menuHeight-8))+'px';}});$('#reportPostBtn')?.addEventListener('click',()=>{ $('#detailMoreMenu').hidden=true;openSafetyDialog(p); });
 $('#viewReceived')?.addEventListener('click',()=>{closeModal();showUser('received')});$('#detailEdit')?.addEventListener('click',()=>editRequest(id));$('#detailDelete')?.addEventListener('click',()=>deleteRequest(id));
 $('#offerBtn')?.addEventListener('click',()=>{showModal('나눔 제안하기',`<p class="demo-note">「${esc(p.title)}」 요청에 물품을 제안합니다.</p><form id="offerForm"><div class="field"><label for="offerItem">나눔할 물품 설명</label><input id="offerItem" required maxlength="80" placeholder="예: 24인치 모니터, 정상 작동"></div><div class="field"><label for="offerMsg">전달할 메시지</label><textarea id="offerMsg" required placeholder="물품 상태와 전달 가능한 방법을 알려주세요."></textarea></div><div class="field"><label for="offerPhotos">물품 사진 첨부 · 최대 3장</label><input type="file" id="offerPhotos" accept="image/jpeg,image/png,image/webp" multiple><small>JPG · PNG · WEBP / 각 5MB 이하</small><div id="offerPhotoPreview" class="stage-photo-preview"></div></div><p class="demo-note">시연용: 제안은 이 브라우저의 '보낸 제안'에 저장됩니다.</p><div class="form-actions"><button class="outline" type="button" id="cancelOffer">취소</button><button class="primary" type="submit">제안 보내기</button></div></form>`);$('#cancelOffer').onclick=closeModal;let offerPhotos=[];$('#offerPhotos').addEventListener('change',async e=>{
  const files=Array.from(e.target.files||[]);
  e.target.value='';
  if(files.length+offerPhotos.length>3){notify('사진은 최대 3장까지 첨부할 수 있어요.');return;}
  for(const f of files){
    if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024){notify('JPG, PNG, WEBP 5MB 이하만 가능해요.');continue;}
    try{offerPhotos.push(await stageResizePhoto(f));}catch(err){console.error(err);notify(err.message||'사진 처리에 실패했어요.');}
  }
  drawOfferPhotos();
});
function drawOfferPhotos(){
 const box=$('#offerPhotoPreview');if(!box)return;
 box.innerHTML=offerPhotos.map((src,i)=>`<div><img src="${src}" alt="첨부 사진 ${i+1}"><button type="button" data-photo-remove="${i}" aria-label="사진 ${i+1} 삭제">×</button></div>`).join('');
 box.querySelectorAll('[data-photo-remove]').forEach(b=>b.addEventListener('click',()=>{offerPhotos.splice(Number(b.dataset.photoRemove),1);drawOfferPhotos();}));
};$('#offerForm').onsubmit=e=>{e.preventDefault();const o={id:uid(),postId:p.id,item:$('#offerItem').value.trim(),message:$('#offerMsg').value.trim(),sender:'나(시연)',mine:true,status:'pending',photos:offerPhotos};userData.offers.unshift(o);userSave();collectBehavior('OFFER_CREATE',{category:p.category,postId:p.id});closeModal();showUser('sent');notify('보낸 제안에 저장했어요. (시연용)')}});
}
// 동적으로 다시 그려지는 요청 관리 버튼의 이벤트 위임.
// 기존 개별 바인딩과 중복 실행되지 않도록, 이미 처리되는 클릭은 그대로 둡니다.
(function(){
 const root=document.getElementById('userContent');if(!root)return;
 root.addEventListener('click',e=>{
  const btn=e.target.closest('[data-close-post],[data-reopen-post]');
  if(!btn||!root.contains(btn))return;
  // 현재 renderUser()에서 바인딩한 이벤트가 있으면 그 이벤트가 실행되도록 유지.
 },false);
})();
// 실제 등록 배너 클릭/노출 시연 지표: 광고 관리 데이터와 연결
const originalAdRender=renderAdPlacement;
renderAdPlacement=function(slot,selector,category='전체'){originalAdRender(slot,selector,category);const el=$(selector);if(!el)return;const b=activeBanner(slot,category);if(b){const st=userData.adStats[b.id]||(userData.adStats[b.id]={impressions:0,clicks:0});st.impressions++;userSave();el.querySelector('.ad-go')?.addEventListener('click',()=>{st.clicks++;userSave();collectBehavior('AD_CLICK',{keyword:b.name,category})})}};
const oldBannerRender=renderBanners;
renderBanners=function(){oldBannerRender();const panel=$('#adminContent .admin-panel');if(!panel)return;const rows=banners.map(b=>{const st=userData.adStats[b.id]||{impressions:0,clicks:0};return `<tr><td>${esc(b.name)}</td><td>${st.impressions}</td><td>${st.clicks}</td><td>${st.impressions?(st.clicks/st.impressions*100).toFixed(1):'0.0'}%</td></tr>`}).join('');panel.insertAdjacentHTML('beforeend',`<div style="margin-top:25px"><h2>광고 반응 지표 (시연용)</h2><p class="user-subtitle">배너가 화면에 렌더링된 횟수를 노출로 집계한 참고 수치이며 실제 광고 측정 방식과 다릅니다.</p><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>배너</th><th>화면 표시</th><th>클릭</th><th>참고 클릭률</th></tr></thead><tbody>${rows||'<tr><td colspan="4">등록된 배너가 없어요.</td></tr>'}</tbody></table></div></div>`)};
// 검색어 추천 대신 카테고리별 탐색: 선택 즉시 게시글 필터링
const quickSearch=document.createElement('div');
quickSearch.className='search-suggestions category-shortcuts';
quickSearch.id='quickSearch';
quickSearch.setAttribute('role','group');
quickSearch.setAttribute('aria-label','요청 물품 카테고리');
$('#searchAdSlot').insertAdjacentElement('afterend',quickSearch);
function renderQuickSearch(){
 quickSearch.innerHTML='<span class="category-shortcuts-title">카테고리</span>'+categories.map(([name,icon])=>`<button type="button" class="category-chip ${activeCategory===name?'selected':''}" data-shortcat="${esc(name)}" aria-pressed="${activeCategory===name}"><span aria-hidden="true">${icon}</span> ${esc(name)}</button>`).join('');
 quickSearch.querySelectorAll('[data-shortcat]').forEach(btn=>btn.addEventListener('click',()=>{
   activeCategory=btn.dataset.shortcat;
   $('#searchInput').value=''; // 카테고리 선택 시 이전 검색어 때문에 결과가 숨겨지지 않도록 초기화
   visible=6;
   renderCats();renderFeed();renderQuickSearch();
   renderAdPlacement('SEARCH_001','#searchAdSlot',activeCategory);
   collectBehavior('CATEGORY_CLICK',{category:activeCategory});
 }));
}
renderQuickSearch();
// 다른 화면에서 카테고리가 바뀌어도 선택 상태 동기화
const renderFeedBeforeCategorySync=renderFeed;
renderFeed=function(){renderFeedBeforeCategorySync();renderQuickSearch();};
// 최초 로컬 게시글 반영
renderFeed();




// 물건 요청하기 / 이웃 도와주기: 별개의 화면, 하나의 계정
(function(){
 let mode='help';
 const requestNav=document.getElementById('requestsNav'),helpNav=document.getElementById('helpNav');
 const reqTab=document.getElementById('viewRequest'),helpTab=document.getElementById('viewHelp');
 const panel=document.getElementById('modePanel'),cta=document.getElementById('heroCreateBtn'),secondary=document.getElementById('modeSecondary');
 function refreshMyRequests(){
  const root=document.getElementById('requestMyPosts');
  const mine=posts.filter(p=>p.author==='나(시연)' || (typeof ownPost==='function' && ownPost(p)));
  root.innerHTML=mine.length?mine.map(p=>`<button type="button" class="request-post" data-my-post="${p.id}"><span class="tag">${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>📍 ${esc(p.region)} · ${typeof requestStage==='function'?requestStage(p):(p.state==='done'?'나눔 완료':'요청 중')}</p><span class="role-link">요청 내용 확인 →</span></button>`).join(''):'<div class="request-empty"><div style="font-size:38px">📦</div><strong>아직 요청한 물건이 없어요</strong><p>필요한 물건을 요청하면 이곳에서 진행 상황을 확인할 수 있어요.</p><button type="button" class="primary" id="emptyRequestBtn">첫 나눔 요청 작성하기</button></div>';
  root.querySelectorAll('[data-my-post]').forEach(b=>b.onclick=()=>detail(Number(b.dataset.myPost)));
  root.querySelector('#emptyRequestBtn')?.addEventListener('click',createDialog);
 }
 function setMode(next,scroll=true){
  if(typeof adminMode!=='undefined'&&adminMode)leaveAdmin();
  if(typeof leaveUser==='function'&&document.getElementById('userArea')&&!document.getElementById('userArea').classList.contains('hidden'))leaveUser();
  mode=next;const isRequest=next==='request';
  document.body.classList.toggle('request-mode',isRequest);document.body.classList.toggle('help-mode-page',!isRequest);
  reqTab.classList.toggle('active',isRequest);helpTab.classList.toggle('active',!isRequest);
  reqTab.setAttribute('aria-selected',String(isRequest));helpTab.setAttribute('aria-selected',String(!isRequest));
  requestNav.classList.toggle('active',isRequest);helpNav.classList.toggle('active',!isRequest);document.getElementById('adminNav').classList.remove('active');
  document.getElementById('homeNav').classList.remove('active');
  panel.classList.toggle('help-mode',!isRequest);
  document.getElementById('modeBadge').textContent=isRequest?'🙋 물건 요청하기':'🎁 이웃 도와주기';
  document.getElementById('modeTitle').textContent=isRequest?'필요한 물건을 이웃에게 요청해 보세요':'내가 도와줄 수 있는 이웃을 찾아보세요';
  document.getElementById('modeDescription').textContent=isRequest?'요청 글을 작성하고, 이웃이 보낸 제안을 확인해 나눔을 진행할 수 있어요.':'우리 동네 이웃이 필요한 물건을 찾아보고, 나눌 수 있다면 제안해 보세요.';
  cta.textContent=isRequest?'＋ 물건 요청 글 작성하기':'🔎 나눔 요청 둘러보기';
  secondary.textContent=isRequest?'받은 나눔 제안 확인하기 →':'내가 제안한 나눔 보기 →';
  document.getElementById('roleHint').textContent='이웃의 요청을 보고 나눌 수 있는 물건이 있다면 제안해 보세요.';
  document.getElementById('categoryHeading').textContent='카테고리로 요청 찾기';
  document.getElementById('feedDescription').textContent='이웃들이 요청한 물건을 확인하고 나눔을 제안해 보세요.';
  if(isRequest)refreshMyRequests();
  if(scroll)window.scrollTo({top:0,behavior:'smooth'});
 }
 reqTab.onclick=()=>setMode('request');helpTab.onclick=()=>setMode('help');
 requestNav.onclick=()=>setMode('request');helpNav.onclick=()=>setMode('help');
 cta.onclick=()=>mode==='request'?createDialog():document.getElementById('feedArea').scrollIntoView({behavior:'smooth'});
 secondary.onclick=()=>showUser(mode==='request'?'received':'sent');
 document.getElementById('requestReceivedBtn').onclick=()=>showUser('received');
 document.getElementById('homeNav').onclick=()=>setMode('help');
 document.getElementById('activityNav').textContent='내 나눔';

// 공개 프로필은 시연 데이터로 구성하며, 실제 회원 인증·평점은 표시하지 않습니다.
function openNeighborProfile(name, offerId=null){
 const nick=String(name||'이웃').trim()||'이웃';
 const mine=nick===profileData.nickname||nick==='나(시연)';
 const authored=posts.filter(p=>String(p.author||'')===nick);
 const reviews=posts.filter(p=>p.state==='done'&&p.review&&userData.offers.some(o=>String(o.postId)===String(p.id)&&o.status==='accepted'&&String(o.sender)===nick)).map(p=>({post:p,review:p.review}));
 const related=userData.offers.find(o=>o&&o.status==='accepted'&&String(o.sender)===nick&&posts.some(p=>String(p.id)===String(o.postId)));
 const chatOffer=offerId?userData.offers.find(o=>String(o.id)===String(offerId)&&o.status==='accepted'):related;
 const avatar=mine&&profileData.photo?`<img src="${esc(profileData.photo)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:esc(nick.slice(0,1));
 showModal('이웃 프로필',`<div class="np-wrap">
  <div class="np-head"><div class="np-avatar">${avatar}</div><div class="np-identity"><h3>${esc(nick)}</h3><p>NEED IT 이웃</p></div></div>
  <div class="np-stats"><div><strong>${authored.length}</strong><span>요청 게시글</span></div><div><strong>${reviews.length}</strong><span>받은 후기</span></div></div>
  <div class="np-actions">${chatOffer?`<button class="primary" id="neighborChat">💬 대화하기</button>`:`<button class="outline" disabled title="제안을 수락하면 대화할 수 있어요">수락 후 대화 가능</button>`}<button class="outline" id="neighborClose">닫기</button></div>
  <div class="np-tabs" role="tablist" aria-label="이웃 활동"><button class="np-tab active" type="button" role="tab" aria-selected="true" data-np-tab="posts">요청 게시글 <span>${authored.length}</span></button><button class="np-tab" type="button" role="tab" aria-selected="false" data-np-tab="reviews">받은 후기 <span>${reviews.length}</span></button></div>
  <section class="np-panel" data-np-panel="posts" role="tabpanel">${authored.length?authored.map(p=>`<button class="np-post" data-neighbor-post="${esc(String(p.id))}">${p.photos?.[0]?`<img src="${esc(p.photos[0])}" alt="">`:`<span class="np-post-fallback">📦</span>`}<span class="np-post-info"><strong>${esc(p.title)}</strong><small>${esc(p.category||'기타')} · ${esc(p.region||'지역 미설정')}</small></span><span class="np-post-status">${p.state==='done'?'나눔 완료':'요청 중'}</span></button>`).join(''):'<div class="np-empty">아직 공개된 요청 게시글이 없어요.</div>'}</section>
  <section class="np-panel" data-np-panel="reviews" role="tabpanel" hidden>${reviews.length?reviews.map(({post,review})=>`<div class="np-review"><div class="np-review-title"><strong>${esc(({good:'😊 좋아요',normal:'😐 보통이에요',bad:'🙁 아쉬워요'})[review.rating]||'나눔 후기')}</strong><small>${esc(post.title)}</small></div><p>${esc(review.text||'후기 내용 없이 나눔을 완료했어요.')}</p></div>`).join(''):'<div class="np-empty">아직 등록된 나눔 후기가 없어요.</div>'}</section>
  <p class="np-footnote">시연용 프로필입니다. 인증·가입일 정보는 표시하지 않아요.</p>
 </div>`);
 document.querySelectorAll('[data-np-tab]').forEach(tab=>tab.addEventListener('click',()=>{
   document.querySelectorAll('[data-np-tab]').forEach(t=>{const active=t===tab;t.classList.toggle('active',active);t.setAttribute('aria-selected',String(active));});
   document.querySelectorAll('[data-np-panel]').forEach(panel=>{panel.hidden=panel.dataset.npPanel!==tab.dataset.npTab;});
 }));
 document.getElementById('neighborClose').onclick=closeModal;
 document.getElementById('neighborChat')?.addEventListener('click',()=>openChat(chatOffer.id));
 document.querySelectorAll('[data-neighbor-post]').forEach(b=>b.addEventListener('click',()=>detail(Number(b.dataset.neighborPost))));
}
window.openNeighborProfile=openNeighborProfile;
// 채팅방 목록, 약속, 알림 연동 (로컬 데모)
function openChat(id){
 let pendingPhoto=null;
 if(!Array.isArray(userData.messages))userData.messages=[];
 if(!Array.isArray(userData.offers))userData.offers=[];
 const o=userData.offers.find(x=>x&&String(x.id)===String(id));
 const p=o?posts.find(x=>String(x.id)===String(o.postId)):null;
 if(!o||!p){notify('채팅에 연결된 제안이나 게시글을 찾을 수 없어요.');return;}
 if(o.status!=='accepted'){notify('수락된 제안만 대화할 수 있어요.');return;}
 userData.messages.filter(m=>m&&!m.mine&&String(m.offerId)===String(o.id)).forEach(m=>m.read=true);
 userSave();updateChatUnread();if(userTab==='chats')renderUser();
 const draw=()=>{
  const msgs=userData.messages.filter(m=>m&&String(m.offerId)===String(o.id));
  const complete=p.state==='done';
  const canComplete=ownPost(p)&&!complete;
  const lines=msgs.map(m=>{const photo=typeof m.photo==='string'&&m.photo.startsWith('data:image/');return `<div class="need-talk-line ${m.mine?'mine':''} ${photo?'photo':''}"><div class="need-talk-bubble">${photo?`<img class="need-talk-photo" src="${esc(m.photo)}" alt="채팅으로 전송한 사진" loading="lazy">${m.text&&m.text!=='📷 사진'?`<p class="need-talk-caption">${esc(m.text)}</p>`:''}`:esc(m.text||'')}</div><small>${esc(m.time||'')}${m.mine?` · <span class="chat-read-label ${m.peerRead?'is-read':''}">${m.peerRead?'읽음':'안 읽음'}</span>`:''}</small></div>`}).join('');
  showModal('채팅',`<div class="need-talk"><div class="need-talk-top"><div class="need-talk-avatar">${esc((o.sender||'이').slice(0,1))}</div><div><div class="need-talk-name-row"><button type="button" class="neighbor-name-link" id="chatNeighborProfile">${esc(o.sender||'이웃')}</button><span class="need-talk-state">${complete?'나눔 완료':'나눔 진행 중'}</span></div></div>${canComplete?'<div class="need-chat-menu-wrap"><button type="button" class="need-chat-menu-btn" id="chatMore" aria-label="채팅 거래 메뉴" aria-expanded="false">⋯</button><div class="need-chat-menu-panel" id="chatMorePanel" hidden><button type="button" id="chatComplete">✓ 거래 완료하기</button><small>물건을 받은 뒤 완료해 주세요.</small></div></div>':''}</div><div class="need-talk-messages" id="chatHistory">${lines||'<div class="need-talk-empty">아직 메시지가 없어요.<br>인사를 건네 대화를 시작해 보세요.</div>'}</div>${complete?'<div class="need-talk-finished">✓ 나눔이 완료된 거래입니다.</div>':''}<div class="chat-read-demo"><span>읽음 확인 · 시연용</span><button type="button" class="outline" id="simulatePeerRead">상대방 읽음 시연</button></div><div id="chatDraftPreview" class="need-chat-draft" ${pendingPhoto?'':'hidden'}>${pendingPhoto?`<img src="${pendingPhoto}" alt="전송 대기 중인 사진"><span>전송 전 사진</span><button type="button" id="chatDraftRemove" aria-label="선택한 사진 제거">×</button>`:''}</div><form id="chatForm" class="need-talk-compose"><button type="button" class="need-photo-add" id="chatPhotoButton" title="사진 보내기" aria-label="사진 보내기">＋</button><input type="file" id="chatPhotoInput" accept="image/*" aria-label="채팅 사진 선택"><input id="chatInput" maxlength="500" autocomplete="off" placeholder="메시지를 입력하세요" aria-label="채팅 메시지"><button class="primary" type="submit">전송</button></form><div class="need-talk-footer"><button class="outline" type="button" id="chatListBack">← 채팅 목록</button></div></div>`);
  document.getElementById('chatNeighborProfile')?.addEventListener('click',()=>openNeighborProfile(o.sender,o.id));
  document.getElementById('simulatePeerRead')?.addEventListener('click',()=>{let changed=0;userData.messages.filter(m=>m&&m.mine&&String(m.offerId)===String(o.id)&&!m.peerRead).forEach(m=>{m.peerRead=true;changed++});userSave();draw();notify(changed?'상대방이 읽은 상태로 표시했어요.':'새로 확인할 메시지가 없어요.')});
  document.getElementById('chatListBack').onclick=()=>{closeModal();showUser('chats')};
  document.getElementById('chatMore')?.addEventListener('click',()=>{const panel=document.getElementById('chatMorePanel');panel.hidden=!panel.hidden;document.getElementById('chatMore').setAttribute('aria-expanded',String(!panel.hidden));});
  document.getElementById('chatComplete')?.addEventListener('click',()=>{if(window.confirm('물건을 실제로 받으셨나요? 거래를 완료하면 후기를 작성할 수 있어요.'))finishRequest(p.id);});
  document.getElementById('chatForm').onsubmit=e=>{e.preventDefault();const input=document.getElementById('chatInput');const t=input.value.trim();if(!t&&!pendingPhoto)return;const message={id:uid(),offerId:o.id,text:t||(pendingPhoto?'📷 사진':''),mine:true,read:true,peerRead:false,time:new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})};if(pendingPhoto)message.photo=pendingPhoto;userData.messages.push(message);try{userSave()}catch(err){userData.messages.pop();notify('저장 공간이 부족해요. 더 작은 사진을 선택해 주세요.');return;}pendingPhoto=null;draw();document.getElementById('chatInput')?.focus()};
  document.getElementById('chatDraftRemove')?.addEventListener('click',()=>{pendingPhoto=null;const preview=document.getElementById('chatDraftPreview');preview.hidden=true;preview.innerHTML='';document.getElementById('chatPhotoInput').value='';});
  document.getElementById('chatPhotoButton').onclick=()=>document.getElementById('chatPhotoInput').click();
  document.getElementById('chatPhotoInput').onchange=async e=>{
   const file=e.target.files?.[0];if(!file)return;
   if(!file.type.startsWith('image/')){notify('이미지 파일만 전송할 수 있어요.');return;}
   if(file.size>8*1024*1024){notify('8MB 이하의 사진을 선택해 주세요.');return;}
   try{
    const photo=await new Promise((resolve,reject)=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{try{const max=1000,scale=Math.min(1,max/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/jpeg',0.72);URL.revokeObjectURL(url);resolve(data)}catch(err){URL.revokeObjectURL(url);reject(err)}};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('사진을 열 수 없어요.'))};img.src=url});
    pendingPhoto=photo;
    const preview=document.getElementById('chatDraftPreview');
    if(preview){preview.hidden=false;preview.innerHTML=`<img src="${photo}" alt="전송 대기 중인 사진"><span>전송 전 사진</span><button type="button" id="chatDraftRemove" aria-label="선택한 사진 제거">×</button>`;preview.querySelector('#chatDraftRemove').onclick=()=>{pendingPhoto=null;preview.hidden=true;preview.innerHTML='';document.getElementById('chatPhotoInput').value='';};}
    document.getElementById('chatInput')?.focus();
   }catch(err){notify('사진을 처리하지 못했어요. 다른 사진을 선택해 주세요.');console.error(err)}
  };
  document.getElementById('chatHistory')?.addEventListener('click',e=>{const img=e.target.closest('.need-talk-photo');if(img)window.open(img.src,'_blank','noopener,noreferrer')});
  const history=document.getElementById('chatHistory');if(history)history.scrollTop=history.scrollHeight;
 };draw();
}
window.openChat = openChat; // 다른 초기화 블록의 버튼에서도 접근 가능
document.getElementById('headerChats').addEventListener('click',()=>showUser('chats'));
updateChatUnread();

 // 요청 등록 후에는 내 요청을 볼 수 있도록 화면 갱신
 const originalClose=window.closeModal;
 if(typeof originalClose==='function')window.closeModal=function(){originalClose();if(mode==='request')refreshMyRequests()};
 setMode('help',false);
})();



/* Visual-copy refinement, after existing navigation initialization. */
(function(){
 const request=document.getElementById('requestsNav'),help=document.getElementById('helpNav');
 if(request)request.textContent='물건 요청하기';
 if(help)help.textContent='이웃 도와주기';
 const badge=document.getElementById('modeBadge'),title=document.getElementById('modeTitle'),desc=document.getElementById('modeDescription');
 function update(){
   const isRequest=document.body.classList.contains('request-mode');
   if(badge)badge.textContent=isRequest?'물건 요청하기':'이웃 도와주기';
   if(title)title.textContent=isRequest?'필요한 물건이 있나요?':'이웃에게 작은 도움을 건네보세요';
   if(desc)desc.textContent=isRequest?'필요한 물건을 요청해 보세요. 가까운 이웃이 나눔을 제안할 수 있어요.':'우리 동네 이웃이 찾는 물건을 확인하고, 나눌 수 있다면 제안해 보세요.';
 }
 if(request)request.addEventListener('click',update);
 if(help)help.addEventListener('click',update);
 const home=document.getElementById('homeNav');if(home)home.addEventListener('click',update);
 update();
})();



(function(){
 const body=document.body;
 function enter(navId){body.classList.remove('landing-state');document.getElementById(navId).click();window.scrollTo(0,0)}
 document.getElementById('landingRequest').addEventListener('click',()=>enter('requestsNav'));
 document.getElementById('landingHelp').addEventListener('click',()=>enter('helpNav'));
 const home=document.getElementById('homeNav');
 home.addEventListener('click',()=>{if(typeof adminMode!=='undefined'&&adminMode&&typeof leaveAdmin==='function')leaveAdmin();if(typeof leaveUser==='function'&&!document.getElementById('userArea').classList.contains('hidden'))leaveUser();body.classList.add('landing-state');window.scrollTo(0,0)});
 document.querySelector('.logo')?.addEventListener('click',e=>{e.preventDefault();home.click()});
})();



/* 알림은 마이페이지 탭 대신 헤더 종 아이콘에서 확인 */
(function(){
 const bell=document.getElementById('headerBell'), bellPanel=document.getElementById('bellPanel');
 const accountBtn=document.getElementById('accountMenuBtn'),accountMenu=document.getElementById('accountMenu');
 const closeAll=()=>{bellPanel.classList.add('hidden');accountMenu.classList.add('hidden');bell.setAttribute('aria-expanded','false');accountBtn.setAttribute('aria-expanded','false')};
 function drawBell(){
  const notes=(typeof userData!=='undefined'&&Array.isArray(userData.notifications))?userData.notifications:[];
  document.getElementById('bellDot').classList.toggle('hidden',!notes.some(n=>!n.read));
  document.getElementById('bellItems').innerHTML=notes.length?notes.map(n=>'<div class="bell-notice-row '+(!n.read?'unread':'')+'"><button type="button" class="bell-item need-notice-link" data-notice-id="'+esc(String(n.id))+'"><p>'+esc(n.message)+'</p><small>'+esc(n.time||'')+' · 눌러서 확인</small></button><button type="button" class="bell-delete-one" data-delete-notice="'+esc(String(n.id))+'" aria-label="이 알림 삭제" title="알림 삭제">×</button></div>').join(''):'<div class="bell-empty">아직 도착한 알림이 없어요.</div>';
 }
 document.getElementById('bellItems').addEventListener('click',e=>{const del=e.target.closest('[data-delete-notice]');if(del){e.stopPropagation();userData.notifications=userData.notifications.filter(n=>String(n.id)!==del.dataset.deleteNotice);userSave();drawBell();return;}const btn=e.target.closest('[data-notice-id]');if(!btn)return;const n=userData.notifications.find(x=>String(x.id)===btn.dataset.noticeId);if(!n)return;n.read=true;userSave();closeAll();drawBell();if(n.offerId&&userData.offers.some(o=>String(o.id)===String(n.offerId)&&o.status==='accepted'))openChat(n.offerId);else showUser(n.tab||'received')});
 bell.addEventListener('click',e=>{e.stopPropagation();const opening=bellPanel.classList.contains('hidden');closeAll();if(opening){drawBell();bellPanel.classList.remove('hidden');bell.setAttribute('aria-expanded','true')}});
 accountBtn.addEventListener('click',e=>{e.stopPropagation();const opening=accountMenu.classList.contains('hidden');closeAll();if(opening){accountMenu.classList.remove('hidden');accountBtn.setAttribute('aria-expanded','true')}});
 accountMenu.querySelectorAll('[data-menu-tab]').forEach(btn=>btn.addEventListener('click',()=>{closeAll();showUser(btn.dataset.menuTab)}));
 document.getElementById('bellClearAll').onclick=()=>{if(!userData.notifications.length)return;if(!confirm('알림을 모두 삭제할까요?'))return;userData.notifications=[];userSave();drawBell()};
 document.getElementById('bellReadAll').onclick=()=>{if(typeof userData!=='undefined'){userData.notifications.forEach(n=>n.read=true);userSave()}drawBell()};
 document.addEventListener('click',e=>{if(!e.target.closest('.header-pop-wrap'))closeAll()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});
 const oldAddNotice=addNotice;
 addNotice=function(msg){oldAddNotice(msg);drawBell()};
 drawBell();
})();



/* 로그인 첫화면 변경 전 버전을 유지하면서, 검색창에 인기 검색어를 표시합니다.
   서버가 연결되지 않은 HTML 시연판이므로 초기 순위는 예시 데이터입니다.
   이 브라우저에서 발생한 검색 로그는 실제 횟수로 집계하여 반영합니다. */
(function(){
 const input=document.getElementById('searchInput');
 if(!input)return;
 const row=input.closest('.search-row');
 const panel=document.createElement('div');
 panel.id='popularSearchPanel';panel.className='popular-search-panel hidden';
 panel.setAttribute('aria-label','인기 검색어');
 row.appendChild(panel);
 const examples=['모니터','책상','의자','전자레인지','노트북','자전거','선풍기','책장','냉장고','에어프라이어'];
 let open=false;
 function getRanking(){
   const counts=new Map();
   examples.forEach((word,i)=>counts.set(word,examples.length-i));
   if(typeof behaviorLogs!=='undefined'&&Array.isArray(behaviorLogs)){
     behaviorLogs.filter(log=>log.action==='SEARCH').forEach(log=>{
       const word=String(log.keyword||'').trim().slice(0,30);
       if(word)counts.set(word,(counts.get(word)||0)+1);
     });
   }
   return [...counts].sort((a,b)=>b[1]-a[1]).map(([word])=>word);
 }
 function draw(){
   const q=input.value.trim().toLocaleLowerCase('ko-KR');
   const ranked=getRanking().filter(w=>!q||w.toLocaleLowerCase('ko-KR').includes(q)).slice(0,10);
   panel.innerHTML='<div class="popular-search-heading"><strong>'+(q?'추천 검색어':'인기 검색어 TOP 10')+'</strong><span>시연용 · 현재 브라우저 검색 반영</span></div>'+
     (ranked.length?'<div class="popular-search-list">'+ranked.map((word,i)=>'<button type="button" data-trending="'+esc(word)+'"><span class="popular-search-rank">'+(i+1)+'</span><span>'+esc(word)+'</span></button>').join('')+'</div>':'<div class="popular-search-empty">일치하는 추천 검색어가 없어요.</div>');
   panel.classList.toggle('hidden',!open);
 }
 function show(){open=true;draw();}
 function hide(){open=false;panel.classList.add('hidden');}
 input.addEventListener('focus',show);
 input.addEventListener('input',()=>{if(open)draw()});
 panel.addEventListener('mousedown',e=>e.preventDefault());
 panel.addEventListener('click',e=>{
   const button=e.target.closest('[data-trending]');if(!button)return;
   const word=button.dataset.trending;
   input.value=word;
   if(typeof activeCategory!=='undefined')activeCategory='전체';
   if(typeof visible!=='undefined')visible=6;
   if(typeof renderCats==='function')renderCats();
   if(typeof renderFeed==='function')renderFeed();
   if(typeof collectBehavior==='function')collectBehavior('SEARCH',{keyword:word});
   hide();
   input.focus({preventScroll:true});
   document.getElementById('feedArea')?.scrollIntoView({behavior:'smooth',block:'start'});
 });
 input.addEventListener('keydown',e=>{if(e.key==='Escape')hide();if(e.key==='Enter'){hide();if(typeof collectBehavior==='function'&&input.value.trim())collectBehavior('SEARCH',{keyword:input.value.trim()})}});
 document.addEventListener('pointerdown',e=>{if(!row.contains(e.target))hide()});
 input.addEventListener('blur',()=>setTimeout(()=>{if(!row.contains(document.activeElement))hide()},120));
})();
