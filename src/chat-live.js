import { authenticatedClient, usableToken, watchSession } from './ws-auth.js';

let client = null;
let connectedToken = null;
let activeRoom = null;
let roomSubscription = null;
let readSubscription = null;
let listSubscriptions = [];
let rooms = [];
let listGeneration = 0;
let readInFlight = new Set();
let refreshTimer = null;
let roomLoadGeneration = 0;
let activeConversationRooms = [];
let conversationSubscriptions = [];

const token = () => sessionStorage.getItem('needit_access_token');
const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api = async (path, options = {}) => {
  const headers = { ...(options.headers || {}), Authorization: `Bearer ${token()}` };
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch('/api' + path, {
    ...options, headers,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) throw Error(result.message || `요청 실패 (${response.status})`);
  return result.data ?? result;
};
// 상대 회원의 공개 프로필을 조회한다. 채팅 API에서 상대 회원 ID를 제공하는 경우 사용한다.
const profileCache = new Map();
const opponentId = room => room.opponentId ?? room.opponentMemberId ?? room.otherMemberId ?? room.partnerMemberId ?? room.partnerId ?? room.opponent?.memberId ?? room.opponent?.id ?? room.otherMember?.id ?? room.otherMember?.memberId ?? null;
const roomPhoto = room => room.opponentProfileImageUrl || room.opponentProfileImage || room.opponentProfileUrl || room.otherMemberProfileImageUrl || room.partnerProfileImageUrl || room.profileImageUrl || room.opponent?.profileImageUrl || room.otherMember?.profileImageUrl || '';
async function opponentPhoto(room) {
  const fallback = roomPhoto(room);
  const id = opponentId(room);
  if (id == null) return fallback;
  // A room may already contain a usable image, even when the public profile endpoint is unavailable.
  if (!profileCache.has(String(id))) {
    profileCache.set(String(id), api(`/members/${encodeURIComponent(id)}/public-profile`)
      .then(profile => profile?.profileImageUrl || fallback)
      .catch(error => { console.warn('[채팅 상대 프로필]', error); return fallback; }));
  }
  return (await profileCache.get(String(id))) || fallback;
}
function avatarMarkup(room, cssClass) {
  const name = room.opponentNickname || '이웃';
  return `<span class="${cssClass}" data-chat-avatar="${escapeHTML(String(room.chatRoomId))}" aria-label="${escapeHTML(name)} 프로필">${escapeHTML(name.slice(0, 1))}</span>`;
}
async function fillAvatars(root, list) {
  await Promise.all(list.map(async room => {
    const url = await opponentPhoto(room);
    if (!url) return;
    const el = Array.from(root.querySelectorAll('[data-chat-avatar]')).find(node => node.dataset.chatAvatar === String(room.chatRoomId));
    if (!el || !el.isConnected) return;
    const img = document.createElement('img');
    img.alt = `${room.opponentNickname || '이웃'} 프로필 사진`;
    img.loading = 'lazy';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit';
    img.onerror = () => { img.remove(); }; 
    img.src = url;
    el.replaceChildren(img);
  }));
}
const report = error => { console.error('[NEED IT 채팅]', error); window.alert(error.message || String(error)); };
const isChatVisible = id => activeRoom === id && document.visibilityState === 'visible' && document.hasFocus() && !!document.getElementById('chatHistory') && !document.getElementById('overlay')?.classList.contains('hidden');

function updateUnreadBadge() {
  const count = rooms.reduce((sum, room) => sum + (Number(room.unreadCount) || 0), 0);
  const badge = document.getElementById('chatUnread');
  if (badge) { badge.textContent = count > 99 ? '99+' : String(count); badge.classList.toggle('hidden', count === 0); }
  document.getElementById('headerChats')?.setAttribute('aria-label', count ? `채팅방 목록, 읽지 않은 메시지 ${count}개` : '채팅방 목록');
}

function scheduleRoomRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    try {
      await loadRooms();
      if (activeRoom == null && document.querySelector('.need-chat-compact-list')) await showList();
    } catch (error) { console.warn('[채팅방 갱신]', error); }
  }, 120);
}

async function sendRead(id) {
  // 오직 해당 대화 모달이 실제로 보이고 브라우저에 포커스가 있을 때만 읽음 요청.
  if (!isChatVisible(id) || readInFlight.has(id)) return;
  readInFlight.add(id);
  try {
    await api(`/chats/${id}/read`, { method: 'PATCH' });
    // 서버의 unreadCount가 유일한 기준. 성공 후 목록을 다시 조회한다.
    await loadRooms();
    if (isChatVisible(id)) await refreshMessages(id);
  } catch (error) {
    console.warn('[채팅 읽음 처리]', error);
  } finally {
    readInFlight.delete(id);
  }
}

function connect() {
  if (!usableToken() || client?.active) return;
  connectedToken=token();
  client = authenticatedClient({
    brokerURL: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:8080/ws`,
    connectHeaders: { Authorization: `Bearer ${token()}` },
    reconnectDelay: 4000,
    debug: () => {},
    onConnect: () => {
      roomSubscription=null;readSubscription=null;listSubscriptions=[];conversationSubscriptions=[];
      if (activeRoom) subscribe(activeRoom);
      else subscribeListRooms();
      scheduleRoomRefresh();
    },
    onStompError: frame => console.warn('[채팅 STOMP]', frame.headers.message),
    onWebSocketError: error => console.warn('[채팅 연결]', error)
  });
  client.activate();
}

function clearListSubscriptions() {
  listSubscriptions.forEach(subscription => subscription.unsubscribe());
  listSubscriptions = [];
}

function subscribeListRooms() {
  clearListSubscriptions();
  if (!client?.connected || activeRoom != null || !document.querySelector('.need-chat-compact-list')) return;
  rooms.forEach(room => {
    listSubscriptions.push(client.subscribe(`/topic/chats/${room.chatRoomId}`, () => {
      scheduleRoomRefresh();
    }));
    listSubscriptions.push(client.subscribe(`/topic/chats/${room.chatRoomId}/read`, () => {
      scheduleRoomRefresh();
    }));
  });
}

function subscribe(id) {
  conversationSubscriptions.forEach(sub => sub.unsubscribe());
  conversationSubscriptions = [];
  roomSubscription?.unsubscribe();
  readSubscription?.unsubscribe();
  clearListSubscriptions();
  if (!client?.connected) return;
  const ids = activeConversationRooms.length ? activeConversationRooms.map(r => r.chatRoomId) : [id];
  conversationSubscriptions = ids.flatMap(roomId => [
    client.subscribe(`/topic/chats/${roomId}`, async () => {
      if (activeRoom !== id) return;
      await refreshMessages(id);
      if (isChatVisible(id)) await Promise.all(ids.map(otherId => api(`/chats/${otherId}/read`, {method:'PATCH'}).catch(console.warn)));
      scheduleRoomRefresh();
    }),
    client.subscribe(`/topic/chats/${roomId}/read`, () => { if (activeRoom === id) refreshMessages(id); scheduleRoomRefresh(); })
  ]);
  return;
  roomSubscription = client.subscribe(`/topic/chats/${id}`, async () => {
    if (activeRoom !== id) return;
    await refreshMessages(id);
    await sendRead(id);
    scheduleRoomRefresh();
  });
  readSubscription = client.subscribe(`/topic/chats/${id}/read`, () => {
    if (activeRoom === id) refreshMessages(id);
    scheduleRoomRefresh();
  });
}

async function refreshMessages(id) {
  const selectedRooms = activeConversationRooms.length ? activeConversationRooms : [{chatRoomId:id}];
  const collections = await Promise.all(selectedRooms.map(async room => {
    try { const messages = await api(`/chats/${room.chatRoomId}/messages`); return Array.isArray(messages) ? messages : []; }
    catch (error) { console.warn('[이전 대화 조회]', room.chatRoomId, error); return []; }
  }));
  const messages = collections.flat().sort((a,b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  if (activeRoom !== id) return;
  const element = document.getElementById('chatHistory');
  if (!element) return;
  const me = JSON.parse(sessionStorage.getItem('needit_member_session_v2') || 'null');
  const myId = me?.memberId;
  element.innerHTML = (Array.isArray(messages) ? messages : []).map(message => {
    const mine = String(message.senderId) === String(myId);
    const photo = String(message.messageType).toUpperCase() === 'IMAGE';
    const content = photo
      ? `<img class="need-talk-photo" src="${escapeHTML(message.content)}" alt="채팅 사진">`
      : escapeHTML(message.content);
    const time = message.createdAt ? new Date(message.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '';
    return `<div class="need-talk-line ${mine ? 'mine' : ''} ${photo ? 'photo' : ''}"><div class="need-talk-bubble">${content}</div><small>${escapeHTML(time)}${mine ? ' · ' + (message.readAt ? '읽음' : '안 읽음') : ''}</small></div>`;
  }).join('') || '<div class="need-talk-empty">아직 메시지가 없어요.<br>인사를 건네 대화를 시작해 보세요.</div>';
  element.scrollTop = element.scrollHeight;
}

async function loadRooms() {
  if (!token()) return [];
  const generation = ++roomLoadGeneration;
  const response = await api('/chats');
  if (generation !== roomLoadGeneration) return rooms;
  rooms = Array.isArray(response) ? response : [];
  updateUnreadBadge();
  return rooms;
}

async function open(offerId) {
  try {
    connect();
    const list = await loadRooms();
    const room = list.find(item => String(item.offerId) === String(offerId)) || list.find(item => String(item.chatRoomId) === String(offerId));
    if (!room) { alert('이 제안의 채팅방을 찾지 못했어요. 제안이 수락되었는지 확인해 주세요.'); return; }
    activeConversationRooms = list.filter(item => opponentId(item) != null && String(opponentId(item)) === String(opponentId(room)));
    if (!activeConversationRooms.length) activeConversationRooms = [room];
    const sendRoom = activeConversationRooms.find(item => item.canSendMessage);
    activeRoom = room.chatRoomId;
    clearListSubscriptions();
    const modal = window.NEEDIT_CHAT_SHOW_MODAL;
    if (typeof modal !== 'function') throw Error('채팅 UI를 열 수 없습니다.');
    modal('채팅', `<div class="need-talk"><div class="need-talk-top">${avatarMarkup(room, 'need-talk-avatar')}<div class="need-talk-name-row"><strong>${escapeHTML(room.opponentNickname || '이웃')}</strong><span class="need-talk-state">이웃과의 대화</span></div></div><div class="need-talk-messages" id="chatHistory"></div><div id="chatDraftPreview" class="need-chat-draft" hidden></div><form id="chatForm" class="need-talk-compose"><button type="button" class="need-photo-add" id="chatPhotoButton" aria-label="사진 보내기">＋</button><input type="file" id="chatPhotoInput" accept="image/*" hidden><textarea id="chatInput" rows="1" maxlength="2000" placeholder="메시지를 입력하세요" aria-label="채팅 메시지"></textarea><button class="primary" type="submit">전송</button></form><div class="need-talk-footer"><button class="outline" type="button" id="chatListBack">← 채팅 목록</button></div></div>`);
    if (opponentId(room) != null) profileCache.delete(String(opponentId(room)));
    await fillAvatars(document, [room]);
    document.querySelector('.need-talk-avatar')?.addEventListener('click', () => { if (typeof window.openNeighborProfile === 'function') window.openNeighborProfile(room.opponentNickname, null, opponentId(room)); });
    document.getElementById('chatListBack').onclick = () => {
      activeRoom = null;
      scheduleRoomRefresh();
      roomSubscription?.unsubscribe();
      readSubscription?.unsubscribe();
      conversationSubscriptions.forEach(sub => sub.unsubscribe());
      conversationSubscriptions = [];
      activeConversationRooms = [];
      window.NEEDIT_CHAT_CLOSE_MODAL?.();
      window.NEEDIT_CHAT_SHOW_LIST?.();
    };
    document.getElementById('chatPhotoButton').onclick = () => document.getElementById('chatPhotoInput').click();
    document.getElementById('chatPhotoInput').onchange = async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { alert('이미지만 보낼 수 있어요.'); return; }
      const form = new FormData();
      form.append('file', file);
      if (!sendRoom) { alert('현재 대화할 수 있는 거래가 없어요.'); return; }
      try { await api(`/chats/${sendRoom.chatRoomId}/images`, { method: 'POST', body: form }); await refreshMessages(room.chatRoomId); }
      catch (error) { report(error); }
      finally { event.target.value = ''; }
    };
    const input = document.getElementById('chatInput');
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        document.getElementById('chatForm').requestSubmit();
      }
    });
    document.getElementById('chatForm').onsubmit = event => {
      event.preventDefault();
      const content = input.value.trim();
      if (!content) return;
      if (!sendRoom) { alert('현재 대화할 수 있는 거래가 없어요.'); return; }
      if (!client?.connected) { alert('채팅 서버에 연결 중이에요. 잠시 후 다시 시도해 주세요.'); return; }
      client.publish({ destination: `/app/chats/${sendRoom.chatRoomId}/send`, body: JSON.stringify({ content }) });
      input.value = '';
    };
    document.getElementById('chatHistory').onclick = event => {
      const image = event.target.closest('.need-talk-photo');
      if (image) window.open(image.src, '_blank', 'noopener,noreferrer');
    };
    await refreshMessages(room.chatRoomId);
    subscribe(room.chatRoomId);
    // 포커스는 모달이 열리기 전에 닫기 버튼으로 이동할 수 있으므로 다음 틱에 확인.
    setTimeout(() => { if (isChatVisible(room.chatRoomId)) Promise.all(activeConversationRooms.map(r => api(`/chats/${r.chatRoomId}/read`, {method:'PATCH'}).catch(console.warn))).then(() => loadRooms()); }, 0);
  } catch (error) { report(error); }
}

const messagePreview = message => String(message.messageType).toUpperCase() === 'IMAGE'
  ? '📷 사진' : String(message.content ?? '');

async function showList() {
  const generation = ++listGeneration;
  try {
    const list = await loadRooms();
    const target = document.getElementById('userContent') || document.querySelector('[data-user-content]');
    if (!target || generation !== listGeneration) return false;
    // 채팅방 API에는 마지막 메시지 필드가 없으므로 기존 메시지 조회 API에서 마지막 1건을 가져온다.
    const latest = await Promise.all(list.map(async room => {
      try {
        const messages = await api(`/chats/${room.chatRoomId}/messages`);
        return Array.isArray(messages) && messages.length ? messages[messages.length - 1] : null;
      } catch (error) { console.warn('[채팅 미리보기]', room.chatRoomId, error); return null; }
    }));
    if (generation !== listGeneration) return false;
    // One contact row per person; keep each transaction room accessible below it.
    const groups = new Map();
    list.forEach((room, index) => {
      const key = opponentId(room) != null ? `id:${opponentId(room)}` : `name:${room.opponentNickname}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ room, last: latest[index] });
    });
    target.innerHTML = groups.size
      ? `<div class="need-chat-compact-list">${Array.from(groups.values()).map(entries => {
          const first = entries[0].room;
          const mostRecent = entries.find(entry => entry.last) || entries[0];
          const preview = mostRecent.last ? messagePreview(mostRecent.last) : '아직 대화가 없어요.';
          const unread = entries.reduce((sum, entry) => sum + (Number(entry.room.unreadCount) || 0), 0);
          const time = mostRecent.last?.createdAt ? new Date(mostRecent.last.createdAt).toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit'}) : '';
          return `<div class="need-chat-compact-row need-chat-contact"><button type="button" class="need-chat-main" data-chat-group="${escapeHTML(first.chatRoomId)}">${avatarMarkup(first, 'need-chat-person-avatar')}<span class="need-chat-person-body"><strong>${escapeHTML(first.opponentNickname || '이웃')}</strong><span class="need-chat-person-preview">${escapeHTML(preview)}</span></span><span class="need-chat-side">${time ? `<span class="need-chat-time">${escapeHTML(time)}</span>` : ''}${unread ? `<span class="need-chat-unread">${unread}</span>` : ''}</span></button></div>`;
        }).join('')}</div>`
      : '<div class="user-empty">아직 채팅방이 없어요. 제안을 수락하면 여기서 대화할 수 있어요.</div>';
    profileCache.clear();
    fillAvatars(target, Array.from(groups.values()).map(entries => entries[0].room));
    target.querySelectorAll('[data-chat-group]').forEach(button => button.onclick = () => open(button.dataset.chatGroup));
    subscribeListRooms();
    return true;
  } catch (error) { report(error); return false; }
}

// Open the existing one-to-one conversation from a neighbor profile.
async function openByMember(memberId, nickname) {
  const list = await loadRooms();
  const matching = list.filter(room => memberId != null && opponentId(room) != null && String(opponentId(room)) === String(memberId));
  // Nickname fallback is only for older API responses without opponent IDs.
  const fallback = memberId == null && nickname
    ? list.filter(room => opponentId(room) == null && room.opponentNickname === nickname)
    : [];
  const candidates = matching.length ? matching : fallback;
  if (!candidates.length) return false;
  const preferred = candidates.find(room => room.canSendMessage) || candidates[0];
  return await open(preferred.chatRoomId);
}

document.addEventListener('visibilitychange', () => {
  if (activeRoom != null && isChatVisible(activeRoom)) {
    refreshMessages(activeRoom).then(() => sendRead(activeRoom)).catch(error => console.warn(error));
  }
});
window.addEventListener('focus', () => {
  if (activeRoom != null && isChatVisible(activeRoom)) sendRead(activeRoom);
  else scheduleRoomRefresh();
});

// 모달을 닫으면 해당 채팅방은 더 이상 읽음 처리 대상이 아니다.
const modalObserver = new MutationObserver(() => {
  if (activeRoom != null && document.getElementById('overlay')?.classList.contains('hidden')) {
    activeRoom = null;
    roomSubscription?.unsubscribe();
    readSubscription?.unsubscribe();
    conversationSubscriptions.forEach(sub => sub.unsubscribe());
    conversationSubscriptions = [];
    activeConversationRooms = [];
    scheduleRoomRefresh();
  }
});
const overlay = document.getElementById('overlay');
if (overlay) modalObserver.observe(overlay, { attributes: true, attributeFilter: ['class'] });

window.NEEDIT_CHAT = { open, openByMember, showList, loadRooms, connect, updateUnreadBadge };
function syncChat(){
  const current=usableToken();
  if(current===connectedToken && client?.active)return;
  const identity=t=>{try{return JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).sub}catch{return null}};
  if(identity(current)!==identity(connectedToken)){activeRoom=null;activeConversationRooms=[];rooms=[];profileCache.clear();updateUnreadBadge();}
  const old=client;client=null;connectedToken=null;
  if(old)void old.deactivate();
  roomSubscription=null;readSubscription=null;listSubscriptions=[];conversationSubscriptions=[];
  if(!current){activeRoom=null;activeConversationRooms=[];rooms=[];profileCache.clear();updateUnreadBadge();return;}
  connect();
}
window.addEventListener('needit:auth-changed',syncChat);
watchSession(syncChat);
window.addEventListener('pagehide',()=>client?.deactivate());
connect();
