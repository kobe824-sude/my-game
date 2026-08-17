// ===================== V1.19 云端排行榜（Supabase） =====================
// 全服共享：所有玩家点开链接玩无限模式，记录都会上传到云端，大家互相可见
// 已配置：kobe824-sude / 狗和猫的旅程 (wfjjhfvtkymoxvfwyfuk)
window.SUPABASE_URL = 'https://wfjjhfvtkymoxvfwyfuk.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_C7RktGCAk5t_MIIUTsDsbA_NmP_H5vh';

// ===================== V1.0 云端账号（好友/联机地基） =====================
window.cloudSession = null;
try{ window.cloudSession = JSON.parse(localStorage.getItem('milkfrog_cloud_session')||'null'); }catch(e){}
function _cloudHeaders(json){
  const h = { 'apikey': window.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + window.SUPABASE_ANON_KEY };
  if(json) h['Content-Type'] = 'application/json';
  if(window.cloudSession && window.cloudSession.access_token) h['Authorization'] = 'Bearer ' + window.cloudSession.access_token;
  return h;
}
// 云端注册：昵称+密码（内部用随机隐藏邮箱，玩家无感）
function cloudRegister(nickname, password){
  const URL = window.SUPABASE_URL.replace(/\/$/,'');
  const email = 'u' + Math.random().toString(36).slice(2,10) + Date.now().toString(36) + '@example.com';
  return fetch(URL + '/auth/v1/signup', {
    method: 'POST',
    headers: { 'apikey': window.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: password })
  }).then(r => r.json().then(function(d){
    if(!r.ok || !d.user || !d.user.id){ throw new Error(d && d.msg ? String(d.msg) : '注册失败'); }
    const userId = d.user.id;
    // 写入玩家资料表（昵称全局唯一）
    return fetch(URL + '/rest/v1/players', {
      method: 'POST',
      headers: { 'apikey': window.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + d.access_token, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({ id: userId, nickname: nickname, auth_email: email })
    }).then(function(pr){
      return pr.json().catch(function(){ return {}; }).then(function(pd){
        const okRow = Array.isArray(pd) ? pd[0] : pd;
        if(!pr.ok || !okRow || !okRow.id){
          const em = (pd && pd.message) ? String(pd.message) : '';
          throw new Error(em.indexOf('duplicate')>=0 ? '该昵称已被占用，请换一个' : '注册失败，请重试');
        }
        return cloudLogin(nickname, password);
      });
    });
  }));
}
window.cloudRegister = cloudRegister;
// 云端登录：用昵称反查隐藏邮箱再登录
function cloudLogin(nickname, password){
  const URL = window.SUPABASE_URL.replace(/\/$/,'');
  return fetch(URL + '/rest/v1/players?nickname=eq.' + encodeURIComponent(nickname) + '&select=auth_email&limit=1', {
    headers: _cloudHeaders()
  }).then(function(r){ return r.json(); }).then(function(rows){
    if(!rows || !rows.length || !rows[0] || !rows[0].auth_email){ throw new Error('云端账号不存在，请先注册'); }
    const email = rows[0].auth_email;
    return fetch(URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'apikey': window.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    }).then(function(r){
      if(!r.ok){ return r.json().then(function(er){ throw new Error(er && er.msg ? String(er.msg) : '密码错误或登录失败'); }); }
      return r.json();
    }).then(function(d){
      if(!d.access_token){ throw new Error('登录失败'); }
      window.cloudSession = { access_token: d.access_token, user_id: d.user && d.user.id, email: email, nickname: nickname };
      try{ localStorage.setItem('milkfrog_cloud_session', JSON.stringify(window.cloudSession)); }catch(e){}
      return window.cloudSession;
    });
  });
}
window.cloudLogin = cloudLogin;
// 云端退出
function cloudLogout(){
  window.cloudSession = null;
  try{ localStorage.removeItem('milkfrog_cloud_session'); }catch(e){}
}
window.cloudLogout = cloudLogout;
// 当前是否已登录云端
function cloudLoggedIn(){ return !!(window.cloudSession && window.cloudSession.access_token); }
window.cloudLoggedIn = cloudLoggedIn;

// ===================== V1.0 好友系统（云端） =====================
function _cloudUid(){ return window.cloudSession && window.cloudSession.user_id; }
// 搜索玩家（按昵称模糊，排除自己）
function cloudSearchPlayers(keyword){
  const URL = window.SUPABASE_URL.replace(/\/$/,'');
  const uid = _cloudUid();
  if(!uid) return Promise.reject(new Error('请先登录云端'));
  return fetch(URL + '/rest/v1/players?nickname=ilike.*' + encodeURIComponent(keyword) + '*&select=id,nickname,avatar,last_seen&limit=20', { headers: _cloudHeaders() })
    .then(function(r){ return r.json(); }).then(function(rows){
      return (Array.isArray(rows)?rows:[]).filter(function(p){ return p && p.id !== uid; });
    });
}
window.cloudSearchPlayers = cloudSearchPlayers;
// 发送好友申请
function cloudSendFriendRequest(toPlayerId){
  const URL = window.SUPABASE_URL.replace(/\/$/,'');
  const uid = _cloudUid();
  if(!uid) return Promise.reject(new Error('请先登录云端'));
  return fetch(URL + '/rest/v1/friends', {
    method: 'POST',
    headers: _cloudHeaders(true),
    body: JSON.stringify({ user_a: uid, user_b: toPlayerId, status: 'pending' })
  }).then(function(r){ if(!r.ok) throw new Error('发送失败(可能已申请过或已是好友)'); return true; });
}
window.cloudSendFriendRequest = cloudSendFriendRequest;
// 我的全部好友关系（含对方信息）
function cloudMyFriends(){
  const URL = window.SUPABASE_URL.replace(/\/$/,'');
  const uid = _cloudUid();
  if(!uid) return Promise.reject(new Error('请先登录云端'));
  return fetch(URL + '/rest/v1/friends?or=(user_a.eq.' + uid + ',user_b.eq.' + uid + ')&select=id,user_a,user_b,status,created_at&order=created_at.desc', { headers: _cloudHeaders() })
    .then(function(r){ return r.json(); }).then(function(rows){
      rows = Array.isArray(rows)?rows:[];
      const ids = [];
      rows.forEach(function(f){ const o = f.user_a === uid ? f.user_b : f.user_a; if(ids.indexOf(o)<0) ids.push(o); });
      if(!ids.length) return [];
      return fetch(URL + '/rest/v1/players?id=in.(' + ids.join(',') + ')&select=id,nickname,avatar,last_seen', { headers: _cloudHeaders() })
        .then(function(pr){ return pr.json(); }).then(function(players){
          const pmap = {};
          (Array.isArray(players)?players:[]).forEach(function(p){ if(p) pmap[p.id]=p; });
          return rows.map(function(f){
            const oid = f.user_a === uid ? f.user_b : f.user_a;
            const p = pmap[oid] || { nickname:'?', avatar:'', last_seen:null };
            return { id: f.id, otherId: oid, nickname: p.nickname, avatar: p.avatar, last_seen: p.last_seen, status: f.status, incoming: (f.user_b === uid) };
          });
        });
    });
}
window.cloudMyFriends = cloudMyFriends;
// 接受/拒绝好友申请（accept=true接受，false拒绝/删除）
function cloudRespondFriend(friendId, accept){
  const URL = window.SUPABASE_URL.replace(/\/$/,'');
  if(accept){
    return fetch(URL + '/rest/v1/friends?id=eq.' + friendId, { method: 'PATCH', headers: _cloudHeaders(true), body: JSON.stringify({ status: 'accepted' }) })
      .then(function(r){ if(!r.ok) throw new Error('接受失败'); return true; });
  }
  return fetch(URL + '/rest/v1/friends?id=eq.' + friendId, { method: 'DELETE', headers: _cloudHeaders() })
    .then(function(r){ if(!r.ok) throw new Error('操作失败'); return true; });
}
window.cloudRespondFriend = cloudRespondFriend;
// 删除好友
function cloudRemoveFriend(friendId){
  const URL = window.SUPABASE_URL.replace(/\/$/,'');
  return fetch(URL + '/rest/v1/friends?id=eq.' + friendId, { method: 'DELETE', headers: _cloudHeaders() })
    .then(function(r){ if(!r.ok) throw new Error('删除失败'); return true; });
}
window.cloudRemoveFriend = cloudRemoveFriend;
// 在线心跳：每30秒更新一次 last_seen
function cloudHeartbeat(){
  const uid = _cloudUid();
  if(!uid) return;
  const URL = window.SUPABASE_URL.replace(/\/$/,'');
  fetch(URL + '/rest/v1/players?id=eq.' + uid, { method: 'PATCH', headers: _cloudHeaders(true), body: JSON.stringify({ last_seen: new Date().toISOString() }) }).catch(function(){});
}
window.cloudHeartbeat = cloudHeartbeat;
// 是否在线（last_seen 90秒内）
function cloudIsOnline(lastSeen){
  if(!lastSeen) return false;
  const t = new Date(lastSeen).getTime();
  return (Date.now() - t) < 90000;
}
window.cloudIsOnline = cloudIsOnline;

// ===================== V1.0 好友私聊 =====================
// 发送消息
function cloudSendMessage(receiverId, content){
  const URL = window.SUPABASE_URL.replace(/\/$/,'');
  const uid = _cloudUid();
  if(!uid) return Promise.reject(new Error('请先登录云端'));
  const text = String(content==null?'':content).slice(0, 300);
  if(!text.trim()) return Promise.reject(new Error('消息不能为空'));
  return fetch(URL + '/rest/v1/messages', {
    method: 'POST',
    headers: _cloudHeaders(true),
    body: JSON.stringify({ sender_id: uid, receiver_id: receiverId, content: text })
  }).then(function(r){ if(!r.ok) throw new Error('发送失败，请重试'); return true; });
}
window.cloudSendMessage = cloudSendMessage;
// 与某好友的完整聊天记录（时间升序）
function cloudGetMessages(friendId){
  const URL = window.SUPABASE_URL.replace(/\/$/,'');
  const uid = _cloudUid();
  if(!uid) return Promise.reject(new Error('请先登录云端'));
  const f = 'or=(and(sender_id.eq.' + uid + ',receiver_id.eq.' + friendId + '),and(sender_id.eq.' + friendId + ',receiver_id.eq.' + uid + '))';
  return fetch(URL + '/rest/v1/messages?' + f + '&select=id,sender_id,content,created_at,is_read&order=created_at.asc&limit=200', { headers: _cloudHeaders() })
    .then(function(r){ return r.json(); }).then(function(rows){ return Array.isArray(rows)?rows:[]; });
}
window.cloudGetMessages = cloudGetMessages;
// 我收到的全部未读消息（返回 sender_id 列表）
function cloudGetUnread(){
  const URL = window.SUPABASE_URL.replace(/\/$/,'');
  const uid = _cloudUid();
  if(!uid) return Promise.resolve([]);
  return fetch(URL + '/rest/v1/messages?receiver_id=eq.' + uid + '&is_read=eq.false&select=sender_id&limit=200', { headers: _cloudHeaders() })
    .then(function(r){ return r.json(); }).then(function(rows){ return Array.isArray(rows)?rows:[]; });
}
window.cloudGetUnread = cloudGetUnread;
// 把来自某好友的未读消息标记为已读
function cloudMarkRead(friendId){
  const URL = window.SUPABASE_URL.replace(/\/$/,'');
  const uid = _cloudUid();
  if(!uid) return Promise.resolve();
  return fetch(URL + '/rest/v1/messages?receiver_id=eq.' + uid + '&sender_id=eq.' + friendId + '&is_read=eq.false', {
    method: 'PATCH',
    headers: _cloudHeaders(true),
    body: JSON.stringify({ is_read: true })
  }).catch(function(){});
}
window.cloudMarkRead = cloudMarkRead;


