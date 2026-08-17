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
