




// =====================
// 玩家资源（妙脆角猫）
// =====================
const PLAYER_IDLE_IMAGE="assets/players/miaocuijiao_cat/sprites/miaocat_idle.png";
const PLAYER_RUN_LEFT_IMAGE="assets/players/miaocuijiao_cat/sprites/miaocat_run_left.png";
const PLAYER_RUN_RIGHT_IMAGE="assets/players/miaocuijiao_cat/sprites/miaocat_run_right.png";
const PLAYER_JUMP_IMAGE="assets/players/miaocuijiao_cat/sprites/miaocat_jump.png";

const playerImg=document.getElementById("player");

// V1.1 设置持久化：打开游戏先读取本地设置（奶蛙笑声/音量/难度等），修改即保存
try{ window.gameSettings = JSON.parse(localStorage.getItem('milkfrog_settings')||'null') || window.gameSettings || { bgm:80, sfx:80 }; }catch(e){ window.gameSettings = window.gameSettings || { bgm:80, sfx:80 }; }
function saveSettings(){ try{ localStorage.setItem('milkfrog_settings', JSON.stringify(window.gameSettings||{})); }catch(e){} }
window.saveSettings = saveSettings;

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
let WORLD_LEFT=0;
let WORLD_RIGHT=window.innerWidth-80; // V1.10 改为 let：旋转/全屏/地址栏变化时由 reflowGameViewport 更新



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
window.accountEUnlocked = false; // E技能是否已解锁（存档）
window.accountSeenEnemies = window.accountSeenEnemies || []; // V1.1 已见敌人（用于新敌人登场弹窗）
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
      window.accountEUnlocked = !!data.eUnlocked;
      window.accountRUnlocked = !!data.rUnlocked;
      window.accountTrainingUnlocked = !!data.trainingUnlocked;
      window.accountSeenEnemies = data.seenEnemies || []; // V1.1 新敌人登场弹窗记录
      // 老存档迁移：已获得Q技能的玩家自动解锁训练营
      if(window.accountQUnlocked && !window.accountTrainingUnlocked){ window.accountTrainingUnlocked = true; }
      window.accountAchievements = data.achievements || {}; // 读取已获成就，刷新后不会丢失/重复触发
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
    localStorage.setItem(key, JSON.stringify({ inventory: window.inventory, maxUnlocked: window.accountMaxUnlocked, cleared: window.accountCleared, hardCleared: window.accountHardCleared, qUnlocked: window.accountQUnlocked, eUnlocked: window.accountEUnlocked, rUnlocked: window.accountRUnlocked, l15Seen: window.accountL15Seen, achievements: window.accountAchievements, trainingUnlocked: !!window.accountTrainingUnlocked, seenEnemies: window.accountSeenEnemies || [] }));
  }catch(e){}
}
window.saveGame = saveGame;

function showMainMenu(){
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
  { level:7, name:"第7关·草原疾风", scene:"grass", flag:"special", mode:"timed", special:{ timer:60 }, enemies:[ {hp:80, x:0.5}, {hp:80, x:0.6}, {hp:80, x:0.7}, {hp:80, x:0.8}, {hp:80, x:0.9} ] },
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
  if(typeof saveSettings==='function') saveSettings(); // V1.1 保存设置
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
  if(typeof saveSettings==='function') saveSettings(); // V1.1 保存设置
  if(type==='bgm'){ const el = document.getElementById('setBgmVal'); if(el) el.textContent = v+'%'; }
  else { const el = document.getElementById('setSfxVal'); if(el) el.textContent = v+'%'; }
  if(window.applySettings) window.applySettings();
}
window.setVolume = setVolume;
function setDiffMode(mode){
  window.gameSettings = window.gameSettings || {};
  window.gameSettings.diffMode = mode;
  if(typeof saveSettings==='function') saveSettings(); // V1.1 保存设置
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
  growth: { name:"天赋点/技能升级/难度模式", img:"🌳", text:"<b>天赋点怎么获得：</b><br>① 每累计通关 <b>2 个困难关卡</b> 获得 1 个天赋点（困难模式才有此加成）；<br>② 通关 <b>第2/8/10/12/14/15/16关</b>（普通模式首次通关）也会各获得 1 个天赋点；<br>③ 部分特殊关卡同样给天赋点。<br>天赋点在「天赋树」升级角色（生命/攻击/冷却/护盾/暴击等）。技能升级消耗金币强化技能；角色等级随通关提升血量与基础伤害。设置里的难度模式：躺平(奖励50%)/普通/高手(奖励200%)/噩梦(奖励300%)，敌人越难奖励越高。" },
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
  // V1.9 手机端哨塔/建筑/箱子缩小（屏幕小，太高的塔会超出屏幕）
  const mS = ('ontouchstart' in window || (navigator.maxTouchPoints||0) > 0) ? 0.6 : 1;
  if(!cfg) return;
  // Boss关（15关）：不生成障碍物，避免挡视线
  if((currentLevel+1) === 16){ return; }
  const steel = (currentLevel+1) >= 8;
  const explosive = (currentLevel+1) >= 13;
  // 箱子：偏右分布，不铺满
  const crateCount = 1 + (currentLevel % 2);
  for(let i=0;i<crateCount;i++){
    const x = window.innerWidth * (0.62 + i*0.1);
    addSolid(x, Math.round(52*mS), Math.round(52*mS), steel ? 'steel' : 'wood', true);
  }
  // 爆炸箱（第13关起，打碎会爆炸）
  if(explosive){
    addSolid(window.innerWidth * 0.55, Math.round(52*mS), Math.round(52*mS), 'explosive', true);
  }
  // 哨塔（第6关起）：随机出现，但每3关必出1座；塔顶自动站一名守卫；没出塔时放一个普通建筑
  if((currentLevel+1) >= 6){
    const needTower = (window.towerStreak||0) >= 2; // 连续2关没塔 -> 第3关必出
    const hasTower = needTower || Math.random() < 0.45;
    if(hasTower){
      const towerX = window.innerWidth * (0.72 + Math.random()*0.12);
      addSolid(towerX, Math.round(120*mS), Math.round(390*mS), 'tower', true);
      const t = solidObjects[solidObjects.length-1];
      spawnTowerGuard(t);
      window.towerStreak = 0;
    } else {
      window.towerStreak = (window.towerStreak||0) + 1;
      addSolid(window.innerWidth * 0.7, Math.round(140*mS), Math.round(80*mS), 'building', false);
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
    if(window.infiniteMode && typeof showInfiniteWaveLoad==='function') showInfiniteWaveLoad(function(){ startInfiniteWave(); });
    else if(window.infiniteMode && typeof startInfiniteWave==='function') startInfiniteWave();
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
  if(window.infiniteMode && typeof showInfiniteWaveLoad==='function') showInfiniteWaveLoad(function(){ startInfiniteWave(); });
  else if(window.infiniteMode && typeof startInfiniteWave==='function') startInfiniteWave();
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

// V1.1 新敌人登场弹窗：进关加载完后展示新敌人的图鉴介绍（特征/弱点/应对）
const LEVEL_NEW_ENEMIES = { 5:'elitefrog', 9:'mouse', 10:'elitemouse', 13:'boom', 16:'boss' };
function showNewEnemyPopup(key){
  const info = (typeof CODEX_DATA!=='undefined') ? CODEX_DATA[key] : null;
  if(!info) return;
  const old = document.getElementById('newEnemyPopup'); if(old) old.remove();
  window.gamePaused = true;
  const ov = document.createElement('div');
  ov.id = 'newEnemyPopup';
  ov.className = 'newEnemyPopup';
  ov.innerHTML = '<div class="nepCard"><div class="nepTitle">👾 新敌人登场！</div>' +
    '<div class="nepBody"><img class="nepImg" src="' + info.img + '" alt="' + info.name + '"><div class="nepInfo"><b>' + info.name + '</b><p>' + info.text + '</p></div></div>' +
    '<div class="nepTip">点击任意处继续（或等待自动关闭）</div></div>';
  document.body.appendChild(ov);
  let closed = false;
  function close(){ if(!closed && ov.parentNode){ closed=true; ov.parentNode.removeChild(ov); window.gamePaused=false; document.removeEventListener('pointerdown', close); } }
  setTimeout(close, 5000);
  document.addEventListener('pointerdown', close);
}
window.showNewEnemyPopup = showNewEnemyPopup;

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
    boss.img.style.width = Math.round(440*enemyMobileScale())+"px"; boss.img.style.height = Math.round(440*enemyMobileScale())+"px";
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
    boss.img.style.width = Math.round(300*enemyMobileScale())+"px"; boss.img.style.height = Math.round(300*enemyMobileScale())+"px";
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
    // V15.20 限时关按难度调整时间：躺平×1.5 / 普通×1 / 困难×0.75 / 噩梦×0.6（越难时间越短）
    const d0 = (window.gameSettings && window.gameSettings.diffMode) || 'normal';
    const tMult = { easy:1.5, normal:1, hard:0.75, nightmare:0.6 }[d0] || 1;
    const secs = Math.max(10, Math.round(((cfg.special && cfg.special.timer) || 60) * tMult));
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
  // V1.14 重置剧情后清除第16关绿勾：被打败/中途退出/重置剧情都不算通关
  if(window.accountCleared){ window.accountCleared[15] = false; }
  if(typeof saveGame==='function') saveGame();
  if(typeof renderLevelSelect==='function') renderLevelSelect(); // 立即刷新勾勾
  alert('第16关剧情已重置，进入第16关将重新体验完整剧情和宗主赐福（技能加强）！');
}
window.resetL15Story = resetL15Story;

// 敌人血量随关卡动态提升（角色升级攻击变高，怪物也要变厚保持平衡）
function enemyLevelHpScale(){
  return 1 + ((typeof currentLevel!=='undefined' ? currentLevel : 0)) * 0.03;
}
window.enemyLevelHpScale = enemyLevelHpScale;
// V1.8 手机端敌人整体缩小（主角小，敌人也要小）
function enemyMobileScale(){ return ('ontouchstart' in window || (navigator.maxTouchPoints||0) > 0) ? 0.62 : 1; }
window.enemyMobileScale = enemyMobileScale;
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
  var msE = enemyMobileScale(); // V1.8 手机端敌人调小
  if(ec.type === "elite"){ img.style.width = Math.round(210*msE)+"px"; img.style.height = Math.round(210*msE)+"px"; }
  else if(ec.type === "mouse"){ img.style.width = Math.round((ec.elite?160:110)*msE)+"px"; img.style.height = Math.round((ec.elite?160:110)*msE)+"px"; }
  else if(ec.type === "boom"){ img.style.width = Math.round((ec.elite?180:150)*msE)+"px"; img.style.height = Math.round((ec.elite?180:150)*msE)+"px"; }
  else { img.style.width = Math.round(160*msE)+"px"; img.style.height = Math.round(160*msE)+"px"; } // 普通奶蛙
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
  img.style.width = Math.round(150*enemyMobileScale())+'px'; img.style.height = Math.round(210*enemyMobileScale())+'px';
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
  if(typeof showInfiniteWaveLoad==='function') showInfiniteWaveLoad(function(){ startInfiniteWave(); });
  else startInfiniteWave();
  if(window.updateV13UI) window.updateV13UI();
  startUpdateLoop();
}
window.enterInfiniteMode = enterInfiniteMode;

// V1.14 无限模式波次加载进度条（与冒险模式一致）：每波开怪前预载素材+小提示，杜绝"怪没刷出来/贴图空白"
var INFINITE_LOAD_TIPS=[
  '波次会越来越密，怪物也会越来越强，记得随时升级技能！',
  '第10/20/30/40波打完会出现中转站，可三选一增益。',
  '第15波起怪物会增强，准备好再冲下一波。',
  '精英奶蛙的黄色冲击波会持续掉血，别站着挨打。',
  '奶鼠冲刺时会穿过障碍物，跳起来躲更安全。',
  '爆裂奶蛙死后会爆炸，看到它变白赶紧拉开距离！',
  '金币永久保留，退出无限模式也不丢进度。',
  '大招每波之间会重新冷却，留着打精英怪更划算。',
  '天赋树点「疾风」能减少所有技能的冷却时间。',
  '战斗前喝护盾药，护盾会显示在左上角。',
  '打碎木箱可能掉落金币和道具，别放过。',
  '奶蛙的子弹跳起来或右键闪避都能躲开。',
  '第50波是最终Boss，记得留好大招和护盾药！',
  '难度越高金币越多（噩梦3倍），但怪也更凶。'
];
function showInfiniteWaveLoad(done){
  var wave = window.infiniteWave || 1;
  var ov = document.getElementById('levelLoadOv');
  if(!ov){ ov=document.createElement('div'); ov.id='levelLoadOv'; ov.innerHTML='<div class="lloBox"><div class="lloTitle">♾️ 无限模式</div><div class="lloBar"><div class="lloFill"></div></div><div class="lloText"></div><div class="lloTip">💡 小提示：</div></div>'; document.body.appendChild(ov); }
  ov.style.display='flex';
  var fill=ov.querySelector('.lloFill'), txt=ov.querySelector('.lloText');
  var tipEl=ov.querySelector('.lloTip'), titleEl=ov.querySelector('.lloTitle');
  if(titleEl) titleEl.textContent='♾️ 无限模式 · 第'+wave+'波';
  if(tipEl){
    var tidx=((wave-1)%INFINITE_LOAD_TIPS.length+INFINITE_LOAD_TIPS.length)%INFINITE_LOAD_TIPS.length;
    tipEl.textContent='💡 '+INFINITE_LOAD_TIPS[tidx];
  }
  // 无限模式通用素材（浏览器缓存命中即秒加载，不卡顿）
  var assets=['assets/enemies/milk_frog/sprites/Walker01.png','assets/enemies/milk_frog/sprites/Walker02.png','assets/enemies/milk_frog/sprites/Walker03.png','assets/enemies/milk_frog/sprites/Walker04.png','assets/enemies/milk_frog/sprites/Attack.png','assets/enemies/milk_frog/sprites/Hurt.png','assets/enemies/milk_frog/sprites/Alert.png','assets/enemies/milk_frog/sprites/Dead.png','assets/enemies/milk_mouse/sprites/mouse_idle.png','assets/enemies/milk_mouse/sprites/mouse_crouch.png','assets/enemies/milk_mouse/sprites/mouse_dead.png','assets/enemies/boom_frog/boom_frog.png','assets/ui/bg_scene.png','assets/players/miaocuijiao_cat/skills/Q/cat_bullet.png','assets/players/miaocuijiao_cat/skills/R_rocket_rain/explosion_cat_rocket.png','assets/players/miaocuijiao_cat/sprites/miaocat_idle.png','assets/players/daodungou/sprites/daodungou_idle.png'];
  if(wave>=50){ assets=assets.concat(['assets/enemies/boss/boss1.png','assets/enemies/boss/annihilation.png','assets/enemies/boss/dark_breath.png','assets/enemies/boss/quake_wave.png','assets/ui/bg_boss1.png']); }
  var total=assets.length, loaded=0, started=Date.now();
  function upd(){ var p=Math.min(100,Math.round(loaded/total*100)); if(fill)fill.style.width=p+'%'; if(txt)txt.textContent='加载 '+p+'%…'; }
  function one(){ loaded++; upd(); }
  function finish(){ ov.style.display='none'; done(); }
  function tryDone(){
    // 等素材真正加载完（30秒兜底防网络卡死），最短展示600ms保证进度条+小提示稳定可见
    if((loaded>=total || Date.now()-started>30000) && Date.now()-started>600){ finish(); }
    else { setTimeout(tryDone, 60); }
  }
  for(var i=0;i<assets.length;i++){ (function(s){
    try{
      var im=new Image();
      if(im.complete && im.naturalWidth>0){ one(); return; }
      im.onload=one; im.onerror=one; im.src=s;
    }catch(e){ one(); }
  })(assets[i]); }
  upd(); tryDone();
}
window.showInfiniteWaveLoad = showInfiniteWaveLoad;
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
  setTimeout(()=>{
    if(window.infiniteMode && !window.waitingBoostClose && !window.waitingCheckpoint){
      if(typeof showInfiniteWaveLoad==='function') showInfiniteWaveLoad(function(){ startInfiniteWave(); });
      else startInfiniteWave();
    }
  }, 1400);
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
    // V15.20 E/Q解锁提示已改到进入关卡时弹出（此处不再重复弹窗，仅兜底标记）
    if((currentLevel+1) === 5 && !window.accountEUnlocked){ window.accountEUnlocked = true; }
    if((currentLevel+1) === 10 && !window.accountQUnlocked){ window.accountQUnlocked = true; window.accountTrainingUnlocked = true; }
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
  if(e.state !== 'HURT'){ e.state="HURT"; e.stunned=true; if(e.img) e.img.src = enemyImgSrc(e,'hurt'); }
  // 奶蛙受击叫声同样受「奶蛙笑声」开关控制：关闭后奶蛙不再发出任何叫声（攻击/受击都不叫）
  const laughOn = !window.gameSettings || window.gameSettings.frogLaugh !== false;
  if(hurtSound && !hurtSoundCooldown && laughOn){
    hurtSoundCooldown=true;
    hurtSound.currentTime=0;
    hurtSound.play().catch(()=>{});
    setTimeout(()=>{ hurtSoundCooldown=false; },900);
  }
  // V15.20 受击恢复：不因连续受击反复重置，保证500ms后一定能切回正常贴图
  if(!e.hurtTimer){
    e.hurtTimer = setTimeout(()=>{
      e.hurtTimer=null;
      if(!e.dead){
        e.stunned=false;
        e.state="RECOVER";
        if(e.img) e.img.src = enemyImgSrc(e,'walk');
      }
    }, CONFIG.HURT_TIME);
  }
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
  // V1.1 性能优化：每个敌人最多每50ms更新一次（减少布局计算）
  const now = Date.now();
  if(now - (e._fehLast||0) < 50) return;
  e._fehLast = now;
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
  const _wS = enemyMobileScale(); // V1.11 奶蛙冲击波随奶蛙缩小并降低弹道高度
  let waveY = Math.round(190 * _wS) + eH;
  const waveTargetY = Math.round(190 * _wS) + pG;
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
    const _wIn = Math.max(2, Math.round(waveRect.width*0.19));
    const hit = {
      left: waveRect.left+_wIn, right: waveRect.right-_wIn,
      top: waveRect.top+_wIn, bottom: waveRect.bottom-_wIn
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
      // V1.10 推出方向优先选屏幕内一侧：手机窄屏下右侧空间不足时推回左侧，避免被推出屏外
      const wantLeft = (e.x < s.x);
      const leftX = sL - ew*0.35, rightX = sR + ew*0.35;
      const leftFits = leftX >= 0, rightFits = rightX <= window.innerWidth - ew;
      if(wantLeft ? (leftFits || !rightFits) : (!rightFits && leftFits)){
        e.x = leftX;
      } else {
        e.x = rightX;
      }
    }
  }
  // V1.10 推出障碍后再次夹紧到屏幕内：防止被建筑推出屏幕外（手机端“东西看不见”）
  if(e.x > window.innerWidth - ew) e.x = Math.max(0, window.innerWidth - ew);
  if(e.x < 0) e.x = 0;
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
    // V1.10 塔上守卫也夹紧到屏幕内（手机窄屏下哨塔靠右时守卫不会出屏）
    const tgw = e.img ? e.img.clientWidth : 120;
    if(e.x > window.innerWidth - tgw) e.x = Math.max(0, window.innerWidth - tgw);
    if(e.x < 0) e.x = 0;
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
// V15.20 每关加载：进关卡前先等本关资源就绪（带进度条），杜绝进关卡瞬间卡顿导致子弹/贴图异常
function levelLoadAssets(idx){
  // V1.13 补全素材：普攻子弹/Q火箭/双角色精灵/刀盾狗技能图，进关即就绪
  var a=['assets/enemies/milk_frog/sprites/Walker01.png','assets/enemies/milk_frog/sprites/Walker02.png','assets/enemies/milk_frog/sprites/Walker03.png','assets/enemies/milk_frog/sprites/Walker04.png','assets/enemies/milk_frog/sprites/Attack.png','assets/enemies/milk_frog/sprites/Hurt.png','assets/enemies/milk_frog/sprites/Alert.png','assets/enemies/milk_frog/sprites/Dead.png','assets/enemies/milk_mouse/sprites/mouse_idle.png','assets/enemies/milk_mouse/sprites/mouse_crouch.png','assets/enemies/milk_mouse/sprites/mouse_dead.png','assets/enemies/boom_frog/boom_frog.png','assets/ui/bg_scene.png','assets/players/miaocuijiao_cat/skills/Q/cat_bullet.png','assets/players/miaocuijiao_cat/skills/R_rocket_rain/explosion_cat_rocket.png','assets/players/miaocuijiao_cat/sprites/miaocat_idle.png','assets/players/miaocuijiao_cat/sprites/miaocat_run_right.png','assets/players/miaocuijiao_cat/sprites/miaocat_run_left.png','assets/players/miaocuijiao_cat/sprites/miaocat_jump.png','assets/players/miaocuijiao_cat/sprites/miaocat_one.png','assets/players/daodungou/sprites/daodungou_idle.png','assets/players/daodungou/skills/blade/dog_blade.png','assets/players/daodungou/skills/R_tornado/tornado.png','assets/players/daodungou/skills/shield/shield_effect.png'];
  if((idx+1)===16){ a=a.concat(['assets/enemies/boss/boss1.png','assets/enemies/boss/annihilation.png','assets/enemies/boss/dark_breath.png','assets/enemies/boss/quake_wave.png','assets/ui/bg_boss1.png','assets/ui/teacher.png','assets/players/miaocuijiao_cat/skills/R_rocket_rain/warning_circle.png','assets/players/miaocuijiao_cat/skills/R_rocket_rain/rocket.png','assets/players/miaocuijiao_cat/skills/R_rocket_rain/explosion_smoke.png']); } // V1.3 含剧情老师图 + R大招红圈/火箭图
  return a;
}
// V1.13 每关加载小提示：轮换展示（可重复，但不连续相同），来自图鉴/玩法小窍门
var LEVEL_LOAD_TIPS=[
  '奶蛙发射子弹时，跳跃或右键闪避都能躲开！',
  '靠近奶蛙会触发它快速反击，保持距离再输出更安全。',
  '按空格可以二段跳，跳得更高躲开地上的冲击波。',
  '右键闪避有 3 秒冷却，能直接穿过敌人的弹幕。',
  '打碎木箱会掉落金币和道具，别放过路上的箱子。',
  '精英奶蛙的黄色冲击波会持续掉血，别站在里面。',
  '奶鼠冲刺时会穿过障碍物，注意跳起来躲开。',
  '爆裂奶蛙死后会爆炸，看到它变白赶紧拉开距离！',
  '站在哨塔顶上，地面的普通奶蛙打不到你。',
  '战斗前在商店喝护盾药，护盾会显示在左上角。',
  '天赋树点「疾风」能减少所有技能的冷却时间。',
  '技能升级到 5 级会解锁额外强化效果，优先投资主力技能。',
  '大招在非 Boss 关一进场就开始冷却，别浪费在清小怪上。',
  '困难模式每通关 2 关获得 1 个天赋点。',
  '图鉴里记录了每个敌人的弱点和应对方法，遇到新敌人先看看。',
  '第16关 Boss 放大招时会时停 2 秒，按闪避就能完全躲开！'
];
function showLevelLoad(idx, done){
  var ov=document.getElementById('levelLoadOv');
  if(!ov){ ov=document.createElement('div'); ov.id='levelLoadOv'; ov.innerHTML='<div class="lloBox"><div class="lloTitle">🎮 加载关卡中…</div><div class="lloBar"><div class="lloFill"></div></div><div class="lloText"></div><div class="lloTip">💡 小提示：</div></div>'; document.body.appendChild(ov); }
  ov.style.display='flex';
  var fill=ov.querySelector('.lloFill'), txt=ov.querySelector('.lloText');
  // V1.13 每关显示不同小提示（按关卡轮换）
  var tipEl=ov.querySelector('.lloTip');
  if(tipEl){
    var tipIdx=((idx % LEVEL_LOAD_TIPS.length)+LEVEL_LOAD_TIPS.length)%LEVEL_LOAD_TIPS.length;
    tipEl.textContent='💡 '+LEVEL_LOAD_TIPS[tipIdx];
  }
  var titleEl=ov.querySelector('.lloTitle');
  if(titleEl && typeof LEVELS!=='undefined' && LEVELS[idx]) titleEl.textContent='🎮 '+LEVELS[idx].name;
  var assets=levelLoadAssets(idx), total=assets.length, loaded=0, started=Date.now();
  function upd(){ var p=Math.min(100,Math.round(loaded/total*100)); if(fill)fill.style.width=p+'%'; if(txt)txt.textContent='加载 '+p+'%…'; }
  function one(){ loaded++; upd(); }
  function tryDone(){
    // V1.13 等所有素材真正加载完成再进关（杜绝进关后图片还是空白）；仅 30 秒兜底防网络卡死
    if(loaded>=total || Date.now()-started>30000){ ov.style.display='none'; done(); }
    else { setTimeout(tryDone, 60); }
  }
  for(var i=0;i<assets.length;i++){ (function(s){
    try{
      var im=new Image();
      if(im.complete && im.naturalWidth>0){ one(); return; }
      im.onload=one; im.onerror=one; im.src=s;
    }catch(e){ one(); }
  })(assets[i]); }
  // V1.2 Boss关预载战斗音乐，避免战斗中BGM突然加载卡顿
  if((idx+1)===16){
    var bossAuds=['assets/audio/boss/boss_battle.mp3','assets/audio/boss/boss_bgm.mp3','assets/audio/boss/boss1_quake.mp3'];
    for(var b=0;b<bossAuds.length;b++){ try{ var ba=new Audio(bossAuds[b]); ba.preload='auto'; ba.load(); }catch(e){} }
  }
  upd(); tryDone();
}
window.showLevelLoad = showLevelLoad;

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
  // V15.20 每关加载：先等本关资源就绪（进度条），再开始打
  showLevelLoad(idx, function(){
    startLevel(idx);
    // V1.1 新敌人登场弹窗：首次遇到该关的新敌人时展示
    {
      const nk = (typeof LEVEL_NEW_ENEMIES!=='undefined') ? LEVEL_NEW_ENEMIES[(idx+1)] : null;
      if(nk){
        const seen = window.accountSeenEnemies || (window.accountSeenEnemies=[]);
        if(seen.indexOf(nk)===-1){
          seen.push(nk);
          if(typeof saveGame==='function') saveGame();
          setTimeout(function(){ if(typeof showNewEnemyPopup==='function') showNewEnemyPopup(nk); }, 400);
        }
      }
    }
    // V15.20 技能解锁提示：首次进入该关（技能首次可用）就提示，而不是通关后才提示
    if(!window.infiniteMode && !window.trainingMode){
      if(!window.accountEUnlocked && (idx+1)===5){
        window.accountEUnlocked = true;
        setTimeout(function(){ if(typeof showSkillUnlockPopup==='function') showSkillUnlockPopup('E 技能 · '+(activeCharacter==='daodungou'?'举盾护盾':'妙脆角回血')); }, 600);
      }
      if(!window.accountQUnlocked && (idx+1)===10){
        window.accountQUnlocked = true;
        window.accountTrainingUnlocked = true;
        setTimeout(function(){ if(typeof showSkillUnlockPopup==='function') showSkillUnlockPopup('Q 技能 · 爆炸火箭（训练营已解锁！）'); }, 600);
      }
    }
    syncPlayerHpBox();
    if(window.updateV13UI) window.updateV13UI();
    // 战斗状态背景音乐开关 + 第15关Boss战BGM（startLevel 后 currentLevel 已更新）
    if(typeof applyLevelBGM==='function'){ applyLevelBGM(); }
    else if(typeof startBGM==='function'){ startBGM(); }
    startUpdateLoop();
  });
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
  // V1.4 第16关高难度警告（优先级最高，先弹警告，玩家确认后再进选角；进入关卡后Boss介绍弹窗自然跟随）
  if(idx===15){
    showHardLevelWarning(idx);
    return;
  }
  // 新流程：点击关卡后进入选角色界面，选好后开始本关
  window.pendingLevel = idx;
  showCharacterSelect('第' + (idx+1) + '关');
}
function showHardLevelWarning(idx){
  const old=document.getElementById('hardLevelWarn'); if(old) old.remove();
  const ov=document.createElement('div');
  ov.id='hardLevelWarn'; ov.className='hardLevelWarn';
  ov.innerHTML='<div class="hlwCard"><div class="hlwTitle">⚠️ 高难度关卡</div>'+
    '<div class="hlwText">第16关是 <b>Boss关</b>，难度很高！<br>建议先把角色的<b>面板数值</b>提升高一些（生命/攻击/天赋/技能升级），再来挑战。</div>'+
    '<div class="hlwBtns"><button class="hlwGo" onclick="confirmHardLevel('+idx+')">💪 我准备好了，继续挑战</button>'+
    '<button class="hlwBack" onclick="closeHardLevelWarn()">◀ 先回去升级</button></div></div>';
  document.body.appendChild(ov);
}
function confirmHardLevel(idx){
  const el=document.getElementById('hardLevelWarn'); if(el) el.remove();
  window.pendingLevel = idx;
  showCharacterSelect('第' + (idx+1) + '关');
}
function closeHardLevelWarn(){
  const el=document.getElementById('hardLevelWarn'); if(el) el.remove();
}
window.confirmHardLevel = confirmHardLevel;
window.closeHardLevelWarn = closeHardLevelWarn;
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
    // V1.4 第16关打勾以"真正通关"为准：失败/中途退出不算完成（不再用看过剧情判断）
    const cleared = isBossLv
      ? (window.selectMode==='hard' ? false : !!(window.accountCleared && window.accountCleared[i-1]))
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
    // V1.17 第16关（Boss关）失败：弹出怒岚专属攻略，教玩家怎么打
    let failAdvice = '<div class="failAdvice">💡 建议：先回主界面升级角色/技能，或去商店购买物资；如果金币不够，可以去「无限模式」攒金币（失败/退出金币都保留）。觉得太难可以在设置里调成「躺平」模式。</div>';
    if((currentLevel+1)===16){
      failAdvice = '<div class="failAdvice bossAdvice"><b>🗡️ 怒岚·Boss 攻略：</b><br>' +
        '① <b>大招必躲</b>：怒岚放大招时会<b>时停 2 秒</b>，这 2 秒内按「闪避」（右键/冲刺键）就完全不会受伤！没按或闪避在冷却就会吃到大招伤害。<br>' +
        '② <b>护盾会吃亏</b>：Boss 对护盾造成 <b>额外 50% 伤害</b>，别把护盾当万能，关键时刻优先闪避。<br>' +
        '③ <b>它的小招</b>：注意躲开地面冲击波和落弹，跳跃或闪避都能躲。<br>' +
        '④ <b>打之前准备</b>：去「⭐ 主角」升级血量/攻击、升级技能、买护盾药和回血药，再回来挑战。<br>' +
        '⑤ 通关过以后重玩，Boss 会被削弱（普通 3600 血 / 困难 6000 血），大招间隔也更长（60 秒），会好打很多。</div>';
    }
    box.innerHTML='你失败了<br><span>GAME OVER</span><br>' + failAdvice +
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
const BULLET_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAgAElEQVR4nOzd349d13Un+O9ae59z7s/6XcVfEklR/iUx/pFEQWaSRrfdaKCBAAYGA1BAgEEDATwzb5k/gfY/kAcP8qCkHxpBgADUmxNMT4AG7Aww05PAQQYZK05sTyxZokSKoVgsVt17fuy11jzsc27doqR04nYikVof4aJYVWTVueeWaq+991prA84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOOeec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"; // V1.15 内嵌base64：线上第一枪也有真图，不再受网络加载影响
const BULLET_SPEED = 4.2; // V1.11 子弹速度加快（手机端更好命中）
// V1.11 手机端子弹/火箭随主角同比例缩小（主角 100->64）：尺寸、发射点、碰撞箱统一缩放
function bulletMobileScale(){ return ('ontouchstart' in window || (navigator.maxTouchPoints||0) > 0) ? 0.64 : 1; }
window.bulletMobileScale = bulletMobileScale;
// 手机端发射点更低（主角变小后上抬量按比例缩小，避免子弹悬空打不到敌人）
function muzzleYOffset(){ return Math.round(20 * bulletMobileScale()); }
// V1.12 手机端跳跃力度缩放：主角变小后跳太高会出屏幕，一段跳约94px（能躲奶蛙波），二段约188px
function jumpMobileScale(){ return ('ontouchstart' in window || (navigator.maxTouchPoints||0) > 0) ? 0.72 : 1; }
window.jumpMobileScale = jumpMobileScale;
function bulletSize(){ return Math.round(72 * bulletMobileScale()); }
function qRocketW(){ return Math.round(110 * bulletMobileScale()); }
function qRocketH(){ return Math.round(80 * bulletMobileScale()); }
window.bulletSize = bulletSize; window.qRocketW = qRocketW; window.qRocketH = qRocketH;
const BULLET_DAMAGE = 25;
const SHOOT_COOLDOWN = 2000;
let canShoot = true;
let shootCooldownLeft = 0;
window.shootCooldownLeft = 0;
let catBullets = [];

// V1.5 Q技能 爆炸火箭
const Q_ROCKET_IMAGE = "data:image/png;base64,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"; // V1.15 内嵌base64：Q火箭第一发也有真图
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

    // V15.20 E回血随技能升级：基础10 + 每级+10，10级效果大增
    const healLv = (inventory.skillLevels && inventory.skillLevels.heal) || 0;
    const healAmt = 10 + healLv * 10 + (healLv >= 10 ? 30 : 0);
    playerHp = Math.min(playerMaxHp, playerHp + healAmt);
    window.playerHp=playerHp;
    updatePlayerHP();
    showHealText(healAmt, enemyObj);

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
    qRockets.push({ x: getMuzzleX(face, qRocketW()), y: getMuzzleY(), dir: face, dead:false, explode:false, born: performance.now() });
    setTimeout(()=>{qReady=true;},qc);
}

function updateQRockets(){
 const gameEl = document.getElementById('game');
 const gr = gameEl ? gameEl.getBoundingClientRect() : { left:0, top:0, height: window.innerHeight };
 qRockets.forEach(r=>{
   r.x += r.dir*4.6; // V1.11 Q火箭速度加快

   // V1.5.2 Q火箭碰撞修复：
   // 火箭本体使用小碰撞箱，不再使用大范围X轴判断
   const _qw=qRocketW(), _qh=qRocketH();
   const rScreenLeft = gr.left + r.x;
   const rScreenTop = gr.top + gr.height - r.y - _qh;
   const rocketHitbox = {
      left: rScreenLeft + Math.round(_qw*0.16),
      right: rScreenLeft + Math.round(_qw*0.5),
      top: rScreenTop + Math.round(_qh*0.225),
      bottom: rScreenTop + Math.round(_qh*0.69)
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
      const rocketCenterX = rScreenLeft + Math.round(qRocketW()*0.32);

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

// V15.19 无缝首帧保障：从猫当前实际渲染位置算出发射点（与飞行起点完全一致，杜绝卡顿时首帧被跳过/偏移）
function youngMuzzle(dir, w, fx, fy){
  try{
    const pr = playerImg && playerImg.getBoundingClientRect ? playerImg.getBoundingClientRect() : null;
    const grEl = document.getElementById('game');
    const gr = grEl ? grEl.getBoundingClientRect() : null;
    if(pr && gr && pr.width && pr.height){
      const inset = Math.min(24, Math.round(w*0.3));
      const pw = pr.width;
      const gameX = (dir > 0 ? (pr.right - inset) : (pr.left - (w - inset))) - gr.left;
      const gameY = (gr.top + gr.height - pr.bottom) + muzzleYOffset(); // 与 getMuzzleY 完全一致
      return { x: gameX, y: gameY };
    }
  }catch(e){}
  return { x: fx, y: fy };
}

// V15.19 子弹/火箭元素复用池：减少每帧创建/销毁 DOM 造成的卡顿
let _qPool = [];
function drawQRockets(){
 const gameEl = document.getElementById('game') || document.body;
 const n = qRockets.length;
 while (_qPool.length < n) { const img=document.createElement('img'); img.className='qRocket'; img.style.position='absolute'; img.style.width=qRocketW()+'px'; img.style.height=qRocketH()+'px'; gameEl.appendChild(img); _qPool.push(img); }
 for(let i=0;i<n;i++){
   const r = qRockets[i];
   let dx=r.x, dy=r.y;
   // 无缝首帧保障：刚出生(约80ms内)强制从猫当前实际位置画出（与飞行起点同一坐标，看不出粘身）
   if(performance.now() - (r.born||0) < 120){ const p=youngMuzzle(r.dir, qRocketW(), dx, dy); dx=p.x; dy=p.y; }
   const img=_qPool[i];
  img.src = qRocketImgSrc(); // V1.1 修复：给火箭设置贴图（否则图标不显示）
  img.style.background = (img.src && img.src.indexOf('data:') === 0) ? '' : 'none'; // V1.14 真图加载好后去掉橙色兜底
   img.style.left=dx+'px';
   img.style.bottom=dy+'px';
   img.style.transform='scaleX('+(r.dir>0?1:-1)+')';
   if(img.parentNode!==gameEl) gameEl.appendChild(img);
 }
 while (_qPool.length > n) { const img=_qPool.pop(); if(img.parentNode) img.parentNode.removeChild(img); }
}

// V15.18 子弹/火箭发射点：与玩家同一坐标系（#game 内绝对定位），从猫的身体旁边打出
// 玩家渲染: left=enemy.x, bottom=100-playerY → 子弹/火箭也用相同基准，杜绝任何坐标偏移
function getMuzzleX(face, w){
  const inset = Math.min(24, Math.round(w*0.3));
  // 用玩家实际渲染宽度（手机端人物缩小后也能从猫身边打出）
  const pw = (playerImg && playerImg.clientWidth) || 100;
  return enemy.x + (face > 0 ? (pw - inset) : -(w - inset));
}
function getMuzzleY(){
  return (100 - playerY) + muzzleYOffset();
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

    catBullets.push({ x: getMuzzleX(playerFace, bulletSize()), y: getMuzzleY(), dir: playerFace, dead:false, born: performance.now() });

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
      // V15.19 手机控制区整体视为控件：任何点触手机按钮的鼠标事件都不触发攻击（杜绝双发）
      const inMobile = !!(t && t.closest && t.closest('#mobileControls'));
      if(onForm || inMobile){ return; }
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
    // V1.12 突进距离按屏幕宽度比例：一段≈1/4屏（手机390→98px，桌面1280→320不变），两段≈半屏
    const stageDist = Math.round(window.innerWidth * (isCat ? 0.25 : 0.17));
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
        const _bsz = bulletSize();
        const bScreenTop = gr.top + gr.height - b.y - _bsz;
        const hitbox = {
            left: bScreenLeft + Math.round(_bsz*0.17),
            right: bScreenLeft + Math.round(_bsz*0.61),
            top: bScreenTop + Math.round(_bsz*0.17),
            bottom: bScreenTop + Math.round(_bsz*0.61)
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

let _bPool = [];
function drawBullets(){
    drawQRockets();
    const gameEl = document.getElementById('game') || document.body;
    const n = catBullets.length;
    while (_bPool.length < n) { const img=document.createElement("img"); img.className="catBullet"; img.style.position="absolute"; img.style.width=bulletSize()+"px"; img.style.height=bulletSize()+"px"; gameEl.appendChild(img); _bPool.push(img); }
    for(let i=0;i<n;i++){
        const b = catBullets[i];
        let dx=b.x, dy=b.y;
        // 无缝首帧保障：刚出生(约80ms内)强制从猫当前实际位置画出（与飞行起点同一坐标，看不出粘身）
        if(performance.now() - (b.born||0) < 120){ const p=youngMuzzle(b.dir, bulletSize(), dx, dy); dx=p.x; dy=p.y; }
        const img=_bPool[i];
        img.src=bulletImgSrc();
        img.style.background = (img.src && img.src.indexOf('data:') === 0) ? '' : 'none'; // V1.14 真图加载好后去掉橙色兜底
        img.style.left=dx+"px";
        img.style.bottom=dy+"px";
        img.style.transform = "scaleX(" + (b.dir>0?1:-1) + ")";
        if(img.parentNode!==gameEl) gameEl.appendChild(img);
    }
    while (_bPool.length > n) { const img=_bPool.pop(); if(img.parentNode) img.parentNode.removeChild(img); }
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
        playerVelocityY = -Math.round(currentJumpPower * (typeof jumpMobileScale==='function' ? jumpMobileScale() : 1));
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
    // V1.1 性能优化：最多每40ms更新一次（减少getBoundingClientRect布局计算，画面几乎无感）
    const now = Date.now();
    if(now - (window._fphLast||0) < 40) return;
    window._fphLast = now;
    const rect=enemyObj.getBoundingClientRect();
    hpBox.style.left=(rect.left+rect.width/2-50)+"px";
    hpBox.style.top=(rect.top-55)+"px";
    hpBox.style.position="fixed";
}


// =====================
// V1.10 手机端视口自适应：旋转 / 全屏 / 地址栏收起时重新夹紧所有实体，避免“看不见/跑到屏幕外”
// =====================
function reflowGameViewport(){
  var w = window.innerWidth || document.documentElement.clientWidth || 390;
  var h = window.innerHeight || document.documentElement.clientHeight || 844;
  WORLD_RIGHT = Math.max(200, w - 80);
  // 主角
  if(typeof enemy !== 'undefined' && enemy){
    if(enemy.x > WORLD_RIGHT) enemy.x = WORLD_RIGHT;
    if(enemy.x < WORLD_LEFT) enemy.x = WORLD_LEFT;
    if(typeof enemyObj !== 'undefined' && enemyObj) enemyObj.style.left = enemy.x + "px";
  }
  // 所有敌人
  if(typeof enemies !== 'undefined' && Array.isArray(enemies)){
    for(var i=0;i<enemies.length;i++){
      var e = enemies[i];
      if(!e) continue;
      var ew = (e.img && e.img.clientWidth) ? e.img.clientWidth : 100;
      if(e.x > w - ew) e.x = Math.max(0, w - ew);
      if(e.x < 0) e.x = 0;
      if(e.img) e.img.style.left = e.x + "px";
    }
  }
  // 障碍物（箱子/哨塔/建筑）：按比例重排，避免被切出屏幕
  if(typeof solidObjects !== 'undefined' && Array.isArray(solidObjects)){
    for(var j=0;j<solidObjects.length;j++){
      var s = solidObjects[j];
      if(!s || !s.el) continue;
      var half = s.w/2;
      var maxX = w - half;
      if(s.x > maxX) s.x = Math.max(half, maxX);
      if(s.x < half) s.x = half;
      s.el.style.left = (s.x - half) + "px";
    }
  }
  // R 大招目标点（红圈）
  if(window.RRocketRain && window.RRocketRain.targetX !== undefined){
    window.RRocketRain.targetX = Math.max(100, Math.min(w-100, window.RRocketRain.targetX));
    if(window.RRocketRain.updateWarning) window.RRocketRain.updateWarning();
  }
  // 战斗提示横幅等绝对定位元素保持在屏内
  var b = document.getElementById('levelBanner');
  if(b){ b.style.left = "50%"; b.style.transform = "translateX(-50%)"; }
}
window.reflowGameViewport = reflowGameViewport;
// V1.10 视口变化（含手机全屏）时自动重排；用 setTimeout 等浏览器完成布局切换
function _reflowDebounced(){ setTimeout(function(){ try{ reflowGameViewport(); }catch(e){} }, 60); }
if(typeof window.addEventListener==='function'){
  window.addEventListener('resize', _reflowDebounced);
  window.addEventListener('orientationchange', _reflowDebounced);
  window.addEventListener('fullscreenchange', _reflowDebounced);
  if(window.visualViewport && window.visualViewport.addEventListener){
    try{ window.visualViewport.addEventListener('resize', _reflowDebounced); }catch(e){}
  }
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

    // 信息面板（调试用，隐藏时不更新，避免每帧innerHTML开销）
    if(info && info.style.display !== 'none'){
      let alive = 0; for(let _i=0;_i<enemies.length;_i++){ if(!enemies[_i].dead) alive++; }
      info.innerHTML = "关卡: 第"+(currentLevel+1)+"关" +
        "<br>敌人剩余: " + alive +
        (frog ? "<br>最近HP: " + Math.max(0,Math.round(frog.hp)) : "");
    }

    syncPlayerHpBox();
    uiTick();
    requestAnimationFrame(update);
}

// V5.5 序章初始化
initPrologue();
