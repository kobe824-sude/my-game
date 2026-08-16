




// =====================
// 玩家资源（妙脆角猫）
// =====================
const PLAYER_IDLE_IMAGE="assets/players/miaocuijiao_cat/sprites/miaocat_idle.png";
const PLAYER_RUN_LEFT_IMAGE="assets/players/miaocuijiao_cat/sprites/miaocat_run_left.png";
const PLAYER_RUN_RIGHT_IMAGE="assets/players/miaocuijiao_cat/sprites/miaocat_run_right.png";
const PLAYER_JUMP_IMAGE="assets/players/miaocuijiao_cat/sprites/miaocat_jump.png";

const playerImg=document.getElementById("player");

// =====================
// 图片资源
// =====================


const WALK_FRAMES=[

"assets/enemies/milk_frog/sprites/Walker01.png",

"assets/enemies/milk_frog/sprites/Walker02.png",

"assets/enemies/milk_frog/sprites/Walker03.png",

"assets/enemies/milk_frog/sprites/Walker04.png"

];



const ALERT_IMAGE=

"assets/enemies/milk_frog/sprites/Alert.png";



const ATTACK_IMAGE=

"assets/enemies/milk_frog/sprites/Attack.png";

const HURT_IMAGE="assets/enemies/milk_frog/sprites/Hurt.png";
const DEAD_IMAGE="assets/enemies/milk_frog/sprites/Dead.png";
const MOUSE_IDLE_IMAGE="assets/enemies/milk_mouse/sprites/mouse_idle.png";
const MOUSE_CROUCH_IMAGE="assets/enemies/milk_mouse/sprites/mouse_crouch.png";
const MOUSE_DEAD_IMAGE="assets/enemies/milk_mouse/sprites/mouse_dead.png";
const BOOM_IMAGE="assets/enemies/boom_frog/boom_frog.png";
const BOSS_IMAGE="assets/enemies/boss/boss1.png";
const BOSS_QUAKE_AUDIO="assets/audio/boss/boss1_quake.mp3";
const QUAKE_WAVE_IMAGE="assets/enemies/boss/quake_wave.png";
const BOSS_BGM="assets/audio/boss/boss_bgm.mp3";
const BOSS_BATTLE_BGM="assets/audio/boss/boss_battle.mp3"; // 宗主赐力后的激战BGM
const ANNIHILATION_IMAGE="assets/enemies/boss/annihilation.png"; // 剧情杀·暗影湮灭
const DARK_BREATH_IMAGE="assets/enemies/boss/dark_breath.png";
window.l15Phase = 0; // 0=非15关 1=完全体 2=削弱
window.l15UltimateBoost = false; // 15关首次：R大招3秒冷却
window.bossTimeLeft = 0;
window.bossStartTime = 0;
window.l15LockControls = false;
window.l15PlotKilled = false;
window.l15StoryRunning = false;
window.l15CdBoost = false; // 第15关第二场：全技能冷却减半

function enemyImgSrc(e, kind){
  if(e && e.images && e.images[kind]){
    const v = e.images[kind];
    return Array.isArray(v) ? v[0] : v;
  }
  if(kind==='walk') return WALK_FRAMES[0];
  if(kind==='alert') return ALERT_IMAGE;
  if(kind==='attack') return ATTACK_IMAGE;
  if(kind==='hurt') return HURT_IMAGE;
  if(kind==='dead') return DEAD_IMAGE;
  return WALK_FRAMES[0];
}




// =====================
// AI参数
// =====================


const DETECT_RANGE=900;


const KEEP_DISTANCE=500;
const ATTACK_RANGE=650;
const DANGER_DISTANCE=120;
const MAX_RETREAT=2;
const RETREAT_DISTANCE=220;


const SPEED=0.4;

// V1.1 战斗区域边界
const WORLD_LEFT=0;
const WORLD_RIGHT=window.innerWidth-80;



// 冲击波

const WAVE_SPEED=1.15;


const WAVE_HEIGHT=0; // V1.6 dynamic height



//伤害

const WAVE_DAMAGE=5; // 普通奶蛙攻击5



const COOLDOWN_TIME=3200;







// =====================
// 获取元素
// =====================


let frogImg=

document.getElementById("frog");


const enemyObj=document.getElementById("player");
const oldPlayerPlaceholder=document.getElementById("enemy");
if(oldPlayerPlaceholder){oldPlayerPlaceholder.style.display="none";}

// V1.0.1 MiaoCat real player render
function updateMiaCatSprite(){
    // V4.4.18: 妙脆角真实渲染绑定修复
    const target = document.getElementById("player") || enemyObj;
    if(!target) return;

    const currentHorns = (window.miaocat && typeof window.miaocat.horns === "number")
        ? window.miaocat.horns
        : (typeof miaocatCorn === "number" ? miaocatCorn : 2);

    const count = Math.max(0, Math.min(2, currentHorns));

    if(count === 2){
        target.src = CORN_NORMAL_IMAGE;
    }else if(count === 1){
        target.src = CORN_ONE_IMAGE;
    }else{
        target.src = CORN_ZERO_IMAGE;
    }

    target.setAttribute("data-horns", String(count));
}

let playerMaxHp=60;
let playerHp=60;
window.playerShield = 0;
const PLAYER_SHIELD_MAX=50;
window.playerMaxHp=playerMaxHp;
window.playerHp=playerHp;
window.healCooldownLeft=0;
let playerDead=false;
let gameEnded=false;
let playerHurtCooldown=false;
let gameOverBox=null;

// =====================
// V5.0 角色选择系统（妙脆角猫 / 刀盾狗）
// =====================
let activeCharacter='miaocuijiao_cat';
window.activeCharacter=activeCharacter;
window.player={ name:'妙脆角猫', hp:60, maxHp:60 };

function selectCharacter(name){
    activeCharacter = name;
    window.activeCharacter = name;
    if(name==='daodungou'){
        currentPlayerSpeed=4;
        currentJumpPower=22;
        currentMaxJumps=1; // 刀盾狗只有一段跳
        playerMaxHp=80 + 8*(charLevel()-1) + talentHpBonus();
        playerHp=playerMaxHp;
        window.playerMaxHp=playerMaxHp;
        window.playerHp=playerHp;
        window.basePlayerMaxHp=100;
        if(playerImg){ playerImg.src="assets/players/daodungou/sprites/daodungou_idle.png"; playerImg.style.width="140px"; playerImg.style.height="140px"; }
        if(window.DOG) window.DOG.reset();
    }else{
        currentPlayerSpeed=6;
        currentJumpPower=18;
        currentMaxJumps=2;
        playerMaxHp=40 + 6*(charLevel()-1) + talentHpBonus();
        playerHp=playerMaxHp;
        window.playerMaxHp=playerMaxHp;
        window.playerHp=playerHp;
        window.basePlayerMaxHp=50;
        if(playerImg){ playerImg.src="assets/players/miaocuijiao_cat/sprites/miaocat_idle.png"; playerImg.style.width="100px"; playerImg.style.height="100px"; }
    }
    window.player={ name:(name==='daodungou'?'刀盾狗':'妙脆角猫'), hp:playerHp, maxHp:playerMaxHp, attack:(name==='daodungou'?(11+charLevel()-1):(13+charLevel()-1)) }; // 猫普攻>狗，初始都不高
    const cards=document.querySelectorAll('.charCard');
    cards.forEach(c=>c.classList.remove('selected'));
    const card=document.getElementById('card_'+name);
    if(card) card.classList.add('selected');
    const btn=document.getElementById('startBtn');
    if(btn) btn.disabled=false;
    updatePlayerHP();
    if(window.applySkillLabels) window.applySkillLabels(name);
    if(window.updateV13UI) window.updateV13UI();
}
window.selectCharacter=selectCharacter;


let waveObj=

document.getElementById("wave");


const info=document.getElementById("info");
if(info){ info.style.display="none"; }


const hpBox=

document.getElementById("hpBox");


const hpFill=

document.getElementById("hpFill");


const hpText=

document.getElementById("hpText");


const attackSound=

document.getElementById("attackSound");


const hurtSound=

document.getElementById("hurtSound");






// =====================
// 数据
// =====================


let frogHpBox;
let frogAttackTimer=null;
let frogAttackEndTimer=null;
let retreatCount=0;
let stickStart=0;
let attackFireTimer=null;
let attackSoundTimer=null;
let hurtSoundCooldown=false;

// =====================
// V5.5 序章剧情（黑屏白字，点击推进）
// =====================
const PROLOGUE_LINES = [
  "很久很久以前，伊莉大陆上，奶蛙、妙脆角猫和刀盾狗世代和睦相处。",
  "三族共同守护着一块蕴含光明之力的「依门魔法石」——它让草原四季常青、让所有居民安居乐业。",
  "然而有一天，奶蛙族首领在古老遗迹中意外触碰到沉睡的黑暗力量，被彻底吞噬了心智。",
  "他夺走了依门魔法石，带着被污染的力量消失在迷雾中；整个奶蛙族也随之堕入黑暗，成为他的爪牙。",
  "失去魔法石后，伊莉大陆开始枯萎、混乱，黑雾渐渐蔓延……",
  "身为小小守护者的妙脆角猫与刀盾狗，决定拿起武器踏上旅途——夺回依门魔法石，让光明重照伊莉大陆！"
];
let prologueIdx = 0;
function initPrologue(){
  prologueIdx = 0;
  const el = document.getElementById("prologueText");
  if(el) el.textContent = PROLOGUE_LINES[0];
}
function nextPrologue(){
  prologueIdx++;
  const el = document.getElementById("prologueText");
  if(prologueIdx >= PROLOGUE_LINES.length){ endPrologue(); return; }
  if(el) el.textContent = PROLOGUE_LINES[prologueIdx];
}
function endPrologue(){
  const p = document.getElementById("prologue");
  if(p) p.style.display = "none";
  // 首次进入第1关的序章播完 → 正式开始第1关
  if(window.prologueLevelPending){
    window.prologueLevelPending = false;
    window.prologueResume = true; // 告诉startLevel：这是序章播完后的正式开打，别再弹序章
    if(typeof startLevel==='function') startLevel(0);
    return;
  }
  const m = document.getElementById("mainMenu");
  if(m) m.style.display = "flex";
}
function skipPrologue(){ endPrologue(); }
window.nextPrologue = nextPrologue;
window.skipPrologue = skipPrologue;

// =====================
// V5.9 账号 / 存档（localStorage）
// =====================
window.accountName = null;
window.accountMaxUnlocked = 1;
    window.accountAchievements = window.accountAchievements || {};
window.accountQUnlocked = false;
window.accountRUnlocked = false;

function doLogin(){
  const nameInput = document.getElementById('loginName');
  const passInput = document.getElementById('loginPass');
  if(!nameInput || !passInput) return;
  const name = nameInput.value.trim();
  const pass = passInput.value;
  if(!name){ alert('请输入账号名字'); return; }
  if(!pass){ alert('请输入密码'); return; }
  if(pass.length < 6){ alert('密码至少 6 位'); return; }
  let accounts = [];
  try{ accounts = JSON.parse(localStorage.getItem('milkfrog_accounts')||'[]'); }catch(e){}
  const existing = accounts.find(a=>a.name === name);
  if(!existing){ alert('账号「'+name+'」不存在，请点击「注册新账号」创建，或选择下方已有账号'); return; }
  if(existing.pass !== pass){ alert('密码错误！'); return; }
  window.accountName = name;
  window.accountPass = pass;
  try{
    let data = null;
    try{ data = JSON.parse(localStorage.getItem('milkfrog_data_'+name+'_'+pass)||'null'); }catch(e){}
    if(!data){ try{ data = JSON.parse(localStorage.getItem('milkfrog_data_'+name)||'null'); }catch(e){} }
    if(data){
      window.inventory = data.inventory || { equipment:[], items:{}, gold:0, xp:0, talent:0, maxItems:10, souvenirs:[], expansionCount:0 };
      window.inventory.maxItems = 10;
      window.inventory.expansionCount = 0;
      window.accountMaxUnlocked = data.maxUnlocked || 1;
      window.accountCleared = data.cleared || {};
      window.accountHardCleared = data.hardCleared || {};
      window.accountL15Seen = !!data.l15Seen;
      window.accountQUnlocked = !!data.qUnlocked;
      window.accountRUnlocked = !!data.rUnlocked;
      window.accountTrainingUnlocked = !!data.trainingUnlocked;
      // 老存档迁移：已获得Q技能的玩家自动解锁训练营
      if(window.accountQUnlocked && !window.accountTrainingUnlocked){ window.accountTrainingUnlocked = true; }
      window.accountAchievements = data.achievements || {}; // 读取已获成就，刷新后不会丢失/重复触发
      // 版本迁移：Boss从15关移到16关，通关过旧15关的玩家自动解锁新16关
      if(window.accountCleared && window.accountCleared[14] && !window.accountCleared[15]){
        window.accountCleared[15] = true;
      }
    } else {
      window.inventory = { equipment:[], items:{}, gold:0, xp:0, talent:0, maxItems:10, souvenirs:[], expansionCount:0 };
      window.accountMaxUnlocked = 1;
      window.accountAchievements = window.accountAchievements || {};
      window.accountCleared = {};
      window.accountHardCleared = {};
      window.accountQUnlocked = false;
      window.accountRUnlocked = false;
      window.accountTrainingUnlocked = false;
    }
  }catch(e){}
  // 版本迁移：旧版「skill」Q升级统一并入「skillQ」（Q技能强化独立升级）
  if(window.inventory && window.inventory.skillLevels){
    const sl = window.inventory.skillLevels;
    if(sl.skill && !sl.skillQ){ sl.skillQ = sl.skill; }
    delete sl.skill;
  }
  // 恢复头像：优先账号列表，其次独立头像存档（版本更新后头像不丢）
  try{
    let av = null;
    const accNow = accounts.find(a=>a.name===name);
    if(accNow && accNow.avatar) av = accNow.avatar;
    if(!av){
      try{ av = localStorage.getItem('milkfrog_avatar_'+name+'_'+pass) || localStorage.getItem('milkfrog_avatar_'+name) || null; }catch(e3){}
    }
    window.accountAvatar = av || null;
    if(av && accNow && !accNow.avatar){ accNow.avatar = av; localStorage.setItem('milkfrog_accounts', JSON.stringify(accounts)); }
  }catch(e){}
  // 记住密码
  const rem = document.getElementById('loginRemember');
  try{
    if(rem && rem.checked){ localStorage.setItem('milkfrog_remember', JSON.stringify({name, pass})); }
    else { localStorage.removeItem('milkfrog_remember'); }
  }catch(e){}
  const lg = document.getElementById('login'); if(lg) lg.style.display='none';
  if(typeof renderAccountList==='function') renderAccountList();
  showMainMenu();
}
window.doLogin = doLogin;

function showRegister(){
  // V15.2 登录/注册左右并排，两个卡片始终同时显示
  const lc = document.getElementById('loginCard'); if(lc) lc.style.display='block';
  const rc = document.getElementById('registerCard'); if(rc) rc.style.display='block';
  // 把登录框里已输入的名字带过去，方便修改
  const ln = document.getElementById('loginName');
  const rn = document.getElementById('registerName');
  if(rn && ln && ln.value.trim()) rn.value = ln.value.trim();
  if(typeof checkRegisterName==='function') checkRegisterName();
}
window.showRegister = showRegister;
function showLogin(){
  const lc = document.getElementById('loginCard'); if(lc) lc.style.display='block';
  const rc = document.getElementById('registerCard'); if(rc) rc.style.display='block';
  if(typeof renderAccountList==='function') renderAccountList();
  if(typeof checkLoginName==='function') checkLoginName();
}
window.showLogin = showLogin;
function checkRegisterName(){
  const name = document.getElementById('registerName');
  const pass = document.getElementById('registerPass');
  const warn = document.getElementById('registerWarn');
  if(!name || !pass || !warn) return;
  let accounts = [];
  try{ accounts = JSON.parse(localStorage.getItem('milkfrog_accounts')||'[]'); }catch(e){}
  const nm = name.value.trim();
  warn.style.display = 'none';
  if(!nm) return;
  if(accounts.some(a=>a.name === nm)){
    warn.style.display = 'block';
    warn.style.color = '#e85b4b';
    warn.textContent = '⚠ 该昵称已被使用，请换一个';
  } else if(pass.value && pass.value.length < 6){
    warn.style.display = 'block';
    warn.style.color = '#e85b4b';
    warn.textContent = '⚠ 密码至少 6 位';
  } else {
    warn.style.display = 'block';
    warn.style.color = '#2e9e3f';
    warn.textContent = '✓ 昵称可用，可以注册';
  }
}
window.checkRegisterName = checkRegisterName;

function doRegister(){
  const nameInput = document.getElementById('registerName');
  const passInput = document.getElementById('registerPass');
  if(!nameInput || !passInput) return;
  const name = nameInput.value.trim();
  const pass = passInput.value;
  if(!name){ alert('请输入账号名字'); return; }
  if(!pass){ alert('请输入密码'); return; }
  if(pass.length < 6){ alert('密码至少 6 位'); return; }
  let accounts = [];
  try{ accounts = JSON.parse(localStorage.getItem('milkfrog_accounts')||'[]'); }catch(e){}
  if(accounts.some(a=>a.name === name)){ alert('该昵称已被使用，请换个名字'); return; }
  if(accounts.length >= 10){ alert('本设备账号数量已达上限（10个），请换一台设备再创建'); return; }
  accounts.push({ name: name, pass: pass });
  try{ localStorage.setItem('milkfrog_accounts', JSON.stringify(accounts)); }catch(e){}
  // 记住密码（注册时勾选）
  const rem = document.getElementById('regRemember');
  try{
    if(rem && rem.checked){ localStorage.setItem('milkfrog_remember', JSON.stringify({name, pass})); }
    else { localStorage.removeItem('milkfrog_remember'); }
  }catch(e){}
  // 回到登录页：新账号已保存，直接点账号或填号登录
  const ln = document.getElementById('loginName'); if(ln) ln.value = name;
  const lp = document.getElementById('loginPass'); if(lp) lp.value = pass;
  showLogin();
  alert('✅ 注册成功！账号「'+name+'」已保存，点「登录」即可进入');
}
window.doRegister = doRegister;function restoreRemember(){
  try{
    const r = JSON.parse(localStorage.getItem('milkfrog_remember')||'null');
    if(r){
      const n = document.getElementById('loginName'); if(n) n.value = r.name;
      const p = document.getElementById('loginPass'); if(p) p.value = r.pass;
      const ch = document.getElementById('loginRemember'); if(ch) ch.checked = true;
    }
  }catch(e){}
}
window.restoreRemember = restoreRemember;

// 本设备已保存的账号列表（最多10个）：显示并可直接选择
function renderAccountList(){
  const box = document.getElementById('accountList');
  if(!box) return;
  let accounts = [];
  try{ accounts = JSON.parse(localStorage.getItem('milkfrog_accounts')||'[]'); }catch(e){}
  if(!accounts.length){ box.innerHTML = ''; return; }
  let html = '<div class="accTitle">👥 本设备账号（'+accounts.length+'/10）</div>';
  accounts.forEach((a,i)=>{
    html += '<div class="accItem" onclick="selectAccount('+i+')"><span class="accNum">'+(i+1)+'</span> <span class="accName">'+a.name+'</span><span class="accDel" onclick="event.stopPropagation();deleteAccount('+i+')">✕</span></div>';
  });
  box.innerHTML = html;
}
window.renderAccountList = renderAccountList;
function selectAccount(i){
  let accounts = [];
  try{ accounts = JSON.parse(localStorage.getItem('milkfrog_accounts')||'[]'); }catch(e){}
  const a = accounts[i]; if(!a) return;
  const n = document.getElementById('loginName'); if(n) n.value = a.name;
  const p = document.getElementById('loginPass');
  if(p){ p.value = a.pass; } // 选账号总是自动填密码（本机已保存）
  if(typeof checkLoginName==='function') checkLoginName(); // 选账号后提示“已有账号：登录”
}
window.selectAccount = selectAccount;
// 删除账号：二次确认后删除该账号及全部进度
function deleteAccount(i){
  let accounts = [];
  try{ accounts = JSON.parse(localStorage.getItem('milkfrog_accounts')||'[]'); }catch(e){}
  const a = accounts[i]; if(!a) return;
  const ov = document.createElement('div');
  ov.id = 'confirmPanel';
  ov.innerHTML = '<div class="confirmCard"><div class="confirmTitle">⚠️ 删除账号「'+a.name+'」？</div>' +
    '<div class="confirmText">该账号的全部进度将被永久删除，且无法找回！</div>' +
    '<div class="confirmBtns"><button class="confirmYes" onclick="doDeleteAccount('+i+',true)">确定删除</button>' +
    '<button class="confirmNo" onclick="doDeleteAccount('+i+',false)">取消</button></div></div>';
  document.body.appendChild(ov);
}
window.deleteAccount = deleteAccount;
function doDeleteAccount(i, ok){
  const el = document.getElementById('confirmPanel'); if(el) el.remove();
  if(!ok) return;
  let accounts = [];
  try{ accounts = JSON.parse(localStorage.getItem('milkfrog_accounts')||'[]'); }catch(e){}
  const a = accounts[i]; if(!a) return;
  accounts.splice(i,1);
  try{ localStorage.setItem('milkfrog_accounts', JSON.stringify(accounts)); }catch(e){}
  try{ localStorage.removeItem('milkfrog_data_'+a.name+'_'+a.pass); }catch(e){}
  try{ localStorage.removeItem('milkfrog_data_'+a.name); }catch(e){}
  // 如果是当前登录账号，顺便退出登录
  if(window.accountName === a.name){ if(typeof logoutToLogin==='function') logoutToLogin(); }
  if(typeof renderAccountList==='function') renderAccountList();
}
window.doDeleteAccount = doDeleteAccount;

function checkLoginName(){
  // 智能提示：已有账号→点「登录」；新昵称→点「注册新账号」；密码至少6位
  const name = document.getElementById('loginName');
  const pass = document.getElementById('loginPass');
  const warn = document.getElementById('loginNameWarn');
  if(!name || !pass || !warn) return;
  let accounts = [];
  try{ accounts = JSON.parse(localStorage.getItem('milkfrog_accounts')||'[]'); }catch(e){}
  const nm = name.value.trim();
  const exists = accounts.some(a=>a.name === nm);
  warn.style.display = 'none';
  if(!nm) return;
  if(exists){
    warn.style.display = 'block';
    warn.style.color = '#2e9e3f';
    warn.textContent = '✓ 已有账号：点击「登录」进入';
  } else if(pass.value && pass.value.length < 6){
    warn.style.display = 'block';
    warn.style.color = '#e85b4b';
    warn.textContent = '⚠ 密码至少 6 位';
  } else {
    warn.style.display = 'block';
    warn.style.color = '#2e9e3f';
    warn.textContent = '新昵称：可直接点击「注册新账号」创建';
  }
}
window.checkLoginName = checkLoginName;

function logoutToLogin(){
  const g2 = document.getElementById('game'); if(g2) g2.style.display='none';
  // 清除当前登录会话
  window.accountName = null;
  window.accountPass = null;
  window.accountAvatar = null;
  window.yishiCdHalf = false; // 退出登录时清除依石/战斗内临时状态
  window.trainingMode = false;
  window.pendingYishi = false;
  window.pendingSpeedBuff = 0; window.pendingAttackBuff = 0;
  window.inventory = { equipment:[], items:{}, gold:0, xp:0, talent:0, maxItems:10, souvenirs:[], expansionCount:0 };
  window.accountMaxUnlocked = 1;
    window.accountAchievements = window.accountAchievements || {};
  window.accountCleared = {};
  window.accountHardCleared = {};
  window.gameStarted = false;
  window.gamePaused = false;
  playerDead = false; gameEnded = false;
  backpackOpen = false; shopOpen = false; pauseOpen = false;
  // 移除动态面板
  ['backpackPanel','shopPanel','pauseMenu','victoryBox','gameOverBox','levelBanner'].forEach(id=>{ const el=document.getElementById(id); if(el) el.remove(); });
  // 隐藏静态界面
  ['prologue','select','levelSelect','game','mainMenu'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display='none'; });
  clearEnemies();
  if(window.DOG) window.DOG.reset();
  const lg = document.getElementById('login'); if(lg) lg.style.display='flex';
  restoreRemember();
  if(typeof renderAccountList==='function') renderAccountList();
}
window.logoutToLogin = logoutToLogin;

function saveGame(){
  if(!window.accountName) return;
  // 金币累计成就
  if((window.inventory && window.inventory.gold || 0) >= 100000 && typeof unlockAchievement==='function') unlockAchievement('rich');
  const key = 'milkfrog_data_' + window.accountName + '_' + window.accountPass;
  try{
    localStorage.setItem(key, JSON.stringify({ inventory: window.inventory, maxUnlocked: window.accountMaxUnlocked, cleared: window.accountCleared, hardCleared: window.accountHardCleared, qUnlocked: window.accountQUnlocked, rUnlocked: window.accountRUnlocked, l15Seen: window.accountL15Seen, achievements: window.accountAchievements, trainingUnlocked: !!window.accountTrainingUnlocked }));
  }catch(e){}
}
window.saveGame = saveGame;

function showMainMenu(){
  // 版本迁移：Boss从15关移到16关，通关过旧15关的玩家自动解锁新16关
  if(window.accountCleared && window.accountCleared[14] && !window.accountCleared[15]){
    window.accountCleared[15] = true;
    if(typeof saveGame==='function') saveGame();
  }
  const p = document.getElementById('prologue'); if(p) p.style.display='none';
  const m = document.getElementById('mainMenu'); if(m) m.style.display='flex';
  if(typeof renderGiftIcon==='function') renderGiftIcon();
  if(typeof renderGuideIcon==='function') renderGuideIcon();
  if(typeof renderTrainingBtn==='function') renderTrainingBtn();
}
window.showMainMenu = showMainMenu;

// 新手礼包：主界面小包裹（点击领取，一次性）
function renderGiftIcon(){
  let icon = document.getElementById('giftIcon');
  if(inventory.giftReady && !inventory.giftGiven){
    if(!icon){
      icon = document.createElement('div');
      icon.id = 'giftIcon';
      icon.className = 'giftIcon';
      icon.innerHTML = '🎁';
      icon.title = '新手礼包（点击领取）';
      icon.onclick = claimGift;
      document.body.appendChild(icon);
    }
    icon.style.display = 'flex';
  } else if(icon){
    icon.style.display = 'none';
  }
}
window.renderGiftIcon = renderGiftIcon;
function claimGift(){
  if(!inventory.giftReady || inventory.giftGiven) return;
  inventory.giftReady = false;
  inventory.giftGiven = true;
  inventory.giftSword = 3; // 新手小木剑：可用3关
  inventory.gold += 500;
  saveGame();
  renderGiftIcon();
  alert('🎁 领取成功！金币+500、新手小木剑（可用3关，每关攻击+3）已生效！');
}
window.claimGift = claimGift;

// ===================== 账户信息管理（头像 / 改名） =====================
function getCurrentAccountObj(){
  try{
    const accounts = JSON.parse(localStorage.getItem('milkfrog_accounts')||'[]');
    return accounts.find(a=>a.name===window.accountName) || null;
  }catch(e){ return null; }
}
window.getCurrentAccountObj = getCurrentAccountObj;
function getMyAvatar(){
  const acc = getCurrentAccountObj();
  if(acc && acc.avatar) return acc.avatar;
  if(window.accountAvatar) return window.accountAvatar;
  return "assets/players/miaocuijiao_cat/sprites/miaocat_idle.png"; // 默认头像固定为妙脆角猫
}
window.getMyAvatar = getMyAvatar;
function openAccountPanel(){
  const existing = document.getElementById('accountPanel');
  if(existing){ existing.remove(); return; }
  const acc = getCurrentAccountObj() || {};
  const renameCount = acc.renameCount || 0;
  const renameCost = renameCount >= 2 ? 1000000 : 100000;
  const freeLeft = renameCount >= 1 ? 0 : 1;
  const panel = document.createElement('div');
  panel.id = 'accountPanel';
  panel.innerHTML = '<div class="bpTitle">👤 账户信息</div>' +
    '<div class="accBody">' +
    '<div class="accAvatarWrap"><img class="accAvatar" src="'+getMyAvatar()+'" alt="头像"><div class="accAvatarTag">我的头像</div></div>' +
    '<div class="accName">昵称：<b>'+window.accountName+'</b></div>' +
    '<div class="accRow"><span class="accRowLabel">🖼️ 更换头像（次数不限）</span><button class="bpUse" onclick="setAvatarPreset(\'cat\')">🐱 妙脆角猫</button><button class="bpUse" onclick="setAvatarPreset(\'dog\')">🐶 刀盾狗</button><label class="bpUse accFileBtn">📁 上传相册图片<input type="file" accept="image/*" style="display:none" onchange="uploadAvatar(this)"></label></div>' +
    '<div class="accRow"><span class="accRowLabel">✏️ 修改昵称</span><button class="bpUse" onclick="changeAccountName()">改名</button><span class="accCost">'+((freeLeft>0)?'本次免费':'需 '+fmtGold(renameCost)+' 金币')+'</span></div>' +
    '<div class="accNote">改名费用：第1次免费 → 之后 10w → 再之后 100w 金币。<br>头像支持本地上传，排行榜会同步显示头像和昵称。</div>' +
    '<div class="bpClose" onclick="closeAccountPanel()">关闭 ✕</div>' +
    '</div>';
  document.body.appendChild(panel);
}
window.openAccountPanel = openAccountPanel;
function closeAccountPanel(){
  const el = document.getElementById('accountPanel'); if(el) el.remove();
  if(typeof renderAccountList==='function') renderAccountList();
}
window.closeAccountPanel = closeAccountPanel;
function uploadAvatar(input){
  if(typeof FileReader === 'undefined' || !input || !input.files || !input.files[0]){ alert('请选择一张图片'); return; }
  const reader = new FileReader();
  reader.onload = function(){ setAccountAvatar(reader.result); };
  reader.readAsDataURL(input.files[0]);
}
window.uploadAvatar = uploadAvatar;
function setAccountAvatar(dataUrl){
  window.accountAvatar = dataUrl;
  try{
    const accounts = JSON.parse(localStorage.getItem('milkfrog_accounts')||'[]');
    const acc = accounts.find(a=>a.name===window.accountName);
    if(acc){ acc.avatar = dataUrl; localStorage.setItem('milkfrog_accounts', JSON.stringify(accounts)); }
  }catch(e){}
  // 同步镜像到独立头像存档：版本更新/换设备重新登录后头像不丢（不影响其它进度）
  try{
    if(window.accountName){
      const pass = window.accountPass || '';
      localStorage.setItem('milkfrog_avatar_'+window.accountName+'_'+pass, dataUrl);
      if(!pass){ try{ localStorage.setItem('milkfrog_avatar_'+window.accountName, dataUrl); }catch(e2){} }
    }
  }catch(e){}
  // 排行榜头像同步：本账号在四个榜单里的记录都更新为新头像
  try{
    if(window.accountName && typeof INFINITE_DIFFS!=='undefined'){
      INFINITE_DIFFS.forEach(d=>{
        let board = loadInfiniteBoard(d);
        let changed = false;
        board.forEach(b=>{ if(b.name===window.accountName && b.avatar!==dataUrl){ b.avatar=dataUrl; changed=true; } });
        if(changed) localStorage.setItem('milkfrog_infinite_leaderboard_'+d, JSON.stringify(board));
      });
    }
  }catch(e){}
  const el = document.getElementById('accountPanel'); if(el) el.remove();
  openAccountPanel();
  alert('✅ 头像已更新！排行榜也会同步显示。');
}
window.setAccountAvatar = setAccountAvatar;
function setAvatarPreset(kind){
  const src = (kind==='dog') ? "assets/players/daodungou/sprites/daodungou_idle.png" : "assets/players/miaocuijiao_cat/sprites/miaocat_idle.png";
  setAccountAvatar(src);
}
window.setAvatarPreset = setAvatarPreset;
function changeAccountName(){
  const acc = getCurrentAccountObj() || {};
  const renameCount = acc.renameCount || 0;
  const free = renameCount === 0;
  const cost = renameCount >= 2 ? 1000000 : 100000;
  if(!free && (inventory.gold||0) < cost){ alert('改名需要 '+fmtGold(cost)+' 金币（当前 '+fmtGold(inventory.gold||0)+'），不够可以去无限模式攒金币！'); return; }
  const newName = window.prompt('请输入新昵称'+(free?'（本次免费）':'（将扣除 '+fmtGold(cost)+' 金币）')+':');
  if(newName === null || newName === undefined) return;
  const nn = newName.trim();
  if(!nn){ alert('昵称不能为空'); return; }
  if(nn === window.accountName){ alert('新昵称与当前相同'); return; }
  let accounts = [];
  try{ accounts = JSON.parse(localStorage.getItem('milkfrog_accounts')||'[]'); }catch(e){}
  if(accounts.some(a=>a.name===nn)){ alert('该昵称已被使用，换个名字吧！'); return; }
  if(!free) inventory.gold -= cost;
  // 迁移存档（老账号存档自动兼容新名字）：进度/装备/金币原样搬过去，老式无密码存档也一并兼容
  const oldName2 = window.accountName;
  const oldKey = 'milkfrog_data_'+oldName2+'_'+window.accountPass;
  const newKey = 'milkfrog_data_'+nn+'_'+window.accountPass;
  try{
    const data = localStorage.getItem(oldKey);
    if(data) localStorage.setItem(newKey, data);
    localStorage.removeItem(oldKey);
  }catch(e){}
  // 兼容更老的无密码存档键（milkfrog_data_<昵称>）
  try{
    const legacyKey = 'milkfrog_data_'+oldName2;
    const legacyData = localStorage.getItem(legacyKey);
    if(legacyData && !localStorage.getItem(newKey)) localStorage.setItem(newKey, legacyData);
    localStorage.removeItem(legacyKey);
  }catch(e){}
  // 排行榜同步：四个难度榜单都旧昵称记录并入新昵称（保留最高分）
  try{
    INFINITE_DIFFS.forEach(d=>{
      let board = loadInfiniteBoard(d);
      const oldEntries = board.filter(b=>b.name===window.accountName);
      if(oldEntries.length){
        board = board.filter(b=>b.name!==window.accountName);
        let best = oldEntries[0];
        for(const o of oldEntries){ if(o.wave > best.wave || (o.wave===best.wave && o.gold>best.gold)) best = o; }
        best.name = nn;
        if(acc.avatar) best.avatar = acc.avatar;
        board.push(best);
        board.sort((a,b)=> (b.wave - a.wave) || (b.gold - a.gold));
        localStorage.setItem('milkfrog_infinite_leaderboard_'+d, JSON.stringify(board.slice(0,8)));
      }
    });
  }catch(e){}
  const accObj = accounts.find(a=>a.name===window.accountName);
  if(accObj){ accObj.name = nn; accObj.renameCount = renameCount + 1; }
  try{ localStorage.setItem('milkfrog_accounts', JSON.stringify(accounts)); }catch(e){}
  // 同步“记住密码/免密登录”里的旧昵称，避免下次登录界面选不到账号/误建新号
  try{
    const rem = JSON.parse(localStorage.getItem('milkfrog_remember')||'null');
    if(rem && rem.name === window.accountName){ rem.name = nn; localStorage.setItem('milkfrog_remember', JSON.stringify(rem)); }
  }catch(e){}
  window.accountName = nn;
  saveGame();
  if(typeof renderAccountList==='function') renderAccountList();
  const el = document.getElementById('accountPanel'); if(el) el.remove();
  openAccountPanel();
  alert('✅ 改名成功！新昵称：'+nn+(free?'':'（已扣除 '+fmtGold(cost)+' 金币）'));
}
window.changeAccountName = changeAccountName;

// ===================== 新手指南（通关第3关后出现在主界面） =====================
function renderGuideIcon(){
  let icon = document.getElementById('guideIcon');
  if(inventory && inventory.guideReady && !inventory.guideGiven){
    if(!icon){
      icon = document.createElement('div');
      icon.id = 'guideIcon';
      icon.className = 'giftIcon';
      icon.style.left = '24px';
      icon.style.right = 'auto';
      icon.innerHTML = '📖';
      icon.title = '新手指南（点击查看）';
      icon.onclick = openGuide;
      document.body.appendChild(icon);
    }
    icon.style.display = 'flex';
  } else if(icon){
    icon.style.display = 'none';
  }
}
window.renderGuideIcon = renderGuideIcon;
function openGuide(){
  if(!inventory.guideReady || inventory.guideGiven) return;
  inventory.guideGiven = true;
  saveGame();
  renderGuideIcon();
  const ov = document.createElement('div');
  ov.id = 'confirmPanel';
  ov.innerHTML = '<div class="confirmCard" style="max-width:520px"><div class="confirmTitle">📖 新手指南</div>' +
    '<div class="confirmText" style="text-align:left;line-height:1.9">' +
    '· 想攒金币？去打「无限模式」——失败或退出，金币都会保留！<br>' +
    '· 觉得太难？到设置里把难度调成「躺平」模式，怪物会弱很多。<br>' +
    '· 想挑战自己？设置里可调「高手 / 噩梦」模式，奖励也更多（最高3倍）。<br>' +
    '· 卡关打不过？试试鼠标右键闪避（闪避时无敌），跳起来攻击还有暴击加成！</div>' +
    '<div class="confirmBtns"><button class="confirmYes" onclick="closeGuide()">知道啦</button></div></div>';
  document.body.appendChild(ov);
}
window.openGuide = openGuide;
function closeGuide(){
  const el = document.getElementById('confirmPanel'); if(el) el.remove();
}
window.closeGuide = closeGuide;

// ===================== 成就系统 =====================
const ACHIEVEMENTS = [
  { id:'first_blood', name:'初露锋芒', desc:'通关第1关', icon:'⚔️', tier:'easy', reward:{ gold:200 } },
  { id:'lv5', name:'小有成就', desc:'通关第5关', icon:'🌟', tier:'mid', reward:{ gold:500 } },
  { id:'lv10', name:'渐入佳境', desc:'通关第10关', icon:'🔥', tier:'hard', reward:{ gold:1000 } },
  { id:'lv15', name:'暗影猎手', desc:'击败暗影蛙将·怒岚（通关第16关）', icon:'🐸', tier:'hard', reward:{ gold:3000 } },
  { id:'powerless', name:'力不从心', desc:'第16关第一场没撑过90秒就被击败', icon:'😵', tier:'easy', reward:{ gold:500 } },
  { id:'plotkill', name:'没办法，剧情杀', desc:'第16关撑过90秒，被剧情杀带走', icon:'💀', tier:'mid', reward:{ gold:800 } },
  { id:'inf10', name:'无尽初探', desc:'无限模式到达第10波（仅普通难度）', icon:'♾️', tier:'mid', reward:{ gold:600 } },
  { id:'inf30', name:'无尽高手', desc:'无限模式到达第30波（仅普通难度）', icon:'🌀', tier:'hard', reward:{ gold:1500 } },
  { id:'inf50', name:'无尽霸主', desc:'通关无限模式·第50波击败怒岚（仅普通难度）', icon:'👑', tier:'legend', reward:{ gold:5000 } },
  { id:'nightmare20', name:'噩梦·初登', desc:'噩梦难度无限模式到达第20波', icon:'🌋', tier:'hard', reward:{ gold:1000 } },
  { id:'nightmare30', name:'噩梦·深渊', desc:'噩梦难度无限模式到达第30波', icon:'🌑', tier:'legend', reward:{ gold:2000 } },
  { id:'easy50', name:'躺平神', desc:'躺平难度通关无限模式（第50波）', icon:'🛋️', tier:'mid', reward:{ gold:3000 } },
  { id:'dash_master', name:'闪避大师', desc:'用右键闪避躲开一次攻击', icon:'💨', tier:'easy', reward:{ gold:200 } },
  { id:'jump_crit', name:'跳砍暴击', desc:'跳起攻击打出一次暴击', icon:'💢', tier:'easy', reward:{ gold:300 } },
  { id:'rich', name:'万元户', desc:'金币达到10万', icon:'💰', tier:'hard', reward:{ gold:10000 } }
];
window.ACHIEVEMENTS = ACHIEVEMENTS;
function isAchUnlocked(id){ return !!(window.accountAchievements && window.accountAchievements[id]); }
window.isAchUnlocked = isAchUnlocked;
function unlockAchievement(id){
  if(!id || isAchUnlocked(id)) return;
  const a = ACHIEVEMENTS.find(x=>x.id===id);
  if(!a) return;
  window.accountAchievements = window.accountAchievements || {};
  window.accountAchievements[id] = true;
  if(a.reward && a.reward.gold) inventory.gold += a.reward.gold;
  saveGame();
  showAchievementPopup(a);
  playAchievementSound();
}
window.unlockAchievement = unlockAchievement;
function showAchievementPopup(a){
  const el = document.createElement('div');
  el.className = 'achPopup';
  el.innerHTML = '🏆 成就解锁！<br><b>'+a.name+'</b><br><span style="font-size:14px">'+a.desc+'</span>' +
    (a.reward && a.reward.gold ? '<br><span style="color:#ffd86b">奖励：金币 +'+fmtGold(a.reward.gold)+'</span>' : '');
  document.body.appendChild(el);
  setTimeout(()=>{ if(el.parentNode) el.parentNode.removeChild(el); }, 3600);
}
window.showAchievementPopup = showAchievementPopup;
function playAchievementSound(){
  const snd = document.getElementById('achievementSound') || document.getElementById('victorySound');
  if(snd){ snd.volume = window.sfxVol||1; snd.loop = false; snd.currentTime = 0; snd.play().catch(()=>{}); }
}
window.playAchievementSound = playAchievementSound;
function openAchievements(){
  const existing = document.getElementById('achievePanel');
  if(existing){ existing.remove(); return; }
  const panel = document.createElement('div');
  panel.id = 'achievePanel';
  const unlocked = ACHIEVEMENTS.filter(a=>isAchUnlocked(a.id)).length;
  let html = '<div class="bpTitle">🏆 成就（'+unlocked+' / '+ACHIEVEMENTS.length+'）</div>';
  html += '<div class="achGrid">';
  const tierColor = { easy:'#2e9e3f', mid:'#2f7fe8', hard:'#d9902f', legend:'#e85b4b' };
  ACHIEVEMENTS.forEach(a=>{
    const got = isAchUnlocked(a.id);
    const tc = tierColor[a.tier] || '#d9902f';
    html += '<div class="achTrophy '+(got?'got':'locked')+'" style="border-color:'+tc+'" title="'+a.desc+'">' +
      '<div class="achTrophyIcon" style="background:'+(got?tc:'#8a8a8a')+'">'+(got?a.icon:'🔒')+'</div>' +
      '<div class="achTrophyName">'+a.name+'</div>' +
      '<div class="achTrophyReward">'+(got?(a.reward&&a.reward.gold?'金币 +'+fmtGold(a.reward.gold):'已解锁'):'未解锁')+'</div>' +
      '</div>';
  });
  html += '</div>';
  html += '<div class="bpClose" onclick="closeAchievements()">关闭 ✕</div>';
  panel.innerHTML = html;
  document.body.appendChild(panel);
}
window.openAchievements = openAchievements;
function closeAchievements(){ const el=document.getElementById('achievePanel'); if(el) el.remove(); }
window.closeAchievements = closeAchievements;

// 隐藏/恢复胜利结算（打开背包/商城/暂停时不重叠）
function hideVictoryBox(){
  const vb = document.getElementById('victoryBox');
  if(vb && vb.style.display !== 'none'){ vb.dataset.hidden='1'; vb.style.display='none'; }
}
function showVictoryBox(){
  const vb = document.getElementById('victoryBox');
  if(vb && vb.dataset.hidden){ vb.dataset.hidden=''; vb.style.display=''; }
}

// =====================
// V5.5 多敌人 + 关卡系统
// =====================
let enemies = [];
window.enemyManager = { enemies: enemies };
let frog = null;       // 当前目标敌人（最近存活，兼容旧代码）
window.frog = null;

// 关卡配置（前3关：草原）
const LEVELS = [
  { level:1, name:"第1关·草原初遇", scene:"grass", enemies:[ {hp:120, x:0.78} ] },
  { level:2, name:"第2关·奶蛙成双", scene:"grass", enemies:[ {hp:132, x:0.68}, {hp:132, x:0.88} ] },
  { level:3, name:"第3关·奶蛙小队", scene:"grass", enemies:[ {hp:144, x:0.62}, {hp:144, x:0.84} ] },
  { level:4, name:"第4关·奶蛙群", scene:"grass", enemies:[ {hp:150, x:0.55}, {hp:150, x:0.75}, {hp:150, x:0.92} ] },
  { level:5, name:"第5关·精英奶蛙", scene:"grass", flag:"elite", enemies:[ {type:"elite", hp:300, x:0.85}, {hp:138, x:0.6} ] },
  { level:6, name:"第6关·草原深处", scene:"grass", enemies:[ {hp:156, x:0.55}, {hp:156, x:0.75}, {hp:156, x:0.92} ] },
  { level:7, name:"第7关·草原疾风", scene:"grass", flag:"special", mode:"timed", special:{ timer:25 }, enemies:[ {hp:80, x:0.5}, {hp:80, x:0.6}, {hp:80, x:0.7}, {hp:80, x:0.8}, {hp:80, x:0.9} ] },
  { level:8, name:"第8关·精英双蛙", scene:"grass", flag:"elite", enemies:[ {type:"elite", hp:336, x:0.88}, {hp:132, x:0.6}, {hp:132, x:0.75} ] },
  { level:9, name:"第9关·奶鼠出没", scene:"grass", enemies:[ {type:"mouse", hp:110, x:0.55}, {type:"mouse", hp:110, x:0.72}, {hp:150, x:0.9} ] },
  { level:10, name:"第10关·精英奶鼠", scene:"grass", flag:"elite", enemies:[ {type:"mouse", elite:true, hp:500, x:0.85}, {type:"mouse", hp:130, x:0.62}, {hp:160, x:0.92} ] },
  { level:11, name:"第11关·守护信标", scene:"grass", flag:"special", mode:"beacon", special:{ hp:320 }, enemies:[ {hp:120, x:0.42}, {hp:120, x:0.52}, {hp:120, x:0.62}, {hp:120, x:0.78}, {hp:120, x:0.9} ] },
  { level:12, name:"第12关·奶鼠精英", scene:"grass", enemies:[ {type:"elite", hp:450, x:0.55}, {hp:180, x:0.72}, {hp:180, x:0.88}, {type:"mouse", hp:130, x:0.96}, {type:"mouse", hp:130, x:0.42} ] },
  { level:13, name:"第13关·爆炸牧场", scene:"grass", enemies:[ {type:"boom", hp:200, x:0.45}, {type:"elite", hp:500, x:0.82}, {type:"mouse", hp:140, x:0.62}, {type:"mouse", hp:140, x:0.95} ] },
  { level:14, name:"第14关·草原突围", scene:"grass", flag:"elite", enemies:[ {type:"boom", hp:220, x:0.4}, {hp:190, x:0.6}, {type:"elite", hp:560, x:0.72}, {type:"mouse", hp:150, x:0.85}, {type:"mouse", hp:150, x:0.95} ] },
  { level:15, name:"第15关·影踪试炼", scene:"grass", flag:"special", mode:"hitlimit", special:{ hits:3 }, enemies:[ {hp:160, x:0.45}, {hp:160, x:0.6}, {type:"mouse", hp:130, x:0.72}, {hp:180, x:0.85} ] },
  { level:16, name:"第16关·风语草原的暗影", scene:"boss", flag:"boss", enemies:[ {type:"boss", hp:100000, x:0.78} ] }
];
let currentLevel = 0;
let levelCleared = false;
let allAlert = false;

// =====================
// V5.6 技能解锁 + 背包 + 关卡奖励
// =====================
// 技能解锁：E=第5关 Q=第10关 R=第15关
// 暴击系统：3% 概率 2 倍伤害
function doCrit(base, mult){
  const t=(inventory&&inventory.talents)||{}; let tn=0; for(const k in t){ if(t[k]) tn++; }
  const critBonus = (t.crit ? 0.10 : 0); // 会心：暴击率 +10%
  const rate = Math.min(0.25, (0.03 + 0.01*tn + critBonus) * (mult||1));
  const crit = Math.random() < rate;
  if(crit && (mult||1) >= 2 && typeof unlockAchievement==='function') unlockAchievement('jump_crit'); // 跳砍暴击
  if(crit && typeof showDamageText==='function' && typeof enemyObj!=='undefined') showDamageText("暴击!", enemyObj);
  return crit ? Math.round(base*2) : base;
}
window.doCrit = doCrit;

// 大额数字格式化：>=1万用 w（万）显示
function fmtGold(n){
  n = Math.max(0, Math.floor(n||0));
  if(n >= 10000){
    const w = n/10000;
    return (Math.round(w*10)/10) + 'w';
  }
  return String(n);
}
window.fmtGold = fmtGold;

// 高度判定：只有玩家与敌人高度接近时才可命中（塔上的敌人从地面打不到）
function canHitEnemy(e){
  if(!e) return false;
  const pHeight = -((typeof playerY!=='undefined') ? playerY : 0);
  let eHeight = e.groundY || 0;
  // 敌人实际高度（含跳跃/泰山压顶滞空）：天上的Boss地面打不到
  if(e.img && e.img.style && e.img.style.bottom){
    const b = parseFloat(e.img.style.bottom);
    if(!isNaN(b) && b > 80){ eHeight = b - 80; }
  }
  // 玩家跳起（pHeight更大）时仍能砍到地面敌人；只有敌人远高于玩家（如塔顶）才打不到
  return (pHeight + 90) >= eHeight;
}
window.canHitEnemy = canHitEnemy;

// ===================== V8.0 角色等级（血量/基础伤害随等级提升） =====================
function charLevel(){ return Math.max(1, (window.inventory&&window.inventory.charLevel)||1); }
function charLevelMax(){ return Math.min(LEVELS.length, (window.accountMaxUnlocked||1)); }
function charLevelCost(){ return 20 + charLevel()*20; }
window.charLevel = charLevel;
window.charLevelMax = charLevelMax;
window.charLevelCost = charLevelCost;
function levelUpCharacter(){
  if(!window.accountName){ alert('请先登录账号'); return; }
  const max = charLevelMax();
  const lv = charLevel();
  if(lv >= max){ alert('当前通关进度最高只能升到 '+max+' 级，先通关更多关卡再来吧！'); return; }
  const cost = charLevelCost();
  if(inventory.gold < cost){ alert('金币不足！升到 '+(lv+1)+' 级需要 '+cost+' 金币'); return; }
  inventory.gold -= cost;
  inventory.charLevel = lv + 1;
  saveGame();
  if(activeCharacter==='daodungou'){ selectCharacter('daodungou'); }
  else { selectCharacter('miaocuijiao_cat'); }
  if(window.updateV13UI) window.updateV13UI();
  const cpEl = document.getElementById('charPanel');
  if(cpEl) cpEl.remove();
  if(window.openCharPanel) openCharPanel();
}
window.levelUpCharacter = levelUpCharacter;

// 天赋减CD：每点天赋 -5% 冷却，最高减 50%
function getCdFactor(){
  const t = (inventory&&inventory.talents)||{};
  const cdNodes = (t.cd?1:0) + (t.cd2?1:0) + (t.cd3?1:0) + (t.cd4?1:0) + (t.cd5?1:0);
  let f = Math.max(0.5, 1 - cdNodes*0.05); // 每级-5%
  if(window.l15CdBoost) f = f * 0.5; // 第15关第二场：全技能冷却减半
  if(window.yishiCdHalf) f = f * 0.5; // 依石：全技能冷却减半
  // 无限模式中转站：技能冷却缩短
  if(window.inventory && window.inventory.infRun && window.inventory.infRun.cdCut){
    f = f * (1 - window.inventory.infRun.cdCut);
  }
  return f;
}
window.getCdFactor = getCdFactor;

// 扩容券价格：500 -> 2000 -> 5000 -> 10000 -> 20000（指数增长）
function expansionPrice(){
  const n = (inventory&&inventory.expansionCount)||0;
  const prices = [500, 2000, 5000, 10000];
  return n < prices.length ? prices[n] : 20000;
}
window.expansionPrice = expansionPrice;

// 天赋生命加成：健体节点 +20 每级
function talentHpBonus(){
  const t = (inventory&&inventory.talents)||{};
  return 20 * ((t.hp?1:0) + (t.hp2?1:0)) + 25 * (t.hp3?1:0) + 30 * (t.hp4?1:0) + 40 * (t.hp5?1:0);
}
function talentDmgBonus(){
  const t = (inventory&&inventory.talents)||{};
  return (t.dmg?2:0) + (t.dmg2?3:0) + (t.dmg3?5:0) + (t.dmg4?8:0);
}
window.talentDmgBonus = talentDmgBonus;

// =====================
// V7.1 天赋树
// =====================
const TALENT_TREE = [
  { id:'cd', name:'疾风', desc:'技能/大招冷却 -5%', tier:1, require:null, icon:'⏱️' },
  { id:'hp', name:'健体', desc:'生命上限 +20', tier:1, require:null, icon:'❤️' },
  { id:'shield', name:'护盾', desc:'进关自动获得8%护盾', tier:1, require:null, icon:'🛡️' },
  { id:'dmg', name:'力量', desc:'普攻伤害 +2', tier:1, require:null, icon:'⚔️' },
  { id:'cd2', name:'疾风II', desc:'技能/大招冷却再 -5%', tier:2, require:'cd', icon:'⏱️' },
  { id:'hp2', name:'健体II', desc:'生命上限再 +20', tier:2, require:'hp', icon:'❤️' },
  { id:'shield2', name:'护盾II', desc:'进关自动获得15%护盾', tier:2, require:'shield', icon:'🛡️' },
  { id:'dmg2', name:'力量II', desc:'普攻伤害再 +3', tier:2, require:'dmg', icon:'⚔️' },
  { id:'dash', name:'疾步', desc:'右键闪避冷却 -0.25秒', tier:1, require:null, icon:'👟' },
  { id:'dash2', name:'疾步II', desc:'右键闪避冷却再 -0.25秒', tier:2, require:'dash', icon:'👟' },
  { id:'cd3', name:'疾风III', desc:'技能/大招冷却再 -5%', tier:3, require:'cd2', icon:'⏱️' },
  { id:'hp3', name:'健体III', desc:'生命上限再 +25', tier:3, require:'hp2', icon:'❤️' },
  { id:'dmg3', name:'力量III', desc:'普攻伤害再 +5', tier:3, require:'dmg2', icon:'⚔️' },
  { id:'shield3', name:'护盾III', desc:'进关自动获得25%护盾', tier:3, require:'shield2', icon:'🛡️' },
  { id:'hp4', name:'健体IV', desc:'生命上限再 +30', tier:4, require:'hp3', icon:'❤️' },
  { id:'dmg4', name:'力量IV', desc:'普攻伤害再 +8', tier:4, require:'dmg3', icon:'⚔️' },
  { id:'shield4', name:'护盾IV', desc:'进关自动获得35%护盾', tier:4, require:'shield3', icon:'🛡️' },
  { id:'cd4', name:'疾风IV', desc:'技能/大招冷却再 -5%', tier:4, require:'cd3', icon:'⏱️' },
  { id:'hp5', name:'健体V', desc:'生命上限再 +40', tier:5, require:'hp4', icon:'❤️' },
  { id:'cd5', name:'疾风V', desc:'技能/大招冷却再 -5%', tier:5, require:'cd4', icon:'⏱️' },
  { id:'crit', name:'会心', desc:'暴击率 +10%', tier:5, require:'dmg4', icon:'💢' }
];

// =====================
// V7.5 技能升级（消耗金币）
// =====================
const SKILL_UPGRADES = [
  { id:'atk', name:'普攻强化', icon:'⚔️', desc:'普攻伤害 +2/级', max:10, costBase:100 },
  { id:'skillQ', name:'Q技能强化', icon:'💥', desc:'Q伤害+5%/级，5级群体伤害', max:10, costBase:150 },
  { id:'shield', name:'E强化·护盾（刀盾狗）', icon:'🛡️', desc:'E护盾值+5/级，10级反弹', max:15, costBase:120 },
  { id:'heal', name:'E强化·回血（妙脆角猫）', icon:'❤️', desc:'E回血+10/级，10级效果大增', max:15, costBase:110 },
{ id:'ult', name:'大招强化', icon:'🚀', desc:'大招伤害+8%/级，5级解锁特殊强化', max:10, costBase:200 }
];
// 大招强化倍率：8%/级，5级再+20%并解锁特殊强化
function ultLevel(){ return (window.inventory && window.inventory.skillLevels && window.inventory.skillLevels.ult) || 0; }
window.ultLevel = ultLevel;
function ultMult(){
  const lv = ultLevel();
  return (1 + 0.08 * lv) * (lv >= 5 ? 1.2 : 1);
}
window.ultMult = ultMult;
function skillUpgradeCost(id){
  const lv = (inventory.skillLevels && inventory.skillLevels[id]) || 0;
  const cfg = SKILL_UPGRADES.find(s=>s.id===id);
  if(!cfg) return 99999;
  // 后期金币越赚越多，升级费用也随等级递增（高等级略贵，但不会太夸张）
  return cfg.costBase + lv*50 + lv*lv*10;
}
function openSkillUpgrade(){
  const gameEl = document.getElementById('game');
  if(window.gameStarted && gameEl && gameEl.style.display !== 'none'){ alert('战斗中不能升级技能，请返回主菜单后再升级'); return; }
  // 打开技能升级时，关闭其它弹窗避免重叠
  const pm = document.getElementById('pauseMenu'); if(pm){ pm.remove(); pauseOpen = false; }
  const sp = document.getElementById('shopPanel'); if(sp){ sp.remove(); shopOpen = false; }
  const bp = document.getElementById('backpackPanel'); if(bp){ bp.remove(); backpackOpen = false; }
  const existing = document.getElementById('skillUpgradePanel');
  if(existing){ existing.remove(); return; }
  const panel = document.createElement('div');
  panel.id = 'skillUpgradePanel';
  let html = '<div class="bpTitle">⚡ 技能升级</div>';
  html += '<div class="bpRow">💰 金币：'+inventory.gold+'</div>';
  SKILL_UPGRADES.forEach(s=>{
    const lv = (inventory.skillLevels && inventory.skillLevels[s.id]) || 0;
    const cost = skillUpgradeCost(s.id);
    const maxed = lv >= s.max;
    html += '<div class="shopItem"><div class="shopIcon">'+s.icon+'</div><div class="shopInfo"><div class="shopName">'+s.name+' <span class="shopDesc">'+s.desc+'</span></div><div class="shopDesc">等级 '+lv+'/'+s.max+'</div></div>' +
      (maxed ? '<div class="ttDone">已满级</div>' : '<button class="bpUse" onclick="upgradeSkill(\''+s.id+'\')">升级（'+cost+'金币）</button></div>');
  });
  // 右键升级（双段突进）：一次性，3000金币
  if(inventory.rightClickUpgrade){
    html += '<div class="shopItem"><div class="shopIcon">👟</div><div class="shopInfo"><div class="shopName">右键升级（双段突进）</div><div class="shopDesc">已解锁 ✔ 按一次右键触发两段突进</div></div></div>';
  } else {
    html += '<div class="shopItem"><div class="shopIcon">👟</div><div class="shopInfo"><div class="shopName">右键升级（双段突进）<span class="shopDesc">按一次右键触发两段突进</span></div><div class="shopDesc">一次性 · 3000金币</div></div><button class="bpUse" onclick="upgradeRightClickDash()">解锁（3000金币）</button></div>';
  }
  // 闪避升级（群体冲刺）：一次性，2500金币
  if(inventory.dashAoeUpgrade){
    html += '<div class="shopItem"><div class="shopIcon">💨</div><div class="shopInfo"><div class="shopName">闪避升级（群体冲刺）</div><div class="shopDesc">已解锁 ✔ 冲刺命中轨迹上所有敌人</div></div></div>';
  } else {
    html += '<div class="shopItem"><div class="shopIcon">💨</div><div class="shopInfo"><div class="shopName">闪避升级（群体冲刺）<span class="shopDesc">冲刺对轨迹上所有敌人造成伤害</span></div><div class="shopDesc">一次性 · 2500金币</div></div><button class="bpUse" onclick="upgradeDashAoe()">解锁（2500金币）</button></div>';
  }
  // 闪避升级II（眩晕冲刺）：需先买群体冲刺，一次性5000金币
  if(inventory.dashAoeUpgrade){
    if(inventory.dashStunUpgrade){
      html += '<div class="shopItem"><div class="shopIcon">⚡</div><div class="shopInfo"><div class="shopName">闪避升级II（眩晕冲刺）</div><div class="shopDesc">已解锁 ✔ 冲刺命中敌人眩晕0.5秒</div></div></div>';
    } else {
      html += '<div class="shopItem"><div class="shopIcon">⚡</div><div class="shopInfo"><div class="shopName">闪避升级II（眩晕冲刺）<span class="shopDesc">冲刺命中敌人使其眩晕0.5秒</span></div><div class="shopDesc">一次性 · 5000金币（需先买群体冲刺）</div></div><button class="bpUse" onclick="upgradeDashStun()">解锁（5000金币）</button></div>';
    }
  }
  html += '<div class="bpClose" onclick="closeSkillUpgrade()">关闭 ✕</div>';
  panel.innerHTML = html;
  document.body.appendChild(panel);
}
window.openSkillUpgrade = openSkillUpgrade;
function closeSkillUpgrade(){ const el=document.getElementById('skillUpgradePanel'); if(el) el.remove(); }
window.closeSkillUpgrade = closeSkillUpgrade;
function upgradeRightClickDash(){
  if(inventory.rightClickUpgrade){ alert('已经解锁过右键双段突进了'); return; }
  if(inventory.gold < 3000){ alert('金币不足！需要 3000 金币'); return; }
  inventory.gold -= 3000;
  inventory.rightClickUpgrade = true;
  saveGame();
  const el = document.getElementById('skillUpgradePanel');
  if(el) el.remove();
  openSkillUpgrade();
}
window.upgradeRightClickDash = upgradeRightClickDash;
function upgradeDashAoe(){
  if(inventory.dashAoeUpgrade){ alert('已经解锁过群体冲刺了'); return; }
  if(inventory.gold < 2500){ alert('金币不足！需要 2500 金币'); return; }
  inventory.gold -= 2500;
  inventory.dashAoeUpgrade = true;
  saveGame();
  const el = document.getElementById('skillUpgradePanel');
  if(el) el.remove();
  openSkillUpgrade();
}
window.upgradeDashAoe = upgradeDashAoe;
// 闪避升级II：眩晕冲刺（需先买群体冲刺，一次性5000金币）
function upgradeDashStun(){
  if(!inventory.dashAoeUpgrade){ alert('请先购买「闪避升级（群体冲刺）」'); return; }
  if(inventory.dashStunUpgrade){ alert('已经解锁过眩晕冲刺了'); return; }
  if(inventory.gold < 5000){ alert('金币不足！需要 5000 金币'); return; }
  inventory.gold -= 5000;
  inventory.dashStunUpgrade = true;
  saveGame();
  const el = document.getElementById('skillUpgradePanel');
  if(el) el.remove();
  openSkillUpgrade();
}
window.upgradeDashStun = upgradeDashStun;
function upgradeSkill(id){
  const cfg = SKILL_UPGRADES.find(s=>s.id===id);
  const lv = (inventory.skillLevels && inventory.skillLevels[id]) || 0;
  if(!cfg || lv >= cfg.max) return;
  // 第10级起需要材料（商店后续更新），当前最高升到9级
  if(lv + 1 >= 10){ alert('第 10 级需要稀有材料，材料商店即将更新，请耐心等待！'); return; }
  const cost = skillUpgradeCost(id);
  if(inventory.gold < cost){ alert('金币不足！'); return; }
  inventory.gold -= cost;
  inventory.skillLevels = inventory.skillLevels || {};
  inventory.skillLevels[id] = lv + 1;
  saveGame();
  // 升级后保持面板打开（重新渲染，不关闭）
  const suPanel = document.getElementById('skillUpgradePanel');
  if(suPanel) suPanel.remove();
  openSkillUpgrade();
}
window.upgradeSkill = upgradeSkill;

// ===================== V7.9 设置（背景音乐 / 游戏音效音量） =====================
function openSettings(){
  const existing = document.getElementById('settingsPanel');
  if(existing){ existing.remove(); return; }
  const pm = document.getElementById('pauseMenu'); if(pm){ pm.remove(); pauseOpen = false; }
  const sp = document.getElementById('shopPanel'); if(sp){ sp.remove(); shopOpen = false; }
  const bp = document.getElementById('backpackPanel'); if(bp){ bp.remove(); backpackOpen = false; }
  const s = window.gameSettings || { bgm:80, sfx:80 };
  const panel = document.createElement('div');
  panel.id = 'settingsPanel';
  panel.innerHTML = '<div class="bpTitle">⚙️ 设置</div>' +
    '<div class="setRow"><span>🎵 背景音乐</span><input type="range" min="0" max="100" value="'+(s.bgm||80)+'" oninput="setVolume(\'bgm\', this.value)"><b id="setBgmVal">'+(s.bgm||80)+'%</b></div>' +
    '<div class="setRow"><span>🔊 游戏音效</span><input type="range" min="0" max="100" value="'+(s.sfx||80)+'" oninput="setVolume(\'sfx\', this.value)"><b id="setSfxVal">'+(s.sfx||80)+'%</b></div>' +
    '<div class="setRow"><span>⚔️ 战斗中播放背景音乐</span><input type="checkbox" '+(s.bgmInBattle===false?'':'checked')+' onchange="setBgmInBattle(this.checked)"></div>' +
    ((window.gameStarted && !window.gameEnded) ? '' : '<div class="setRow"><span>🎚️ 难度模式</span><div class="diffBtns">'+
      '<button class="diffBtn '+( (s.diffMode||'normal')==='easy'?'on':'')+'" onclick="setDiffMode(\'easy\')">躺平</button>'+
      '<button class="diffBtn '+( (s.diffMode||'normal')==='normal'?'on':'')+'" onclick="setDiffMode(\'normal\')">普通</button>'+
      '<button class="diffBtn '+( (s.diffMode||'normal')==='hard'?'on':'')+'" onclick="setDiffMode(\'hard\')">高手</button>'+
      '<button class="diffBtn '+( (s.diffMode||'normal')==='nightmare'?'on':'')+'" onclick="setDiffMode(\'nightmare\')">噩梦</button>'+
      '</div></div>') +
    
    '<div class="setRow"><span>🐸 奶蛙笑声</span><input type="checkbox" '+(s.frogLaugh===false?'':'checked')+' onchange="setFrogLaugh(this.checked)"><span class="setNote">（打开后会有奶蛙笑，可能比较吵）</span></div>' +
    '<div class="setRow"><span>🖥️ 全屏模式</span><button class="bpUse" onclick="toggleFullscreen()">切换全屏</button></div>' +
    '<div class="setRow setDanger"><span>🔄 一键重来（清空全部进度）</span><button class="bpUse" onclick="confirmReset()">清空进度</button></div>' +
    '<div class="bpClose" onclick="closeSettings()">关闭 ✕</div>';
  document.body.appendChild(panel);
}
window.openSettings = openSettings;
function setBgmInBattle(on){
  window.gameSettings = window.gameSettings || { bgm:80, sfx:80 };
  window.gameSettings.bgmInBattle = !!on;
  if(window.applySettings) window.applySettings();
  const bgm = document.getElementById('bgmAudio');
  if(!on && window.gameStarted){ if(bgm) bgm.pause(); }
  if(on){ if(typeof applyLevelBGM==='function') applyLevelBGM(); else if(typeof startBGM==='function') startBGM(); }
}
window.setBgmInBattle = setBgmInBattle;
function setFrogLaugh(on){
  window.gameSettings = window.gameSettings || { bgm:80, sfx:80 };
  window.gameSettings.frogLaugh = !!on;
  if(window.applySettings) window.applySettings();
}
window.setFrogLaugh = setFrogLaugh;
function confirmReset(){
  const ov = document.createElement('div');
  ov.id = 'confirmPanel';
  ov.innerHTML = '<div class="confirmCard"><div class="confirmTitle">⚠️ 确定要一键重来吗？</div>' +
    '<div class="confirmText">这会清空你的全部进度：金币、等级、天赋、技能升级、通关记录、道具全部清零，从零开始。</div>' +
    '<div class="confirmBtns"><button class="confirmYes" onclick="doReset(true)">确定清空</button>' +
    '<button class="confirmNo" onclick="doReset(false)">取消</button></div></div>';
  document.body.appendChild(ov);
}
window.confirmReset = confirmReset;
function doReset(ok){
  const el = document.getElementById('confirmPanel'); if(el) el.remove();
  if(ok){
    window.inventory = { equipment:[], items:{}, gold:0, xp:0, talent:0, maxItems:10, souvenirs:[], expansionCount:0, charLevel:1, talents:{}, skillLevels:{} };
    window.accountMaxUnlocked = 1;
    window.accountAchievements = window.accountAchievements || {};
    window.accountCleared = {};
    window.accountHardCleared = {};
    window.accountQUnlocked = false;
    window.accountRUnlocked = false;
    window.levelPending = { gold:0, items:{} };
    saveGame();
    // 如果在战斗中重置，先退回主菜单
    if(window.gameStarted && typeof backToMenu==='function') backToMenu();
    if(typeof startBGM==='function') startBGM();
    alert('已清空全部进度，从头开始吧！');
    const sp = document.getElementById('settingsPanel'); if(sp) sp.remove();
    openSettings();
  }
}
window.doReset = doReset;
window.openSettings = openSettings;
function closeSettings(){
  const el = document.getElementById('settingsPanel'); if(el) el.remove();
  // 从暂停菜单进入设置后关闭，要同步暂停状态，避免游戏卡死在“已暂停”状态
  if(typeof updatePauseState==='function') updatePauseState();
}
window.closeSettings = closeSettings;
window.forceFullscreen = false;
function toggleFullscreen(){
  if(document.fullscreenElement){
    window.forceFullscreen = false;
    document.exitFullscreen().catch(()=>{});
  }
  else if(document.documentElement && document.documentElement.requestFullscreen){
    window.forceFullscreen = true;
    document.documentElement.requestFullscreen().catch(()=>{});
  }
}
window.toggleFullscreen = toggleFullscreen;
// V15.18 全屏+Esc修复：关卡内按Esc应呼出暂停/退出菜单，不再被"强制回全屏"困住
// - 主菜单/设置界面：保持全屏（只有设置按钮能退出全屏）
// - 关卡内：允许浏览器退出全屏，并自动打开暂停菜单，避免死循环无法退出
if(typeof document.addEventListener==='function'){
  document.addEventListener('fullscreenchange', ()=>{
    if(window.forceFullscreen && !document.fullscreenElement){
      const inLevel = !!window.gameStarted; // 进入关卡（含暂停/结算）后视为关卡内
      if(inLevel){
        // 关卡内：Esc已被浏览器用于退出全屏 → 不再强制回全屏，改呼出暂停菜单
        window.forceFullscreen = false;
        if(!window.gameEnded && !window.playerDead && typeof togglePause==='function'){
          try{ togglePause(); }catch(e){}
        }
      } else if(document.documentElement && document.documentElement.requestFullscreen){
        // 主菜单/设置界面：保持全屏（只有设置按钮能退出全屏）
        document.documentElement.requestFullscreen().catch(()=>{});
      }
    }
  });
}
function setVolume(type, val){
  const v = Math.max(0, Math.min(100, parseInt(val)||0));
  window.gameSettings = window.gameSettings || { bgm:80, sfx:80 };
  window.gameSettings[type] = v;
  if(type==='bgm'){ const el = document.getElementById('setBgmVal'); if(el) el.textContent = v+'%'; }
  else { const el = document.getElementById('setSfxVal'); if(el) el.textContent = v+'%'; }
  if(window.applySettings) window.applySettings();
}
window.setVolume = setVolume;
function setDiffMode(mode){
  window.gameSettings = window.gameSettings || {};
  window.gameSettings.diffMode = mode;
  if(window.applyDiffMult) window.applyDiffMult();
  if(window.applySettings) window.applySettings();
  const sp = document.getElementById('settingsPanel'); if(sp) sp.remove();
  openSettings();
}
window.setDiffMode = setDiffMode;

// 背景音乐：全局循环播放（战斗页/主页面都播），首次交互后启动
function startBGM(){
  const bgm = document.getElementById('bgmAudio');
  if(!bgm) return;
  bgm.src = "assets/audio/bgm/bgm.wav";
  bgm.load();
  bgm.volume = window.bgmVol;
  bgm.loop = true;
  bgm.play().catch(()=>{});
}
window.startBGM = startBGM;

// 按关卡切换 BGM：第15关用Boss战BGM，其他关用普通BGM
function applyLevelBGM(){
  const bgm = document.getElementById('bgmAudio');
  if(!bgm) return;
  const isBoss = !window.infiniteMode && (currentLevel+1) === 16;
  const src = isBoss ? BOSS_BGM : "assets/audio/bgm/bgm.wav";
  if(bgm.getAttribute('data-src') !== src){
    bgm.setAttribute('data-src', src);
    bgm.src = src;
    bgm.load();
  }
  if(window.gameSettings && window.gameSettings.bgmInBattle === false){ bgm.pause(); return; }
  bgm.volume = isBoss ? Math.min(1, (window.bgmVol||0.8)*0.7) : window.bgmVol; // Boss战BGM音量改为原来的0.7倍（高潮太大声）
  bgm.loop = true;
  bgm.play().catch(()=>{});
}
window.applyLevelBGM = applyLevelBGM;

window.addEventListener('load', ()=>{
  if(window.applySettings) window.applySettings();
  if(typeof showLogin==='function') showLogin(); // 登录页默认显示登录框
  if(typeof renderAccountList==='function') renderAccountList(); // 登录页一开始就显示本设备账号
  const startOnce = ()=>{ startBGM(); window.removeEventListener('pointerdown', startOnce); window.removeEventListener('keydown', startOnce); };
  window.addEventListener('pointerdown', startOnce);
  window.addEventListener('keydown', startOnce);
});

// ===================== V8.0 主角状态面板 =====================
function openCharPanel(){
  const existing = document.getElementById('charPanel');
  if(existing){ existing.remove(); return; }
  const pm = document.getElementById('pauseMenu'); if(pm){ pm.remove(); pauseOpen = false; }
  const lv = charLevel();
  const max = charLevelMax();
  const cost = charLevelCost();
  const t = (inventory&&inventory.talents)||{};
  let tn=0; for(const k in t){ if(t[k]) tn++; }
  const crit = Math.min(10, 3+tn);
  const catHp = 40 + 6*(lv-1) + talentHpBonus();
  const dogHp = 80 + 8*(lv-1) + talentHpBonus();
  const catAtk = 13 + (lv-1);
  const dogAtk = 11 + (lv-1);
  const shp = t.shield2 ? 0.15 : (t.shield ? 0.08 : 0);
  const panel = document.createElement('div');
  panel.id = 'charPanel';
  panel.innerHTML = '<div class="bpTitle">⭐ 主角状态</div>' +
    '<div class="bpRow">📊 角色等级：'+lv+' / '+max+'　💰 金币：'+(inventory.gold||0)+'</div>' +
    '<div class="charCardRow">' +
    '  <div class="charStat"><div class="csIcon">🐱</div><b>妙脆角猫</b>' +
    '    <div>生命：'+catHp+'</div><div>普攻：'+catAtk+'</div><div>暴击率：'+crit+'%</div>' +
    '    <div>初始护盾：'+(shp>0?Math.min(40,Math.round(catHp*shp)):0)+'</div>' +
    '    <div>E回血冷却：15秒</div><div>Q冷却：'+Math.round(50*getCdFactor())+'秒</div><div>R冷却：'+Math.round(90*getCdFactor())+'秒</div><div style="font-size:12px;color:#8a6a3a;margin-top:4px">R大招用法：按住R移动鼠标调整红色预选圈，松开R后导弹从红圈处落下</div><div>大招强化：Lv.'+(ultLevel())+'（伤害×'+Math.round(ultMult()*100)/100+'）</div></div>' +
    '  <div class="charStat"><div class="csIcon">🐶</div><b>刀盾狗</b>' +
    '    <div>生命：'+dogHp+'</div><div>普攻：'+dogAtk+'</div><div>暴击率：'+crit+'%（跳砍翻倍）</div>' +
    '    <div>初始护盾：'+(shp>0?Math.min(40,Math.round(dogHp*shp)):0)+'</div>' +
    '    <div>E护盾冷却：'+Math.round(40*getCdFactor())+'秒</div><div>Q冷却：'+Math.round(18*getCdFactor())+'秒</div><div>R冷却：'+Math.round(90*getCdFactor())+'秒</div><div style="font-size:12px;color:#8a6a3a;margin-top:4px">R大招用法：按R向前释放龙卷风，卷住敌人持续扣血并聚怪</div><div>大招强化：Lv.'+(ultLevel())+'（伤害×'+Math.round(ultMult()*100)/100+'）</div></div>' +
    '</div>' +
    '<div class="bpRow">✨ 每升1级：生命+6~8、普攻+1（通关更多关卡可提高等级上限）</div>' +
    '<div class="charUpRow">'+(lv>=max ? '<div class="ttDone">已达当前进度上限，先通关更多关卡吧</div>' : '<button class="bpUse" onclick="levelUpCharacter()">升级到 '+(lv+1)+' 级（'+cost+' 金币）</button>')+'</div>' +
    '<div class="bpClose" onclick="closeCharPanel()">关闭 ✕</div>';
  document.body.appendChild(panel);
}
window.openCharPanel = openCharPanel;
function closeCharPanel(){ const el=document.getElementById('charPanel'); if(el) el.remove(); }
window.closeCharPanel = closeCharPanel;

function openTalentTree(){
  const existing = document.getElementById('talentPanel');
  if(existing){ existing.remove(); return; }
  const panel = document.createElement('div');
  panel.id = 'talentPanel';
  const t = (inventory.talents||{});
  let html = '<div class="bpTitle">🌳 天赋树</div>';
  html += '<div class="bpRow">🔮 可用天赋点：'+(inventory.talent||0)+'</div>';
  // 天赋树按“列”分组：每竖列同一类型（疾风/健体/护盾/力量/疾步），从上到下是进阶
  const BRANCHES = [
    { name:'疾风', icon:'⏱️', ids:['cd','cd2','cd3','cd4','cd5'] },
    { name:'健体', icon:'❤️', ids:['hp','hp2','hp3','hp4','hp5'] },
    { name:'护盾', icon:'🛡️', ids:['shield','shield2','shield3','shield4'] },
    { name:'力量', icon:'⚔️', ids:['dmg','dmg2','dmg3','dmg4','crit'] },
    { name:'疾步', icon:'👟', ids:['dash','dash2'] }
  ];
  html += '<div class="ttCols">';
  BRANCHES.forEach(br=>{
    html += '<div class="ttCol"><div class="ttColTitle">'+br.icon+' '+br.name+'</div>';
    br.ids.forEach(id=>{
      const n = TALENT_TREE.find(x=>x.id===id);
      if(!n) return;
      const bought = t[n.id];
      const prereqOk = !n.require || t[n.require];
      html += '<div class="ttNode '+(bought?'bought':'')+'"><div class="ttIcon">'+n.icon+'</div><div class="ttName">'+n.name+'</div><div class="ttDesc">'+n.desc+'</div>';
      if(bought) html += '<div class="ttDone">已解锁 ✓</div>';
      else if(!prereqOk) html += '<div class="ttLock">🔒 需前置</div>';
      else if((inventory.talent||0)>0) html += '<button class="bpUse" onclick="buyTalent(\''+n.id+'\')">解锁（1点）</button>';
      else html += '<div class="ttLock">天赋点不足</div>';
      html += '</div>';
    });
    html += '</div>';
  });
  html += '</div>';
  html += '<div class="ttSoon">更多分支 未完待续…</div>';
  html += '<div class="bpClose" onclick="closeTalentTree()">关闭 ✕</div>';
  panel.innerHTML = html;
  document.body.appendChild(panel);
}
window.openTalentTree = openTalentTree;
function closeTalentTree(){ const el=document.getElementById('talentPanel'); if(el) el.remove(); }
window.closeTalentTree = closeTalentTree;

function buyTalent(id){
  const node = TALENT_TREE.find(n=>n.id===id);
  const t = (inventory.talents||{});
  if(!node || t[id] || (inventory.talent||0)<=0) return;
  if(node.require && !t[node.require]){ alert('需先解锁前置'); return; }
  inventory.talents = t;
  inventory.talents[id] = true;
  inventory.talent = (inventory.talent||0) - 1;
  if(id==='hp'||id==='hp2'){ if(window.gameStarted){ playerMaxHp = (window.basePlayerMaxHp||50) + (activeCharacter==='daodungou'?8:6)*(charLevel()-1) + talentHpBonus(); window.playerMaxHp=playerMaxHp; if(window.updateV13UI) window.updateV13UI(); } }
  saveGame();
  // 买完天赋保持天赋树打开（重新渲染，不关闭）
  const tpEl = document.getElementById('talentPanel');
  if(tpEl) tpEl.remove();
  openTalentTree();
}
window.buyTalent = buyTalent;

// =====================
// V7.1 图鉴 / 新手介绍
// =====================
// 图鉴数据：点开单个条目 -> 左边贴图 + 右边文字（植物大战僵尸式）
const CODEX_DATA = {
  miaocat: { name:"妙脆角猫", img:"assets/players/miaocuijiao_cat/sprites/miaocat_idle.png", text:"远程主角，普攻发射猫子弹；E 回复生命；Q 爆炸火箭；R 火箭雨。右键突进可透体穿过建筑/哨塔并闪避弹幕。技能升级5级特殊：回血效果大增、爆炸火箭范围群体；闪避升级后冲刺可群体命中。" },
  dog: { name:"刀盾狗", img:"assets/players/daodungou/sprites/daodungou_idle.png", text:"近战坦克，普攻近战挥砍；E 举盾格挡；Q 旋风斩；R 龙卷风。跳起攻击暴击率翻倍；右键突进（盾牌冲击）造成伤害并把敌人击退。技能升级5级特殊：旋风斩群体伤害；护盾强化5级解锁「盾反」——护盾破碎后下次攻击反弹50%吸收伤害。" },
  frog: { name:"奶蛙", img:"assets/enemies/milk_frog/sprites/Walker01.png", text:"奶家人普通成员，发射蓝色冲击波。弱点：无明显弱点，注意躲避冲击波，贴脸会被弹开。笑声可以在设置里关闭。" },
  elitefrog: { name:"精英奶蛙", img:"assets/enemies/milk_frog/sprites/Attack.png", text:"第5关首次出现（紫色关键关）。体型更大、血量更高，发射黄色持续冲击波（伤害更高）。" },
  mouse: { name:"奶鼠", img:"assets/enemies/milk_mouse/sprites/mouse_idle.png", text:"奶家人，匍匐蓄力后向前冲刺撞人；站立时获得50%减伤。弱点：怕践踏——跳起踩踏造成大量伤害（最多3次）。" },
  elitemouse: { name:"精英奶鼠", img:"assets/enemies/milk_mouse/sprites/mouse_crouch.png", text:"第10关首次出现（紫色关键关）。冲刺更快、伤害更高。" },
  boom: { name:"爆裂奶蛙", img:"assets/enemies/boom_frog/boom_frog.png", text:"奶家人，移动很慢的近战型。近身撞击伤害不高，但死亡后闪白2秒会爆炸，爆炸只炸玩家、伤害很高，记得拉开距离！" },
  boss: { name:"暗影蛙将·怒岚", img:"assets/enemies/boss/boss1.png", text:"第16关Boss。依门魔法石本是守护伊莉大陆的光明之石，却被沉睡的黑暗力量侵染；奶蛙族首领夺走被污染的魔法石，将其据为己有。怒岚只是奶蛙族首领座下的一名守卫（镇守者），负责镇守被夺走的魔法石——他远不是真正的威胁，奶蛙族首领本尊比怒岚强上数百倍，是旅途尽头才会现身的最终Boss。第一场完全体（10万血、90秒剧情杀）；被神秘人削弱后第二场可击败，通关注定解锁。" },
  tower: { name:"哨塔", img:"🗼", text:"中立建筑，第6关起出现，随机概率+每3关保底1座。可打碎，塔顶自动站一名守卫；塔上守卫的攻击会越过塔直接打到你，打碎后塔上敌人坠落扣血。" },
  crates: { name:"木箱/钢箱/爆炸箱", img:"📦", text:"可打碎掉落战利品；钢箱更结实；爆炸箱打碎会爆炸（不分敌我）。" },
  items: { name:"道具", img:"🎒", text:"回血药恢复生命、护盾药增加护盾值；装备（小木剑/皮革铠甲等）使用后下一关生效。" },
  boost: { name:"怪物强化（第15/20关起）", img:"⚠️", text:"从第15关起，奶家人攻击有几率（10%起步、每关+2%、上限30%）穿透护盾直接伤到本体；从第20关起，攻击对护盾造成的伤害翻倍，且整体伤害大幅提升（噩梦等难度下更强）。此强化在闯关与无限模式都生效；闪避无敌、跳得够高可以躲开。第50波还会直面削弱版怒岚。" },
  ult: { name:"R 大招 · 终极技能升级", img:"🚀", text:"R 大招·终极技能在第16关由宗主（神秘人）救场时传授。妙脆角猫的R是火箭雨（初始6发，每发25伤害）；刀盾狗的R是龙卷风（持续3秒，总伤害100，主要聚怪）。两者大招初始冷却都是90秒，疾风天赋/依石等冷却缩减会同步生效（主角面板与战斗中显示一致）。在「技能升级」里升级「大招强化」：每级伤害+8%；升到第5级解锁特殊强化——妙脆角猫：单发伤害再+20%且火箭+2发（共8发）；刀盾狗：总伤害再+20%、持续+2秒、并对卷到的敌人眩晕2秒。目前最高升到9级，第10级需要稀有材料。用法：妙脆角猫按住R键并移动鼠标调整红色预选圈位置，松开R后导弹会从红圈处落下；刀盾狗按R直接向前释放龙卷风，卷住敌人持续扣血并聚怪。" },
  special15: { name:"特殊剧情·存活90秒", img:"⏱️", text:"第16关第一场是完全体怒岚（10万血），撑过90秒会被「剧情杀·暗影湮灭」带走——这是躲不掉的剧情（成就：没办法，剧情杀）；如果在90秒内被击败，神秘人会现身救场，削弱怒岚并传授大招（成就：力不从心）。首次通关16关（90秒内被击败）回到主界面，会提示你去「重新体验剧情」再挑战一次90秒存活。在躺平模式下，宗主赐福会大幅加强（血量×10、伤害提升、Boss血砍半），总能磨死Boss。" },
  growth: { name:"天赋点/技能升级/难度模式", img:"🌳", text:"通关获得天赋点，可在天赋树升级；技能升级消耗金币强化技能；角色等级随通关提升血量与基础伤害。设置里的难度模式：躺平(奖励50%)/普通/高手(奖励200%)/噩梦(奖励300%)，敌人越难奖励越高。" },
  controls: { name:"🎮 按键操作说明", img:"🎮", text:"<b>移动：</b>A / D 或 ← / →<br><b>跳跃：</b>空格（可二段跳）<br><b>普攻：</b>鼠标左键<br><b>闪避突进：</b>鼠标右键（购买右键升级后按一次触发两段）<br><b>E 技能：</b>妙脆角猫回复生命 / 刀盾狗举盾护盾<br><b>Q 技能：</b>妙脆角猫爆炸火箭 / 刀盾狗旋风斩<br><b>R 大招：</b>猫：按住R移动鼠标调整红色预选圈，松开后火箭从红圈处落下；狗：按R释放龙卷风聚怪持续伤害<br><b>Tab：</b>打开/关闭背包<br><b>Esc：</b>暂停 / 逐层关闭当前界面<br>更多功能（技能升级、天赋、图鉴、成就等）都在主界面按钮中，训练营可免费练习所有连招。" }
};
window.CODEX_DATA = CODEX_DATA;

function openCodex(){
  const existing = document.getElementById('codexPanel');
  if(existing){ existing.remove(); return; }
  const panel = document.createElement('div');
  panel.id = 'codexPanel';
  const mouseUnlocked = (window.accountMaxUnlocked||1) >= 9;
  let html = '<div class="bpTitle">📖 图鉴（点击条目查看详情）</div>';
  html += '<div class="bpSec">😺 主角</div>';
  html += '<div class="codexItem clickable" onclick="openCodexDetail(\'miaocat\')">🐱 <b>妙脆角猫</b><span class="codexGo">点开 ➤</span></div>';
  html += '<div class="codexItem clickable" onclick="openCodexDetail(\'dog\')">🐶 <b>刀盾狗</b><span class="codexGo">点开 ➤</span></div>';
  html += '<div class="bpSec">🐸 奶家人（敌方）</div>';
  html += '<div class="codexItem clickable" onclick="openCodexDetail(\'frog\')">🐸 <b>奶蛙</b><span class="codexGo">点开 ➤</span></div>';
  html += '<div class="codexItem clickable" onclick="openCodexDetail(\'elitefrog\')">👑 <b>精英奶蛙</b><span class="codexGo">点开 ➤</span></div>';
  if(mouseUnlocked){
    html += '<div class="codexItem clickable" onclick="openCodexDetail(\'mouse\')">🐭 <b>奶鼠</b><span class="codexGo">点开 ➤</span></div>';
    html += '<div class="codexItem clickable" onclick="openCodexDetail(\'elitemouse\')">👑 <b>精英奶鼠</b><span class="codexGo">点开 ➤</span></div>';
  html += '<div class="codexItem clickable" onclick="openCodexDetail(\'boom\')">💥 <b>爆裂奶蛙</b><span class="codexGo">点开 ➤</span></div>';
  if(window.accountCleared && window.accountCleared[15]){ html += '<div class="codexItem clickable" onclick="openCodexDetail(\'boss\')">👹 <b>暗影蛙将·怒岚</b><span class="codexGo">点开 ➤</span></div>'; }
  } else {
    html += '<div class="codexItem"><b>奶鼠</b>：🔒 尚未解锁（通关第9关解锁图鉴）。</div>';
  }
  html += '<div class="bpSec">🏰 建筑（中立）</div>';
  html += '<div class="codexItem clickable" onclick="openCodexDetail(\'tower\')">🗼 <b>哨塔</b><span class="codexGo">点开 ➤</span></div>';
  html += '<div class="codexItem clickable" onclick="openCodexDetail(\'crates\')">📦 <b>木箱/钢箱/爆炸箱</b><span class="codexGo">点开 ➤</span></div>';
  html += '<div class="bpSec">🎒 其他</div>';
  html += '<div class="codexItem clickable" onclick="openCodexDetail(\'boost\')">⚠️ <b>怪物强化</b><span class="codexGo">点开 ➤</span></div>';
  html += '<div class="codexItem clickable" onclick="openCodexDetail(\'ult\')">🚀 <b>R 大招·终极技能升级</b><span class="codexGo">点开 ➤</span></div>';
  html += '<div class="codexItem clickable" onclick="openCodexDetail(\'special15\')">⏱️ <b>特殊剧情·存活90秒</b><span class="codexGo">点开 ➤</span></div>';
  html += '<div class="codexItem clickable" onclick="openCodexDetail(\'items\')">🎒 <b>道具</b><span class="codexGo">点开 ➤</span></div>';
  html += '<div class="codexItem clickable" onclick="openCodexDetail(\'growth\')">🌳 <b>天赋点/技能升级</b><span class="codexGo">点开 ➤</span></div>';
  html += '<div class="codexItem clickable" onclick="openCodexDetail(\'controls\')">🎮 <b>按键操作说明</b><span class="codexGo">点开 ➤</span></div>';
  html += '<div class="bpClose" onclick="closeCodex()">关闭 ✕</div>';
  panel.innerHTML = html;
  document.body.appendChild(panel);
}
window.openCodex = openCodex;
function closeCodex(){ const el=document.getElementById('codexPanel'); if(el) el.remove(); }
window.closeCodex = closeCodex;

function openCodexDetail(id){
  const d = CODEX_DATA[id];
  if(!d) return;
  const old = document.getElementById('codexDetailPanel');
  if(old) old.remove();
  const panel = document.createElement('div');
  panel.id = 'codexDetailPanel';
  const isEmoji = (d.img.length < 10);
  const imgHtml = isEmoji
    ? '<div class="cdImg cdEmoji">'+d.img+'</div>'
    : '<div class="cdImg"><img src="'+d.img+'" alt="'+d.name+'"></div>';
  panel.innerHTML = imgHtml +
    '<div class="cdInfo"><div class="cdName">'+d.name+'</div><div class="cdText">'+d.text+'</div>' +
    '<div class="bpClose" onclick="closeCodexDetail()">关闭 ✕</div></div>';
  document.body.appendChild(panel);
}
window.openCodexDetail = openCodexDetail;
function closeCodexDetail(){ const el=document.getElementById('codexDetailPanel'); if(el) el.remove(); }
window.closeCodexDetail = closeCodexDetail;

function skillUnlocks(){
  const lv = currentLevel+1;
  // 无限模式跟随玩家当前拥有的技能：主角有什么，无限模式就有什么
  if(window.infiniteMode){
    return {
      e: (window.accountMaxUnlocked||1) >= 5,
      q: !!window.accountQUnlocked,
      r: !!window.accountRUnlocked
    };
  }
  // 第16关第一场：大招还没获得（必须等老师救场传授后才解锁）
  if(lv===16 && window.l15Phase===1){ return { e: lv>=5, q: !!window.accountQUnlocked, r: false }; }
  return { e: lv>=5, q: !!window.accountQUnlocked, r: !!window.accountRUnlocked };
}
window.getSkillUnlocks = skillUnlocks;

// 背包
window.inventory = { equipment: [], items: {}, gold: 0, xp: 0, talent: 0, maxItems: 5, souvenirs: [] };

// 关卡奖励配置（1关起）
const LEVEL_REWARDS = {
  1: { items: { "回血药": 2 }, gold: 60, xp: 30, desc: "回血药×2 + 金币60" },
  2: { items: { "回血药": 1 }, gold: 90, xp: 40, talent: 1, desc: "天赋点×1 + 回血药×1 + 金币90" },
  3: { equipment: { name: "小木剑", type: "weapon", quality: "白", stat: "攻击+3", attack: 3 }, gold: 130, xp: 60, desc: "武器「小木剑」 + 金币130" },
  4: { items: { "回血药": 2 }, gold: 180, xp: 70, desc: "回血药×2 + 金币180" },
  5: { equipment: { name: "小木剑·绿", type: "weapon", quality: "绿", stat: "攻击+5", attack: 5 }, gold: 250, xp: 80, desc: "武器「小木剑·绿」 + 金币250" },
  6: { items: { "回血药": 1, "护盾药": 2 }, gold: 320, xp: 90, desc: "护盾药×2 + 回血药×1 + 金币320" },
  7: { equipment: { name: "皮革铠甲", type: "armor", quality: "绿", stat: "减伤+5", defense: 5 }, gold: 400, xp: 100, desc: "装备「皮革铠甲」 + 金币400" },
  8: { items: { "回血药": 3 }, gold: 500, xp: 110, talent: 1, desc: "回血药×3 + 天赋点×1 + 金币500" },
  9: { items: { "护盾药": 2 }, gold: 600, xp: 120, desc: "护盾药×2 + 金币600" },
  10: { equipment: { name: "皮革铠甲·蓝", type: "armor", quality: "蓝", stat: "减伤+8", defense: 8 }, gold: 720, xp: 150, talent: 1, desc: "装备「皮革铠甲·蓝」 + 天赋点×1 + 金币720" },
  11: { items: { "回血药": 2, "护盾药": 1 }, gold: 800, xp: 160, desc: "回血药×2 + 护盾药×1 + 金币800" },
  12: { equipment: { name: "小木剑·蓝", type: "weapon", quality: "蓝", stat: "攻击+8", attack: 8 }, gold: 900, xp: 170, talent: 1, desc: "武器「小木剑·蓝」 + 天赋点×1 + 金币900" },
  13: { items: { "回血药": 3, "护盾药": 2 }, gold: 1000, xp: 180, desc: "回血药×3 + 护盾药×2 + 金币1000" },
  14: { equipment: { name: "皮革铠甲·紫", type: "armor", quality: "紫", stat: "减伤+12", defense: 12 }, gold: 1100, xp: 200, talent: 1, desc: "装备「皮革铠甲·紫」 + 天赋点×1 + 金币1100" },
  15: { items: { "回血药": 2, "护盾药": 2 }, gold: 1200, xp: 200, talent: 1, desc: "回血药×2 + 护盾药×2 + 天赋点×1 + 金币1200" },
  16: { items: { "回血药": 5, "护盾药": 3 }, gold: 2000, xp: 300, talent: 1, desc: "回血药×5 + 护盾药×3 + 天赋点×1 + 金币2000（+ 依门魔法石碎片）" }
};

function grantLevelRewards(){
  const rw = LEVEL_REWARDS[currentLevel+1];
  if(!rw) return "无";
  const lvIdx = currentLevel;
  const firstClear = !(window.accountCleared && window.accountCleared[lvIdx]);
  const hardFirst = (window.levelMode==='hard') && !(window.accountHardCleared && window.accountHardCleared[lvIdx]);
  // 累计通关2个困难关卡给1个天赋点（4个给2个，以此类推）
  const hardTalentNote = function(){
    let n=0; const hc=window.accountHardCleared||{}; for(const k in hc){ if(hc[k]) n++; }
    if(n>0 && n%2===0){ inventory.talent = (inventory.talent||0)+1; return ' + 天赋点×1'; }
    return '';
  };
  // 困难首通加成：关卡越靠后越丰厚
  const hardBonusGold = hardFirst ? Math.round((rw.gold||0) * (0.4 + lvIdx*0.04)) : 0;
  // 重复通关：固定金币（精英关多些），不给道具
  if(!firstClear){
    let replayGold = 10;
    let hardNote = "";
    if(window.levelMode==='hard'){
      // 困难重复通关：最少50，关卡越难越多（最多100）；boss关500
      const isBoss = LEVELS[currentLevel] && LEVELS[currentLevel].flag==='boss';
      replayGold = isBoss ? 500 : (50 + Math.min(50, (currentLevel+1)*4));
      if(hardFirst){
        window.accountHardCleared = window.accountHardCleared || {};
        window.accountHardCleared[lvIdx] = true;
        replayGold += hardBonusGold;
        hardNote = "（困难：金币+"+replayGold+"）" + hardTalentNote();
      } else {
        hardNote = "（困难重复通关：金币+"+replayGold+"）";
      }
    } else {
      // 普通重复通关：普通关10/精英20；boss关200
      const isBoss = LEVELS[currentLevel] && LEVELS[currentLevel].flag==='boss';
      if(isBoss){ replayGold = 200; }
      else {
        const isElite = LEVELS[currentLevel] && LEVELS[currentLevel].enemies.some(e=>e.type==='elite');
        replayGold = isElite ? 20 : 10;
      }
    }
    inventory.gold += Math.round(replayGold * (window.diffRewardMult||1));
    if(window.accountCleared) window.accountCleared[lvIdx] = true;
    saveGame();
    if(window.levelMode==='hard'){ return "困难重复通关：金币+" + replayGold; }
    return "重复通关：金币+" + replayGold;
  }
  let note = "";
  if(rw.items){
    const used = itemCount() + inventory.equipment.length;
    let avail = Math.max(0, inventory.maxItems - used);
    for(const k in rw.items){
      const qty = rw.items[k];
      const add = Math.min(qty, avail);
      if(add>0){ inventory.items[k] = (inventory.items[k]||0) + add; avail -= add; }
      if(add < qty) note = "（背包已满，部分未获得）";
    }
  }
  if(rw.equipment){
    const used = itemCount() + inventory.equipment.length;
    if(used < inventory.maxItems){ inventory.equipment.push(rw.equipment); }
    else note = "（背包已满，装备未获得）";
  }
  if(rw.gold) inventory.gold += Math.round(rw.gold * (window.diffRewardMult||1));
  if(rw.xp) inventory.xp += rw.xp;
  if(rw.talent){ inventory.talent += rw.talent; }
  let hardNote = "";
  if(hardFirst){
    window.accountHardCleared = window.accountHardCleared || {};
    window.accountHardCleared[lvIdx] = true;
    inventory.gold += hardBonusGold;
    const addIt = (rw.items && rw.items['回血药']) ? '回血药' : (rw.items && rw.items['护盾药']) ? '护盾药' : null;
    if(addIt && itemCount() + inventory.equipment.length < inventory.maxItems){
      inventory.items[addIt] = (inventory.items[addIt]||0) + 1;
      hardNote = "（困难首通：金币+"+hardBonusGold+" + "+addIt+"×1）";
    } else {
      hardNote = "（困难首通：金币+"+hardBonusGold+"）";
    }
    hardNote += hardTalentNote();
  }
  // 新手礼包：新玩家首通第1关，主界面出现小包裹，点击领取（一次性）
  if((currentLevel+1)===1 && firstClear && !inventory.giftGiven){
    inventory.giftReady = true;
    note += " + 🎁 新手礼包已送达主界面！";
    if(typeof showStoryHint==='function') showStoryHint("🎁 新手礼包已送达主界面，去领取吧！");
  }
  if((currentLevel+1)===16 && firstClear){
    inventory.souvenirs = inventory.souvenirs || [];
    if(!inventory.souvenirs.includes('依门魔法石碎片')){ inventory.souvenirs.push('依门魔法石碎片'); note += " + 依门魔法石碎片"; }
  }
  if(window.accountCleared) window.accountCleared[lvIdx] = true;
  if(window.updateV13UI) window.updateV13UI();
  saveGame();
  return (rw.desc||"无") + note + hardNote;
}

// =====================
// V5.7 暂停 / 背包 / 商城 / 主菜单
// =====================
window.gamePaused = false;
let backpackOpen = false;
let shopOpen = false;
let pauseOpen = false;

// 商城商品
const SHOP_ITEMS = [
  { name: "回血药", icon: "🧪", price: 50, desc: "回复 30 点生命" },
  { name: "护盾药", icon: "🛡️", price: 80, desc: "增加护盾值" },
  { name: "小木剑", icon: "🪵", price: 100, desc: "下一关攻击+3（持续一关）", equip: { name:"小木剑", type:"weapon", quality:"白", stat:"攻击+3", attack:3 } },
  { name: "草原之花", icon: "🌸", price: 30, desc: "纪念品（收藏）", souvenir: "草原之花" },
  { name: "背包扩容券", icon: "🎒", price: 0, desc: "背包容量+5（上限30，价格递增）", capacity: 5 },
  { name: "小木剑·绿", icon: "⚔️", price: 350, desc: "下一关攻击+5（持续一关）", unlockLevel: 8, equip: { name:"小木剑·绿", type:"weapon", quality:"绿", stat:"攻击+5", attack:5 } },
  { name: "皮革铠甲", icon: "🥋", price: 400, desc: "下一关减伤+5（持续一关）", unlockLevel: 10, equip: { name:"皮革铠甲", type:"armor", quality:"绿", stat:"减伤+5", defense:5 } },
  { name: "皮革铠甲·蓝", icon: "🛡️", price: 700, desc: "下一关减伤+8（持续一关）", unlockLevel: 14, equip: { name:"皮革铠甲·蓝", type:"armor", quality:"蓝", stat:"减伤+8", defense:8 } },
  { name: "馕", icon: "🫓", price: 150, desc: "回复100生命+小幅移速（战斗外使用）", unlockLevel: 5, buff: "naan" },
  { name: "羊肉串", icon: "🍢", price: 250, desc: "攻击力增强（战斗外使用）", unlockLevel: 10, buff: "kebab" },
  { name: "依石", icon: "💎", price: 1500, desc: "全技能CD-50%、血量×2、开场200护盾（战斗外使用）", unlockLevel: 15, buff: "yishi" }
];

// ---------- 背包 ----------
function itemCount(){
  let n=0; for(const k in inventory.items) n += Math.ceil((inventory.items[k]||0)/10); return n; // 每10个道具占1格
}
function renderBackpack(){
  const panel = document.getElementById('backpackPanel');
  if(!panel) return;
  const inBattle = window.gameStarted && !window.gameEnded;
  const used = itemCount() + inventory.equipment.length;
  let html = '<div class="bpTitle">🎒 背包</div>';
  html += '<div class="bpRow">💰 金币：'+fmtGold(inventory.gold)+'　⭐ 经验：'+inventory.xp+'　🔮 天赋点：'+inventory.talent+'</div>';
  html += '<div class="bpRow">📦 容量：'+used+' / '+inventory.maxItems+'　⏫ 攻击加成：'+(window.pendingAttackBuff||0)+'</div>';
  html += '<div class="bpSec">⚔️ 装备（使用后下一关生效，持续一关）</div>';
  if(inventory.equipment.length===0) html += '<div class="bpEmpty">暂无装备</div>';
  else inventory.equipment.forEach((eq,i)=>{
    html += '<div class="bpItem"><span>'+eq.quality+' · '+eq.name+'（'+eq.stat+'）</span>'
      + '<button class="bpUse" onclick="useEquip('+i+')">使用</button>'
      + '<button class="bpDrop" onclick="dropEquip('+i+')">丢弃</button>'
      + '<button class="bpSell" onclick="sellEquip('+i+')">出售</button></div>';
  });
  html += '<div class="bpSec">🧪 道具</div>';
  const itemKeys = Object.keys(inventory.items);
  if(itemKeys.length===0) html += '<div class="bpEmpty">暂无道具</div>';
  else itemKeys.forEach(k=>{
    html += '<div class="bpItem"><span>'+k+' ×'+inventory.items[k]+'</span>'
      + (((k==='回血药'||k==='护盾药') && inBattle) || (k==='馕'||k==='羊肉串'||k==='依石') ? '<button class="bpUse" onclick="useItem(\''+k+'\')">使用</button>' : '')
      + '<button class="bpDrop" onclick="dropItem(\''+k+'\')">丢弃</button>'
      + '<button class="bpDropAll" onclick="dropAllItem(\''+k+'\')">全部丢弃</button>'
      + '<button class="bpSell" onclick="sellItem(\''+k+'\')">出售('+sellPrice(k)+')</button></div>';
  });
  if(inventory.souvenirs && inventory.souvenirs.length>0){
    html += '<div class="bpSec">🎁 纪念品</div>';
    inventory.souvenirs.forEach(s=>{ html += '<div class="bpItem">'+s+'</div>'; });
  }
  if(!inBattle) html += '<div class="bpHint">进入战斗后可使用道具/装备</div>';
  html += '<div class="bpClose" onclick="toggleBackpack()">关闭 ✕</div>';
  panel.innerHTML = html;
}

function toggleBackpack(){
  const existing = document.getElementById('backpackPanel');
  if(existing){
    existing.remove();
    backpackOpen = false;
    showVictoryBox();
    updatePauseState();
    return;
  }
  // 打开背包时，隐藏暂停菜单（避免重叠）
  const pm = document.getElementById('pauseMenu');
  if(pm){ pm.remove(); pauseOpen = false; }
  const sp = document.getElementById('shopPanel');
  if(sp){ sp.remove(); shopOpen = false; }
  const panel = document.createElement('div');
  panel.id = 'backpackPanel';
  document.body.appendChild(panel);
  backpackOpen = true;
  hideVictoryBox();
  renderBackpack();
  updatePauseState();
}
window.toggleBackpack = toggleBackpack;

function useItem(name){
  if(!inventory.items[name] || inventory.items[name]<=0) return;
  if(name === '回血药'){
    if(!window.gameStarted || playerHp<=0) return;
    const healAmt = 30 + 10*((inventory.skillLevels&&inventory.skillLevels.heal)||0);
    playerHp = Math.min(playerMaxHp, playerHp + healAmt);
    window.playerHp = playerHp;
    inventory.items[name]--;
    if(inventory.items[name]<=0) delete inventory.items[name];
    updatePlayerHP();
    if(window.updateV13UI) window.updateV13UI();
    if(typeof showHealText==='function' && enemyObj) showHealText(30, enemyObj);
  } else if(name === '护盾药'){
    if(!window.gameStarted) return;
    window.playerShield = Math.min(PLAYER_SHIELD_MAX, (window.playerShield||0) + 20);
    inventory.items[name]--;
    if(inventory.items[name]<=0) delete inventory.items[name];
    if(window.updateV13UI) window.updateV13UI();
    if(typeof showDamageText==='function' && enemyObj) showDamageText("护盾+20", enemyObj);
  } else if(name === '馕' || name === '羊肉串' || name === '依石'){
    if(window.gameStarted && !window.gameEnded){ alert('该道具只能在进入战斗前使用（战斗中只能用恢复药剂）'); return; }
    if(name==='馕'){
      playerHp = Math.min(playerMaxHp, playerHp + 100);
      window.playerHp = playerHp;
      window.pendingSpeedBuff = (window.pendingSpeedBuff||0) + 1; // 小幅移速
      updatePlayerHP();
      if(typeof showHealText==='function' && enemyObj) showHealText(100, enemyObj);
    } else if(name==='羊肉串'){
      window.pendingAttackBuff = (window.pendingAttackBuff||0) + 12; // 攻击增强
    } else if(name==='依石'){
      window.pendingYishi = true;
      window.yishiCdHalf = true; // 全技能CD减半
    }
    inventory.items[name]--;
    if(inventory.items[name]<=0) delete inventory.items[name];
  } else {
    return;
  }
  renderBackpack();
  saveGame();
}
window.useItem = useItem;

function dropItem(name){
  if(!inventory.items[name] || inventory.items[name]<=0) return;
  inventory.items[name]--;
  if(inventory.items[name]<=0) delete inventory.items[name];
  renderBackpack();
  saveGame();
}
window.dropItem = dropItem;

// 出售价格：按品质/道具
function sellPrice(name){
  const map = { "回血药":15, "护盾药":25, "攻击药":30, "小木剑":30, "草原之花":10, "背包扩容券":60 };
  return map[name] || 20;
}
function sellItem(name){
  if(!inventory.items[name] || inventory.items[name]<=0) return;
  inventory.gold += sellPrice(name);
  inventory.items[name]--;
  if(inventory.items[name]<=0) delete inventory.items[name];
  renderBackpack();
  saveGame();
}
window.sellItem = sellItem;
function sellEquip(i){
  const eq = inventory.equipment[i];
  if(!eq) return;
  const q = eq.quality || '白';
  const price = q==='白'?20 : q==='绿'?50 : q==='蓝'?120 : q==='紫'?300 : 800;
  inventory.gold += price;
  inventory.equipment.splice(i,1);
  renderBackpack();
  saveGame();
}
window.sellEquip = sellEquip;

function dropAllItem(name){
  if(!inventory.items[name] || inventory.items[name]<=0) return;
  delete inventory.items[name];
  renderBackpack();
  saveGame();
}
window.dropAllItem = dropAllItem;

// 装备：使用后下一关攻击加成（持续一关）
function useEquip(i){
  const eq = inventory.equipment[i];
  if(!eq) return;
  if(eq.defense){
    window.pendingDefenseBuff = (window.pendingDefenseBuff||0) + eq.defense;
    if(typeof showDamageText==='function' && enemyObj) showDamageText('防御+'+eq.defense, enemyObj);
  } else {
    window.pendingAttackBuff = (window.pendingAttackBuff||0) + (eq.attack||5);
    if(typeof showDamageText==='function' && enemyObj) showDamageText('攻击+'+eq.attack, enemyObj);
  }
  inventory.equipment.splice(i,1);
  renderBackpack();
  saveGame();
}
window.useEquip = useEquip;

function dropEquip(i){
  if(!inventory.equipment[i]) return;
  inventory.equipment.splice(i,1);
  renderBackpack();
  saveGame();
}
window.dropEquip = dropEquip;

// ---------- 商城 ----------
function openShop(){
  const existing = document.getElementById('shopPanel');
  if(existing) return;
  // 从暂停菜单打开商城时，先隐藏暂停菜单（避免叠加）
  const pm = document.getElementById('pauseMenu'); if(pm){ pm.remove(); pauseOpen = false; }
  const panel = document.createElement('div');
  panel.id = 'shopPanel';
  let html = '<div class="bpTitle">🛒 商城</div>';
  html += '<div class="bpRow">💰 金币：'+inventory.gold+'</div>';
  const maxUnlock = window.accountMaxUnlocked || 1;
  SHOP_ITEMS.forEach(it=>{
    if(it.unlockLevel && maxUnlock <= it.unlockLevel) return;
    const q = it.equip ? (it.equip.quality==='绿'?'#2e9e3f':it.equip.quality==='蓝'?'#3f7de8':it.equip.quality==='紫'?'#9b59d0':'#fff') : '#fff';
    html += '<div class="shopItem" style="border-left:6px solid '+q+'"><div class="shopIcon">'+(it.icon||'🛒')+'</div><div class="shopInfo"><div class="shopName">'+it.name+'</div><div class="shopDesc">'+it.desc+'</div></div>' +
      '<button class="bpUse" onclick="buyItem(\''+it.name+'\')">购买（'+fmtGold(it.capacity?expansionPrice():it.price)+'金币）</button></div>';
  });
  html += '<div class="bpClose" onclick="closeShop()">关闭 ✕</div>';
  panel.innerHTML = html;
  document.body.appendChild(panel);
  shopOpen = true;
  hideVictoryBox();
  updatePauseState();
}
window.openShop = openShop;

function closeShop(){
  const el = document.getElementById('shopPanel');
  if(el) el.remove();
  shopOpen = false;
  showVictoryBox();
  updatePauseState();
}
window.closeShop = closeShop;

function buyItem(name){
  const it = SHOP_ITEMS.find(i=>i.name===name);
  if(!it) return;
  if(inventory.gold < it.price){ alert('金币不足！'); return; }
  if(it.capacity){
    if(inventory.maxItems >= 30){ alert('背包容量已达上限30！'); return; }
    const price = expansionPrice();
    if(inventory.gold < price){ alert('金币不足！'); return; }
    inventory.gold -= price;
    inventory.expansionCount = (inventory.expansionCount||0) + 1;
    inventory.maxItems = Math.min(30, inventory.maxItems + it.capacity);
  } else if(it.equip){
    if(itemCount() + inventory.equipment.length >= inventory.maxItems){ alert('背包已满！'); return; }
    inventory.gold -= it.price;
    inventory.equipment.push(it.equip);
  } else if(it.souvenir){
    inventory.gold -= it.price;
    inventory.souvenirs.push(it.souvenir);
  } else {
    if(itemCount() + inventory.equipment.length >= inventory.maxItems){ alert('背包已满！'); return; }
    inventory.gold -= it.price;
    inventory.items[name] = (inventory.items[name]||0) + 1;
  }
  const el = document.getElementById('shopPanel');
  if(el) el.remove();
  openShop();
  renderBackpack();
  saveGame();
}
window.buyItem = buyItem;

// ---------- 暂停菜单 ----------
function togglePause(){
  if(!window.gameStarted) return;
  const existing = document.getElementById('pauseMenu');
  if(existing){ closePause(); return; }
  // 打开暂停时，关闭背包/商城/技能升级等面板，并移除悬浮提示，避免界面重叠/残留卡住
  const bp = document.getElementById('backpackPanel');
  if(bp){ bp.remove(); backpackOpen = false; }
  const sp = document.getElementById('shopPanel');
  if(sp){ sp.remove(); shopOpen = false; }
  const su = document.getElementById('skillUnlockPopup'); if(su) su.remove();
  const sa = document.getElementById('skillUpgradePanel'); if(sa) sa.remove();
  const lb = document.getElementById('levelBanner'); if(lb) lb.remove();
  const lc = document.getElementById('leaveConfirmPanel'); if(lc) lc.remove();
  const cp = document.getElementById('confirmPanel'); if(cp) cp.remove();
  const st = document.getElementById('settingsPanel'); if(st) st.remove();
  window.leaveConfirmOpen = false;
  document.querySelectorAll('.achPopup,.skillUnlock').forEach(el=>el.remove());
  const ov = document.createElement('div');
  ov.id = 'pauseMenu';
  ov.innerHTML = '<div class="pmTitle">⏸ 暂停</div>' +
    '<button class="pmBtn" onclick="closePause()">▶ 继续游戏</button>' +
    '<button class="pmBtn" onclick="toggleBackpack()">🎒 背包</button>' +
    '<button class="pmBtn" onclick="openShop()">🛒 商城</button>' +
    '<button class="pmBtn" onclick="openSettings()">⚙️ 设置</button>' +
    '<button class="pmBtn" onclick="confirmLeave()">🏠 返回主菜单</button>';
  document.body.appendChild(ov);
  pauseOpen = true;
  hideVictoryBox();
  updatePauseState();
}
window.togglePause = togglePause;

function closePause(){
  const el = document.getElementById('pauseMenu');
  if(el) el.remove();
  // 恢复游戏前清掉可能残留的确认框/设置框，避免遮挡导致“卡死/没反应”
  const lc = document.getElementById('leaveConfirmPanel'); if(lc) lc.remove();
  const cp = document.getElementById('confirmPanel'); if(cp) cp.remove();
  const st = document.getElementById('settingsPanel'); if(st) st.remove();
  pauseOpen = false;
  window.leaveConfirmOpen = false;
  showVictoryBox();
  updatePauseState();
}
window.closePause = closePause;

// ---------- 暂停状态 ----------
function updatePauseState(){
  const wasPaused = window.gamePaused;
  window.gamePaused = (backpackOpen || shopOpen || pauseOpen || window.leaveConfirmOpen) && window.gameStarted && !window.gameEnded;
  if(!window.gameStarted || window.gameEnded) window.gamePaused = false;
  // 恢复游戏时，补发暂停期间被推迟的R大招火箭/发射（暂停时大招不能继续攻击）
  if(wasPaused && !window.gamePaused && window.RRocketRain && window.RRocketRain.onResume){
    window.RRocketRain.onResume();
  }
}
window.updatePauseState = updatePauseState;

// ---------- 主菜单 ----------
// 清除上一场战斗/关卡残留的界面（失败/通关/横幅/设置面板），保证重进关卡是全新界面
function clearBattleOverlays(){
  ['gameOverBox','victoryBox','levelBanner','settingsPanel'].forEach(id=>{ const el=document.getElementById(id); if(el) el.remove(); });
  gameOverBox = null;
}
window.clearBattleOverlays = clearBattleOverlays;
function goSelect(){
  window.selectMode = 'normal';
  const m = document.getElementById('mainMenu'); if(m) m.style.display = 'none';
  // 新流程：开始游戏 -> 先选关，点击具体关卡后再选角色
  const s = document.getElementById('select'); if(s) s.style.display = 'none';
  const ls = document.getElementById('levelSelect'); if(ls) ls.style.display = 'flex';
  renderLevelSelect();
}
window.goSelect = goSelect;

function backToMenu(){
  if(window.infiniteMode && window.inventory){ window.inventory.infiniteHp = playerHp; window.inventory.infiniteMaxHp = playerMaxHp; }
  if(typeof saveGame==='function') saveGame(); // 保存无限模式退出时的血量/进度
  window.infiniteMode = false;
  stopVictorySound();
  closePause();
  const im = document.getElementById('infiniteMenu'); if(im) im.remove();
  const ilb = document.getElementById('infiniteLeaderboard'); if(ilb) ilb.remove();
  const bp = document.getElementById('backpackPanel'); if(bp) bp.remove(); backpackOpen = false;
  const sp = document.getElementById('shopPanel'); if(sp) sp.remove(); shopOpen = false;
  window.gamePaused = false;
  window.gameStarted = false;
  playerDead = false; gameEnded = false;
  window.yishiCdHalf = false; // 依石冷却减半只在本场战斗生效，回到主界面清除
  window.trainingMode = false; // 退出训练营
  window.leaveConfirmOpen = false;
  if(typeof clearBattleOverlays==='function') clearBattleOverlays(); // 清除上一场残留的失败/通关界面
  clearEnemies();
  if(window.DOG) window.DOG.reset();
  const game = document.getElementById('game'); if(game) game.style.display = 'none';
  // 隐藏选关/选角界面（否则会盖住主菜单，导致“返回不了主界面”）
  const ls = document.getElementById('levelSelect'); if(ls) ls.style.display = 'none';
  const sel = document.getElementById('select'); if(sel) sel.style.display = 'none';
  const m = document.getElementById('mainMenu'); if(m) m.style.display = 'flex';
  if(typeof renderGiftIcon==='function') renderGiftIcon();
  if(typeof renderGuideIcon==='function') renderGuideIcon();
  if(typeof startBGM==='function') startBGM();
}
window.backToMenu = backToMenu;

// 关卡流程
function clearEnemies(){
  for(const e of enemies){
    if(e.deathTimer){ clearTimeout(e.deathTimer); e.deathTimer=null; }
    if(e.boomTimer){ clearTimeout(e.boomTimer); e.boomTimer=null; }
    if(e.img && e.img.parentNode) e.img.parentNode.removeChild(e.img);
    if(e.hpBox && e.hpBox.parentNode) e.hpBox.parentNode.removeChild(e.hpBox);
  }
  // 第15关战场清理
  if(typeof clearBossFx==='function') clearBossFx();
  const tEl = document.getElementById('l15Timer'); if(tEl) tEl.remove();
  const st = document.getElementById('l15Story'); if(st) st.remove();
  document.querySelectorAll('.bossFx,.bossTelegraph,.bossWarnBar,.l15PlotFlash,.l15Hint').forEach(el=>el.remove());
  window.l15Phase = 0; window.l15LockControls = false; window.l15PlotKilled = false; window.l15CdBoost = false; window.l15UltimateBoost = false;
  window.l15StoryRun = false;
  // 离开15关后恢复宗主赐力前的血量（×10只在15关内生效）
  if(window.preL15MaxHp){
    playerMaxHp = window.preL15MaxHp;
    window.playerMaxHp = playerMaxHp;
    if(playerHp > playerMaxHp) playerHp = playerMaxHp;
    window.preL15MaxHp = 0;
  }
  window.l15StoryRunning = false;
  // 特殊玩法关清理
  window.specialState = null;
  window.waitingCheckpoint = false;
  window.slowmo = null; window.annihilDodged = false;
  const spEl = document.getElementById('slowmoPrompt'); if(spEl) spEl.remove();
  const stEl2 = document.getElementById('slowmoTint'); if(stEl2) stEl2.remove();
  const sEl = document.querySelector('.specialBeacon'); if(sEl && sEl.parentNode) sEl.parentNode.removeChild(sEl);
  const stEl = document.getElementById('specialTimer'); if(stEl) stEl.remove();
  const sbEl = document.getElementById('specialBeaconHp'); if(sbEl) sbEl.remove();
  const sbnEl = document.getElementById('specialBanner'); if(sbnEl) sbnEl.remove();
  const hlEl = document.getElementById('hitlimitCounter'); if(hlEl) hlEl.remove();
  enemies = [];
  window.enemyManager.enemies = enemies;
  frog = null; frogImg = null; window.frog = null;
  // 清掉场上残留的冲击波/战斗元素
  document.querySelectorAll('.frogWave').forEach(el=>el.remove());
  document.querySelectorAll('.enemyImg').forEach(el=>el.remove());
  document.querySelectorAll('.enemyHpBox').forEach(el=>el.remove());
  document.querySelectorAll('.scarecrowDmg').forEach(el=>el.remove());
  const vb = document.getElementById('victoryBox'); if(vb) vb.remove();
  const lb = document.getElementById('levelBanner'); if(lb) lb.remove();
}

// =====================
// V7.3 实体障碍物（木箱/钢箱/建筑：可站、可挡、可打碎）
// =====================
let solidObjects = [];
window.towerStreak = 0; // 连续没有哨塔的关卡数（每3关必出1塔）
function spawnSolids(){
  solidObjects.forEach(s=>{ if(s.el && s.el.parentNode) s.el.parentNode.removeChild(s.el); });
  solidObjects = [];
  const cfg = LEVELS[currentLevel];
  if(!cfg) return;
  // Boss关（15关）：不生成障碍物，避免挡视线
  if((currentLevel+1) === 16){ return; }
  const steel = (currentLevel+1) >= 8;
  const explosive = (currentLevel+1) >= 13;
  // 箱子：偏右分布，不铺满
  const crateCount = 1 + (currentLevel % 2);
  for(let i=0;i<crateCount;i++){
    const x = window.innerWidth * (0.62 + i*0.1);
    addSolid(x, 52, 52, steel ? 'steel' : 'wood', true);
  }
  // 爆炸箱（第13关起，打碎会爆炸）
  if(explosive){
    addSolid(window.innerWidth * 0.55, 52, 52, 'explosive', true);
  }
  // 哨塔（第6关起）：随机出现，但每3关必出1座；塔顶自动站一名守卫；没出塔时放一个普通建筑
  if((currentLevel+1) >= 6){
    const needTower = (window.towerStreak||0) >= 2; // 连续2关没塔 -> 第3关必出
    const hasTower = needTower || Math.random() < 0.45;
    if(hasTower){
      const towerX = window.innerWidth * (0.72 + Math.random()*0.12);
      addSolid(towerX, 120, 390, 'tower', true);
      const t = solidObjects[solidObjects.length-1];
      spawnTowerGuard(t);
      window.towerStreak = 0;
    } else {
      window.towerStreak = (window.towerStreak||0) + 1;
      addSolid(window.innerWidth * 0.7, 140, 80, 'building', false);
    }
  } else {
    addSolid(window.innerWidth * 0.7, 140, 80, 'building', false);
  }
}
function addItemChecked(name, qty){
  let added = 0;
  for(let i=0;i<qty;i++){
    const cur = inventory.items[name]||0;
    const curSlots = Math.ceil(cur/10);
    const newSlots = Math.ceil((cur+1)/10);
    const totalSlots = itemCount() - curSlots + newSlots + inventory.equipment.length;
    if(totalSlots > inventory.maxItems) break;
    inventory.items[name] = cur + 1;
    added++;
  }
  return added;
}

function addSolid(x, w, topY, kind, breakable){
  const s = { x:x, w:w, topY:topY, kind:kind, breakable:breakable, hp: kind==='steel'?80:(kind==='tower'?220:30), el:null, broken:false };
  const el = document.createElement('div');
  el.className = 'solid ' + kind;
  el.style.left = (x - w/2) + "px";
  el.style.width = w + "px";
  el.style.height = topY + "px";
  document.getElementById('game').appendChild(el);
  s.el = el;
  solidObjects.push(s);
}
// 某水平位置的地面高度（平台顶，0=地面）
function groundYAt(px){
  let best = 0;
  for(const s of solidObjects){
    if(s.broken) continue;
    if(px >= s.x - s.w/2 && px <= s.x + s.w/2){
      if(s.topY > best) best = s.topY;
    }
  }
  return best;
}
function tryBreakBreakables(dmg, px, range){
  for(let i=solidObjects.length-1;i>=0;i--){
    const b = solidObjects[i];
    if(b.broken || !b.breakable) continue;
    if(Math.abs(b.x - px) < range){
      b.hp -= dmg;
      if(b.el){ b.el.style.filter='brightness(1.6)'; setTimeout(()=>{ if(b.el) b.el.style.filter=''; },100); }
      if(b.hp <= 0) breakSolid(i);
    }
  }
}
// 塔/建筑/箱子被打破：站在上面的敌人立刻落到下方地面（不再卡在空中），高处坠落按高度扣血
function dropEnemiesFromSolid(b){
  for(const e of enemies){
    if(!e || e.dead) continue;
    if(Math.abs(e.x - b.x) >= b.w/2 + 30) continue;
    if((e.groundY||0) < b.topY - 2) continue;
    const newGy = (typeof groundYAt==='function') ? groundYAt(e.x) : 0;
    const fall = (e.groundY||0) - newGy;
    if(fall <= 0) continue;
    e.groundY = newGy;
    if(e.towerGuard) e.tower = null; // 不再绑定已碎的塔
    if(fall >= 40 && typeof damageEnemy==='function'){
      const dmg = Math.round(fall * 0.3);
      damageEnemy(e, dmg);
      if(typeof showDamageText==='function' && e.img) showDamageText("坠落! -"+dmg, e.img);
    }
  }
}
function breakSolid(i){
  const b = solidObjects[i];
  if(!b || b.broken) return;
  b.broken = true;
  if(b.el) b.el.remove();
  // 站在上面的敌人立刻掉落
  if(typeof dropEnemiesFromSolid==='function') dropEnemiesFromSolid(b);
  // 爆炸箱：爆炸，AOE伤害
  if(b.kind === 'explosive'){ explodeSolid(b); }
  // 战利品先暂存，通关才结算（中途退出作废）
  const firstClear = !(window.accountCleared && window.accountCleared[currentLevel]);
  window.levelPending = window.levelPending || { gold:0, items:{} };
  if(!firstClear){
    const g2 = 5 + Math.floor(Math.random()*6);
    window.levelPending.gold += g2;
    if(typeof showDamageText==='function' && enemyObj) showDamageText('战利品 金币+'+g2+'（通关后结算）', enemyObj);
    return;
  }
  const r = Math.random();
  let msg = '';
  if(b.kind === 'steel'){
    if(r < 0.35){ window.levelPending.items['回血药'] = (window.levelPending.items['回血药']||0)+1; msg = '战利品 回血药×1'; }
    else if(r < 0.6){ window.levelPending.gold += 60; msg = '战利品 金币+60'; }
    else if(r < 0.8){ window.levelPending.items['护盾药'] = (window.levelPending.items['护盾药']||0)+1; msg = '战利品 护盾药×1'; }
    else { window.levelPending.gold += 40; msg = '战利品 金币+40'; }
  } else {
    if(r < 0.4){ window.levelPending.items['回血药'] = (window.levelPending.items['回血药']||0)+1; msg = '战利品 回血药×1'; }
    else if(r < 0.65){ window.levelPending.gold += 30; msg = '战利品 金币+30'; }
    else if(r < 0.85){ window.levelPending.items['护盾药'] = (window.levelPending.items['护盾药']||0)+1; msg = '战利品 护盾药×1'; }
    else { window.levelPending.gold += 10; msg = '战利品 金币+10'; }
  }
  if(typeof showDamageText==='function' && enemyObj) showDamageText(msg, enemyObj);
}
// 爆炸箱爆炸：AOE伤害（敌人/玩家），震塌附近建筑
function explodeSolid(b){
  if(typeof showDamageText==='function' && enemyObj) showDamageText("💥 爆炸!", enemyObj);
  // 玩家受伤害
  if(Math.abs(enemy.x - b.x) < 160){ playerTakeDamage(20); }
  // 敌人受伤害 + 附近建筑震塌
  for(const e of enemies){
    if(e.dead) continue;
    if(Math.abs(e.x - b.x) < 200){
      damageEnemy(e, 60);
    }
  }
  // 塔/建筑倒塌：砸到站在上面的敌人（按高度扣血）
  if(b.kind === 'tower' || b.kind === 'building'){
    for(const e of enemies){
      if(e.dead) continue;
      if(Math.abs(e.x - b.x) < b.w/2 + 20 && (e.groundY||0) === b.topY){
        damageEnemy(e, Math.round(b.topY * 0.3));
        if(typeof showDamageText==='function' && e.img) showDamageText("坠落! -"+Math.round(b.topY*0.3), e.img);
      }
    }
  }
  // 震塌附近可碎物/建筑
  for(let j=solidObjects.length-1;j>=0;j--){
    const s = solidObjects[j];
    if(s===b || s.broken) continue;
    if(Math.abs(s.x - b.x) < 140 && (s.kind==='building' || s.kind==='tower' || s.breakable)){
      s.broken = true;
      if(s.el) s.el.remove();
      // 塔/建筑倒塌：站在上面的敌人立刻掉落
      if(typeof dropEnemiesFromSolid==='function') dropEnemiesFromSolid(s);
      // 建筑倒塌砸到敌人
      for(const e of enemies){
        if(e.dead) continue;
        if(Math.abs(e.x - s.x) < 130){ damageEnemy(e, 40); }
      }
    }
  }
  // 爆炸特效
  const fx = document.createElement('div');
  fx.className = 'explosionFx';
  fx.style.left = (b.x - 60) + "px";
  fx.style.top = "calc(100% - 180px)";
  document.getElementById('game').appendChild(fx);
  setTimeout(()=>{ if(fx.parentNode) fx.parentNode.removeChild(fx); }, 500);
}
window.tryBreakBreakables = tryBreakBreakables;

// 敌人跳跃（后面关卡更聪明，带冷却）
// 技能获得横幅
// 关卡战利品暂存（通关才结算，中途退出作废）
window.levelPending = { gold: 0, items: {} };
function commitPending(){
  if(!window.levelPending) return;
  inventory.gold += window.levelPending.gold || 0;
  for(const k in (window.levelPending.items||{})){ addItemChecked(k, window.levelPending.items[k]); }
  window.levelPending = { gold: 0, items: {} };
}
function discardPending(){ window.levelPending = { gold: 0, items: {} }; }

// 中途离开确认弹窗
function confirmLeave(){
  // 训练营无奖励：直接退出，不弹“进度会丢失”确认框
  if(window.trainingMode){ doLeave(true); return; }
  if(!window.gameStarted){ backToMenu(); return; }
  // 防止重复堆积：已有离开确认框则不再创建
  if(document.getElementById('leaveConfirmPanel')) return;
  // 用离开确认框【替换】暂停菜单，而不是叠加在它上面
  const pm = document.getElementById('pauseMenu'); if(pm) pm.remove();
  pauseOpen = false;
  window.leaveConfirmOpen = true;
  const ov = document.createElement('div');
  ov.id = 'leaveConfirmPanel';
  const isInf = !!window.infiniteMode;
  const leaveTitle = isInf ? '♾️ 确定要退出无限模式吗？' : '⚠️ 确定要离开游戏吗？';
  const leaveText = isInf
    ? '退出会保存您当前的进度（波次与金币），奖励不会消失，下次进入可继续挑战。'
    : '中途离开将作废本关获得的战利品，关卡进度不会保留。';
  ov.innerHTML = '<div class="confirmCard"><div class="confirmTitle">' + leaveTitle + '</div>' +
    '<div class="confirmText">' + leaveText + '</div>' +
    '<div class="confirmBtns"><button class="confirmYes" onclick="doLeave(true)">确定离开</button>' +
    '<button class="confirmNo" onclick="doLeave(false)">取消</button></div></div>';
  document.body.appendChild(ov);
  if(typeof updatePauseState==='function') updatePauseState();
}
function doLeave(ok){
  const el = document.getElementById('leaveConfirmPanel'); if(el) el.remove();
  window.leaveConfirmOpen = false;
  if(ok){ discardPending(); backToMenu(); }
  else {
    // 取消：回到干净的暂停菜单（游戏继续保持暂停）
    if(window.gameStarted && !window.gameEnded && !window.trainingMode){
      if(typeof togglePause==='function') togglePause();
    }
    if(typeof updatePauseState==='function') updatePauseState();
  }
}
window.confirmLeave = confirmLeave;
window.doLeave = doLeave;

// 20关/20波通关后：怪物强化提示弹窗
function showMonsterBoostNotice(){
  if(window.infiniteMode){ window.gamePaused = true; } // 无限模式弹框期间暂停游戏
  const ov = document.createElement('div');
  ov.id = 'confirmPanel';
  ov.innerHTML = '<div class="confirmCard"><div class="confirmTitle">⚠️ 奶家人变强了！</div>' +
    '<div class="confirmText">从第15关起，奶家人攻击有几率<span style="color:#e85b4b">穿透护盾</span>直接伤到本体；<br>' +
    '从第20关起：攻击对护盾造成的伤害<span style="color:#e85b4b">翻倍</span>，整体伤害<span style="color:#e85b4b">大幅提升</span>（噩梦等难度下更强）。<br><br>' +
    '记住：闪避无敌、跳得够高可以躲开！</div>' +
    '<div class="confirmBtns"><button class="confirmYes" onclick="closeMonsterBoostNotice()">知道了</button></div></div>';
  document.body.appendChild(ov);
}
window.showMonsterBoostNotice = showMonsterBoostNotice;
function closeMonsterBoostNotice(){
  const el = document.getElementById('confirmPanel'); if(el) el.remove();
  if(window.waitingBoostClose){
    window.waitingBoostClose = false;
    window.gamePaused = false;
    if(window.infiniteMode && typeof startInfiniteWave==='function') startInfiniteWave();
  }
}
window.closeMonsterBoostNotice = closeMonsterBoostNotice;

// ===================== 无限模式·中转站（每10波三选一增益，选择时暂停） =====================
function checkpointRewards(wave){
  const idx = Math.max(1, Math.floor(wave/10)); // 10->1, 20->2, 30->3, 40->4
  const d = (window.gameSettings && window.gameSettings.diffMode) || 'normal';
  const dm = { easy:0.7, normal:1, hard:1.2, nightmare:1.5 }[d] || 1; // 难度越高给得越好
  return {
    hp: Math.round(100 * idx * dm),
    shield: Math.round(300 * idx * dm),
    cd: [0.1, 0.3, 0.5, 0.6][idx-1] || 0.6
  };
}
window.checkpointRewards = checkpointRewards;
function showCheckpointUI(wave){
  window.gamePaused = true; // 选择时游戏暂停
  const r = checkpointRewards(wave);
  const ov = document.createElement('div');
  ov.id = 'confirmPanel';
  ov.innerHTML = '<div class="cpCard"><div class="cpTitle">⛺ 中转站 · 第'+wave+'波</div>' +
    '<div class="cpSub">选择一个增益，然后继续战斗！</div>' +
    '<div class="cpOpt" onclick="pickCheckpoint(\'hp\')"><div class="cpOptIcon">❤️</div><div class="cpOptInfo"><b>恢复生命</b><br><span>生命上限 +'+r.hp+'，并恢复 '+r.hp+' 点生命</span></div></div>' +
    '<div class="cpOpt" onclick="pickCheckpoint(\'shield\')"><div class="cpOptIcon">🛡️</div><div class="cpOptInfo"><b>获得护盾</b><br><span>立刻获得 '+r.shield+' 点护盾</span></div></div>' +
    '<div class="cpOpt" onclick="pickCheckpoint(\'cd\')"><div class="cpOptIcon">⏱️</div><div class="cpOptInfo"><b>技能冷却</b><br><span>全技能冷却时间缩短 '+Math.round(r.cd*100)+'%</span></div></div>' +
    '</div>';
  document.body.appendChild(ov);
}
window.showCheckpointUI = showCheckpointUI;
function pickCheckpoint(kind){
  const el = document.getElementById('confirmPanel'); if(el) el.remove();
  window.inventory.infRun = window.inventory.infRun || { hpBonus:0, cdCut:0 };
  const wave = (window.infiniteWave||1) - 1;
  const r = checkpointRewards(wave);
  if(kind === 'hp'){
    window.inventory.infRun.hpBonus = (window.inventory.infRun.hpBonus||0) + r.hp;
    playerMaxHp += r.hp; window.playerMaxHp = playerMaxHp;
    playerHp = Math.min(playerMaxHp, playerHp + r.hp); window.playerHp = playerHp;
  } else if(kind === 'shield'){
    window.playerShield = (window.playerShield||0) + r.shield;
  } else if(kind === 'cd'){
    window.inventory.infRun.cdCut = Math.min(0.75, (window.inventory.infRun.cdCut||0) + r.cd); // 上限75%
  }
  saveGame();
  if(window.updateV13UI) window.updateV13UI();
  window.waitingCheckpoint = false;
  window.gamePaused = false;
  if(window.infiniteMode && typeof startInfiniteWave==='function') startInfiniteWave();
}
window.pickCheckpoint = pickCheckpoint;

// 通关15关回到主界面后的提示：可重置剧情重打90秒存活挑战（仅第一次通关且90秒内被击败时提示一次）
function showL15ClearHint(show){
  if(!show) return;
  setTimeout(()=>{
    const ov = document.createElement('div');
    ov.id = 'confirmPanel';
    ov.innerHTML = '<div class="confirmCard"><div class="confirmTitle">💡 挑战：存活 90 秒</div>' +
      '<div class="confirmText">你已经击败了怒岚！<br>可以升级变强后，在主界面的选关里点「重新体验第16关剧情」，再挑战一次「存活90秒」——看看会发生什么？</div>' +
      '<div class="confirmBtns"><button class="confirmYes" onclick="closeL15ClearHint()">知道了</button></div></div>';
    document.body.appendChild(ov);
  }, 900);
}
window.showL15ClearHint = showL15ClearHint;
function closeL15ClearHint(){
  const el = document.getElementById('confirmPanel'); if(el) el.remove();
}
window.closeL15ClearHint = closeL15ClearHint;

function showSkillUnlock(text){
  const el = document.createElement('div');
  el.className = 'skillUnlock';
  el.innerHTML = '🎉 恭喜获得<br><span>' + text + '</span>';
  document.getElementById('game').appendChild(el);
  setTimeout(()=>{ if(el.parentNode) el.parentNode.removeChild(el); }, 3500);
}
window.showSkillUnlock = showSkillUnlock;
// 通关获得新技能时的弹窗：暂停游戏，停留3秒自动关闭
function showSkillUnlockPopup(text){
  const old = document.getElementById('skillUnlockPopup'); if(old) old.remove();
  window.gamePaused = true;
  const ov = document.createElement('div');
  ov.id = 'skillUnlockPopup';
  ov.className = 'skillUnlockPopup';
  ov.innerHTML = '<div class="supCard">🎉 恭喜获得新技能！<br><b>'+text+'</b><br><span>回到战斗后可按对应按键使用</span></div>';
  document.body.appendChild(ov);
  setTimeout(()=>{
    if(ov.parentNode) ov.parentNode.removeChild(ov);
    window.gamePaused = false;
  }, 3000);
}
window.showSkillUnlockPopup = showSkillUnlockPopup;

function updateEnemyJump(e){
  if(e.smashAnim) return; // 泰山压顶期间用手动升空动画，不走跳跃物理
  // 平滑地面高度：走上/走下平台时缓升缓降，不瞬移
  const targetGy = (typeof groundYAt==='function') ? groundYAt(e.x) : 0;
  const cur = (e.groundY!==undefined) ? e.groundY : 0;
  if(cur < targetGy - 1){ e.groundY = Math.min(targetGy, cur + 4); }
  else if(cur > targetGy + 1){ e.groundY = Math.max(targetGy, cur - 3); }
  else { e.groundY = targetGy; }
  // 跳跃：完整抛物线（上升 + 缓降），不会一抽一抽
  if(e.jumping){
    e.jumpV += 0.55;
    e.jumpY += e.jumpV;
    if(e.smashHover && e.jumpY < -250){ e.jumpY = -250; e.jumpV = 0; } // 泰山压顶：跳到天上后滞空定格
    if(e.jumpY >= 0){ e.jumping = false; e.jumpY = 0; } // 落地判定：跳到最高点回落回到地面才结束
  }
  if(e.img) e.img.style.bottom = (80 + e.groundY - e.jumpY) + "px";
}

// =====================
// V9.0 第15关 Boss 战（暗影蛙将·怒岚）
// =====================
window.bossFx = [];

function spawnBoss(ec){
  const img = document.createElement("img");
  img.className = "enemyImg";
  img.src = BOSS_IMAGE;
  img.style.width = "440px"; img.style.height = "440px";
  window.__eid = (window.__eid||0)+1;
  const e = {
    uid: window.__eid,
    x: window.innerWidth * ec.x, hp: ec.hp, maxHp: ec.hp,
    dead:false, stunned:false, state:"IDLE", face:-1,
    attacking:false, cooldown:false,
    type:'boss', canJump:false, jumping:false, jumpY:0, jumpV:0,
    groundY:0, phase:1,
    images:{ walk:[BOSS_IMAGE], alert:BOSS_IMAGE, attack:BOSS_IMAGE, hurt:BOSS_IMAGE, dead:BOSS_IMAGE },
    img:img, hpBox:null,
    nextAttack: Date.now()+2000, summonNext: Date.now()+15000,
    atkLock: 1200
  };
  img.style.left = e.x + "px";
  document.getElementById("game").appendChild(img);
  const hpBox = document.createElement("div");
  hpBox.className = "enemyHpBox";
  hpBox.innerHTML = '<div class="enemyHpFill"></div><span class="enemyHpText"></span>';
  document.getElementById("game").appendChild(hpBox);
  e.hpBox = hpBox;
  e.die = function(){ enemyDeath(e); };
  enemies.push(e);
  updateEnemyHp(e);
  return e;
}

// 第15关模式初始化（首次=完整剧情+完全体；重玩/困难=直接削弱版）
function l15Init(){
  window.l15Phase = 0;
  window.l15EarlyDeath = false; // 是否在90秒内被击败（决定通关后是否提示90秒挑战）
  window.l15UltimateBoost = false;
  window.l15CdBoost = false;
  window.bossTimeLeft = 0;
  window.bossStartTime = 0;
  window.l15LockControls = false;
  window.l15PlotKilled = false;
  window.l15StoryRunning = false;
  clearBossFx();
  const tEl = document.getElementById('l15Timer'); if(tEl) tEl.remove();
  const boss = enemies.find(e=>e.type==='boss');
  if(!boss) return;
  const firstTime = !window.accountL15Seen && window.levelMode!=='hard';
  window.l15StoryRun = firstTime; // 本次是否为“剧情流程”运行（决定失败重试时是否从剧情重来）
  if(firstTime){
    window.l15Phase = 1;
    boss.phase = 1;
    boss.hp = 100000; boss.maxHp = 100000;
    boss.img.style.width = "440px"; boss.img.style.height = "440px";
    updateEnemyHp(boss);
    l15OpeningStory();
  } else {
    // 重玩（已通关）第16关：Boss 进一步削弱（无宗主赐福，所以血/伤害再降）
    const easyMode3 = (window.gameSettings && window.gameSettings.diffMode === 'easy');
    window.l15Phase = 2;
    boss.phase = 2;
    boss.replayWeak = true;
    const replayHp = window.levelMode==='hard' ? 6000 : 3600;
    boss.hp = Math.round(replayHp * (easyMode3?0.5:1)); boss.maxHp = boss.hp; // 普通3600 / 困难6000 / 躺平1800
    boss.img.style.width = "300px"; boss.img.style.height = "300px";
    boss.annihilNext = Date.now() + 60000; // 重玩：削弱版Boss每60秒才放大招
    updateEnemyHp(boss);
    showStoryHint(window.levelMode==='hard' ? '第16关·困难（重玩）：怒岚已被大幅削弱（6000血），直接挑战！' : '第16关·重玩：怒岚已被大幅削弱（3600血），直接挑战！');
  }
}

// 简单提示横幅
function showStoryHint(txt){
  const el = document.createElement('div');
  el.className = 'l15Hint';
  el.textContent = txt;
  document.getElementById('game').appendChild(el);
  setTimeout(()=>{ if(el.parentNode) el.parentNode.removeChild(el); }, 2200);
}

// ===================== 特殊玩法关（蓝色关卡：限时 / 守护信标 / 限伤试炼） =====================
function initSpecialLevel(idx){
  window.specialState = null;
  const cfg = LEVELS[idx];
  if(!cfg || !cfg.mode) return;
  if(cfg.mode === 'timed'){
    const secs = (cfg.special && cfg.special.timer) || 25;
    window.specialState = { mode:'timed', deadline: Date.now() + secs*1000, total: secs };
    showSpecialBanner('⏱ 特殊关·限时清怪：' + secs + ' 秒内清完所有怪物！');
  } else if(cfg.mode === 'beacon'){
    // 信标血量随关卡/难度平衡：基础值 × (1+关数×4%) × 难度系数
    const hp = Math.round(((cfg.special && cfg.special.hp) || 320) * (1 + ((currentLevel||0)+1)*0.04) * ({easy:0.8, normal:1, hard:1.2, nightmare:1.5}[(window.gameSettings&&window.gameSettings.diffMode)||'normal']||1));
    const el = document.createElement('div');
    el.className = 'specialBeacon';
    el.style.left = (window.innerWidth*0.5 - 42) + 'px';
    document.getElementById('game').appendChild(el);
    window.specialState = { mode:'beacon', hp: hp, maxHp: hp, el: el };
    updateBeaconHp();
    showSpecialBanner('🏮 特殊关·守护光明信标：别让怪物打爆它！');
  } else if(cfg.mode === 'hitlimit'){
    // 次数随难度：躺平20 / 普通15 / 高手10 / 噩梦5
    const d0 = (window.gameSettings && window.gameSettings.diffMode) || 'normal';
    const n = { easy:20, normal:15, hard:10, nightmare:5 }[d0] || 15;
    window.specialState = { mode:'hitlimit', hits: 0, limit: n };
    // 屏幕上方显示命中计数：0 / N
    let ctr = document.getElementById('hitlimitCounter');
    if(!ctr){ ctr = document.createElement('div'); ctr.id='hitlimitCounter'; ctr.className='hitlimitCounter'; document.getElementById('game').appendChild(ctr); }
    ctr.textContent = '🎯 0 / ' + n;
    showSpecialBanner('🎯 特殊关·影踪试炼：全程最多被击中 ' + n + ' 次（打到护盾也算！）');
  }
}
window.initSpecialLevel = initSpecialLevel;
function showSpecialBanner(txt){
  let b = document.getElementById('specialBanner');
  if(!b){ b = document.createElement('div'); b.id='specialBanner'; b.className='specialBanner'; document.getElementById('game').appendChild(b); }
  b.textContent = txt;
  b.style.display = 'block';
  setTimeout(()=>{ if(b.parentNode) b.parentNode.removeChild(b); }, 2800);
}
window.showSpecialBanner = showSpecialBanner;
function updateSpecialTimer(msLeft){
  let el = document.getElementById('specialTimer');
  if(!el){ el = document.createElement('div'); el.id='specialTimer'; el.className='specialTimer'; document.getElementById('game').appendChild(el); }
  el.textContent = '⏱ ' + Math.max(0, Math.ceil(msLeft/1000)) + 's';
  if(msLeft <= 0) el.style.color = '#ff5b4b';
}
function updateBeaconHp(){
  const s = window.specialState;
  if(!s || s.mode!=='beacon') return;
  let el = document.getElementById('specialBeaconHp');
  if(!el){ el = document.createElement('div'); el.id='specialBeaconHp'; el.className='specialBeaconHp'; document.getElementById('game').appendChild(el); }
  el.style.width = Math.max(0, Math.round(s.hp/s.maxHp*100)) + 'px';
}
window.updateBeaconHp = updateBeaconHp;
function updateSpecial(){
  if(!window.specialState || window.gamePaused || window.gameEnded || playerDead || levelCleared) return;
  const s = window.specialState;
  const now = Date.now();
  if(s.mode === 'timed'){
    updateSpecialTimer(s.deadline - now);
    if(now >= s.deadline && !levelCleared && !gameEnded){
      specialFail('⏱ 时间到！没能及时清完怪物');
    }
  } else if(s.mode === 'beacon'){
    if(s.el && s.hp > 0){
      const bx = window.innerWidth*0.5;
      for(const e of enemies){
        if(!e || e.dead || e.type==='boss') continue;
        if(Math.abs(e.x - bx) < 130 && now - (e.lastBeaconHit||0) >= 700){
          e.lastBeaconHit = now;
          s.hp -= 14;
          if(s.el){ s.el.style.filter = 'brightness(2.2)'; setTimeout(()=>{ if(s.el) s.el.style.filter=''; }, 120); }
          updateBeaconHp();
          if(s.hp <= 0){ s.hp = 0; updateBeaconHp(); specialFail('🏮 光明信标被摧毁了！'); break; }
        }
      }
    }
  }
}
window.updateSpecial = updateSpecial;
function specialFail(msg){
  if(window.specialState) window.specialState = null;
  if(typeof showStoryHint==='function') showStoryHint(msg);
  if(!playerDead && !gameEnded){
    playerHp = 0; window.playerHp = 0;
    playerDeath();
  }
}
window.specialFail = specialFail;

// ===================== 时缓系统（Boss大招：2秒慢动作 + 按右键闪避） =====================
window.slowmo = null;
window.annihilDodged = false;
function slowmoFactor(){
  if(window.slowmo && Date.now() < window.slowmo.endAt) return 0.12; // 慢动作时速度几乎静止
  return 1;
}
window.slowmoFactor = slowmoFactor;
function isSlowmoActive(){
  return !!(window.slowmo && Date.now() < window.slowmo.endAt);
}
window.isSlowmoActive = isSlowmoActive;
function startAnnihilSlowmo(){
  window.slowmo = { endAt: Date.now() + 2000, dodged: false };
  window.annihilDodged = false;
  // 屏幕蓝色慢动作滤镜 + 提示按右键
  let tint = document.getElementById('slowmoTint');
  if(!tint){ tint = document.createElement('div'); tint.id = 'slowmoTint'; tint.className = 'slowmoTint'; document.body.appendChild(tint); }
  showSlowmoPrompt();
  setTimeout(()=>{
    const p = document.getElementById('slowmoPrompt'); if(p) p.remove();
    const t = document.getElementById('slowmoTint'); if(t) t.remove();
    window.slowmo = null;
  }, 2000);
}
window.startAnnihilSlowmo = startAnnihilSlowmo;
function showSlowmoPrompt(){
  const old = document.getElementById('slowmoPrompt'); if(old) old.remove();
  const el = document.createElement('div');
  el.id = 'slowmoPrompt';
  el.className = 'slowmoPrompt';
  el.innerHTML = '⚠ 暗影湮灭来袭！<br><span style="font-size:16px">请立刻按下【鼠标右键】闪避！</span>';
  document.body.appendChild(el);
}
window.showSlowmoPrompt = showSlowmoPrompt;
function dodgeSlowmo(){
  if(window.slowmo && Date.now() < window.slowmo.endAt){
    window.slowmo.dodged = true;
    window.annihilDodged = true; // 这次大招不再造成伤害
    const p = document.getElementById('slowmoPrompt'); if(p) p.remove();
    const t = document.getElementById('slowmoTint'); if(t) t.remove();
    window.slowmo = null;
  }
}
window.dodgeSlowmo = dodgeSlowmo;

// 点击推进的剧情分镜
function showStoryPanels(panels, onDone){
  const ov = document.createElement('div');
  ov.id = 'l15Story';
  let idx = 0;
  let done = false;
  let readyAt = Date.now() + 600; // 刚弹出时吸收残余点击，避免被连点瞬间跳过剧情
  const render = ()=>{
    const p = panels[idx];
    ov.innerHTML = '<div class="storyCard">' +
      (p.img ? '<div class="storyImgWrap"><img class="storyImg" src="'+p.img+'" alt=""></div>' : '') +
      (p.sub ? '<div class="storySub">'+p.sub+'</div>' : '') +
      '<div class="storyText">'+p.t+'</div>' +
      '<div class="storyHint">▸ 点击继续</div></div>';
  };
  ov.addEventListener('click', ()=>{
    if(done || Date.now() < readyAt) return; // 防止重复触发完成回调；弹出初期吸收残余点击
    idx++;
    if(idx >= panels.length){ done = true; ov.remove(); if(onDone) onDone(); return; }
    render();
  });
  render();
  document.body.appendChild(ov);
}

function l15OpeningStory(){
  window.l15StoryRunning = true;
  window.l15LockControls = true;
  showStoryPanels([
    { t:"风语草原深处，天空泛着不祥的暗紫……" },
    { t:"一道巨大的黑影从黑雾中踏出——暗影蛙将·怒岚！" },
    { t:"它身上缠绕着依门魔法石的气息，血红的眼睛死死盯着你。" },
    { t:"⏱ 撑过 90 秒！" }
  ], ()=>{
    window.l15StoryRunning = false;
    window.l15LockControls = false;
    window.bossStartTime = Date.now();
    window.bossTimeLeft = 90000;
    showStoryHint('暗影蛙将·怒岚 出现了！');
  });
}

// 剧情杀：90秒到，全屏必杀演出（冲击波从Boss方向冲向主角，命中后定格2秒濒死画面再切剧情）
function l15PlotKill(){
  if(window.l15Phase !== 1 || window.l15PlotKilled || window.l15StoryRunning) return;
  window.l15PlotKilled = true;
  window.l15LockControls = true; // 锁定玩家，剧情必中
  window.bossTimeLeft = 0;
  if(typeof unlockAchievement==='function') unlockAchievement('plotkill'); // 撑过90秒被剧情杀
  playBossAudio(BOSS_QUAKE_AUDIO, 3000);
  shakeScreen(900, 16);
  const boss = enemies.find(e=>e.type==='boss');
  const game = document.getElementById('game');
  const dir = (boss && enemy.x >= boss.x) ? 1 : -1;
  // 暗影湮灭：光束压在屏幕中下游（不横穿正中），从Boss那一侧朝主角方向冲过去
  const bw = Math.min(1000, Math.round(window.innerWidth * 0.85));
  const bh = Math.max(220, Math.round(window.innerHeight * 0.4)); // 中下游高度，不占满全屏
  const laser = document.createElement('img');
  laser.src = ANNIHILATION_IMAGE;
  laser.className = 'annihilationLaser';
  laser.style.width = bw + "px";
  laser.style.height = bh + "px";
  laser.style.bottom = "80px"; // 压在中下游，直接打在主角身上
  laser.style.transform = "scaleX(" + dir + ")";
  laser.style.opacity = "1";
  const startX = (dir > 0) ? ((boss ? boss.x : 0) - bw/2) : ((boss ? boss.x : window.innerWidth) - bw/2);
  const hitX = enemy.x - bw/2; // 冲到主角位置
  laser.style.left = startX + "px";
  game.appendChild(laser);
  // 冲过去：约0.9秒从Boss冲向主角（easeInOut）
  const rushT0 = performance.now(), rushDur = 900;
  (function rush(now){
    const p = Math.min(1, (now - rushT0)/rushDur);
    const eased = p < 0.5 ? 2*p*p : 1 - Math.pow(-2*p+2, 2)/2;
    laser.style.left = (startX + (hitX - startX)*eased) + "px";
    if(p < 1) requestAnimationFrame(rush);
  })(rushT0);
  // 强制命中（无视护盾/闪避/高度）：命中瞬间红光定格，主角濒死约4秒
  setTimeout(()=>{
    playerHp = 0; window.playerHp = 0; playerDead = true; gameEnded = true;
    updatePlayerHP();
    if(typeof showStoryHint==='function') showStoryHint('暗影湮灭——躲不开的必中一击！');
    shakeScreen(500, 10);
    const fade = document.createElement('div');
    fade.className = 'l15PlotFade';
    game.appendChild(fade);
    setTimeout(()=>{ if(fade.parentNode) fade.parentNode.removeChild(fade); }, 4000);
    if(laser.parentNode) laser.parentNode.removeChild(laser);
  }, 950);
  // 剧情杀演出总时长约5秒，再切入老师剧情
  setTimeout(()=>{ l15TeacherScene(); }, 5000);
}

// 老师登场：削弱 Boss + 传授 R 大招
function l15TeacherScene(){
  if(window.l15Phase !== 1) return;
  window.l15Phase = 2;
  window.l15StoryRunning = true;
  window.l15LockControls = true;
  window.accountL15Seen = true;
  clearBossFx();
  const tEl = document.getElementById('l15Timer'); if(tEl) tEl.remove(); // 救场后不再显示倒计时
  const boss = enemies.find(e=>e.type==='boss');
  if(boss){
    const easyMode = (window.gameSettings && window.gameSettings.diffMode === 'easy');
    boss.phase = 2;
    boss.hp = Math.round(10000 * (easyMode ? 0.5 : 1)); boss.maxHp = boss.hp; // 首次/重置剧情：宗主削弱后仍10000血（躺平砍半）
    boss.img.style.width = "300px"; boss.img.style.height = "300px";
    boss.attacking = false; boss.cooldown = false;
    boss.annihilNext = Date.now() + 40000; // 首次/重置剧情：宗主削弱后Boss每40秒放大招
    updateEnemyHp(boss);
  }
  const TEACHER_IMG = "assets/ui/teacher.png";
  showStoryPanels([
    { t:"主角被击倒在地，黑暗逐渐笼罩视线……" },
    { t:"一道剑光划破黑气！……会是谁？" },
    { t:"神秘人挡下了致命一击。", img: TEACHER_IMG, sub:"（分镜·剑光）" },
    { t:"神秘人：\"起来，小子。还没到你倒在这里的时候。\"", img: TEACHER_IMG },
    { t:"神秘人：\"这怪物的力量借自被黑暗侵染的依门魔法石——把它身上的黑暗剥掉，它也不过是只大一点的蛤蟆。\"", img: TEACHER_IMG },
    { t:"（神秘人挥剑，黑暗力量被消去——怒岚缩小了！）", img: TEACHER_IMG },
    { t:"（一股全新的力量涌入体内——习得 R 大招！）", img: TEACHER_IMG },
    { t:"宗主传功：全技能冷却时间减半，R 大招 12 秒！" }
  ], ()=>{
    window.l15StoryRunning = false;
    window.l15LockControls = false;
    window.accountRUnlocked = true;
    window.l15UltimateBoost = true;
    window.l15CdBoost = true;
    saveGame();
    showSkillUnlock("R 大招 · 终极技能（本关冷却 12 秒）");
    showStoryHint("宗主传功：全技能冷却减半！");
    playerDead = false; gameEnded = false;
    // 宗主赐力（仅本关，退出时恢复原血量）：猫×5血+500盾；狗×3血+300盾；躺平模式血量×10+伤害提升
    const easyMode2 = (window.gameSettings && window.gameSettings.diffMode === 'easy');
    window.preL15MaxHp = playerMaxHp;
    if(activeCharacter==='daodungou'){
      playerMaxHp = playerMaxHp * (easyMode2 ? 10 : 3);
      window.playerShield = 300;
    } else {
      playerMaxHp = playerMaxHp * (easyMode2 ? 10 : 3.5);
      window.playerShield = 500;
    }
    if(easyMode2){ window.playerAttackBuff = (window.playerAttackBuff||0) + 50; } // 躺平：主角伤害大幅提升，总能磨死Boss
    window.playerMaxHp = playerMaxHp;
    playerHp = playerMaxHp; window.playerHp = playerMaxHp;
    // 读完剧情后切换为激战BGM（仅15关，通关/退出恢复原BGM）
    const bbgm = document.getElementById('bgmAudio');
    if(bbgm){
      bbgm.src = BOSS_BATTLE_BGM; bbgm.load();
      if(!(window.gameSettings && window.gameSettings.bgmInBattle === false)){ bbgm.volume = Math.min(1, (window.bgmVol||0.8) * 0.7); bbgm.loop = true; bbgm.play().catch(()=>{}); }
    }
    updatePlayerHP();
    if(window.updateV13UI) window.updateV13UI();
  });
}

// 每帧更新（倒计时 + 特效碰撞）
function updateL15(){
  if(currentLevel+1 !== 16 || !window.l15Phase) return;
  if(window.l15Phase===1 && !playerDead && !gameEnded && !window.l15StoryRunning){
    if(!window.bossStartTime){ window.bossStartTime = Date.now(); } // 兜底：确保计时起点有效
    window.bossTimeLeft = Math.max(0, 90000 - (Date.now() - window.bossStartTime));
    // 最后1秒：锁定玩家，Boss自动释放剧情杀·暗影湮灭
    if(window.bossTimeLeft <= 1000 && !window.l15PlotKilled && !window.l15LockControls){
      window.l15LockControls = true;
      if(typeof showStoryHint==='function') showStoryHint('⚠ 暗影湮灭！躲不掉的……');
    }
    updateBossTimerUI();
    if(window.bossTimeLeft <= 0){ l15PlotKill(); }
  }
  updateBossFx();
}

function updateBossTimerUI(){
  const tEl = document.getElementById('l15Timer');
  if(!tEl && window.l15Phase===1){
    const t = document.createElement('div');
    t.id = 'l15Timer';
    document.getElementById('game').appendChild(t);
  }
  const t = document.getElementById('l15Timer');
  if(t){ t.textContent = '⏱ ' + Math.ceil(window.bossTimeLeft/1000); t.style.display = window.l15Phase===1 ? 'block' : 'none'; }
}

function clearBossFx(){
  for(const fx of window.bossFx){ if(fx && fx.el && fx.el.parentNode) fx.el.parentNode.removeChild(fx.el); }
  window.bossFx = [];
}

function shakeScreen(ms, intensity){
  const game = document.getElementById('game');
  if(!game) return;
  const start = Date.now();
  const iv = setInterval(()=>{
    const elapsed = Date.now() - start;
    if(elapsed >= ms){ clearInterval(iv); game.style.transform=''; return; }
    const amp = intensity * (1 - elapsed/ms);
    game.style.transform = "translate(" + ((Math.random()*2-1)*amp).toFixed(1) + "px," + ((Math.random()*2-1)*amp).toFixed(1) + "px)";
  }, 16);
}

function playBossAudio(path, stopMs){
  try{
    const a = new Audio(path);
    a.volume = (window.sfxVol||1);
    a.play().catch(()=>{});
    if(stopMs){ setTimeout(()=>{ try{a.pause();}catch(err){} }, stopMs); }
  }catch(err){}
}

function bossHitPlayer(dmg){
  window.bossShieldBonus = true; // Boss攻击对护盾额外50%伤害
  playerTakeDamage(Math.max(1, Math.round(dmg * (window.diffDmgMult||1))));
  window.bossShieldBonus = false;
}

function showBossTelegraph(x, r){
  const el = document.createElement('div');
  el.className = 'bossTelegraph';
  const sz = r*2;
  el.style.width = sz+"px"; el.style.height = sz+"px";
  el.style.left = (x - r) + "px";
  document.getElementById('game').appendChild(el);
  setTimeout(()=>{ if(el.parentNode) el.parentNode.removeChild(el); }, 650);
}

// ---------- Boss 出招 ----------
function updateBossAI(e){
  if(!e || e.dead) return;
  if(window.l15StoryRunning){ e.img.style.left=e.x+"px"; followEnemyHp(e); return; }
  if(e.stunned){ e.img.style.left=e.x+"px"; followEnemyHp(e); return; }
  const now = Date.now();
  const dx = enemy.x - e.x;
  if(dx > 0){ e.face = 1; e.img.style.transform = "scaleX(-1)"; }
  else { e.face = -1; e.img.style.transform = "scaleX(1)"; }
  const enraged = (e.phase===2 && e.hp <= e.maxHp*0.3);
  // 削弱版Boss也要保持机动：速度与第一场相当，死区收窄，不会站桩“装死”
  const speed = e.phase===1 ? 0.5 : (enraged ? 0.85 : 0.5);
  const dist = Math.abs(dx);
  if(dist > 260){ e.x += (dx>0?speed:-speed) * slowmoFactor(); }
  else if(dist < 160){ e.x += (dx>0?-speed*0.5:speed*0.5) * slowmoFactor(); }
  clampWorld(e);
  const ew = e.img ? e.img.clientWidth : 440;
  if(e.x > window.innerWidth-ew) e.x = window.innerWidth-ew;
  e.img.style.left = e.x + "px";
  // 泰山压顶：手动升空/滞空动画（看得见地跳高、停住、再砸下）
  if(e.smashAnim){
    const el = Date.now() - e.smashAnim.start;
    let off = 0;
    if(el < e.smashAnim.upMs){ off = e.smashAnim.top * (el/e.smashAnim.upMs); }
    else if(el < e.smashAnim.upMs + e.smashAnim.hoverMs){ off = e.smashAnim.top; }
    e.img.style.bottom = (80 + off) + "px";
  }
  updateEnemyJump(e);
  followEnemyHp(e);
  if(!e.attacking && now >= e.nextAttack){
    e.nextAttack = now + (enraged ? 1500 : (e.phase===1 ? 2600 : 3600));
    bossCastAttack(e);
  }
  if(now >= e.summonNext){
    e.summonNext = now + (e.phase===1 ? 18000 : 26000);
    bossSummonMinions(e);
  }
}

// 削弱后Boss伤害按难度调整：普通75%、躺平35%、高手85%、噩梦100%
// 16关技能加强标记：只有第16关技能伤害才高，其他关基础伤害低
function l16SkillBoost(){
  return typeof currentLevel!=='undefined' && currentLevel+1===16;
}
window.l16SkillBoost = l16SkillBoost;
function bossNerfMult(){
  const m = (window.gameSettings && window.gameSettings.diffMode) || 'normal';
  const map = { easy:0.3, normal:0.6, hard:0.7, nightmare:1 }; // 削弱后伤害：普通60%、躺平30%、高手70%、噩梦100%
  return map[m] || 0.75;
}
window.bossNerfMult = bossNerfMult;
function bossCastAttack(e){
  const pool = ['quake','triple','scatter','breath','charge','smash'];
  const now = Date.now();
  // 削弱版大招：固定40秒冷却，不会连续放
  if(e.phase===2 && (!e.annihilNext || now >= e.annihilNext)) pool.push('annihil');
  const atk = pool[Math.floor(Math.random()*pool.length)];
  e.attacking = true; e.cooldown = true;
  const dmgMult = e.phase===2 ? bossNerfMult() * (e.replayWeak ? 0.6 : 1) : 1; // 削弱后伤害按难度调整；重玩再降40%
  if(atk==='quake'){ bossQuake(e, dmgMult); }
  else if(atk==='triple'){ bossTriple(e, dmgMult); }
  else if(atk==='scatter'){ bossScatter(e, dmgMult); }
  else if(atk==='breath'){ bossBreath(e, dmgMult); }
  else if(atk==='smash'){ bossSmash(e, dmgMult); }
  else if(atk==='annihil'){
    e.annihilNext = now + (e.replayWeak ? 60000 : 40000); // 大招冷却：重玩60秒 / 首次剧情40秒
    if(typeof showStoryHint==='function') showStoryHint('⚠ 怒岚即将释放大招·暗影湮灭！');
    bossAnnihil(e, dmgMult);
  }
  else { bossCharge(e, dmgMult); }
}

function bossQuake(e, dmgMult){
  const targetX = enemy.x; // 瞄准玩家当前（释放预警时）的位置
  showBossTelegraph(targetX, 95); // 预警圈：波会打到这里
  e.img.style.filter = "brightness(1.4)";
  setTimeout(()=>{
    if(e.dead) return;
    e.img.style.filter = "";
    playBossAudio(BOSS_QUAKE_AUDIO, 2000);
    shakeScreen(240, 8);
    const dir = (targetX >= e.x) ? 1 : -1;
    const fx = { el:null, kind:'quake', x:e.x + dir*70, dir:dir, speed:3.2, born:Date.now(), dur:1500, hit:false, w:220, h:100, dmg:Math.round(42*dmgMult) };
    spawnQuakeImg(fx, DARK_BREATH_IMAGE); // 震地波用「暗黑地震波」原图，清晰显示
    e.atkLock = 1500;
    setTimeout(()=>{ if(!e.dead){ e.attacking=false; e.cooldown=false; } }, e.atkLock);
  }, 750);
}

function bossTriple(e, dmgMult){
  const dir = (enemy.x >= e.x) ? 1 : -1;
  for(let i=0;i<3;i++){
    setTimeout(()=>{ if(e.dead) return; bossSpawnWave(e, dir, dmgMult); }, i*380);
  }
  e.atkLock = 1500;
  setTimeout(()=>{ if(!e.dead){ e.attacking=false; e.cooldown=false; } }, e.atkLock);
}
function bossSpawnWave(e, dir, dmgMult){
  const fx = { el:null, kind:'wave', x:e.x + dir*90, dir:dir, speed:2.4, born:Date.now(), dur:2600, hit:false, w:170, h:78, dmg:Math.round(36*dmgMult) };
  spawnQuakeImg(fx);
}
// 用地震波贴图生成Boss冲击波（贴地、水平推进）
function spawnQuakeImg(fx, imgSrc){
  const el = document.createElement('img');
  el.className = 'bossFx waveImg';
  el.src = imgSrc || QUAKE_WAVE_IMAGE;
  el.style.width = fx.w+"px";
  el.style.height = fx.h+"px";
  el.style.bottom = "104px";
  document.getElementById('game').appendChild(el);
  fx.el = el;
  window.bossFx.push(fx);
}

function bossScatter(e, dmgMult){
  e.jumpV = -13; e.jumpY = 0; e.jumping = true; // 升到空中（不会往下掉，也不会飞出屏幕）
  const dir = (enemy.x >= e.x) ? 1 : -1;
  for(let i=0;i<6;i++){
    const off = (i - 2.5) * 90;
    const tx = e.x + dir*130 + off;
    setTimeout(()=>{
      if(e.dead) return;
      showBossTelegraph(tx, 26);
      setTimeout(()=>{
        if(e.dead) return;
        const fx = { el:null, kind:'pellet', x:tx, born:Date.now(), dur:200, hit:false, w:44, h:44, dmg:Math.round(20*dmgMult) };
        const el = document.createElement('div');
        el.className = 'bossFx pellet';
        el.style.width=fx.w+"px"; el.style.height=fx.h+"px";
        document.getElementById('game').appendChild(el);
        fx.el = el; window.bossFx.push(fx);
      }, 700);
    }, i*160);
  }
  setTimeout(()=>{ if(!e.dead){ e.jumping=false; e.jumpY=0; e.jumpV=0; } }, 1300);
  e.atkLock = 1700;
  setTimeout(()=>{ if(!e.dead){ e.attacking=false; e.cooldown=false; } }, e.atkLock);
}

function bossBreath(e, dmgMult){
  const warn = document.createElement('div');
  warn.className = 'bossWarnBar';
  document.getElementById('game').appendChild(warn);
  setTimeout(()=>{ if(warn.parentNode) warn.parentNode.removeChild(warn); }, 1300);
  const dir = (enemy.x >= e.x) ? 1 : -1;
  setTimeout(()=>{
    if(e.dead) return;
    const w = 430, h = 135;
    const fx = { el:null, kind:'breath', x:e.x + (dir>0?150:-150), born:Date.now(), dur:1500, hit:false, w:w, h:h, dmg:Math.round(32*dmgMult), lastHit:0 };
    const el = document.createElement('img');
    el.className = 'bossFx breathImg';
    el.src = DARK_BREATH_IMAGE;
    el.style.width=w+"px"; el.style.height=h+"px";
    el.style.bottom = "104px";
    document.getElementById('game').appendChild(el);
    fx.el = el; window.bossFx.push(fx);
  }, 1300);
  e.atkLock = 2900;
  setTimeout(()=>{ if(!e.dead){ e.attacking=false; e.cooldown=false; } }, e.atkLock);
}

function bossCharge(e, dmgMult){
  const dir = (enemy.x >= e.x) ? 1 : -1;
  const from = e.x;
  const to = Math.max(120, Math.min(window.innerWidth-120, from + dir*900));
  showBossTelegraph(to, 80);
  e.img.style.filter = "brightness(1.5)";
  setTimeout(()=>{
    if(e.dead) return;
    e.img.style.filter = "";
    // 本体沿地面冲锋（带黑气拖尾效果跟随，不会飘到天上）
    const start = Date.now();
    const dur = 800;
    let hitDone = false;
    const iv = setInterval(()=>{
      if(e.dead){ clearInterval(iv); return; }
      const t = Math.min(1, (Date.now()-start)/dur);
      e.x = from + (to - from)*t;
      e.img.style.left = e.x + "px";
      if(!hitDone && !playerDead && Math.abs(enemy.x - e.x) < 150 && -((playerY||0)) < 120){
        hitDone = true;
        bossHitPlayer(Math.round(46*dmgMult));
      }
      if(t >= 1){ clearInterval(iv); }
    }, 16);
    e.atkLock = 1700;
    setTimeout(()=>{ if(!e.dead){ e.attacking=false; e.cooldown=false; } }, e.atkLock);
  }, 700);
}

// 泰山压顶：跳到天上定格约2.5秒（期间向下发弹），落点有等大警告圈，砸下造成范围伤害
function bossSmash(e, dmgMult){
  const targetX = enemy.x; // 落点瞄准玩家
  // 落点地面椭圆警告（像妙脆角猫大招那样，砸下来的位置）
  const warn = document.createElement('div');
  warn.className = 'bossSmashWarn';
  // 椭圆随Boss体型缩放：完全体440，削弱后缩小到300，红圈跟着缩小，保证压中玩家
  const bossScale = (e.phase===2) ? 0.68 : 1;
  const szW = Math.max(200, Math.round(440 * bossScale));
  const szH = Math.max(70, Math.round(140 * bossScale));
  warn.style.width = szW+"px"; warn.style.height = szH+"px";
  warn.style.left = (targetX - szW/2) + "px";
  document.getElementById('game').appendChild(warn);
  setTimeout(()=>{ if(warn.parentNode) warn.parentNode.removeChild(warn); }, 2500);
  // 跳到天上并滞空定格（手动动画，看得见的高高跳起）
  e.smashAnim = { start: Date.now(), upMs: 550, hoverMs: 1950, top: 340 };
  e.img.style.filter = "brightness(1.35)";
  // 空中定格：每0.5秒向下发一颗暗弹（红圈和暗弹都放大，落地后停留一段时间造成伤害）
  const missleTimer = setInterval(()=>{
    if(e.dead){ clearInterval(missleTimer); return; }
    const tx = Math.max(80, Math.min(window.innerWidth-80, enemy.x + (Math.random()*220-110)));
    showBossTelegraph(tx, 34); // 红圈放大，更醒目
    setTimeout(()=>{
      if(e.dead) return;
      const fx = { el:null, kind:'pellet', x:tx, born:Date.now(), dur:1300, hit:false, w:72, h:72, dmg:Math.round(15 * (window.hardMult||1) * (window.diffDmgMult||1)), lastHit:0 }; // 干扰用低伤害：普通15，困难/噩梦按倍数上翻
      const el = document.createElement('img');
      el.className = 'bossFx pelletImg';
      el.src = QUAKE_WAVE_IMAGE;
      el.style.width=fx.w+"px"; el.style.height=fx.h+"px";
      el.style.bottom="100px";
      document.getElementById('game').appendChild(el);
      fx.el = el; window.bossFx.push(fx);
    }, 420);
  }, 520);
  // 2.5秒后泰山压顶
  setTimeout(()=>{
    clearInterval(missleTimer);
    if(e.dead) return;
    e.img.style.filter = "";
    e.smashAnim = null;
    e.img.style.bottom = "80px"; // 落回地面
    e.x = targetX;
    e.img.style.left = e.x + "px";
    shakeScreen(320, 12);
    playBossAudio(BOSS_QUAKE_AUDIO, 2000);
    if(!playerDead && Math.abs(enemy.x - targetX) < szW/2 && -((playerY||0)) < szH/2 + 30){
      bossHitPlayer(Math.round(85*dmgMult)); // 泰山压顶伤害提高
      if(typeof showDamageText==='function' && enemyObj) showDamageText("泰山压顶!", enemyObj);
    }
    e.atkLock = 1600;
    setTimeout(()=>{ if(!e.dead){ e.attacking=false; e.cooldown=false; } }, e.atkLock);
  }, 2500);
}

// 削弱版·暗影湮灭：贴地冲击波（体积较大，持续穿透，每1秒一跳，跳开可躲）
function bossAnnihil(e, dmgMult){
  // 起手预警：贴地红线提示冲击波即将扫过（持续3秒蓄力，给足反应时间）
  const warn = document.createElement('div');
  warn.className = 'bossWarnBar';
  document.getElementById('game').appendChild(warn);
  e.img.style.filter = "brightness(1.5)";
  setTimeout(()=>{
    if(e.dead) return;
    e.img.style.filter = "";
    if(warn.parentNode) warn.parentNode.removeChild(warn);
    playBossAudio(BOSS_QUAKE_AUDIO, 2200);
    shakeScreen(360, 10);
    const dir = (enemy.x >= e.x) ? 1 : -1;
    const bw = 720, bh = 260; // 比剧情杀小一点，但体积仍然较大
    if(typeof startAnnihilSlowmo==='function') startAnnihilSlowmo(); // 大招发射：进入2秒慢动作，提示按右键闪避
    const fx = { el:null, kind:'annihil', x:(e.x + (dir>0?60:-60-bw)), dir:dir, speed:3.6, born:Date.now(), dur:2600, hit:false, w:bw, h:260, dmg:Math.round(300*dmgMult), lastHit:0 }; // h=260 与贴图同高，跳得比贴图高或用闪避即可躲开
    const el = document.createElement('img');
    el.className = 'bossFx annihilImg';
    el.src = ANNIHILATION_IMAGE;
    el.style.width = bw + "px"; el.style.height = bh + "px";
    el.style.bottom = "110px"; // 贴地打
    el.style.transform = "scaleX(" + dir + ")";
    document.getElementById('game').appendChild(el);
    fx.el = el; window.bossFx.push(fx);
    e.atkLock = 2600;
    setTimeout(()=>{ if(!e.dead){ e.attacking=false; e.cooldown=false; } }, e.atkLock);
  }, 3000);
}

function bossSummonMinions(e){
  e.summonCount = (e.summonCount||0) + 1;
  // 前期召唤普通奶蛙，后期召唤精英奶蛙/爆裂奶蛙（不召唤奶鼠）
  const pool = [{type:'normal', hp:90}];
  if(e.phase===2 || e.summonCount >= 3){
    pool.push({type:'elite', hp:260}, {type:'boom', hp:200});
  }
  const kinds = [];
  for(let i=0;i<2;i++){
    const cfg = pool[Math.floor(Math.random()*pool.length)];
    const c = { hp: Math.round((cfg.hp)*(window.hardMult||1)), type: cfg.type };
    const x = e.x + (i===0 ? -260 : 260);
    const m = makeEnemy(c, Math.max(80, Math.min(window.innerWidth-80, x)), 0);
    m.isSummoned = true;
    kinds.push(cfg.type==='elite'?'精英奶蛙':cfg.type==='boom'?'爆裂奶蛙':'奶蛙');
  }
  // 只报实际召唤出来的怪物，没召唤的不说
  if(kinds.length && typeof showStoryHint==='function') showStoryHint('怒岚召唤了：'+kinds.join('、')+'！');
}

// 特效推进 + 玩家碰撞
function updateBossFx(){
  if(!window.bossFx || window.l15StoryRunning) return;
  if(window.gamePaused) return; // 暂停时冻结Boss攻击
  const now = Date.now();
  for(let i=window.bossFx.length-1;i>=0;i--){
    const fx = window.bossFx[i];
    if(!fx || !fx.el || !fx.el.parentNode){ window.bossFx.splice(i,1); continue; }
    if(now - fx.born > fx.dur){ fx.el.remove(); window.bossFx.splice(i,1); continue; }
    if(fx.kind==='quake' || fx.kind==='wave'){
      fx.x += fx.dir * fx.speed * slowmoFactor();
      fx.el.style.left = fx.x + "px";
      if(!fx.hit && !playerDead && Math.abs(enemy.x - fx.x) < fx.w && -((playerY||0)) < 60){
        fx.hit = true; bossHitPlayer(fx.dmg);
      }
    } else if(fx.kind==='pellet'){
      fx.el.style.left = fx.x + "px";
      // 落地暗弹：踩到就受伤，且停留约2.6秒（站在上面每0.4秒再扣一次）
      if(!playerDead && Math.abs(enemy.x - fx.x) < fx.w && -((playerY||0)) < 70 && (now - (fx.lastHit||0)) >= 400){
        fx.lastHit = now; bossHitPlayer(fx.dmg);
      }
    } else if(fx.kind==='breath'){
      fx.el.style.left = fx.x + "px";
      const pleft = enemy.x - 20, pright = enemy.x + 60;
      if(!playerDead && pright > fx.x && pleft < fx.x + fx.w && -((playerY||0)) < fx.h && (now - (fx.lastHit||0)) > 400){
        fx.lastHit = now; bossHitPlayer(fx.dmg);
      }
    } else if(fx.kind==='charge'){
      const sf = slowmoFactor();
      const t = Math.min(1, (now - fx.born)/(fx.dur/sf));
      fx.x = fx.from + (fx.to - fx.from)*t;
      fx.el.style.left = (fx.x - fx.w/2) + "px";
      if(!fx.hit && !playerDead && Math.abs(enemy.x - fx.x) < 140 && -((playerY||0)) < 120){
        fx.hit = true; bossHitPlayer(fx.dmg);
      }
    } else if(fx.kind==='annihil'){
      // 削弱版暗影湮灭：贴地冲击波持续推进，穿透伤害每1秒一跳（时缓时几乎静止；按右键闪避后不再造成伤害）
      fx.x += fx.dir * fx.speed * slowmoFactor();
      fx.el.style.left = fx.x + "px";
      const pleft = enemy.x - 20, pright = enemy.x + 60;
      if(!playerDead && !window.annihilDodged && pright > fx.x && pleft < fx.x + fx.w && -((playerY||0)) < fx.h && (now - (fx.lastHit||0)) >= 1000){
        fx.lastHit = now; bossHitPlayer(fx.dmg);
      }
    }
  }
}

// 重置第15关剧情（重新体验）
function resetL15Story(){
  window.accountL15Seen = false;
  saveGame();
  alert('第16关剧情已重置，进入第16关将重新体验完整剧情和宗主赐福（技能加强）！');
}
window.resetL15Story = resetL15Story;

// 敌人血量随关卡动态提升（角色升级攻击变高，怪物也要变厚保持平衡）
function enemyLevelHpScale(){
  return 1 + ((typeof currentLevel!=='undefined' ? currentLevel : 0)) * 0.03;
}
window.enemyLevelHpScale = enemyLevelHpScale;
function makeEnemy(ec, x, groundY){
  window.__eid = (window.__eid||0)+1;
  const e = {
    uid: window.__eid,
    x: x,
    hp: Math.round(ec.hp * (window.enemyHpMult||1) * (window.diffHpMult||1) * enemyLevelHpScale()), maxHp: Math.round(ec.hp * (window.enemyHpMult||1) * (window.diffHpMult||1) * enemyLevelHpScale()),
    dead:false, stunned:false, state:"IDLE", face:1,
    attacking:false, cooldown:false,
    type: ec.type || 'normal',
    canJump: true, // 奶蛙都能跳上小障碍物（箱/建筑）；太高（哨塔）靠高度判定上不去
    jumping:false, jumpY:0, jumpV:0, lastJump:0,
    groundY: groundY || 0,
    images: (ec.type==='mouse') ? { walk:[MOUSE_IDLE_IMAGE], alert:MOUSE_IDLE_IMAGE, attack:MOUSE_CROUCH_IMAGE, hurt:MOUSE_IDLE_IMAGE, dead:MOUSE_DEAD_IMAGE } : (ec.type==='boom') ? { walk:[BOOM_IMAGE], alert:BOOM_IMAGE, attack:BOOM_IMAGE, hurt:BOOM_IMAGE, dead:BOOM_IMAGE } : null,
    attackTimer:null, attackEndTimer:null, walkFrame:0,
    img:null, hpBox:null
  };
  const img = document.createElement("img");
  img.className = "enemyImg";
  img.src = enemyImgSrc(e,'walk');
  if(ec.type === "elite"){ img.style.width = "210px"; img.style.height = "210px"; }
  else if(ec.type === "mouse"){ img.style.width = ec.elite ? "160px" : "110px"; img.style.height = ec.elite ? "160px" : "110px"; }
  else if(ec.type === "boom"){ img.style.width = ec.elite ? "180px" : "150px"; img.style.height = ec.elite ? "180px" : "150px"; }
  img.style.left = e.x + "px";
  document.getElementById("game").appendChild(img);
  e.img = img;
  const hpBox = document.createElement("div");
  hpBox.className = "enemyHpBox";
  hpBox.innerHTML = '<div class="enemyHpFill"></div><span class="enemyHpText"></span>';
  document.getElementById("game").appendChild(hpBox);
  e.hpBox = hpBox;
  e.die = function(){ enemyDeath(e); };
  enemies.push(e);
  updateEnemyHp(e);
  return e;
}

// 哨塔守卫：关卡刷新时塔顶自动站一名敌人（最多1名），站在塔上不会下来
function spawnTowerGuard(t){
  const guardCfg = { hp: Math.round(120 + (currentLevel+1)*8), type:'normal' };
  const guard = makeEnemy(guardCfg, t.x, t.topY);
  guard.towerGuard = true;
  guard.tower = t;
  guard.canJump = false;
  guard.face = -1;
  return guard;
}

function spawnLevel(idx){
  clearEnemies();
  currentLevel = idx;
  levelCleared = false;
  const cfg = LEVELS[idx];
  if(!cfg) return;
  cfg.enemies.forEach(ec=>{
    if(ec.type==='boss'){ spawnBoss(ec); return; }
    makeEnemy(ec, window.innerWidth * ec.x, 0);
  });
  updateTargetFrog();
  spawnSolids();
  // 第15关：Boss 专属背景 + 模式初始化
  const gEl = document.getElementById('game');
  if(gEl){ gEl.style.backgroundImage = (idx+1===16) ? "url('assets/ui/bg_boss1.png')" : "url('assets/ui/bg_scene.png')"; }
  if(idx+1===16 && typeof l15Init==='function'){ l15Init(); }
  if(cfg.mode && typeof initSpecialLevel==='function'){ initSpecialLevel(idx); } // 特殊玩法关初始化
  // 关卡横幅
  const banner = document.createElement("div");
  banner.id = "levelBanner";
  banner.textContent = cfg.name + (window.levelMode==='hard' ? ' · 困难' : '');
  document.getElementById("game").appendChild(banner);
  setTimeout(()=>{ const b=document.getElementById('levelBanner'); if(b) b.remove(); },1600);
}

window.prologueLevelPending = false;
window.prologueResume = false;
function startLevel(idx){
  // 新玩家首次进入第1关：先播放序章黑幕白字，播完再开打（prologueResume=true时是序章播完后的正式开打）
  if(idx===0 && !(window.accountCleared && window.accountCleared[0]) && !window.infiniteMode && !window.prologueResume){
    window.prologueLevelPending = true;
    const p = document.getElementById('prologue');
    if(p) p.style.display='flex';
    if(typeof initPrologue==='function') initPrologue();
    return;
  }
  window.prologueResume = false;
  if(typeof clearBattleOverlays==='function') clearBattleOverlays(); // 重进关卡前清掉上一场的失败/通关界面
  playerHp = playerMaxHp;
  window.playerHp = playerHp;
  playerDead = false;
  gameEnded = false;
  // 重置所有技能/普攻/闪避冷却（新关卡满状态开始）
  canShoot=true; shootCooldownLeft=0; window.shootCooldownLeft=0;
  qReady=true; qCooldownLeft=0; window.qCooldownLeft=0;
  healSkillReady=true; healCooldownLeft=0; window.healCooldownLeft=0;
  // 非Boss关：R大招进场即在冷却（不能一进场就放）；Boss关（16）大招就绪
  rReady=(idx+1)===16; rCooldownLeft=0; window.rCooldownLeft=0;
  if((idx+1)!==16 && window.accountRUnlocked){
    const rc0 = Math.round((typeof R_COOLDOWN!=='undefined'?R_COOLDOWN:120000) * (typeof getCdFactor==='function'?getCdFactor():1));
    rCooldownLeft=rc0; window.rCooldownLeft=rc0;
    setTimeout(()=>{ rReady=true; rCooldownLeft=0; window.rCooldownLeft=0; }, rc0);
  }
  dashReady=true; dashCooldownLeft=0; window.dashCooldownLeft=0;
  window.playerAttackBuff = window.pendingAttackBuff||0; window.pendingAttackBuff = 0;
  // 新手小木剑：可用5关，每关攻击+5
  if(inventory.giftSword > 0){ window.playerAttackBuff += 3; inventory.giftSword--; } // 新手小木剑：每关攻击+3
  window.playerDefenseBuff = window.pendingDefenseBuff||0; window.pendingDefenseBuff = 0;
  window.playerShield = 0;
  // 依石：血量×2 + 开场200护盾（本关生效）
  if(window.pendingYishi){
    playerMaxHp = playerMaxHp * 2;
    window.playerMaxHp = playerMaxHp;
    playerHp = playerMaxHp; window.playerHp = playerMaxHp;
    window.playerShield = (window.playerShield||0) + 200;
    window.pendingYishi = false;
  }
  // 馕：小幅移速（本关生效）
  if(window.pendingSpeedBuff){
    currentPlayerSpeed += window.pendingSpeedBuff;
    window.pendingSpeedBuff = 0;
  }
  window.levelPending = { gold:0, items:{} };
  { const st=(inventory&&inventory.talents)||{}; const shp=st.shield4?0.35:(st.shield3?0.25:(st.shield2?0.15:(st.shield?0.08:0))); if(shp>0) window.playerShield=Math.min(80,Math.round(playerMaxHp*shp)); }
  allAlert = false;
  enemy.x = 180; window.miaoCatFace = 1;
  if(enemyObj){ enemyObj.style.left = enemy.x+"px"; enemyObj.style.transform = "scaleX(1)"; }
  catBullets=[]; qRockets=[];
  document.querySelectorAll('.catBullet,.qRocket,.dogBlade,.frogWave').forEach(el=>el.remove());
  if(window.DOG) window.DOG.reset();
  // 刀盾狗：非Boss关大招进场即在冷却（Boss关16大招就绪）
  if((idx+1)!==16 && window.accountRUnlocked && activeCharacter==='daodungou' && window.DOG && typeof window.DOG.startTornadoCooldown==='function'){
    window.DOG.startTornadoCooldown();
  }
  updatePlayerHP();
  spawnLevel(idx);
  if(window.updateV13UI) window.updateV13UI();
}

function updateTargetFrog(){
  let best=null, bestD=Infinity;
  for(const e of enemies){
    if(e.dead) continue;
    const d = Math.abs(e.x - enemy.x);
    if(d < bestD){ bestD=d; best=e; }
  }
  if(best){
    frog = best; window.frog = best; frogImg = best.img;
  } else if(enemies.length > 0){
    // 全部死亡时指向第一个（dead），避免 null 崩溃
    frog = enemies[0]; window.frog = frog; frogImg = frog.img;
  } else {
    frog = null; window.frog = null; frogImg = null;
  }
  if(typeof updateFrogHP==='function') updateFrogHP(); // Boss血条UI随目标实时切换
}

function nearestAliveEnemy(){
  return frog;
}

// ===================== V10.6 无限模式子菜单（开始游戏 / 排行榜） =====================
function openInfiniteMenu(){
  const existing = document.getElementById('infiniteMenu');
  if(existing){ existing.remove(); return; }
  const m = document.getElementById('mainMenu'); if(m) m.style.display = 'none';
  const ov = document.createElement('div');
  ov.id = 'infiniteMenu';
  ov.innerHTML = '<div class="infiniteCard">' +
    '<div class="infiniteTitle">♾️ 无限模式</div>' +
    '<div class="infiniteSub">波次刷怪 · 金币永久保留 · 退出不丢进度</div>' +
    '<button class="pmBtn" onclick="startInfiniteSelect()">⚔️ 开始游戏</button>' +
    '<button class="pmBtn" onclick="showLeaderboard()">🏆 排行榜</button>' +
    '<button class="pmBtn" onclick="backToMenu()">◀ 返回主菜单</button>' +
    '</div>';
  document.body.appendChild(ov);
}
window.openInfiniteMenu = openInfiniteMenu;
function closeInfiniteMenu(){
  const el = document.getElementById('infiniteMenu'); if(el) el.remove();
  // ESC/关闭无限模式子菜单 → 回到主界面（不能停在绿幕）
  const m = document.getElementById('mainMenu'); if(m) m.style.display='flex';
  if(typeof renderGiftIcon==='function') renderGiftIcon();
  if(typeof renderGuideIcon==='function') renderGuideIcon();
}
window.closeInfiniteMenu = closeInfiniteMenu;
function startInfiniteSelect(){
  const el = document.getElementById('infiniteMenu'); if(el) el.remove();
  // 中途退出后再进：沿用上次使用的角色直接进入（不再选角色，避免进度/角色不一致）
  if(window.inventory && window.inventory.infiniteWave > 1 && window.inventory.infiniteChar){
    const c = window.inventory.infiniteChar;
    if(c==='daodungou' || c==='miaocuijiao_cat'){ selectCharacter(c); }
    enterInfiniteMode();
    return;
  }
  window.pendingInfinite = true;
  showCharacterSelect('无限模式');
}
window.startInfiniteSelect = startInfiniteSelect;

// ===================== V15.8 训练营（稻草人木桩 · 全技能3秒冷却） =====================
window.trainingMode = false;
const SCARECROW_IMAGE = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22150%22%20height%3D%22210%22%20viewBox%3D%220%200%20150%20210%22%3E%3Crect%20x%3D%2271%22%20y%3D%2266%22%20width%3D%228%22%20height%3D%22130%22%20fill%3D%22%238a6a3a%22%2F%3E%3Ccircle%20cx%3D%2275%22%20cy%3D%2244%22%20r%3D%2227%22%20fill%3D%22%23e8c98a%22%20stroke%3D%22%23b8863f%22%20stroke-width%3D%223%22%2F%3E%3Ccircle%20cx%3D%2264%22%20cy%3D%2238%22%20r%3D%223.4%22%20fill%3D%22%233a2a1a%22%2F%3E%3Ccircle%20cx%3D%2286%22%20cy%3D%2238%22%20r%3D%223.4%22%20fill%3D%22%233a2a1a%22%2F%3E%3Cpath%20d%3D%22M64%2052%20q11%209%2022%200%22%20stroke%3D%22%233a2a1a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cline%20x1%3D%2275%22%20y1%3D%2286%22%20x2%3D%2220%22%20y2%3D%22126%22%20stroke%3D%22%23c98a4b%22%20stroke-width%3D%2211%22%20stroke-linecap%3D%22round%22%2F%3E%3Cline%20x1%3D%2275%22%20y1%3D%2286%22%20x2%3D%22130%22%20y2%3D%22126%22%20stroke%3D%22%23c98a4b%22%20stroke-width%3D%2211%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%2242%22%20y%3D%2284%22%20width%3D%2266%22%20height%3D%2254%22%20rx%3D%2212%22%20fill%3D%22%23d9a95f%22%20stroke%3D%22%23b8863f%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%2250%22%20y1%3D%22100%22%20x2%3D%22100%22%20y2%3D%22100%22%20stroke%3D%22%23b8863f%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%2250%22%20y1%3D%22112%22%20x2%3D%22100%22%20y2%3D%22112%22%20stroke%3D%22%23b8863f%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%2250%22%20y1%3D%22124%22%20x2%3D%22100%22%20y2%3D%22124%22%20stroke%3D%22%23b8863f%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M46%2026%20h58%20l-7%2018%20h-44%20z%22%20fill%3D%22%237a4a24%22%2F%3E%3Crect%20x%3D%2239%22%20y%3D%2216%22%20width%3D%2272%22%20height%3D%2213%22%20rx%3D%225%22%20fill%3D%22%237a4a24%22%2F%3E%3C%2Fsvg%3E";
// 训练营按钮：未解锁显示锁定状态
function trainingBtnClick(){
  if(!window.accountTrainingUnlocked){
    alert('🔒 训练营需通关第 10 关（获得 Q 技能）后解锁！');
    return;
  }
  openTrainingCamp();
}
window.trainingBtnClick = trainingBtnClick;
function renderTrainingBtn(){
  const btn = document.getElementById('trainingBtn');
  if(!btn) return;
  if(window.accountTrainingUnlocked){
    btn.classList.remove('locked');
    btn.innerHTML = '🏋️ 训练营';
  } else {
    btn.classList.add('locked');
    btn.innerHTML = '🔒 训练营（第10关解锁）';
  }
}
window.renderTrainingBtn = renderTrainingBtn;
function openTrainingCamp(){
  if(!window.accountTrainingUnlocked){
    alert('🔒 训练营需通关第 10 关（获得 Q 技能）后解锁！');
    return;
  }
  const existing = document.getElementById('trainingMenu');
  if(existing){ existing.remove(); return; }
  const m = document.getElementById('mainMenu'); if(m) m.style.display='none';
  const ov = document.createElement('div');
  ov.id = 'trainingMenu';
  ov.innerHTML = '<div class="infiniteCard">' +
    '<div class="infiniteTitle">🏋️ 训练营</div>' +
    '<div class="infiniteSub">所有技能冷却 3 秒 · 中间有稻草人木桩（无限血量）<br>随便爽打，熟悉每个技能的招式与连招</div>' +
    '<div class="trainingChars">' +
    '  <button class="pmBtn" onclick="enterTrainingCamp(\'miaocuijiao_cat\')">🐱 妙脆角猫</button>' +
    '  <button class="pmBtn" onclick="enterTrainingCamp(\'daodungou\')">🐶 刀盾狗</button>' +
    '</div>' +
    '<button class="pmBtn" onclick="backToMenu()">◀ 返回主菜单</button>' +
    '</div>';
  document.body.appendChild(ov);
}
window.openTrainingCamp = openTrainingCamp;
function enterTrainingCamp(char){
  const el = document.getElementById('trainingMenu'); if(el) el.remove();
  if(char==='daodungou' || char==='miaocuijiao_cat'){ selectCharacter(char); }
  const g = document.getElementById('game'); if(g){ g.style.display='block'; g.style.backgroundImage = "url('assets/ui/bg_scene.png')"; }
  window.trainingMode = true;
  window.infiniteMode = false;
  window.gameStarted = true;
  window.gamePaused = false;
  if(typeof clearBattleOverlays==='function') clearBattleOverlays();
  playerDead = false; gameEnded = false; levelCleared = false;
  playerHp = playerMaxHp; window.playerHp = playerHp;
  canShoot=true; shootCooldownLeft=0; window.shootCooldownLeft=0;
  qReady=true; qCooldownLeft=0; window.qCooldownLeft=0;
  healSkillReady=true; healCooldownLeft=0; window.healCooldownLeft=0;
  rReady=true; rCooldownLeft=0; window.rCooldownLeft=0;
  dashReady=true; dashCooldownLeft=0; window.dashCooldownLeft=0;
  window.miaocatCorn=2; window.miaocat = { hornCooldowns:[0,0], horns:2, maxHorns:2 };
  if(activeCharacter==='daodungou'){ if(window.DOG) window.DOG.reset(); }
  else if(typeof updateCornSprite==='function') updateCornSprite();
  allAlert=false;
  enemy.x = 200; window.miaoCatFace = 1;
  if(enemyObj){ enemyObj.style.left = enemy.x+"px"; enemyObj.style.transform = "scaleX(1)"; }
  catBullets=[]; qRockets=[];
  document.querySelectorAll('.catBullet,.qRocket,.dogBlade,.frogWave').forEach(el=>el.remove());
  spawnScarecrow();
  if(typeof applyLevelBGM==='function') applyLevelBGM(); else if(typeof startBGM==='function') startBGM();
  if(window.updateV13UI) window.updateV13UI();
  startUpdateLoop();
}
window.enterTrainingCamp = enterTrainingCamp;
// 训练营稻草人：无限血量木桩，只显示红色伤害数字，不击退/不死亡
function spawnScarecrow(){
  clearEnemies();
  solidObjects.forEach(s=>{ if(s.el&&s.el.parentNode) s.el.parentNode.removeChild(s.el); }); solidObjects=[];
  const img = document.createElement('img');
  img.className = 'enemyImg scarecrowImg';
  img.src = SCARECROW_IMAGE;
  img.style.width = '150px'; img.style.height = '210px';
  const e = {
    uid: (window.__eid = (window.__eid||0)+1),
    x: window.innerWidth*0.5, hp: 999999999, maxHp: 999999999,
    dead:false, stunned:false, state:'IDLE', face:1,
    attacking:false, cooldown:false,
    type:'dummy', canJump:false, jumping:false, jumpY:0, jumpV:0,
    groundY:0, images:{ walk:[SCARECROW_IMAGE], alert:SCARECROW_IMAGE, attack:SCARECROW_IMAGE, hurt:SCARECROW_IMAGE, dead:SCARECROW_IMAGE },
    img:img, hpBox:null
  };
  img.style.left = (e.x - 75) + "px";
  document.getElementById('game').appendChild(img);
  // 头顶总伤害数字（红色，累计对本稻草人造成的总伤害）
  const dmgEl = document.createElement('div');
  dmgEl.className = 'scarecrowDmg';
  dmgEl.textContent = '总伤害 0';
  dmgEl.style.left = (e.x - 100) + "px";
  dmgEl.style.bottom = '310px';
  document.getElementById('game').appendChild(dmgEl);
  e.dmgEl = dmgEl;
  window.scarecrowTotalDmg = 0;
  e.die = function(){};
  enemies.push(e);
  frog = e; window.frog = e; frogImg = e.img;
}
window.spawnScarecrow = spawnScarecrow;

// 选角色界面（通用：闯关/无限模式），label 用于提示将进入的目标
function showCharacterSelect(label){
  const s = document.getElementById('select'); if(s) s.style.display = 'flex';
  const ls = document.getElementById('levelSelect'); if(ls) ls.style.display = 'none';
  const btn = document.getElementById('startBtn');
  if(btn) btn.textContent = '⚔️ 开始：' + (label || '挑战');
  selectCharacter(activeCharacter); // 默认选中当前角色，保证“开始”可用
  saveGame();
}
window.showCharacterSelect = showCharacterSelect;

// 无限模式排行榜（当前为本机记录，后续接共享服务器后所有玩家共用）
// 排行榜：四个难度并列展示（左→右：躺平 / 普通 / 高手 / 噩梦）
function showLeaderboard(){
  const el = document.getElementById('infiniteMenu'); if(el) el.remove();
  const colors = ['#ffd700','#4fc3f7','#81c784','#dff3ff','#dff3ff','#dff3ff','#dff3ff','#dff3ff'];
  const col = (d)=>{
    const board = loadInfiniteBoard(d).sort((a,b)=> (b.wave - a.wave) || (b.gold - a.gold)).slice(0, 8);
    const rows = board.length
      ? board.map((b,i)=> '<div class="rankRow"><span class="rankNum" style="color:'+colors[i]+'">'+(i+1)+'</span> <img class="rankAvatar" src="'+(b.avatar||'')+'" alt=""> '+b.name+' · '+b.wave+'波 · '+fmtGold(b.gold)+'</div>').join('')
      : '<div class="rankRow">暂无记录</div>';
    return '<div class="lbCol"><div class="lbColTitle">'+INFINITE_DIFF_NAMES[d]+'</div>'+rows+'</div>';
  };
  const ov = document.createElement('div');
  ov.id = 'infiniteLeaderboard';
  ov.innerHTML = '<div class="infiniteCard lbCard">' +
    '<div class="infiniteTitle">🏆 无限模式排行榜</div>' +
    '<div class="infiniteSub">按难度分开排名 · 本机记录</div>' +
    '<div class="lbGrid">' + INFINITE_DIFFS.map(col).join('') + '</div>' +
    '<button class="pmBtn" onclick="closeLeaderboard()">◀ 返回</button>' +
    '</div>';
  document.body.appendChild(ov);
}
window.showLeaderboard = showLeaderboard;
function closeLeaderboard(){
  const el = document.getElementById('infiniteLeaderboard'); if(el) el.remove();
  openInfiniteMenu();
}
window.closeLeaderboard = closeLeaderboard;
// 手动清空排行榜（仅玩家主动调用，版本更新不会自动清）
function clearInfiniteLeaderboard(){
  const ov = document.createElement('div');
  ov.id = 'confirmPanel';
  ov.innerHTML = '<div class="confirmCard"><div class="confirmTitle">🗑️ 清空排行榜？</div>' +
    '<div class="confirmText">这会删除本机四个难度排行榜的全部记录，且不可恢复。确定要清空吗？</div>' +
    '<div class="confirmBtns"><button class="confirmYes" onclick="doClearLeaderboard(true)">确定清空</button>' +
    '<button class="confirmNo" onclick="doClearLeaderboard(false)">取消</button></div></div>';
  document.body.appendChild(ov);
}
window.clearInfiniteLeaderboard = clearInfiniteLeaderboard;
function doClearLeaderboard(ok){
  const el = document.getElementById('confirmPanel'); if(el) el.remove();
  if(ok){
    INFINITE_DIFFS.forEach(d=>{ try{ localStorage.removeItem('milkfrog_infinite_leaderboard_'+d); }catch(e){} });
    try{ localStorage.removeItem('milkfrog_infinite_leaderboard'); }catch(e){}
    const lb = document.getElementById('infiniteLeaderboard'); if(lb) lb.remove();
    showLeaderboard();
    alert('✅ 排行榜已清空，重新开始排名！');
  }
}
window.doClearLeaderboard = doClearLeaderboard;

// ===================== V10.4 无限模式（波次刷怪，金币/进度保留） =====================
function enterInfiniteMode(){
  window.infiniteMode = true;
  const m = document.getElementById('mainMenu'); if(m) m.style.display='none';
  const g = document.getElementById('game'); if(g) g.style.display='block';
  if(g) g.style.backgroundImage = "url('assets/ui/bg_scene.png')"; // 无限模式也有草原背景，不是绿屏
  window.gameStarted = true;
  window.gamePaused = false;
  if(typeof clearBattleOverlays==='function') clearBattleOverlays();
  window.infiniteWave = (window.inventory && window.inventory.infiniteWave) || 1;
  window.infiniteRunGold = 0;
  // 记住本次使用的角色：中途退出后再进直接沿用
  if(window.inventory) window.inventory.infiniteChar = activeCharacter;
  // 中途退出再进：血量保持退出时状态；死亡后从满血重新开始
  const savedHp = window.inventory && window.inventory.infiniteHp;
  const savedMaxHp = window.inventory && window.inventory.infiniteMaxHp;
  // 中转站累计的生命上限增益
  if(window.inventory && window.inventory.infRun && window.inventory.infRun.hpBonus){
    playerMaxHp += window.inventory.infRun.hpBonus;
    window.playerMaxHp = playerMaxHp;
  }
  if(savedMaxHp && window.inventory.infiniteWave > 1){
    playerMaxHp = Math.max(playerMaxHp, savedMaxHp);
    window.playerMaxHp = playerMaxHp;
  }
  if(savedHp && window.inventory.infiniteWave > 1){
    playerHp = Math.min(playerMaxHp, savedHp);
  } else {
    playerHp = playerMaxHp;
  }
  window.playerHp = playerHp; playerDead = false; gameEnded = false;
  canShoot=true; shootCooldownLeft=0; window.shootCooldownLeft=0;
  qReady=true; qCooldownLeft=0; window.qCooldownLeft=0;
  healSkillReady=true; healCooldownLeft=0; window.healCooldownLeft=0;
  rReady=true; rCooldownLeft=0; window.rCooldownLeft=0;
  dashReady=true; dashCooldownLeft=0; window.dashCooldownLeft=0;
  allAlert = false;
  enemy.x = 180; window.miaoCatFace = 1;
  if(enemyObj){ enemyObj.style.left = enemy.x+"px"; enemyObj.style.transform = "scaleX(1)"; }
  catBullets=[]; qRockets=[];
  document.querySelectorAll('.catBullet,.qRocket,.dogBlade,.frogWave').forEach(el=>el.remove());
  if(window.DOG) window.DOG.reset();
  if(activeCharacter!=='daodungou'){ window.miaocatCorn = 2; window.miaocat = { hornCooldowns:[0,0], horns:2, maxHorns:2 }; if(typeof updateCornSprite==='function') updateCornSprite(); }
  if(typeof applyLevelBGM==='function') applyLevelBGM();
  startInfiniteWave();
  if(window.updateV13UI) window.updateV13UI();
  startUpdateLoop();
}
window.enterInfiniteMode = enterInfiniteMode;

function startInfiniteWave(){
  clearEnemies();
  levelCleared = false; gameEnded = false;
  const wave = window.infiniteWave || 1;
  // 第50波=最后一波：直面削弱版怒岚（冒险15关Boss的削弱版，会召唤小怪）
  if(wave >= 50){
    const boss = spawnBoss({ x:0.5, hp:10000 });
    const easyMode4 = (window.gameSettings && window.gameSettings.diffMode === 'easy');
    boss.phase = 2;
    boss.hp = Math.round(10000 * (easyMode4?0.5:1)); boss.maxHp = boss.hp; // 躺平模式Boss血砍半
    boss.img.style.width = "300px"; boss.img.style.height = "300px";
    boss.summonNext = Date.now() + 10000;
    boss.annihilNext = Date.now() + 60000; // 无限50波Boss：每60秒放大招
    updateEnemyHp(boss);
    updateTargetFrog();
    const banner = document.createElement("div");
    banner.id = "levelBanner";
    banner.textContent = "♾️ 无限模式 · 第50波 · 最终Boss：暗影蛙将·怒岚（削弱版）";
    document.getElementById("game").appendChild(banner);
    setTimeout(()=>{ const b=document.getElementById('levelBanner'); if(b) b.remove(); }, 2200);
    return;
  }
  const count = Math.min(1 + Math.floor((wave-1)/4), 6);
  const baseHp = 70 + wave*7;
  for(let i=0;i<count;i++){
    let cfg = { hp: baseHp, type:'normal' };
    if(i===0 && wave % 10 === 0){ cfg = { hp: baseHp*4, type:'elite' }; }
    else if(i===0 && wave % 6 === 0){ cfg = { hp: baseHp*3, type:'elite' }; }
    else if(i===1 && wave % 5 === 0){ cfg = { hp: baseHp, type:'mouse' }; }
    else if(i===0 && wave % 8 === 0){ cfg = { hp: baseHp*2, type:'boom' }; }
    const x = 0.25 + (i/((count-1)||1))*0.5;
    makeEnemy(cfg, window.innerWidth * x, 0);
  }
  updateTargetFrog();
  const banner = document.createElement("div");
  banner.id = "levelBanner";
  banner.textContent = "♾️ 无限模式 · 第"+wave+"波";
  document.getElementById("game").appendChild(banner);
  setTimeout(()=>{ const b=document.getElementById('levelBanner'); if(b) b.remove(); }, 1600);
}
window.startInfiniteWave = startInfiniteWave;

// 一波通过：金币按波次累计并保留，进度保存
function infiniteWaveCleared(){
  const wave = window.infiniteWave || 1;
  const gold = (wave <= 15) ? (wave * 2) : (30 + (wave - 15) * 40); // 前15波每波+2（少），之后每波+40（难度上来才多）
  const realGold = Math.round(gold * (window.diffRewardMult||1)); // 难度倍率（噩梦3倍）
  inventory.gold += realGold;
  window.infiniteRunGold = (window.infiniteRunGold||0) + realGold;
  inventory.infiniteWave = wave + 1;
  window.infiniteWave = wave + 1;
  levelCleared = true; gameEnded = true; // 防止重复结算
  saveGame();
  if(typeof showStoryHint==='function') showStoryHint("第"+wave+"波通过！金币+"+realGold+"（已保留）");
  // 第15波打完：提示怪物增强（无限模式同样生效，弹框期间游戏暂停，关掉后才开下一波）
  if(wave === 15 && typeof showMonsterBoostNotice==='function'){
    window.waitingBoostClose = true;
    setTimeout(()=>{ showMonsterBoostNotice(); }, 500);
  }
  // 每10波一个中转站（10/20/30/40波）：三选一增益，选择时游戏暂停
  if(wave % 10 === 0 && wave < 50 && typeof showCheckpointUI==='function'){
    window.waitingCheckpoint = true;
    setTimeout(()=>{ showCheckpointUI(wave); }, 600);
  }
  // 无限模式成就（按难度区分：普通专属；噩梦另加；躺平50波得「躺平神」）
  const diffNow = currentInfiniteDiff();
  if(diffNow === 'normal'){
    if(wave >= 10 && typeof unlockAchievement==='function') unlockAchievement('inf10');
    if(wave >= 30 && typeof unlockAchievement==='function') unlockAchievement('inf30');
    if(wave >= 50 && typeof unlockAchievement==='function') unlockAchievement('inf50');
  } else if(diffNow === 'nightmare'){
    if(wave >= 20 && typeof unlockAchievement==='function') unlockAchievement('nightmare20');
    if(wave >= 30 && typeof unlockAchievement==='function') unlockAchievement('nightmare30');
  } else if(diffNow === 'easy' && wave >= 50 && typeof unlockAchievement==='function'){
    unlockAchievement('easy50'); // 躺平神
  }
  // 第50波（最后一波）通关：无限模式通关
  if(wave >= 50){
    window.infiniteCompleted = true;
    window.infiniteDeathWave = 50;
    inventory.infiniteWave = 1; // 下次从第1波重新开始
    window.infiniteWave = 1;
    inventory.infRun = { hpBonus:0, cdCut:0 };
    saveGame();
    setTimeout(()=>{ if(typeof showInfiniteResult==='function') showInfiniteResult(); }, 900);
    return;
  }
  setTimeout(()=>{ if(window.infiniteMode && !window.waitingBoostClose && !window.waitingCheckpoint) startInfiniteWave(); }, 1400);
}
window.infiniteWaveCleared = infiniteWaveCleared;

// 排行榜数据：同一个玩家只保留最高分（按昵称去重，昵称唯一不可重名）
// 后续接上共享服务器后，把 load/record 改为上报云端，所有点开链接的玩家即可共用同一榜单
// 无限模式排行榜按难度分开（躺平/普通/高手/噩梦各自独立排名，排名才公平）
const INFINITE_DIFFS = ['easy','normal','hard','nightmare'];
const INFINITE_DIFF_NAMES = { easy:'躺平', normal:'普通', hard:'高手', nightmare:'噩梦' };
window.INFINITE_DIFFS = INFINITE_DIFFS;
// V15.10 一次性清理排行榜：开发者测试记录（本版本首次加载执行一次，之后永不自动清除）
try{
  if(!localStorage.getItem('milkfrog_lb_cleared_v1510')){
    INFINITE_DIFFS.forEach(d=>{ localStorage.removeItem('milkfrog_infinite_leaderboard_'+d); });
    try{ localStorage.removeItem('milkfrog_infinite_leaderboard'); }catch(e){}
    localStorage.setItem('milkfrog_lb_cleared_v1510','1');
  }
}catch(e){}
function currentInfiniteDiff(){
  return (window.gameSettings && window.gameSettings.diffMode) || 'normal';
}
window.currentInfiniteDiff = currentInfiniteDiff;
function loadInfiniteBoard(diff){
  const d = diff || currentInfiniteDiff();
  let board = [];
  try{ board = JSON.parse(localStorage.getItem('milkfrog_infinite_leaderboard_'+d)||'[]'); }catch(e){ board = []; }
  // 版本更新保留记录：旧版单一排行榜（普通难度）迁移到普通难度榜
  if(d === 'normal' && board.length === 0){
    try{
      const legacy = JSON.parse(localStorage.getItem('milkfrog_infinite_leaderboard')||'[]');
      if(legacy.length){ board = legacy; }
    }catch(e){}
  }
  return board;
}
window.loadInfiniteBoard = loadInfiniteBoard;
function recordInfiniteScore(waves, gold){
  const name = window.accountName || '玩家';
  const avatar = (typeof getMyAvatar==='function') ? getMyAvatar() : '';
  const board = loadInfiniteBoard();
  const old = board.find(b=>b.name===name);
  if(old){
    if(waves > old.wave || (waves === old.wave && gold > old.gold)){ old.wave = waves; old.gold = gold; old.avatar = avatar; }
    else if(!old.avatar){ old.avatar = avatar; }
  } else {
    board.push({ name: name, wave: waves, gold: gold, avatar: avatar });
  }
  board.sort((a,b)=> (b.wave - a.wave) || (b.gold - a.gold));
  const top = board.slice(0, 8);
  try{ localStorage.setItem('milkfrog_infinite_leaderboard_'+currentInfiniteDiff(), JSON.stringify(top)); }catch(e){}
  return top;
}
window.recordInfiniteScore = recordInfiniteScore;

// 无限模式结算画面 + 本机排行榜（金色/蓝色/绿色前三名）
function showInfiniteResult(){
  // 死亡时用到达的波次记录（如死在43波就记43），避免被重置后的1覆盖
  const waves = Math.max((window.infiniteDeathWave||0), (window.infiniteWave||1));
  const gold = window.infiniteRunGold || 0;
  recordInfiniteScore(waves, gold);
  const board = loadInfiniteBoard();
  const colors = ['#ffd700','#4fc3f7','#81c784','#dff3ff','#dff3ff','#dff3ff','#dff3ff','#dff3ff'];
  const rows = board.map((b,i)=> '<div class="rankRow"><span class="rankNum" style="color:'+colors[i]+'">'+(i+1)+'</span> <img class="rankAvatar" src="'+(b.avatar||'')+'" alt=""> '+b.name+' · 第'+b.wave+'波 · 金币'+fmtGold(b.gold)+'</div>').join('');
  const completed = !!window.infiniteCompleted;
  window.infiniteCompleted = false;
  const title = completed ? '🏆 无限模式通关' : '♾️ 无限模式结算';
  const text = completed
    ? '恭喜你通关全部 <b>50</b> 波，击败了削弱版怒岚！获得 <b>'+gold+'</b> 金币（已保留）！'
    : '恭喜你通过 <b>'+waves+'</b> 波，获得 <b>'+gold+'</b> 金币（已保留）！';
  const ov = document.createElement('div');
  ov.id = 'l15Story';
  ov.innerHTML = '<div class="storyCard"><div class="storySub">'+title+'</div>' +
    '<div class="storyText">'+text+'</div>' +
    '<div class="rankTitle">🏆 本机排行榜（'+INFINITE_DIFF_NAMES[currentInfiniteDiff()]+'难度）</div>' + rows +
    '<div class="storyHint">▸ 稍等片刻后点击返回主界面</div></div>';
  // 死亡瞬间可能还在连点：先停留2.5秒吸收点击，防止把结算页瞬间点掉
  const readyAt = Date.now() + 2500;
  ov.addEventListener('click', ()=>{ if(Date.now() < readyAt) return; ov.remove(); if(typeof backToMenu==='function') backToMenu(); });
  document.body.appendChild(ov);
}
window.showInfiniteResult = showInfiniteResult;

function checkLevelClear(){
  if(levelCleared || gameEnded) return;
  if(enemies.length>0 && enemies.every(e=>e.dead)){
    if(window.infiniteMode){ if(typeof infiniteWaveCleared==='function') infiniteWaveCleared(); return; }
    levelCleared = true;
    gameEnded = true;
    const isBossLv = (currentLevel+1)===16;
    // Boss关胜利音乐延后到小剧情出现前播放；其他关立即播放
    const vs = document.getElementById('victorySound');
    if(vs){ vs.volume = window.sfxVol||1; vs.loop = false; vs.currentTime = 0; vs.play().catch(()=>{}); }
    const firstClear15 = (currentLevel+1)===16 && !(window.accountCleared && window.accountCleared[currentLevel]);
    const rewardDesc = grantLevelRewards();
    if(typeof startBGM==='function') startBGM(); // 通关后恢复原背景音乐
    commitPending();
    window.accountMaxUnlocked = Math.max(window.accountMaxUnlocked||1, (currentLevel+1)+1);
    // Boss关胜利：先停5秒让玩家确认Boss已击败（防止狂点鼠标把剧情瞬间点过去），再播胜利音乐+小剧情
    if(isBossLv){
      window.l15StoryRun = false; // 已通关，本次剧情流程结束
      if(typeof showStoryHint==='function') showStoryHint('🎉 暗影蛙将·怒岚 被击败了！');
      // R大招解锁提示：首次通关第16关后再弹出（不在进关/剧情中途弹）
      if(firstClear15 && typeof showSkillUnlockPopup==='function'){
        setTimeout(()=>{ showSkillUnlockPopup('R 大招 · 终极技能（宗主传授）'); }, 500);
      }
      setTimeout(()=>{
        if(typeof showStoryPanels==='function'){
          showStoryPanels([
            { t:"暗影蛙将·怒岚倒下了，黑气缓缓散尽……" },
            { t:"（风语草原的尽头，一座小镇的轮廓若隐若现。）" },
            { t:"神秘人：\"干得不错。我在前面的镇子等你——那里，有你需要的东西。\"" },
            { t:"（依门魔法石的气息，仍在远方跳动……）" }
          ], ()=>{ if(typeof backToMenu==='function') backToMenu(); showL15ClearHint(firstClear15 && window.l15EarlyDeath); });
        }
      }, 5000);
      return;
    }
    // 20关通关：提示怪物增强
    if((currentLevel+1) === 20 && typeof showMonsterBoostNotice==='function'){
      setTimeout(()=>{ showMonsterBoostNotice(); }, 600);
    }
    // 通关第3关：解锁新手指南
    if((currentLevel+1) === 3){
      inventory.guideReady = true;
      if(typeof renderGuideIcon==='function') renderGuideIcon();
    }
    // 剧情解锁：通关第5关获得E技能，通关第10关获得Q技能（R大招在第16关由宗主救场时传授）
    if((currentLevel+1) === 5 && !window.accountEUnlocked){
      window.accountEUnlocked = true;
      if(typeof showSkillUnlockPopup==='function') showSkillUnlockPopup('E 技能 · '+(activeCharacter==='daodungou'?'举盾护盾':'妙脆角回血'));
    }
    if((currentLevel+1) === 10 && !window.accountQUnlocked){
      window.accountQUnlocked = true;
      window.accountTrainingUnlocked = true; // 获得Q技能的同时解锁训练营
      showSkillUnlockPopup("Q 技能 · 爆炸火箭（训练营已解锁！）");
    }
    // 通关成就
    if((currentLevel+1) === 1 && typeof unlockAchievement==='function') unlockAchievement('first_blood');
    if((currentLevel+1) === 5 && typeof unlockAchievement==='function') unlockAchievement('lv5');
    if((currentLevel+1) === 10 && typeof unlockAchievement==='function') unlockAchievement('lv10');
    if((currentLevel+1) === 16 && typeof unlockAchievement==='function') unlockAchievement('lv15');
    saveGame();
    const box = document.createElement("div");
    box.id = "victoryBox";
    const hasNext = currentLevel+1 < LEVELS.length;
    const btns = hasNext
      ? "<button onclick='nextLevel()'>下一关 ▶</button><button onclick='toggleBackpack()'>🎒 查看背包</button><button onclick='backToMenu()'>🏠 返回主菜单</button>"
      : "<button onclick='backToMenu()'>🏠 返回主菜单</button>";
    box.innerHTML = "<div>第"+(currentLevel+1)+"关 通关！</div>" +
      "<div style='margin-top:12px;font-size:20px;color:#ffd86b'>🎁 获得：" + rewardDesc + "</div>" +
      (hasNext ? "" : "<div style='margin-top:14px;font-size:26px'>🎉 全部关卡通关！</div>") +
      btns;
    document.getElementById("game").appendChild(box);
  }
}

function stopVictorySound(){
  const vs = document.getElementById('victorySound');
  if(vs){ vs.pause(); vs.currentTime = 0; }
}
window.stopVictorySound = stopVictorySound;

function nextLevel(){
  stopVictorySound();
  const vb = document.getElementById('victoryBox'); if(vb) vb.remove();
  enterLevel(currentLevel + 1); // 不再询问切换角色，玩家想换角色自己回主界面选
}
window.nextLevel = nextLevel;

// 奶蛙受击（多敌人版）
function damageEnemy(e, dmg){
  if(!e || e.dead) return;
  // 训练营稻草人：无限血量木桩，只显示红色伤害数字，并累计总伤害（不击退/不死亡）
  if(e.type === 'dummy'){
    if(typeof showDamageText==='function' && e.img) showDamageText(Math.round(dmg), e.img);
    window.scarecrowTotalDmg = (window.scarecrowTotalDmg||0) + Math.round(dmg);
    if(e.dmgEl) e.dmgEl.textContent = '总伤害 ' + window.scarecrowTotalDmg;
    e.img.style.filter = "brightness(2.2)";
    setTimeout(()=>{ if(e.img) e.img.style.filter=""; }, 110);
    return;
  }
  allAlert = true;
  // 第15关完全体：打不死（保底1血），但血量数字会随伤害下降
  if(e.type==='boss' && e.phase===1){
    e.hp = Math.max(1, e.hp - dmg);
    updateEnemyHp(e);
    if(attackSound){ attackSound.pause(); attackSound.currentTime=0; }
    showDamageText(Math.round(dmg), e.img);
    e.img.style.filter = "brightness(2.2)";
    setTimeout(()=>{ if(e.img) e.img.style.filter=""; }, 110);
    return;
  }
  // 奶鼠站立状态：50% 减伤
  if(e.type === 'mouse' && e.mouseState === 'stand'){ dmg = Math.max(1, Math.round(dmg*0.5)); }
  if(e.attackTimer){ clearTimeout(e.attackTimer); e.attackTimer=null; }
  if(e.attackEndTimer){ clearTimeout(e.attackEndTimer); e.attackEndTimer=null; }
  e.attacking=false; e.cooldown=false;
  if(attackSound){ attackSound.pause(); attackSound.currentTime=0; }
  e.hp -= dmg;
  if(e.hp < 0) e.hp = 0;
  updateEnemyHp(e);
  showDamageText(dmg, e.img);
  // Boss被动：2%概率反弹伤害
  if(e.type==='boss' && !playerDead && !gameEnded && Math.random() < 0.02){
    playerTakeDamage(Math.max(1, Math.round(dmg)));
    if(typeof showDamageText==='function' && enemyObj) showDamageText('反弹!', enemyObj);
  }
  e.img.style.filter = "brightness(2.6)";
  setTimeout(()=>{ if(e.img) e.img.style.filter=""; },120);
  if(e.hp === 0){ enemyDeath(e); return; }
  e.state="HURT"; e.stunned=true;
  e.img.src = enemyImgSrc(e,'hurt');
  // 奶蛙受击叫声同样受「奶蛙笑声」开关控制：关闭后奶蛙不再发出任何叫声（攻击/受击都不叫）
  const laughOn = !window.gameSettings || window.gameSettings.frogLaugh !== false;
  if(hurtSound && !hurtSoundCooldown && laughOn){
    hurtSoundCooldown=true;
    hurtSound.currentTime=0;
    hurtSound.play().catch(()=>{});
    setTimeout(()=>{ hurtSoundCooldown=false; },900);
  }
  setTimeout(()=>{
    if(!e.dead){
      e.stunned=false;
      e.state="RECOVER";
      if(e.img) e.img.src = enemyImgSrc(e,'walk');
    }
  }, CONFIG.HURT_TIME);
}
// 兼容旧代码：对最近目标造成伤害
function frogTakeDamage(dmg){ if(frog) damageEnemy(frog, dmg); }
// 通用伤害入口（大招等走这里，血条会同步更新）
window.applyDamage = function(enemy, dmg, player, type){ if(typeof damageEnemy==='function') damageEnemy(enemy, dmg); };

function enemyDeath(e){
  if(!e || e.dead) return;
  e.dead=true; e.state="DEAD";
  e.img.src = enemyImgSrc(e,'dead');
  e.stunned=true;
  if(e.attackTimer) clearTimeout(e.attackTimer);
  if(e.attackEndTimer) clearTimeout(e.attackEndTimer);
  if(attackFireTimer) clearTimeout(attackFireTimer);
  if(e.dashTimer) clearTimeout(e.dashTimer);
  checkLevelClear();
  // Boss 死亡：清掉召唤的小蛙，恢复大招冷却
  if(e.type==='boss'){
    for(const oe of enemies){ if(oe !== e && oe.isSummoned && !oe.dead){ damageEnemy(oe, 999999); } }
    window.l15UltimateBoost = false;
    window.l15CdBoost = false;
    window.l15Phase = 0;
  }
  // 爆裂奶蛙：站在原地闪白2秒后爆炸（只炸玩家，不做倒地/下沉）
  if(e.type === 'boom'){
    e.deathTimer = setTimeout(()=>{
      if(!e.img) return;
      e.img.style.filter = "brightness(4)";
      setTimeout(()=>{ if(e.img) e.img.style.filter = "brightness(2)"; }, 150);
      setTimeout(()=>{ if(e.img) e.img.style.filter = "brightness(4)"; }, 300);
      setTimeout(()=>{ if(e.img && e.img.parentNode) e.img.parentNode.removeChild(e.img); if(e.hpBox && e.hpBox.parentNode) e.hpBox.parentNode.removeChild(e.hpBox); e.img = null; e.hpBox = null; }, 500);
    }, 2000);
    e.boomTimer = setTimeout(()=>{ boomExplode(e); }, 2000);
    return;
  }
  // 通用死亡演出：倒地姿势，1.5秒后闪白，然后消失
  const deathDy = e.type === 'mouse' ? 8 : 35;
  const deathFlip = (e.type === 'mouse') ? (e.face===1 ? "1" : "-1") : (e.face===1 ? "-1" : "1");
  e.img.style.transform = "scaleX(" + deathFlip + ") rotate(0deg) translateY(" + deathDy + "px)";
  e.img.style.transformOrigin = "bottom center";
  e.img.style.bottom = "80px";
  // 通用死亡演出：1.5秒后闪白，然后消失
  if(e.deathTimer) clearTimeout(e.deathTimer);
  e.deathTimer = setTimeout(()=>{
    if(!e.img) return;
    e.img.style.filter = "brightness(4)";
    setTimeout(()=>{ if(e.img) e.img.style.filter = "brightness(2)"; }, 150);
    setTimeout(()=>{ if(e.img) e.img.style.filter = "brightness(4)"; }, 300);
    setTimeout(()=>{
      if(e.img && e.img.parentNode) e.img.parentNode.removeChild(e.img);
      if(e.hpBox && e.hpBox.parentNode) e.hpBox.parentNode.removeChild(e.hpBox);
      e.img = null; e.hpBox = null;
    }, 500);
  }, 1500);
}
function frogDeath(){ if(frog) enemyDeath(frog); }

// 敌人血条
function updateEnemyHp(e){
  if(!e || !e.hpBox) return;
  const p = Math.max(0, e.hp/e.maxHp*100);
  const fill = e.hpBox.querySelector('.enemyHpFill');
  const txt = e.hpBox.querySelector('.enemyHpText');
  if(fill){ fill.style.width = p+"%"; fill.style.background = p>50?"#00ff00":p>20?"#ffff00":"#ff0000"; }
  if(txt) txt.textContent = "HP:"+e.hp;
}
function followEnemyHp(e){
  if(!e || !e.hpBox) return;
  const rect = e.img.getBoundingClientRect();
  e.hpBox.style.left = (rect.left + rect.width/2 - 35) + "px";
  e.hpBox.style.top = (rect.top - 25) + "px";
}
// 兼容旧调用
function createFrogHP(){}
function updateFrogHP(){ if(frog) updateEnemyHp(frog);
  const hud = document.getElementById('frogHUD');
  if(hud){
    if(frog && frog.type==='boss'){ hud.classList.add('boss'); const t=hud.querySelector('.title'); if(t) t.textContent='👹 怒岚'; }
    else { hud.classList.remove('boss'); const t=hud.querySelector('.title'); if(t) t.textContent='🐸 奶蛙'; }
  }
}
function followFrogHP(){ if(frog) followEnemyHp(frog); }

// =====================
// 奶蛙攻击系统（多敌人版）
// =====================
function startAttack(e){
  if(!e || e.attacking || e.cooldown) return;
  e.attacking = true;
  e.state = "ATTACK_CHARGE";
  e.img.src = enemyImgSrc(e,'attack');
  // 笑声音效冷却：2秒内不重复，避免嘈杂
  if(!window.laughCd && Math.random() < 0.15 && (!window.gameSettings || window.gameSettings.frogLaugh !== false)){ window.laughCd=true; attackSound.currentTime = 0; attackSound.play().catch(()=>{}); setTimeout(()=>{ window.laughCd=false; }, 3000); }
  // 玩家贴脸/近身时奶蛙快速反击（蓄力变短），避免被无限白打
  const close = (typeof enemy!=='undefined') && (Math.abs(enemy.x - e.x) < 280);
  const fireTime = close ? 350 : 900;
  const attackTime = close ? 700 : 900;
  e.attackTimer = setTimeout(()=>{
    if(!e.dead && !e.stunned && e.state==="ATTACK_CHARGE"){
      e.state = "ATTACK_FIRE";
      createWave(e);
      // 狂暴连发
      if(e.hp <= e.maxHp*0.3){
        setTimeout(()=>{ if(!e.dead && !e.stunned){ createWave(e); } },260);
      }
    }
  }, fireTime);
  e.attackEndTimer = setTimeout(()=>{
    if(e.dead) return;
    if(e.attackTimer) clearTimeout(e.attackTimer);
    e.attacking = false;
    e.cooldown = true;
    e.state = "RECOVER";
    e.img.src = enemyImgSrc(e,'walk');
    setTimeout(()=>{ e.cooldown = false; }, e.hp <= e.maxHp*0.3 ? 1300 : COOLDOWN_TIME);
  }, attackTime);
}

// 冲击波（动态元素，多敌人各自独立）
function createWave(e){
  if(!e || e.dead) return;
  const isElite = (e.type === 'elite');
  const wave = document.createElement("div");
  wave.className = isElite ? "frogWave elite" : "frogWave";
  const waveDirection = e.face;
  let waveX = e.x + (10*e.face);
  // 蛙的高度（跳跃/站平台时从空中斜着打下来）
  const eH = (e.groundY || 0) + ((e.jumpY||0) < 0 ? -(e.jumpY) : 0);
  const pG = (typeof groundYAt==='function') ? groundYAt(enemy.x + 50) : 0;
  let waveY = 190 + eH;
  const waveTargetY = 190 + pG;
  const speed = isElite ? WAVE_SPEED*0.75 : WAVE_SPEED;
  const distToPlayer = Math.abs(enemy.x - e.x);
  const frames = Math.max(12, distToPlayer / speed);
  const waveVy = (waveTargetY - waveY) / frames;   // 斜线轨迹，落到地面水平
  wave.style.left = waveX + "px";
  wave.style.top = "calc(100% - " + waveY + "px)";
  document.getElementById("game").appendChild(wave);
  let lastDmg = 0;
  function moveWave(){
    if(!wave.parentNode) return;
    if(window.gamePaused){ requestAnimationFrame(moveWave); return; }
    waveX += speed*waveDirection;
    waveY += waveVy;
    wave.style.left = waveX + "px";
    wave.style.top = "calc(100% - " + waveY + "px)";
    const playerRect = enemyObj.getBoundingClientRect();
    const waveRect = wave.getBoundingClientRect();
    const hit = {
      left: waveRect.left+6, right: waveRect.right-6,
      top: waveRect.top+6, bottom: waveRect.bottom-6
    };
    const overlapping = hit.left < playerRect.right && hit.right > playerRect.left &&
       hit.top < playerRect.bottom && hit.bottom > playerRect.top;
    if(overlapping){
      if(window.dashing){
        wave.remove();
        if(typeof showDamageText==='function') showDamageText("闪避!", enemyObj);
        return;
      }
      if(isElite){
        // 黄色精英冲击波：持续伤害（每0.5秒8点，穿透不消失）
        const now = Date.now();
        if(now - lastDmg >= 500){
          lastDmg = now;
          playerTakeDamage(Math.round(13 * (window.hardMult||1) * (window.diffDmgMult||1))); // 精英奶蛙攻击13
        }
      } else {
        playerTakeDamage(Math.round(WAVE_DAMAGE * (window.hardMult||1) * (window.diffDmgMult||1)));
        wave.remove();
        return;
      }
    }
    // 冲击波可打实体（哨塔/箱子/建筑，中立）—— 塔上守卫的波会越过自己脚下的塔
    if(typeof solidObjects!=='undefined'){
      const waveGy = e.groundY || 0;
      for(const s of solidObjects){
        if(s.broken || !s.breakable) continue;
        if(waveGy >= s.topY) continue; // 站在塔顶/更高处发出的波不撞这座塔，直接打到玩家
        const sr = s.el ? s.el.getBoundingClientRect() : null;
        if(!sr) continue;
        const wr = wave.getBoundingClientRect();
        if(wr.left < sr.right && wr.right > sr.left && wr.top < sr.bottom && wr.bottom > sr.top){
          s.hp -= 6;
          if(s.el){ s.el.style.filter='brightness(1.6)'; setTimeout(()=>{ if(s.el) s.el.style.filter=''; },100); }
          if(s.hp <= 0){ const idx=solidObjects.indexOf(s); if(idx>=0) breakSolid(idx); }
          wave.remove(); return;
        }
      }
    }
    if(waveX < -120 || waveX > window.innerWidth+120){ wave.remove(); return; }
    requestAnimationFrame(moveWave);
  }
  moveWave();
}

// 把卡进建筑/哨塔里的敌人推到最近的边缘（实体只挡路，进不去）
function clampOutOfSolids(e){
  if(typeof solidObjects==='undefined' || !e) return;
  if(e.jumping) return; // 跳跃中从障碍上方越过，不做实体推出（落地时groundY自动落到箱顶）
  const ew = e.img ? e.img.clientWidth : 130;
  for(const s of solidObjects){
    if(s.broken) continue;
    const sL = s.x - s.w/2, sR = s.x + s.w/2;
    if(e.x > sL && e.x < sR && (e.groundY||0) < s.topY - 4){
      // 只有真正卡在建筑内部才推出去（贴边不算），避免原地踏步
      e.x = (e.x < s.x) ? (sL - ew*0.35) : (sR + ew*0.35);
    }
  }
}

// 敌人 AI（多敌人版，每帧对每个敌人执行）
function updateEnemyAI(e){
  if(!e || e.dead) return;
  if(e.type === 'dummy'){ e.img.style.left = e.x + "px"; followEnemyHp(e); return; } // 稻草人：原地不动
  if(e.tornadoStun) e.stunned = true;
  if(e.stunned){
    e.img.style.left = e.x + "px";
    followEnemyHp(e);
    return;
  }
  if(e.type === 'mouse'){ updateMouseAI(e); return; }
  if(e.type === 'boom'){ updateBoomAI(e); return; }
  if(e.type === 'boss'){ updateBossAI(e); return; }
  const dx = enemy.x - e.x;
  const distance = Math.abs(dx);

  // 塔上守卫：不离开塔顶，只会站在塔上攻击
  if(e.towerGuard && e.tower && !e.tower.broken){
    const t = e.tower;
    e.x = t.x; // 站在塔顶正中间
    e.groundY = t.topY;
    if(dx > 0){ e.face = 1; e.img.style.transform = "scaleX(-1)"; }
    else { e.face = -1; e.img.style.transform = "scaleX(1)"; }
    if(distance <= ATTACK_RANGE && !e.attacking && !e.cooldown && e.state!=="HURT" && e.state!=="RETREAT"){ startAttack(e); }
    e.img.style.left = e.x + "px";
    updateEnemyJump(e);
    followEnemyHp(e);
    return;
  }

  // 方向
  if(dx > 0){ e.face = 1; e.img.style.transform = "scaleX(-1)"; }
  else { e.face = -1; e.img.style.transform = "scaleX(1)"; }

  // 状态判断（全屏警觉：打到任意敌人，全体警觉）
  const detected = allAlert || distance <= DETECT_RANGE;
  if(!detected){ e.state = "IDLE"; }
  else if(distance > KEEP_DISTANCE){
    if(e.state === "IDLE" || e.state === "NOTICE"){
      e.state = "ALERT";
      e.img.src = enemyImgSrc(e,'alert');
      const ee = e;
      setTimeout(()=>{ if(!ee.dead && ee.state==="ALERT"){ ee.state="CHASE"; } }, allAlert ? 300 : 800);
    } else if(e.state !== "ALERT" && e.state !== "ATTACK" && e.state !== "ATTACK_CHARGE" && e.state !== "ATTACK_FIRE"){
      e.state = "CHASE";
    }
  } else {
    if(distance < DANGER_DISTANCE && e.state!=="RETREAT"){ e.state="RETREAT"; }
    if(distance <= ATTACK_RANGE && !e.attacking && !e.cooldown && e.state!=="HURT" && e.state!=="RETREAT"){
      startAttack(e);
    }
  }

  // 追击/保持距离（实体阻挡：含跳跃高度——跳起来能越过矮障碍，但过不去高塔）
  const blocked = (targetX)=>{
    if(typeof solidObjects==='undefined') return false;
    const ey = (e.groundY||0) - (e.jumpY||0); // jumpY为负=跳起，减去它才是真实高度
    for(const s of solidObjects){
      if(s.broken) continue;
      if(targetX >= s.x - s.w/2 - 6 && targetX <= s.x + s.w/2 + 6 && ey < s.topY) return true;
    }
    return false;
  };
  // 前方阻挡物的顶高（-1=没挡）
  const blockedTop = (targetX)=>{
    if(typeof solidObjects==='undefined') return -1;
    const ey = (e.groundY||0) - (e.jumpY||0);
    let top = -1;
    for(const s of solidObjects){
      if(s.broken) continue;
      if(targetX >= s.x - s.w/2 - 6 && targetX <= s.x + s.w/2 + 6 && ey < s.topY){
        if(s.topY > top) top = s.topY;
      }
    }
    return top;
  };
  if(e.state === "RETREAT" && !e.stunned){ e.state = "RECOVER"; }
  if(e.state === "CHASE" && !e.stunned){
    const enraged = e.hp <= e.maxHp*0.3;
    const effSpeed = (enraged ? SPEED*1.6 : SPEED) * slowmoFactor(); // 时缓时怪也几乎静止
    const dirStep = dx>0 ? 1 : -1;
    if(e.jumping){
      // 跳跃中：继续向前越过障碍（太高过不去的会被挡下）
      const tx2 = e.x + dirStep*effSpeed*0.9;
      if(!blocked(tx2)) e.x = tx2;
    } else {
      const tx = e.x + dirStep*effSpeed;
      const bt = blockedTop(tx);
      // 障碍不高（≤140，箱/小建筑）就跳上去再走下来；哨塔太高跳不上去就不反复抽搐
      if(bt >= 0 && e.canJump && (bt - (e.groundY||0)) <= 140 && Date.now() - (e.lastJump||0) > 2500){
        e.jumping = true; e.jumpV = -13; e.lastJump = Date.now();
        const txj = e.x + dirStep*effSpeed*0.5;
        if(!blocked(txj)) e.x = txj;
      } else if(distance > 520){ if(!blocked(tx)) e.x = tx; }
      else if(distance < 360 && !e.attacking && !e.cooldown){ const tr=e.x - dirStep*effSpeed*0.9; if(!blocked(tr)) e.x = tr; }
    }
  }
  clampWorld(e);
  const ew = e.img ? e.img.clientWidth : 160;
  if(e.x > window.innerWidth - ew) e.x = window.innerWidth - ew;
  clampOutOfSolids(e);
  e.img.style.left = e.x + "px";
  updateEnemyJump(e);
  followEnemyHp(e);
}

// 爆裂奶蛙专属 AI：慢速靠近 -> 近身攻击（伤害不高）-> 死亡闪白2秒后爆炸（只炸玩家）
function updateBoomAI(e){
  if(e.mouseState === undefined){ e.mouseState='stand'; e.mouseStateTime=Date.now(); }
  const dx = enemy.x - e.x;
  const distance = Math.abs(dx);
  if(dx > 0){ e.face = 1; e.img.style.transform = "scaleX(-1)"; }
  else { e.face = -1; e.img.style.transform = "scaleX(1)"; }
  const detected = allAlert || distance <= DETECT_RANGE;
  if(detected && distance > 130 && !e.attacking && !e.stunned){
    // 遇到低障碍（箱/小建筑）跳上去再走下来；哨塔太高不跳
    const txB = e.x + (dx>0 ? 0.35 : -0.35);
    let blockedB = false, topB = -1;
    if(typeof solidObjects!=='undefined'){
      const eyB = (e.groundY||0) - (e.jumpY||0);
      for(const s of solidObjects){
        if(s.broken) continue;
        if(txB >= s.x - s.w/2 - 6 && txB <= s.x + s.w/2 + 6 && eyB < s.topY){ blockedB = true; topB = Math.max(topB, s.topY); }
      }
    }
    if(blockedB && !e.jumping && (topB - (e.groundY||0)) <= 140 && Date.now() - (e.lastJump||0) > 2500){
      e.jumping = true; e.jumpV = -13; e.lastJump = Date.now();
    } else if(!blockedB){
      e.x += (dx>0 ? 0.35 : -0.35); // 移动很慢
    }
  }
  updateEnemyJump(e);
  if(e.img) e.img.style.left = e.x + "px";
  followEnemyHp(e);
  if(distance <= 150 && !e.attacking && !e.cooldown && !e.stunned && Date.now() - (e.lastBoomAtk||0) > 1500){
    e.attacking = true; e.cooldown = true;
    e.lastBoomAtk = Date.now();
    if(distance < 130){
      const dmg = Math.round(10 * (window.hardMult||1) * (window.diffDmgMult||1));
      playerTakeDamage(dmg);
      if(typeof showDamageText==='function') showDamageText("爆裂奶蛙撞击! -"+dmg, enemyObj);
    }
    setTimeout(()=>{ e.attacking=false; }, 300);
    setTimeout(()=>{ e.cooldown=false; }, 1800);
  }
  clampWorld(e);
  const ew = e.img ? e.img.clientWidth : 130;
  if(e.x > window.innerWidth - ew) e.x = window.innerWidth - ew;
  clampOutOfSolids(e);
  e.img.style.left = e.x + "px";
  updateEnemyJump(e);
  followEnemyHp(e);
}

// 爆裂奶蛙死亡爆炸：只炸玩家，不伤奶家人
function boomExplode(e){
  if(gameEnded || playerDead) return; // 已通关/已死亡则不炸
  const game = document.getElementById('game');
  const fx = document.createElement('div');
  fx.className = 'explosionFx';
  fx.style.left = (e.x - 60) + "px";
  fx.style.top = "calc(100% - 220px)";
  if(game) game.appendChild(fx);
  setTimeout(()=>{ if(fx.parentNode) fx.parentNode.removeChild(fx); }, 500);
  // 原地爆炸：跑开范围就炸不到；跳得够高（比如猫二段跳）也炸不到；只有真炸到玩家才显示提示
  const pHeight = -((typeof playerY!=='undefined') ? playerY : 0);
  if(Math.abs(enemy.x - e.x) < 200 && pHeight < 130){
    const dmg = Math.round(60 * (window.hardMult||1) * (window.diffDmgMult||1));
    playerTakeDamage(dmg);
    if(typeof showDamageText==='function' && enemyObj) showDamageText("爆裂伤害! -"+dmg, enemyObj);
  }
}

// 奶鼠专属 AI：站立 -> 匍匐(0.8s) -> 冲刺 -> 停止(1s) -> 站立
function initMouseAI(e){
  e.mouseState = 'stand';
  e.mouseStateTime = Date.now();
  e.stompTime = 0;
}
function updateMouseAI(e){
  if(e.mouseState === undefined) initMouseAI(e);
  const dx = enemy.x - e.x;
  // 奶鼠图方向：站立图头在右，匍匐/冲刺图头在左 → 翻转方向相反
  const crouchMode = (e.mouseState==='crouch' || e.mouseState==='dash');
  const ms = crouchMode ? -1 : 1;
  if(dx > 0){ e.face = 1; e.img.style.transform = "scaleX(" + (1*ms) + ")"; }
  else { e.face = -1; e.img.style.transform = "scaleX(" + (-1*ms) + ")"; }
  // 踩踏：玩家空中下落时踩到奶鼠
  if(!onGround && playerVelocityY > 0 && !playerDead && !gameEnded && (e.stompCount||0) < 3){
    if(playerY < -12 && Math.abs(enemy.x - e.x) < 70 && Date.now() - (e.stompTime||0) > 800){
      e.stompTime = Date.now();
      e.stompCount = (e.stompCount||0) + 1;
      damageEnemy(e, Math.round(e.maxHp*0.3));
      playerVelocityY = -5;
      if(typeof showDamageText==='function' && e.img) showDamageText("踩踏!", e.img);
    }
  }
  const now = Date.now();
  switch(e.mouseState){
    case 'stand':
      e.img.src = enemyImgSrc(e,'walk');
      if(now - e.mouseStateTime >= 2000){ e.mouseState='crouch'; e.mouseStateTime=now; }
      break;
    case 'crouch':
      e.img.src = enemyImgSrc(e,'attack');
      if(now - e.mouseStateTime >= 800){ e.mouseState='dash'; e.mouseStateTime=now; e.dashStartX=e.x; e.dashDir=e.face; }
      break;
    case 'dash': {
      e.img.src = enemyImgSrc(e,'attack');
      const dashOldX = e.x;
      e.x += e.dashDir * 6;
      if(e.x === dashOldX){ e.mouseState='stop'; e.mouseStateTime=now; break; } // 顶到屏幕边缘就停，避免左右横跳
      if(onGround && Math.abs(enemy.x - e.x) < 70){
        playerTakeDamage(Math.round((e.elite ? 30 : 20) * (window.hardMult||1) * (window.diffDmgMult||1)));
        e.mouseState='stop'; e.mouseStateTime=now;
      }
      if(Math.abs(e.x - (e.dashStartX||e.x)) > 150){ e.mouseState='stop'; e.mouseStateTime=now; }
      break;
    }
    case 'stop':
      e.img.src = enemyImgSrc(e,'walk');
      if(now - e.mouseStateTime >= 1000){ e.mouseState='stand'; e.mouseStateTime=now; }
      break;
  }
  clampWorld(e);
  const ew = e.img ? e.img.clientWidth : 110;
  if(e.x > window.innerWidth - ew) e.x = window.innerWidth - ew;
  // 奶鼠冲刺（扑进）：直接穿过障碍物，不再被弹回/原地抽搐
  const mouseDashing = (e.mouseState === 'dash');
  if(!mouseDashing){ clampOutOfSolids(e); }
  e.img.style.left = e.x + "px";
  if(mouseDashing){
    if(e.img) e.img.style.bottom = (80 + (e.groundY||0) - (e.jumpY||0)) + "px"; // 冲刺穿墙：保持地面高度
  } else {
    updateEnemyJump(e);
  }
  followEnemyHp(e);
}

let frame=0;






function startGame(){
  // 选角完成 -> 若已选定关卡则直接进关；若为无限模式则进入无限模式；否则回到选关
  const s = document.getElementById("select"); if(s) s.style.display="none";
  if(window.pendingInfinite){ window.pendingInfinite = false; enterInfiniteMode(); return; }
  if(window.pendingLevel >= 0){
    const idx = window.pendingLevel;
    window.pendingLevel = -1;
    enterLevel(idx);
    return;
  }
  const ls = document.getElementById("levelSelect"); if(ls) ls.style.display="flex";
  renderLevelSelect();
  saveGame();
}

window.selectMode = 'normal'; // 选关界面的 普通/困难 切换（默认普通）
window.pendingLevel = -1;      // 待进入的关卡（点了关卡后先选角色）
window.pendingInfinite = false; // 是否从无限模式子菜单进入选角
let updateLoopStarted = false;
let __uiFrame=0;
function uiTick(){
  // HUD刷新节流：每3帧更新一次（约20fps），减少每帧DOM开销/卡顿
  __uiFrame++;
  if(__uiFrame%3===0 && window.updateV13UI) window.updateV13UI();
}
function startUpdateLoop(){
  if(updateLoopStarted) return; // 防止每进一关就多开一个主循环（速度越玩越快）
  updateLoopStarted = true;
  requestAnimationFrame(update);
}
window.startUpdateLoop = startUpdateLoop;
function enterLevel(idx, mode){
  window.levelMode = (((mode || window.selectMode || 'normal'))==='hard') ? 'hard' : 'normal';
  window.hardMult = (window.levelMode==='hard') ? 1.5 : 1;
  window.enemyHpMult = (window.levelMode==='hard') ? 1.5 : 0.75;
  ["skillUpgradePanel","codexPanel","talentPanel","backpackPanel","shopPanel","confirmPanel"].forEach(id=>{ const el=document.getElementById(id); if(el) el.remove(); });
  document.getElementById("levelSelect").style.display="none";
  document.getElementById("game").style.display="block";
  window.gameStarted = true;
  window.gamePaused = false;
  if(playerImg){
    if(activeCharacter==='daodungou'){ if(window.DOG){ window.DOG.reset(); window.DOG.updateSprite(); } }
    else { updateCornSprite(); }
  }
  hpBox.style.display="none";
  startLevel(idx);
  syncPlayerHpBox();
  if(window.updateV13UI) window.updateV13UI();
  // 战斗状态背景音乐开关 + 第15关Boss战BGM（startLevel 后 currentLevel 已更新）
  if(typeof applyLevelBGM==='function'){ applyLevelBGM(); }
  else if(typeof startBGM==='function'){ startBGM(); }
  startUpdateLoop();
}
window.enterLevel = enterLevel;

function updateLevelModeBtn(){
  const btn = document.getElementById('lvModeToggle');
  if(!btn) return;
  btn.textContent = (window.selectMode==='hard') ? '🎯 困难模式' : '🎯 普通模式';
  btn.classList.toggle('hard', window.selectMode==='hard');
}
window.updateLevelModeBtn = updateLevelModeBtn;
function playLevel(idx){
  // 困难模式必须先通关该关卡的普通模式
  if(window.selectMode==='hard' && !(window.accountCleared && window.accountCleared[idx])){
    alert('请先通关该关卡的普通模式，再挑战困难！'); return;
  }
  // 新流程：点击关卡后进入选角色界面，选好后开始本关
  window.pendingLevel = idx;
  showCharacterSelect('第' + (idx+1) + '关');
}
window.playLevel = playLevel;
function toggleLevelMode(){
  if((window.accountMaxUnlocked||1) <= 1){ alert('先通关第1关，再挑战困难模式吧！'); return; }
  window.selectMode = (window.selectMode==='hard') ? 'normal' : 'hard';
  updateLevelModeBtn();
  if(typeof renderLevelSelect==='function') renderLevelSelect(); // 刷新打勾
}
window.toggleLevelMode = toggleLevelMode;

function renderLevelSelect(){
  const list = document.getElementById('levelList');
  if(!list) return;
  const maxUnlocked = window.accountMaxUnlocked || 1;
  let html = '';
  for(let i=1;i<=LEVELS.length;i++){
    const unlocked = i <= maxUnlocked;
    // 打勾跟随当前模式：普通看普通通关，困难看困难通关；15关普通看剧情是否已看（重置剧情后勾消失），困难不显示勾
    const isBossLv = LEVELS[i-1] && LEVELS[i-1].flag==='boss';
    const cleared = isBossLv
      ? (window.selectMode==='hard' ? false : !!window.accountL15Seen)
      : (window.selectMode==='hard')
        ? !!(window.accountHardCleared && window.accountHardCleared[i-1])
        : !!(window.accountCleared && window.accountCleared[i-1]);
    const flag = (LEVELS[i-1] && LEVELS[i-1].flag) ? LEVELS[i-1].flag : 'normal';
    html += '<div class="levelCard ' + (unlocked?'unlocked':'locked') + ' ' + flag + '" onclick="' + (unlocked?('playLevel('+(i-1)+')'):'') + '">' +
      (unlocked ? i : '🔒') +
      (cleared ? '<div class="lvDone">✓</div>' : '') +
      '</div>';
  }
  // 第15关：通关后可重新体验剧情
  const l15c = LEVELS.find(l=>l.flag==='boss');
  if(l15c && window.accountCleared && window.accountCleared[l15c.level-1]){
    html += '<div class="lvReplayBtnWrap"><button class="lvReplayBtn" onclick="resetL15Story()">🎬 重新体验第16关剧情</button></div>';
  }
  list.innerHTML = html;
  updateLevelModeBtn();
}
window.renderLevelSelect = renderLevelSelect;





// 玩家血条同步 V8.8.6
function syncPlayerHpBox(){
    if(hpBox && enemyObj){
        const r=enemyObj.getBoundingClientRect();
        hpBox.style.left=(r.left+r.width/2-50)+"px";
        hpBox.style.top=(r.top-45)+"px";
    }
}

function updatePlayerHP(){
    let percent=(playerHp/playerMaxHp)*100;
    if(percent<0) percent=0;
    if(typeof hpFill!=="undefined" && hpFill){
        hpFill.style.width=percent+"%";
        if(percent>50){
            hpFill.style.background="#00ff00";
        }else if(percent>20){
            hpFill.style.background="#ffff00";
        }else{
            hpFill.style.background="#ff0000";
        }
    }
    if(typeof hpText!=="undefined" && hpText){
        hpText.innerHTML="HP:"+playerHp;
    }
}

// 玩家受伤/失败系统 V8.8
function playerTakeDamage(dmg){
    if(window.gamePaused) return; // 暂停时不受任何伤害（Boss压顶/落弹/大招等全部冻结）
    if(playerDead || (frog && frog.dead) || gameEnded || playerHurtCooldown) return;
    // 时停2秒内主角无敌（Boss大招暗影湮灭）
    if(window.slowmo && Date.now() < window.slowmo.endAt) return;
    if(window.dashing){ if(typeof unlockAchievement==='function') unlockAchievement('dash_master'); return; } // V5.1 突进闪避期间免伤
    if(activeCharacter==='daodungou' && window.DOG && typeof window.DOG.isInvincible==='function' && window.DOG.isInvincible()) return; // V5.0 大招无敌
    // ===== 关卡进度强化（闯关/无限模式都生效）=====
    const progLevel = window.infiniteMode ? (window.infiniteWave||1) : ((currentLevel||0)+1);
    // 20关起：怪物整体伤害大幅提升（再乘难度倍率，噩梦更强）
    if(progLevel >= 20){ dmg = Math.round(dmg * (window.progDmgMult||1.6)); }
    // 15关起：攻击有几率穿透护盾直接伤本体（10%起步，每关+1%，上限30%）
    let pierce = false;
    if(progLevel >= 15 && window.playerShield > 0){
      const pierceChance = Math.min(30, 10 + 2*(progLevel - 15)); // 10%起步，每关+2%，上限30%
      pierce = (Math.random() * 100) < pierceChance;
    }
    // 护盾优先吸收伤害（20关起护盾承伤×2）
    // 影踪试炼：打到护盾也算一次（在护盾吸收前计数），并更新屏幕上方计数
    if(window.specialState && window.specialState.mode==='hitlimit'){
      window.specialState.hits++;
      const ctr2 = document.getElementById('hitlimitCounter');
      if(ctr2) ctr2.textContent = '🎯 ' + window.specialState.hits + ' / ' + window.specialState.limit;
      if(window.specialState.hits > window.specialState.limit){
        if(typeof specialFail==='function') specialFail('🎯 被击中超过 '+window.specialState.limit+' 次（含护盾），试炼失败！');
      }
    }
    if(window.playerShield > 0 && !pierce){
      const shieldMult = (progLevel >= 20) ? 2 : 1;
      const shieldMult2 = shieldMult * (window.bossShieldBonus ? 1.5 : 1); // Boss对护盾额外50%
      const absorbed = Math.min(window.playerShield, dmg * shieldMult2);
      window.playerShield -= absorbed;
      if(window.dogShieldAbsorbed !== undefined) window.dogShieldAbsorbed += absorbed;
      // 盾反新机制：护盾吸收的伤害按10秒窗口积攒（5秒缓冲期内第一次攻击反弹50%）
      if(activeCharacter==='daodungou' && window.dogShieldReflect && absorbed > 0){
        const rr = window.dogShieldReflect;
        if(rr.phase === 'ready'){
          rr.accum = absorbed;          // 缓冲期内又受击：并入新一轮重新计时
          rr.phase = 'accum';
          rr.phaseStart = Date.now();
          rr.readyDeadline = 0;
        } else {
          rr.accum += absorbed;
        }
      }
      dmg -= (shieldMult2 > 1) ? Math.round(absorbed / shieldMult2) : absorbed;
      if(window.updateV13UI) window.updateV13UI();
      if(dmg <= 0) return;
    } else if(pierce && window.playerShield > 0){
      // 穿透：护盾无效，直接打本体
      if(window.updateV13UI) window.updateV13UI();
      if(typeof showDamageText==='function' && enemyObj) showDamageText('穿透护盾!', enemyObj);
    }
    dmg = Math.max(1, dmg - (window.playerDefenseBuff||0));
    playerHp-=dmg;
    window.playerHp=playerHp;
    if(playerHp<0) playerHp=0;
    updatePlayerHP();
    playerHurtCooldown=true;
    setTimeout(()=>{ playerHurtCooldown=false; },700);

    // 玩家受伤反馈（测试角色）
    if(enemyObj){
        enemyObj.style.opacity="0.5";
        setTimeout(()=>{ if(enemyObj) enemyObj.style.opacity="1"; },120);
    }

    if(playerHp<=0){
        playerHp=0;
        playerDeath();
    }
}

function playerDeath(){
    // 无限模式：失败退出，金币和波次进度保留
    if(window.infiniteMode){
      playerDead=true; gameEnded=true;
      // 记录死亡时到达的最高波次（用于排行榜），再重置进度
      window.infiniteDeathWave = window.infiniteWave;
      // 死亡：进度从第1波重新开始（金币保留）
      window.inventory.infiniteWave = 1;
      window.infiniteWave = 1;
      window.inventory.infiniteHp = 0;
      window.inventory.infRun = { hpBonus:0, cdCut:0 }; // 新的一局，中转站增益清零
      saveGame();
      setTimeout(()=>{ if(typeof showInfiniteResult==='function') showInfiniteResult(); }, 600);
      return;
    }
    playerDead=true;
    gameEnded=true;
    // 第15关第一场：被打倒 → 直接进老师剧情（不显示失败）
    if(window.l15Phase === 1){
      if(typeof unlockAchievement==='function') unlockAchievement('powerless'); // 没撑过90秒被击败
      window.l15EarlyDeath = true; // 90秒内被击败（决定通关后是否提示）
      window.l15LockControls = true;
      if(typeof showStoryHint==='function') showStoryHint('你被击倒在地……');
      setTimeout(()=>{ if(typeof l15TeacherScene==='function') l15TeacherScene(); }, 1000);
      return;
    }
    if(frog){ frog.dead=false; frog.attacking=false; frog.stunned=true; }
    if(attackFireTimer) clearTimeout(attackFireTimer);
    if(attackSound){
        attackSound.pause();
        attackSound.currentTime=0;
    }
    const box=document.createElement("div");
    box.id="gameOverBox";
    box.innerHTML='你失败了<br><span>GAME OVER</span><br>' +
      '<div class="failAdvice">💡 建议：先回主界面升级角色/技能，或去商店购买物资；如果金币不够，可以去「无限模式」攒金币（失败/退出金币都保留）。觉得太难可以在设置里调成「躺平」模式。</div>' +
      '<button onclick="retryLevel()">重新挑战</button><button onclick="backToMenu()">返回主菜单</button>';
    document.getElementById("game").appendChild(box);
    gameOverBox=box;
}
function retryLevel(){
    const box=document.getElementById('gameOverBox'); if(box) box.remove();
    // 第15关：本次是剧情流程（首次/重置剧情）且被击败 → 重新挑战必须从剧情重头开始（完整Boss→90秒→宗主→削弱）
    if((currentLevel+1)===16 && window.l15StoryRun){
      window.accountL15Seen = false;
      if(typeof saveGame==='function') saveGame();
    }
    startLevel(currentLevel);
}
window.retryLevel=retryLevel;

// =====================
// 奶蛙受伤系统 V8.7
// =====================
// =====================
// V1.0.3 游戏胜利系统
// =====================
function playerVictory(){
    if(gameEnded) return;
    gameEnded=true;
    if(attackFireTimer) clearTimeout(attackFireTimer);
    if(attackSound){ attackSound.pause(); attackSound.currentTime=0; }
    const box=document.createElement("div");
    box.id="victoryBox";
    box.innerHTML="游戏胜利<br><span>VICTORY</span>";
    document.getElementById("game").appendChild(box);
}

// =====================
// 奶蛙血条 V8.7.1
// =====================

// V1.4 battle feedback (旧版已移除，统一使用 V1.4.3 版本)

function enemyAttack(){
    // V1.8 修复：
    // 奶蛙准备攻击、蓄力、笑声阶段不再直接造成伤害。
    // 伤害只由真正生成的蓝色冲击波碰撞触发。
    return;
}

// =====================
// 撤退系统 V8.7.3
// =====================
function tryRetreat(){
    let d=Math.abs(enemy.x-frog.x);

    // 前两次受伤优先进行战术后撤，不让奶蛙站桩挨打
    if(retreatCount >= MAX_RETREAT) return false;

    retreatCount++;
    frog.state="RETREAT";
    frog.stunned=true;

    let direction = enemy.x > frog.x ? -1 : 1;
    let target = frog.x + direction * RETREAT_DISTANCE;
    frogImg.src=HURT_IMAGE;

    let retreatTimer=setInterval(()=>{
        if(frog.dead){
            clearInterval(retreatTimer);
            return;
        }
        if((direction<0 && frog.x<=target)||(direction>0 && frog.x>=target)){
            clearInterval(retreatTimer);
            frog.stunned=false;
            frog.state="RECOVER";
            return;
        }
        frog.x += direction * 8;
    },16);

    return true;
}

// =====================
// 攻击系统
// =====================


function showCombatText(value, type, x, y){
    const t=document.createElement("div");
    t.className="combatText "+type;
    t.innerText=(type==="heal"?"+":"-")+value;
    t.style.left=(x)+"px";
    t.style.top=(y-40)+"px";
    document.body.appendChild(t);
    requestAnimationFrame(()=>{
        t.style.transform="translateY(-60px) scale(1.1)";
        t.style.opacity="0";
    });
    setTimeout(()=>t.remove(),1000);
}

function showDamageText(value, target){
    const r=target.getBoundingClientRect();
    showCombatText(value,"damage",r.left+r.width/2,r.top);
}

function showHealText(value, target){
    const r=target.getBoundingClientRect();
    showCombatText(value,"heal",r.left+r.width/2,r.top);
}

function frogFlashHit(){
    if(!frogImg) return;
    frogImg.style.filter="brightness(3) sepia(1) saturate(8) hue-rotate(320deg)";
    setTimeout(()=>{frogImg.style.filter="";},120);
}


// 玩家测试攻击 V8.8.1
// V1.1.1 妙脆角猫远程普攻系统
const BULLET_IMAGE = "assets/players/miaocuijiao_cat/skills/Q/cat_bullet.png";
const BULLET_SPEED = 3.6; // V15.18 子弹速度稍微加快
const BULLET_DAMAGE = 25;
const SHOOT_COOLDOWN = 2000;
let canShoot = true;
let shootCooldownLeft = 0;
window.shootCooldownLeft = 0;
let catBullets = [];

// V1.5 Q技能 爆炸火箭
const Q_ROCKET_IMAGE = "assets/players/miaocuijiao_cat/skills/R_rocket_rain/explosion_cat_rocket.png";
// V15.19 预加载子弹/火箭贴图 + 画布兜底：保证第一枪/第一发Q也能立即看到子弹（贴图未加载完时不显示空白）
const BULLET_PRELOAD = new Image(); BULLET_PRELOAD.src = BULLET_IMAGE;
const QROCKET_PRELOAD = new Image(); QROCKET_PRELOAD.src = Q_ROCKET_IMAGE;
let _bulletFb = null, _qrocketFb = null;
function makeBulletFallback(){
  const cv=document.createElement('canvas'); cv.width=72; cv.height=72;
  const c=cv.getContext('2d');
  c.fillStyle='#ffb300'; c.beginPath(); c.ellipse(36,36,24,16,0,0,Math.PI*2); c.fill();
  c.fillStyle='#ff6d00'; c.beginPath(); c.arc(58,36,11,0,Math.PI*2); c.fill();
  c.fillStyle='#fff3c4'; c.beginPath(); c.arc(50,32,5,0,Math.PI*2); c.fill();
  return cv.toDataURL('image/png');
}
function makeQRocketFallback(){
  const cv=document.createElement('canvas'); cv.width=110; cv.height=80;
  const c=cv.getContext('2d');
  c.fillStyle='#7e57c2'; c.beginPath(); c.ellipse(55,40,38,24,0,0,Math.PI*2); c.fill();
  c.fillStyle='#ff7043'; c.beginPath(); c.arc(88,40,14,0,Math.PI*2); c.fill();
  c.fillStyle='#fff3c4'; c.beginPath(); c.arc(78,34,6,0,Math.PI*2); c.fill();
  return cv.toDataURL('image/png');
}
function bulletImgSrc(){
  if(BULLET_PRELOAD && BULLET_PRELOAD.complete && BULLET_PRELOAD.naturalWidth>0) return BULLET_IMAGE;
  if(!_bulletFb) _bulletFb = makeBulletFallback();
  return _bulletFb;
}
function qRocketImgSrc(){
  if(QROCKET_PRELOAD && QROCKET_PRELOAD.complete && QROCKET_PRELOAD.naturalWidth>0) return Q_ROCKET_IMAGE;
  if(!_qrocketFb) _qrocketFb = makeQRocketFallback();
  return _qrocketFb;
}
const Q_DAMAGE = 90;
const Q_COOLDOWN = 50000; // Q技能初始冷却50秒
let qCooldownLeft = 0;
window.qCooldownLeft = 0;
let qReady = true;
let qRockets = [];

// V1.6.3 R技能框架（测试CD）
const R_COOLDOWN = 90000; // R大招初始冷却90秒
let rReady = true;
let rCooldownLeft = 0;
window.rCooldownLeft = 0;
window.gameStarted = false;

let rAiming = false;
let rAimCircle = null;

function startRAim(){
    if(playerDead || gameEnded || !rReady || !window.RRocketRain) return;
    if(!rAiming){
        rAiming = true;
        if(typeof enemy!=='undefined'){ window.RRocketRain.targetX = enemy.x; } // 红圈从主角当前位置开始
        rAimCircle = window.RRocketRain.createWarning();
    }
}
// 按住R瞄准时，红圈跟随鼠标移动；松开R时火箭落在红圈停留位置
window.addEventListener("mousemove",(e)=>{
    if(window.rAiming && window.RRocketRain){
        window.RRocketRain.targetX = Math.max(100, Math.min(window.innerWidth-100, e.clientX));
        if(window.RRocketRain.updateWarning) window.RRocketRain.updateWarning();
    }
});

function releaseRAim(){
    if(!rAiming || !window.RRocketRain) return;
    rAiming = false;
    window.RRocketRain.lockWarning();
    if(rAimCircle){
        window.RRocketRain.flashWarning(rAimCircle);
    }
    setTimeout(()=>{
        if(window.gamePaused){ if(window.RRocketRain) window.RRocketRain.pendingLaunch = true; return; } // 暂停时不发射，恢复后补发
        if(window.RRocketRain) window.RRocketRain.launch();
    }, window.RRocketRain.warningTime);

    rReady=false;
    const rc = window.trainingMode ? 3000 : (window.l15UltimateBoost ? 12000 : Math.round(R_COOLDOWN * getCdFactor())); // 训练营：冷却3秒
    rCooldownLeft=rc;
    window.rCooldownLeft=rc;
    setTimeout(()=>{
        rReady=true;
        rCooldownLeft=0;
        window.rCooldownLeft=0;
    },rc);
}

function useRSkill(){
    startRAim();
}

setInterval(()=>{
    if(window.gamePaused) return; // 暂停时冷却也冻结
    if(rCooldownLeft>0){
        rCooldownLeft-=100;
        if(rCooldownLeft<0) rCooldownLeft=0;
        window.rCooldownLeft=rCooldownLeft;
    }
},100);


setInterval(()=>{ if(window.gamePaused) return; if(!window.gameStarted && !window.infiniteMode && !window.trainingMode) return; // 菜单空闲不刷新（省CPU）
 if(window.updateRUI) window.updateRUI(); if(shootCooldownLeft>0){shootCooldownLeft-=100; if(shootCooldownLeft<0)shootCooldownLeft=0; window.shootCooldownLeft=shootCooldownLeft;} if(window.healCooldownLeft>0){window.healCooldownLeft-=100; if(window.healCooldownLeft<0)window.healCooldownLeft=0;} if(qCooldownLeft>0){qCooldownLeft-=100;if(qCooldownLeft<0)qCooldownLeft=0;window.qCooldownLeft=qCooldownLeft;} },100);

// V1.2 妙脆角猫回血技能
const HEAL_AMOUNT = 30;
const HEAL_COOLDOWN = 15000; // 总技能冷却（后续可调）
const CORN_REGEN_TIME = 30000; // 单个妙脆角恢复时间（后续可调）
let miaocatCorn = 2;
let healSkillReady = true;
let cornTimers = [];

// 妙碎角独立资源状态
window.miaocat = window.miaocat || {};
window.miaocat.horns = (typeof window.miaocat.horns==='number') ? window.miaocat.horns : miaocatCorn;
window.miaocat.maxHorns = 2;
window.miaocat.hornCooldowns = window.miaocat.hornCooldowns || [0,0];
if(window.miaocat.horns > window.miaocat.maxHorns) window.miaocat.horns = window.miaocat.maxHorns;

const CORN_NORMAL_IMAGE = "assets/players/miaocuijiao_cat/sprites/miaocat_idle.png";
const CORN_ONE_IMAGE = "assets/players/miaocuijiao_cat/sprites/miaocat_one.png";
const CORN_ZERO_IMAGE = "assets/players/miaocuijiao_cat/sprites/miaocat_bald.png";

window.updateCornSprite = function updateCornSprite(){
    const target = playerImg || document.getElementById("player");
    if(!target) return;

    const count = (window.miaocat && typeof window.miaocat.horns === 'number')
        ? Math.max(0, Math.min(2, window.miaocat.horns))
        : Math.max(0, Math.min(2, miaocatCorn));

    let nextImage = CORN_ZERO_IMAGE;
    if(count === 2) nextImage = CORN_NORMAL_IMAGE;
    else if(count === 1) nextImage = CORN_ONE_IMAGE;

    // 强制同步当前外观，防止恢复后仍停留秃头
    if(target && target.src && !target.src.endsWith(nextImage)){
        target.src = nextImage;
        target.setAttribute("data-horn-sync", String(count));
    }

    miaocatCorn = count;
    window.miaocatCorn = count;
};

window.forceMiaocuiVisualSync = function(){
    if(window.miaocat && typeof window.miaocat.horns === "number"){
        window.miaocat.horns = Math.max(0, Math.min(2, window.miaocat.horns));
        updateCornSprite();
    }
};

// 每帧状态校正：角数量变化必须反映到角色图片
setInterval(()=>{
    if(activeCharacter!=='daodungou' && window.miaocat && typeof window.miaocat.horns === "number"){
        window.forceMiaocuiVisualSync();
    }
},100);

function useHealSkill(){
    if(playerDead || gameEnded || !healSkillReady || miaocatCorn<=0) return;

    // 先确认有可用喵碎角，再消耗，避免无角状态错误
    window.miaocat = window.miaocat || {};
    window.miaocat.hornCooldowns = window.miaocat.hornCooldowns || [0,0];
    let usedIndex = window.miaocat.hornCooldowns.findIndex(v=>v<=0);
    if(usedIndex===-1 || miaocatCorn<=0) return;

    miaocatCorn--;
    window.miaocatCorn=miaocatCorn;
    window.miaocat.horns=miaocatCorn;

    playerHp = Math.min(playerMaxHp, playerHp + HEAL_AMOUNT);
    window.playerHp=playerHp;
    updatePlayerHP();
    showHealText(HEAL_AMOUNT, enemyObj);

    // 同步妙脆角资源UI
    updateCornSprite();
    // 启动对应喵碎角独立冷却
    window.miaocat.hornCooldowns[usedIndex]=CORN_REGEN_TIME;
    window.miaocat.horns=miaocatCorn;

    window.hornCooldownLeft=CORN_REGEN_TIME;
    if(window.updateV13UI) window.updateV13UI();

    // 技能自身冷却
    healSkillReady=false;
    const hc = window.trainingMode ? 3000 : Math.round(HEAL_COOLDOWN * getCdFactor()); // 训练营：冷却3秒
    window.healCooldownLeft = hc;
    setTimeout(()=>{
        healSkillReady=true;
    }, hc);
}


setInterval(()=>{
    if(window.gamePaused) return; // 暂停时妙脆角资源也冻结
    if(activeCharacter!=='daodungou' && window.miaocat && window.miaocat.hornCooldowns){
        for(let i=0;i<window.miaocat.hornCooldowns.length;i++){
            if(window.miaocat.hornCooldowns[i]>0){
                window.miaocat.hornCooldowns[i]-=100;
                if(window.miaocat.hornCooldowns[i]<=0){
                    window.miaocat.hornCooldowns[i]=0;
                    if((window.miaocat.horns||0) < (window.miaocat.maxHorns||2)){
                        window.miaocat.horns = Math.min(window.miaocat.maxHorns||2, (window.miaocat.horns||0) + 1);
                        window.miaocatCorn=window.miaocat.horns;
                        miaocatCorn=window.miaocat.horns;
                        if(window.updateCornSprite) window.updateCornSprite();
                        if(window.updateMiaoCatSprite) window.updateMiaoCatSprite();
                    }
                }
            }
        }
        window.hornCooldownLeft=Math.max(...window.miaocat.hornCooldowns);
        if(window.updateV13UI) window.updateV13UI();
    }
},100);

function useQRocket(){
    if(playerDead || gameEnded || !qReady) return;
    qReady=false;
    const qc = window.trainingMode ? 3000 : Math.round(Q_COOLDOWN * getCdFactor()); // 训练营：冷却3秒
    qCooldownLeft=qc;
    window.qCooldownLeft=qc;
    const face=window.miaoCatFace||1;
    // V15.18 开火瞬间强制把猫贴图同步到 enemy.x，确保火箭从猫实际位置打出
    if(enemyObj){ enemyObj.style.left = enemy.x + "px"; }
    qRockets.push({ x: getMuzzleX(face, 110), y: getMuzzleY(), dir: face, dead:false, explode:false });
    setTimeout(()=>{qReady=true;},qc);
}

function updateQRockets(){
 const gameEl = document.getElementById('game');
 const gr = gameEl ? gameEl.getBoundingClientRect() : { left:0, top:0, height: window.innerHeight };
 qRockets.forEach(r=>{
   r.x += r.dir*4.1; // V15.18 Q火箭速度稍微加快

   // V1.5.2 Q火箭碰撞修复：
   // 火箭本体使用小碰撞箱，不再使用大范围X轴判断
   const rScreenLeft = gr.left + r.x;
   const rScreenTop = gr.top + gr.height - r.y - 80;
   const rocketHitbox = {
      left: rScreenLeft + 18,
      right: rScreenLeft + 55,
      top: rScreenTop + 18,
      bottom: rScreenTop + 55
   };

   // 命中检测：遍历所有存活敌人（Boss也能被打到），取第一个被火箭碰到/爆炸范围内的
   let hitEnemy = null;
   if(typeof enemies!=='undefined'){
     for(const en of enemies){
       if(en && !en.dead && en.img){
         const er = en.img.getBoundingClientRect();
         if(rocketHitbox.left < er.right && rocketHitbox.right > er.left && rocketHitbox.top < er.bottom && rocketHitbox.bottom > er.top){ hitEnemy = en; break; }
       }
     }
   }
   if(!hitEnemy && typeof frog!=='undefined' && frog && frog.img){
     const fr = frog.img.getBoundingClientRect();
     if(rocketHitbox.left < fr.right && rocketHitbox.right > fr.left && rocketHitbox.top < fr.bottom && rocketHitbox.bottom > fr.top){ hitEnemy = frog; }
   }

   if(!r.explode && hitEnemy){
      r.explode=true;
      const hitFrog = hitEnemy;

      // 爆炸伤害范围单独处理（150px）
      const explosionRange = 260; // 大Boss也能被炸到
      const frogCenterX = hitEnemy.img.getBoundingClientRect().left + hitEnemy.img.getBoundingClientRect().width/2;
      const rocketCenterX = rScreenLeft + 35;

      if(Math.abs(frogCenterX - rocketCenterX) <= explosionRange){
          const qDmg = doCrit((Q_DAMAGE + (window.playerAttackBuff||0)) * (1 + 0.05*((inventory.skillLevels&&(inventory.skillLevels.skillQ||inventory.skillLevels.skill))||0)));
        if(typeof damageEnemy==='function') damageEnemy(hitEnemy, qDmg); // 统一走伤害通道：血条+伤害数字同步
        // 5级特殊：群体伤害（爆炸范围内所有敌人）
        if((inventory.skillLevels&&(inventory.skillLevels.skillQ||inventory.skillLevels.skill)) >= 5 && typeof enemies!=='undefined'){
          for(const oe of enemies){ if(oe && !oe.dead && oe !== frog && Math.abs(oe.x - r.x) < 220){ damageEnemy(oe, qDmg); } }
        }
      }

      // V1.6.2: Q火箭爆炸音效
      try{
          const explosionSound = new Audio("assets/audio/players/miaocuijiao_cat/rocket_explosion.wav");
          explosionSound.volume = 0.9 * (window.sfxVol||1);
          explosionSound.play().catch(()=>{});
      }catch(e){}

      r.dead=true;
   }

   // 防止火箭飞出地图后残留
   if(r.x < -200 || r.x > window.innerWidth+200){
      r.dead=true;
   }
 });
 qRockets=qRockets.filter(r=>!r.dead);
}

function drawQRockets(){
 document.querySelectorAll('.qRocket').forEach(e=>e.remove());
 const gameEl = document.getElementById('game');
 qRockets.forEach(r=>{let img=document.createElement('img');img.className='qRocket';img.src=qRocketImgSrc();img.style.position='absolute';img.style.left=r.x+'px';img.style.bottom=r.y+'px';img.style.width='110px';img.style.height='80px';img.style.transform='scaleX('+(r.dir>0?1:-1)+')';(gameEl||document.body).appendChild(img);});
}

// V15.18 子弹/火箭发射点：与玩家同一坐标系（#game 内绝对定位），从猫的身体旁边打出
// 玩家渲染: left=enemy.x, bottom=100-playerY → 子弹/火箭也用相同基准，杜绝任何坐标偏移
function getMuzzleX(face, w){
  const inset = Math.min(24, Math.round(w*0.3));
  return enemy.x + (face > 0 ? (100 - inset) : -(w - inset));
}
function getMuzzleY(){
  return (100 - playerY) + 20;
}
function shootBullet(){
    if(playerDead || (frog && frog.dead) || gameEnded || !canShoot) return; // frog 可能为空（切换/过渡时），防空引用

    canShoot = false;
    const shootCd = window.l15CdBoost ? 1000 : SHOOT_COOLDOWN; // 宗主传功后普攻冷却减半（2秒→1秒）
    shootCooldownLeft = shootCd;
    window.shootCooldownLeft = shootCd;

    // V1.1.4: 子弹方向跟随妙脆角猫当前朝向
    const playerFace = (keys["a"] || keys["arrowleft"]) ? -1 : 
                       ((keys["d"] || keys["arrowright"]) ? 1 : 
                       (window.miaoCatFace || 1));

    window.miaoCatFace = playerFace;
    // V15.18 开火瞬间强制把猫贴图同步到 enemy.x，确保子弹从猫实际位置打出
    if(enemyObj){ enemyObj.style.left = enemy.x + "px"; }

    catBullets.push({ x: getMuzzleX(playerFace, 72), y: getMuzzleY(), dir: playerFace, dead:false });

    setTimeout(()=>{
        canShoot=true;
    }, shootCd);
}

// 鼠标左键：发射子弹（不再直接近战伤害）
window.addEventListener("mousedown",(e)=>{
    if(window.l15LockControls) return;
    if(e.button===0){
      // 输入框/按钮等表单控件必须能正常聚焦输入，不能 preventDefault（否则白色输入框点不进去）
      const t = e.target;
      const tag = t && t.tagName ? t.tagName.toUpperCase() : '';
      const onForm = tag==='INPUT' || tag==='TEXTAREA' || tag==='SELECT' || tag==='BUTTON' || tag==='LABEL' ||
        !!(t && t.closest && t.closest('input,textarea,select,button,label'));
      // V15.18 点击按钮/触控键/输入框等控件时不发射普攻（防止触屏合成mousedown导致双发/误发）
      if(onForm){ return; }
      e.preventDefault(); // 防止点出图片选中/拖到书签
    }
    if(window.gamePaused) return;
    if(e.button===0 && window.gameStarted){
        if(activeCharacter==='daodungou'){ if(window.DOG) window.DOG.meleeAttack(); }
        else { shootBullet(); }
    }
});

// =====================
// V5.1 右键突进闪避（可穿过/抵消敌人弹幕，3秒冷却）
// =====================
let dashReady=true;
let dashCooldownLeft=0;
let dashActive=false;
let dashTimer=null;
window.dashReady=true;
window.dashCooldownLeft=0;

// 闪避升级II：冲刺命中敌人眩晕0.5秒
function stunDashTarget(tgt){
  if(!tgt || tgt.dead) return;
  tgt.stunned = true;
  setTimeout(()=>{ if(tgt && !tgt.dead){ tgt.stunned = false; } }, 500);
}
window.stunDashTarget = stunDashTarget;
function useDash(){
    if(playerDead || gameEnded || (frog && frog.dead) || !dashReady || dashActive) return;
    // 时缓：按右键闪避，规避Boss大招这次伤害
    if(typeof dodgeSlowmo==='function') dodgeSlowmo();
    dashReady=false;
    const t=(inventory.talents)||{}; const dashNodes=(t.dash?1:0)+(t.dash2?1:0);
    const dashCd = Math.max(2000, 3000 - 250*dashNodes);
    dashCooldownLeft=dashCd;
    window.dashCooldownLeft=dashCd;
    dashActive=true;
    window.dashing=true;
    const isCat = activeCharacter!=='daodungou';
    const dir=window.miaoCatFace||1;
    // 妙脆角猫突进更远；刀盾狗突进较短；右键升级后按一次触发两段
    const stages = (window.inventory && window.inventory.rightClickUpgrade === true) ? 2 : 1; // 必须购买右键双段才生效
    const stageDist = isCat ? 320 : 220;
    let stage = 0;
    let hitIds = {};
    const dashAoe = !!(window.inventory && window.inventory.dashAoeUpgrade === true); // 闪避升级：购买后命中冲刺轨迹上所有敌人
    // 未购买群体冲刺：冲刺开始时锁定离玩家最近的一个存活敌人，整段冲刺只对它造成伤害
    let dashTargets = 'ALL';
    if(!dashAoe){
      let nearest=null, nd=Infinity;
      for(const e of enemies){ if(e.dead) continue; const dd=Math.abs(enemy.x - e.x); if(dd<nd){ nd=dd; nearest=e; } }
      dashTargets = nearest ? [nearest] : [];
    }
    if(enemyObj) enemyObj.style.filter="brightness(1.4) drop-shadow(0 0 8px rgba(255,255,255,.8))";
    const runStage = ()=>{
        const curDir = window.miaoCatFace || 1; // 每段都按当前朝向（可在两段之间换方向）
        hitIds = {}; // 每段重置：双段冲刺两段都能造成伤害
        const startX = enemy.x;
        const target = startX + curDir*stageDist;
        dashTimer=setInterval(()=>{
            // 在间隔内直接夹住边界：顶到边缘立即结束当前段，不会卡住/永久无敌
            enemy.x = Math.max(WORLD_LEFT, Math.min(WORLD_RIGHT, enemy.x + curDir*22));
            // 突进伤害：命中冲刺轨迹上的敌人（群冲升级后命中轨迹上所有敌人；未购买时整段冲刺只锁定冲刺开始时离玩家最近的一个）
            if(frog && !frog.dead && typeof enemies!=='undefined'){
              const targets = (dashTargets==='ALL') ? enemies.filter(e=>!e.dead) : dashTargets;
              for(const tgt of targets){
                if(!tgt || hitIds[tgt.uid]) continue;
                const d=Math.abs(enemy.x - tgt.x);
                const vOK=(typeof canHitEnemy==='function')?canHitEnemy(tgt):true;
                if(isCat && d<120 && vOK){
                  hitIds[tgt.uid]=true;
                  if(typeof damageEnemy==='function') damageEnemy(tgt, doCrit(10 + (charLevel()-1) + (window.playerAttackBuff||0)));
                  if(window.inventory && window.inventory.dashStunUpgrade){ stunDashTarget(tgt); }
                } else if(!isCat && d<150 && vOK){
                  hitIds[tgt.uid]=true;
                  if(typeof damageEnemy==='function') damageEnemy(tgt, doCrit(11 + (charLevel()-1) + (window.playerAttackBuff||0)));
                  if(window.inventory && window.inventory.dashStunUpgrade){ stunDashTarget(tgt); }
                  if(tgt && !tgt.dead && tgt.type !== 'dummy'){ // 稻草人不被击退
                    tgt.x += (tgt.x > enemy.x ? 55 : -55);
                    if(typeof clampWorld==='function') clampWorld(tgt);
                    if(tgt.img) tgt.img.style.left = tgt.x + "px";
                    if(typeof showDamageText==='function' && tgt.img) showDamageText("盾击击退!", tgt.img);
                  }
                }
              }
            }
            const atEdge = (curDir>0 && enemy.x >= WORLD_RIGHT) || (curDir<0 && enemy.x <= WORLD_LEFT);
            if(atEdge || (curDir>0&&enemy.x>=target)||(curDir<0&&enemy.x<=target)){
                // 顶到屏幕边缘时立即结束当前段，避免卡住左右摇摆
                enemy.x = Math.max(WORLD_LEFT, Math.min(WORLD_RIGHT, target));
                clearInterval(dashTimer);
                dashTimer=null;
                stage++;
                if(stage < stages){
                    setTimeout(runStage, 160); // 两段之间小停顿
                } else {
                    dashActive=false;
                    window.dashing=false;
                    if(enemyObj) enemyObj.style.filter="";
                }
            }
        },16);
    };
    runStage();
    setTimeout(()=>{ dashReady=true; window.dashReady=true; },3000);
}
window.useDash=useDash;

window.addEventListener("dragstart",(e)=>{ e.preventDefault(); }); // 禁止拖拽图片/文字到书签栏
window.addEventListener("contextmenu",(e)=>{
    e.preventDefault();
    if(window.l15LockControls) return;
    if(window.gamePaused) return;
    if(window.gameStarted) useDash();
});

setInterval(()=>{
    if(window.gamePaused) return;
    if(dashCooldownLeft>0){
        dashCooldownLeft-=100;
        if(dashCooldownLeft<0) dashCooldownLeft=0;
        window.dashCooldownLeft=dashCooldownLeft;
        if(window.updateV13UI) window.updateV13UI();
    }
},100);

function updateBullets(){
    if(!frogImg) return;
    updateQRockets();
    const gameEl = document.getElementById('game');
    const gr = gameEl ? gameEl.getBoundingClientRect() : { left:0, top:0, height: window.innerHeight };
    catBullets.forEach(b=>{
        b.x += b.dir * BULLET_SPEED;

        // V1.1.3: 子弹独立小范围碰撞箱，不受大贴图影响
        const frogRect = frogImg.getBoundingClientRect();
        const bScreenLeft = gr.left + b.x;
        const bScreenTop = gr.top + gr.height - b.y - 72;
        const hitbox = {
            left: bScreenLeft + 12,
            right: bScreenLeft + 44,
            top: bScreenTop + 12,
            bottom: bScreenTop + 44
        };
        if(typeof window.tryBreakBreakables==='function'){ tryBreakBreakables(12 + (charLevel()-1), b.x, 55); }
        if(frog && !frog.dead &&
           hitbox.left < frogRect.right &&
           hitbox.right > frogRect.left &&
           hitbox.top < frogRect.bottom &&
           hitbox.bottom > frogRect.top){
            frogTakeDamage(doCrit((13 + (charLevel()-1)) + (typeof talentDmgBonus==='function'?talentDmgBonus():0) + 2*((inventory.skillLevels&&inventory.skillLevels.atk)||0) + (window.playerAttackBuff||0)));
            b.dead=true;
        }
    });

    catBullets = catBullets.filter(b=>!b.dead);
}

function drawBullets(){
    drawQRockets();
    document.querySelectorAll(".catBullet").forEach(e=>e.remove());
    const gameEl = document.getElementById('game');

    catBullets.forEach(b=>{
        let img=document.createElement("img");
        img.className="catBullet";
        img.src=bulletImgSrc();
        img.style.position="absolute";
        img.style.left=b.x+"px";
        img.style.bottom=b.y+"px";
        img.style.width="72px";
        img.style.transform = "scaleX(" + (b.dir>0?1:-1) + ")"; // 朝左发射时子弹图片也跟着朝左
        img.style.height="72px";
        (gameEl||document.body).appendChild(img);
    });
}

// Player Series V1.0 玩家基础框架
// 黑框测试玩家：移动 + 跳跃接口
const PLAYER_SPEED = 6;
const JUMP_POWER = 18;
// V5.0 角色切换后使用动态数值
let currentPlayerSpeed = 6;
let currentJumpPower = 18;
let currentMaxJumps = 2;
const GRAVITY = 0.9;
let keys = {};
let playerY = 0;
let playerVelocityY = 0;
let onGround = true;
let jumpCount = 0;
const MAX_JUMPS = 2;

window.addEventListener("mousemove",(e)=>{
    if(window.RRocketRain && window.RRocketRain.warning && !window.RRocketRain.locked){
        window.RRocketRain.targetX=e.clientX;
        window.RRocketRain.updateWarning();
    }
});

window.addEventListener("keydown",(e)=>{
    const k=e.key.toLowerCase();
    // ESC：逐层关闭当前弹窗/界面（商城、背包、技能升级、天赋、图鉴、暂停、选关、选角色、序章）
    if(k==="escape"){
        if(document.getElementById('leaveConfirmPanel')){ doLeave(false); return; } // 取消离开确认 → 回到暂停菜单
        if(document.getElementById('confirmPanel')){ return; } // 其它确认框（删除账号/怪物提示/中转站）由它自己的按钮处理，ESC不强行关闭
        if(document.getElementById('skillUpgradePanel')){ closeSkillUpgrade(); return; }
        if(document.getElementById('talentPanel')){ closeTalentTree(); return; }
        if(document.getElementById('codexPanel')){ closeCodex(); return; }
        if(document.getElementById('codexDetailPanel')){ closeCodexDetail(); return; }
        if(document.getElementById('accountPanel')){ closeAccountPanel(); return; }
        if(document.getElementById('achievePanel')){ closeAchievements(); return; }
        if(document.getElementById('shopPanel')){ closeShop(); return; }
        if(document.getElementById('backpackPanel')){ toggleBackpack(); return; }
        if(document.getElementById('charPanel')){ closeCharPanel(); return; }
        if(document.getElementById('skillUnlockPopup')){ const s=document.getElementById('skillUnlockPopup'); s.remove(); window.gamePaused=false; return; }
        if(document.getElementById('infiniteMenu')){ closeInfiniteMenu(); return; }
        if(document.getElementById('infiniteLeaderboard')){ closeLeaderboard(); return; }
        if(document.getElementById('settingsPanel')){ closeSettings(); return; }
        if(document.getElementById('pauseMenu')){ closePause(); return; }
        const ls = document.getElementById('levelSelect'); if(ls && ls.style.display==='flex'){ backToMenu(); return; }
        const sel = document.getElementById('select'); if(sel && sel.style.display==='flex'){ backToMenu(); return; }
        const pr = document.getElementById('prologue'); if(pr && pr.style.display==='flex'){ skipPrologue(); return; }
        if(window.gameStarted && !gameEnded && !playerDead){ togglePause(); }
        return;
    }
    // 暂停时只响应菜单键
    if(window.gamePaused){
        if(k==="tab"){ toggleBackpack(); }
        return;
    }
    keys[k] = true;
    const su = skillUnlocks();
    if(k==="tab"){ toggleBackpack(); return; }
    if(activeCharacter==='daodungou'){
        if(k==="e" && su.e && window.DOG) window.DOG.useShield();
        if(k==="q" && su.q && window.DOG) window.DOG.useSlash();
        if(k==="r" && su.r && window.DOG) window.DOG.useTornado();
    }else{
        if(k==="e" && su.e) useHealSkill();
        if(k==="q" && su.q) useQRocket();
        if(k==="r" && su.r) startRAim();
    }
    if((e.code==="Space") && jumpCount < currentMaxJumps && !playerDead && !gameEnded){
        playerVelocityY = -currentJumpPower;
        jumpCount++;
        onGround = false;
    }
});window.addEventListener("keyup",(e)=>{
    keys[e.key.toLowerCase()] = false;
    if(e.key.toLowerCase()==="r" && activeCharacter!=='daodungou') releaseRAim();
});

function updatePlayerMovement(){
    if(window.gamePaused) return;
    if(window.l15LockControls) return;
    if(!enemyObj || playerDead || gameEnded) return;
    if(window.dogSpinning) return; // V5.0 刀盾狗大招旋转期间锁定移动

    if(keys["a"] || keys["arrowleft"]){
        enemy.x -= currentPlayerSpeed * slowmoFactor();
        window.miaoCatFace = -1;
        enemyObj.style.transform = "scaleX(-1)";
    }

    if(keys["d"] || keys["arrowright"]){
        enemy.x += currentPlayerSpeed * slowmoFactor();
        window.miaoCatFace = 1;
        enemyObj.style.transform = "scaleX(1)";
    }

    // 基础跳跃物理（可站上箱子/建筑）—— 突进闪避期间保持高度透体穿过，不会被平台顶起
    if(!window.dashing){
      const gy = typeof groundYAt==='function' ? groundYAt(enemy.x + 50) : 0;
      if(!onGround){
          playerVelocityY += GRAVITY;
          playerY += playerVelocityY;
          if(playerY >= -gy){
              playerY = -gy;
              playerVelocityY = 0;
              onGround = true;
              jumpCount = 0;
          }
      } else {
          if(playerY < -gy - 1){ onGround = false; }
          else if(playerY !== -gy){ playerY = -gy; }
      }
    }
    // 实体水平阻挡（检查角色两侧边缘，防穿模）—— 右键突进闪避时透体穿过
    if(typeof solidObjects!=='undefined' && !window.dashing){
      const pw = playerImg ? (playerImg.clientWidth||100) : 100;
      const pL = enemy.x + 8, pR = enemy.x + pw - 8;
      for(const s of solidObjects){
        if(s.broken) continue;
        const sL = s.x - s.w/2, sR = s.x + s.w/2;
        if(pR > sL && pL < sR && -playerY < s.topY){
          if((enemy.x + pw/2) < s.x && (keys["d"]||keys["arrowright"])) enemy.x -= currentPlayerSpeed;
          if((enemy.x + pw/2) > s.x && (keys["a"]||keys["arrowleft"])) enemy.x += currentPlayerSpeed;
        }
      }
    }

    enemyObj.style.left = enemy.x + "px";
    enemyObj.style.bottom = (100 - playerY) + "px";
    // V1.6: HP bar follows player immediately after movement/jump update
    followPlayerHP();
    if(activeCharacter==='daodungou'){ if(window.DOG) window.DOG.updateSprite(); }
    else if(window.updateMiaoCatSprite){ window.updateMiaoCatSprite(); }
}

setInterval(updatePlayerMovement,16);

// V8.8.9 玩家攻击自动测试连接
// 黑方块作为主角时，持续产生攻击行为用于战斗测试
let playerAttackTimer=null;
function startPlayerAutoAttack(){
    // V8.8.10: 移除自动攻击，改为鼠标左键触发
}


// =====================
// 创建冲击波
// =====================


// =====================
// 命中扣血
// =====================


function hitFrog(){
    frogTakeDamage(CONFIG.DAMAGE);
}



function enemyDead(){
    gameEnded=true;
    info.innerHTML="Enemy Defeated!";
}









// =====================
// 更新血条
// =====================


function updateHP(){



    let percent=

    enemy.hp/enemy.maxHp*100;




    hpFill.style.width=

    percent+"%";



    hpText.innerHTML=

    "HP:"+enemy.hp;



    if(percent>50){


        hpFill.style.background="#00ff00";


    }

    else if(percent>20){


        hpFill.style.background="#ffff00";


    }

    else{


        hpFill.style.background="#ff0000";


    }



}









// =====================
// 走路动画
// =====================


setInterval(()=>{
  // V5.5 多敌人走路动画
  for(const e of enemies){
    if(!e.dead && e.state==="CHASE"){
      if(e.images && e.images.walk && e.images.walk.length===1){
        e.img.src = e.images.walk[0];
      } else {
        e.walkFrame++;
        if(e.walkFrame>=WALK_FRAMES.length) e.walkFrame=0;
        e.img.src = WALK_FRAMES[e.walkFrame];
      }
    }
  }
},180);









// =====================
// AI核心
// =====================


// V1.1 边界限制
function clampWorld(obj){
    if(obj.x < WORLD_LEFT) obj.x = WORLD_LEFT;
    if(obj.x > WORLD_RIGHT) obj.x = WORLD_RIGHT;
}

function followPlayerHP(){
    if(!hpBox || !enemyObj) return;
    // V1.6: HP bar is locked to player transform position every frame
    const rect=enemyObj.getBoundingClientRect();
    hpBox.style.left=(rect.left+rect.width/2-50)+"px";
    hpBox.style.top=(rect.top-55)+"px";
    hpBox.style.position="fixed";
}

function update(){
    // 不在战斗中（已回主菜单/未开局）时停止主循环，避免空转消耗CPU（卡顿优化）
    if(!window.gameStarted && !window.infiniteMode){ updateLoopStarted = false; return; }
    // V5.7 暂停（背包/商城/暂停菜单打开时冻结战斗）
    if(window.gamePaused){
        for(const e of enemies){ if(e.img) e.img.style.left=e.x+"px"; }
        if(enemyObj) enemyObj.style.left=enemy.x+"px";
        uiTick(); // 暂停时HUD也节流更新（省CPU）
        requestAnimationFrame(update);
        return;
    }
    if(activeCharacter==='daodungou' && window.DOG){
        window.DOG.update();
        window.DOG.draw();
    }
    updateBullets();
    drawBullets();
    syncPlayerHpBox();

    // 更新目标指针（最近存活敌人）
    updateTargetFrog();

    if(playerDead){
        followPlayerHP();
        syncPlayerHpBox();
        if(window.updateV13UI) window.updateV13UI();
        requestAnimationFrame(update);
        return;
    }

    if(levelCleared || gameEnded){
        for(const e of enemies){ if(e.img) e.img.style.left=e.x+"px"; followEnemyHp(e); }
        followPlayerHP();
        syncPlayerHpBox();
        if(window.updateV13UI) window.updateV13UI();
        requestAnimationFrame(update);
        return;
    }

    // 防贴脸：贴近最近敌人 1.5 秒被弹开
    if(frog){
      const stickDist = Math.abs(frog.x - enemy.x);
      if(stickDist < 70){
        if(stickStart === 0) stickStart = Date.now();
        else if(Date.now() - stickStart >= 1500){
          stickStart = 0;
          const dir2 = (enemy.x > frog.x) ? 1 : -1;
          enemy.x += dir2 * 200;
          if(enemyObj){ enemyObj.style.filter="brightness(2)"; setTimeout(()=>{ if(enemyObj) enemyObj.style.filter=""; },150); }
          playerTakeDamage(10);
          if(typeof showDamageText==='function') showDamageText("被弹开! -10", enemyObj);
        }
      } else {
        stickStart = 0;
      }
    }

    // 每个敌人 AI + 位置
    for(const e of enemies){
      if(e.dead) continue;
      updateEnemyAI(e);
      e.img.style.left = e.x + "px";
      followEnemyHp(e);
    }

    // 玩家限制在战斗范围内
    clampWorld(enemy);
    enemyObj.style.left = enemy.x + "px";

    // 通关判定
    checkLevelClear();
    if(typeof updateL15==='function') updateL15();
  if(typeof updateSpecial==='function') updateSpecial();

    // 信息面板（调试用）
    if(info){
      const alive = enemies.filter(e=>!e.dead);
      info.innerHTML = "关卡: 第"+(currentLevel+1)+"关" +
        "<br>敌人剩余: " + alive.length +
        (frog ? "<br>最近HP: " + Math.max(0,Math.round(frog.hp)) : "");
    }

    syncPlayerHpBox();
    uiTick();
    requestAnimationFrame(update);
}

// V5.5 序章初始化
initPrologue();
