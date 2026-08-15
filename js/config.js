// MilkFrog V8.6 AI configuration
const CONFIG={
 DETECT_RANGE:900,
 KEEP_DISTANCE:500,
 SPEED:0.7,
 NOTICE_TIME:800,
 ALERT_TIME:1200,
 RECOVER_TIME:800,
 WAVE_SPEED:0.8,
 WAVE_HEIGHT:0,
 DAMAGE:5,
 COOLDOWN_TIME:5500,
 FROG_HP:1000,
 HURT_TIME:500
};

const AI_STATE={
 IDLE:"IDLE",
 NOTICE:"NOTICE",
 ALERT:"ALERT",
 CHASE:"CHASE",
 KEEP_DISTANCE:"KEEP_DISTANCE",
 ATTACK:"ATTACK",
 RECOVER:"RECOVER",
 HURT:"HURT",
 RETREAT:"RETREAT",
 ATTACK_CHARGE:"ATTACK_CHARGE",
 ATTACK_FIRE:"ATTACK_FIRE",
 DEAD:"DEAD"
};

// ===================== V7.9 音频设置（背景音乐 / 游戏音效音量） =====================
window.gameSettings = { bgm: 80, sfx: 80 };
try{
  const saved = JSON.parse(localStorage.getItem('milkfrog_settings')||'null');
  if(saved && typeof saved === 'object'){ window.gameSettings = Object.assign({ bgm:80, sfx:80 }, saved); }
}catch(e){}
window.sfxVol = Math.max(0, Math.min(1, (window.gameSettings.sfx||80)/100));
window.bgmVol = Math.max(0, Math.min(1, (window.gameSettings.bgm||80)/100));
window.applySettings = function(){
  window.sfxVol = Math.max(0, Math.min(1, (window.gameSettings.sfx||80)/100));
  window.bgmVol = Math.max(0, Math.min(1, (window.gameSettings.bgm||80)/100));
  const bgm = document.getElementById('bgmAudio');
  if(bgm){ bgm.volume = window.bgmVol; }
  ['attackSound','hurtSound','rocketExplosionSound'].forEach(function(id){ const el = document.getElementById(id); if(el){ el.volume = window.sfxVol; } });
  try{ localStorage.setItem('milkfrog_settings', JSON.stringify(window.gameSettings)); }catch(e){}
};
// ===================== V10.5 难度模式（躺平/普通/高手/噩梦） =====================
window.diffMode = 'normal'; window.diffHpMult = 1; window.diffDmgMult = 1; window.diffRewardMult = 1;
window.applyDiffMult = function(){
  const m = (window.gameSettings && window.gameSettings.diffMode) || 'normal';
  const map = {
    easy:      { hp: 0.5, dmg: 0.5, r: 0.5 },  // 躺平
    normal:    { hp: 1,   dmg: 1,   r: 1 },    // 普通
    hard:      { hp: 1.6, dmg: 1.5, r: 2 },    // 高手
    nightmare: { hp: 2.2, dmg: 2,   r: 3 }     // 噩梦
  };
  const c = map[m] || map.normal;
  window.diffMode = m; window.diffHpMult = c.hp; window.diffDmgMult = c.dmg; window.diffRewardMult = c.r;
};
window.applyDiffMult();