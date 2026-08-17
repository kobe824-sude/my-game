// =========================================================
// V5.1 刀盾狗 DaodungouDog 角色模块
// 定位：近战坦克 —— 近战挥砍 + 举盾格挡 + 旋风斩 + 龙卷风(大招)
// =========================================================
window.DOG = (function(){

  const CFG = {
    maxHp: 150,
    attack: 20,
    speed: 4,
    jumpPower: 16,
    gravity: 0.9,
    // 普攻：近战挥砍（必须朝向目标才命中，距离近）
    meleeDamage: 20,
    meleeRange: 210,
    meleeCooldown: 1000,
    // E：举盾格挡（光环不遮挡角色，持续5秒）
    shieldMax: 40,
    shieldDuration: 8000,
    shieldCooldown: 40000,
    // Q：旋风斩（三连刀光 + 闪光 + 屏震）
    slashDamage: 45,
    slashRange: 260,
    slashCooldown: 18000,
    // R：龙卷风（持续伤害 + 眩晕）
    tornadoDamage: [40, 35, 25],   // 第1/2/3 秒每秒伤害（总100）基础低伤，16关才高（×9）
    tornadoDuration: 3000,
    tornadoCooldown: 90000,
    tornadoSpeed: 4.5,
    tornadoRange: 220,
    tornadoPullRange: 350,   // 聚怪范围（适中，不超标）
    tornadoPullSpeed: 3,     // 聚怪拉扯速度
    tornadoImage: "assets/players/daodungou/skills/R_tornado/tornado.png",
    // 外观（正式贴图）
    idleImage: "assets/players/daodungou/sprites/daodungou_idle.png"
  };

  const state = {
    meleeReady: true, meleeCd: 0,
    shieldHp: 0, shieldActive: false, shieldReady: true, shieldCd: 0, shieldTimer: null,
    slashReady: true, slashCd: 0,
    tornadoReady: true, tornadoCd: 0, tornadoActive: false, tornado: null,
    tornadoTick: null, tornadoEnd: null, tornadoFx: null,
    slashEl: null, shieldEl: null
  };

  function playQDamage(){
    try{
      const a = new Audio("assets/audio/players/daodungou/q_damage.wav");
      a.volume = 0.9 * (window.sfxVol||1);
      a.play().catch(()=>{});
    }catch(e){}
  }
  function playSound(path, volume){
    try{
      const a = new Audio(path);
      a.volume = Math.max(0, Math.min(1, (volume||0.8) * (window.sfxVol||1)));
      a.play().catch(()=>{});
    }catch(e){}
  }

  // 基础攻击随角色等级提升（14 + 等级-1）
  function dogBaseAtk(){
    return 11 + ((typeof charLevel==='function' ? charLevel() : 1) - 1); // 刀盾狗普攻基础11，低于妙脆角猫13
  }

  function removeFx(){
    if(state.slashEl){ state.slashEl.remove(); state.slashEl=null; }
    if(state.shieldEl){ state.shieldEl.remove(); state.shieldEl=null; }
    if(state.tornadoFx){ state.tornadoFx.remove(); state.tornadoFx=null; }
  }

  function reset(){
    // 盾反新机制：10秒积攒 + 5秒缓冲
    window.dogShieldReflect = { accum: 0, phase: 'accum', phaseStart: Date.now(), readyDeadline: 0 };
    state.meleeReady=true; state.meleeCd=0;
    state.shieldHp=0; state.shieldActive=false; state.shieldReady=true; state.shieldCd=0;
    if(state.shieldTimer){ clearTimeout(state.shieldTimer); state.shieldTimer=null; }
    state.slashReady=true; state.slashCd=0;
    state.tornadoReady=true; state.tornadoCd=0; state.tornadoActive=false; state.tornado=null;
    if(state.tornadoTick){ clearInterval(state.tornadoTick); state.tornadoTick=null; }
    if(state.tornadoEnd){ clearTimeout(state.tornadoEnd); state.tornadoEnd=null; }
    if(typeof frog!=='undefined' && frog) frog.tornadoStun=false;
    window.dogMeleeCooldownLeft=0;
    window.dogShieldCooldownLeft=0;
    window.dogSlashCooldownLeft=0;
    window.dogTornadoCooldownLeft=0;
    removeFx();
    if(window.updateV13UI) window.updateV13UI();
  }

  // ---------- 盾反：10秒积攒期结束后的5秒缓冲期内，第一次攻击释放积攒值的50%（触发后重新开始10秒） ----------
  function getDogShieldReflectDamage(){
    if(!(window.inventory&&window.inventory.skillLevels&&window.inventory.skillLevels.shield>=5)) return 0;
    const r = window.dogShieldReflect;
    if(!r || r.phase !== 'ready') return 0;
    const d = Math.round((r.accum||0) * 0.5);
    r.accum = 0;
    r.phase = 'accum';
    r.phaseStart = Date.now();
    r.readyDeadline = 0;
    return d;
  }

  // ---------- 普攻：近战挥砍（朝向前方才命中） ----------
  function meleeAttack(){
    if(playerDead || (frog && frog.dead) || gameEnded || !state.meleeReady) return;
    state.meleeReady = false;
    state.meleeCd = CFG.meleeCooldown;
    window.dogMeleeCooldownLeft = state.meleeCd;
    const face = window.miaoCatFace || 1;
    const px = (typeof enemy!=='undefined') ? enemy.x : 200;
    if(typeof frog!=='undefined' && frog && !frog.dead){
      const dist = Math.abs(frog.x - px);
      // 必须朝向奶蛙那一侧才算命中（背对则砍空）；贴身/落点也在前方命中范围内，避免落地瞬间砍空
      const inFront = (face>0) ? (frog.x >= px - 20) : (frog.x <= px + 20);
      // 高度判定：塔上的敌人（站在高处）从地面打不到，只有打到同高度才行
      const vertOK = (typeof window.canHitEnemy==='function') ? window.canHitEnemy(frog) : true;
      if(dist <= CFG.meleeRange && inFront && vertOK){
        const reflectD = getDogShieldReflectDamage(); // 盾反：10秒积攒结束后的5秒缓冲期内，第一次攻击释放积攒值的50%
        // 跳起攻击：暴击概率翻倍
        const jumpMult = (typeof onGround!=='undefined' && !onGround) ? 2 : 1;
        if(typeof frogTakeDamage==='function') frogTakeDamage(doCrit(dogBaseAtk() + (typeof window.talentDmgBonus==='function'?window.talentDmgBonus():0) + 2*((window.inventory&&window.inventory.skillLevels&&window.inventory.skillLevels.atk)||0) + (window.playerAttackBuff||0) + reflectD, jumpMult));
      }
      if(typeof tryBreakBreakables==='function') tryBreakBreakables(dogBaseAtk(), px, CFG.meleeRange);
    }
    spawnMeleeSlash(px, face);
    playSound("assets/audio/players/miaocuijiao_cat/attack.wav", 0.7);
    // V1.0 冷却统一由 setInterval 递减到0置 ready（暂停时冻结）
  }

  // 刀光：刀气光柱，紧贴狗子前缘挥下（左右对称）
  function spawnMeleeSlash(px, face){
    if(state.slashEl){ state.slashEl.remove(); state.slashEl=null; }
    const game = document.getElementById('game');
    if(!game) return;
    const el = document.createElement('div');
    el.className = 'dogSlashMark';
    // 刀在右手：贴图内 x 比例 88.3%、y 比例 29.4%，按实际显示尺寸动态计算
    const pImg = document.getElementById('player');
    const sw = (pImg && pImg.clientWidth) ? pImg.clientWidth : 170;
    const swordX = Math.round(sw * (face>0 ? 0.883 : 0.117));
    const scale = sw / 1071;
    const dispH = 941 * scale;
    const offY = (pImg ? (pImg.clientHeight - dispH)/2 : 10);
    const swordY = 277 * scale + offY;
    const ih = pImg ? pImg.clientHeight : 170;
    el.style.left = (px + swordX - 50) + "px";
    el.style.top = "calc(100% - " + Math.round(80 + ih - swordY + 50) + "px)";
    el.style.transform = "scaleX(" + face + ") rotate(-75deg)";
    el.style.opacity = "0";
    game.appendChild(el);
    state.slashEl = el;
    requestAnimationFrame(()=>{
      el.style.transform = "scaleX(" + face + ") rotate(28deg)";
      el.style.opacity = "1";
    });
    setTimeout(()=>{ if(state.slashEl===el){ el.remove(); state.slashEl=null; } }, 200);
  }

  // ---------- E 技能：举盾格挡（护盾光环，不遮挡角色） ----------
  function useShield(){
    if(playerDead || gameEnded || !state.shieldReady) return; // V1.0 冷却好了就能按：护盾还在时也能刷新（修复"冷却好了按E没反应"）
    state.shieldReady = false;
    state.shieldCd = window.trainingMode ? 3000 : Math.round(CFG.shieldCooldown * (window.getCdFactor?window.getCdFactor():1)); // 训练营：冷却3秒
    window.dogShieldCooldownLeft = state.shieldCd;
    const wasActive = state.shieldActive;
    state.shieldActive = true;
    // 给玩家增加护盾值（护盾药也是加这个值）
    const maxShield = CFG.shieldMax + 5*((window.inventory&&window.inventory.skillLevels&&window.inventory.skillLevels.shield)||0);
    if(wasActive){
      // V1.0 护盾还在生效时重按：刷新到满值（不无限叠加），避免"冷却好了却按不出来"
      window.playerShield = Math.max(window.playerShield||0, maxShield);
    } else {
      // 在现有护盾上叠加（不会把高护盾顶掉）
      window.playerShield = (window.playerShield||0) + maxShield;
    }
    window.dogShieldAbsorbed = 0;
    if(window.dogShieldReflect){ window.dogShieldReflect.accum = 0; window.dogShieldReflect.phase = 'accum'; window.dogShieldReflect.phaseStart = Date.now(); window.dogShieldReflect.readyDeadline = 0; }
    playSound("assets/audio/players/miaocuijiao_cat/hurt.wav", 0.35);
    if(window.updateV13UI) window.updateV13UI();
    const sc = state.shieldCd;
    // V1.0 冷却统一由 setInterval 递减到0置 ready（暂停时冻结）；重按时重置护盾时长
    if(state.shieldTimer){ clearTimeout(state.shieldTimer); state.shieldTimer = null; }
    state.shieldTimer = setTimeout(()=>{ state.shieldActive = false; state.shieldTimer = null; }, CFG.shieldDuration + 1000*((window.inventory&&window.inventory.skillLevels&&window.inventory.skillLevels.shield)||0));
  }

  function ensureShieldFx(){
    const game = document.getElementById('game');
    if(!game || state.shieldEl) return;
    const el = document.createElement('div');
    el.className = 'dogShieldRing';
    game.appendChild(el);
    state.shieldEl = el;
  }

  // 返回 true 表示护盾吸收了这次伤害
  function absorbDamage(dmg){
    if(!state.shieldActive || state.shieldHp <= 0) return false;
    state.shieldHp -= dmg;
    if(state.shieldHp < 0) state.shieldHp = 0;
    window.dogShieldHp = state.shieldHp;
    const target = document.getElementById('player');
    if(target){
      target.style.filter = "brightness(1.4) drop-shadow(0 0 6px #3fa9f5)";
      setTimeout(()=>{ if(target) target.style.filter=""; },120);
    }
    if(window.updateV13UI) window.updateV13UI();
    if(state.shieldHp <= 0){
      state.shieldActive = false;
      if(state.shieldTimer){ clearTimeout(state.shieldTimer); state.shieldTimer=null; }
    }
    return true;
  }

  // ---------- Q 技能：旋风斩（三连刀光） ----------
  function useSlash(){
    if(playerDead || (frog && frog.dead) || gameEnded || !state.slashReady) return;
    state.slashReady = false;
    state.slashCd = window.trainingMode ? 3000 : Math.round(CFG.slashCooldown * (window.getCdFactor?window.getCdFactor():1)); // 训练营：冷却3秒
    window.dogSlashCooldownLeft = state.slashCd;
    const face = window.miaoCatFace || 1;
    const px = (typeof enemy!=='undefined') ? enemy.x : 200;
    if(typeof frog!=='undefined' && frog && !frog.dead){
      const dist = Math.abs(frog.x - px);
      const vertOK = (typeof window.canHitEnemy==='function') ? window.canHitEnemy(frog) : true;
      if(dist <= CFG.slashRange && vertOK){
        const qSlash = doCrit((CFG.slashDamage + (window.playerAttackBuff||0)) * (1 + 0.05*((window.inventory&&window.inventory.skillLevels&&(window.inventory.skillLevels.skillQ||window.inventory.skillLevels.skill))||0)));
        if(typeof frogTakeDamage==='function') frogTakeDamage(qSlash);
        // 5级特殊：旋风斩范围群体
        if((window.inventory&&window.inventory.skillLevels&&(window.inventory.skillLevels.skillQ||window.inventory.skillLevels.skill)) >= 5 && typeof enemies!=='undefined'){
          for(const oe of enemies){ if(oe && !oe.dead && oe !== frog && Math.abs(oe.x - px) < CFG.slashRange+60){ damageEnemy(oe, qSlash); } }
        }
        playQDamage();
        if(typeof tryBreakBreakables==='function') tryBreakBreakables(CFG.slashDamage, px, CFG.slashRange);
        if(!frog.dead && frog.type !== 'dummy'){ // 稻草人不被击退
          frog.x += (frog.x > px ? 26 : -26);
          if(typeof clampWorld==='function') clampWorld(frog);
        }
      }
    }
    spawnQSlashFx(px, face);
    playSound("assets/audio/players/miaocuijiao_cat/attack.wav", 0.8);
    // V1.0 冷却统一由 setInterval 递减到0置 ready（暂停时冻结）
  }

  // Q 升级特效：三连扇形刀光 + 中心闪光 + 屏幕震动（紧贴狗子的刀，左右对称）
  function spawnQSlashFx(px, face){
    const game = document.getElementById('game');
    if(!game) return;
    // 和普攻刀光共用同一锚点：刀在右手/左手的位置
    const pImg = document.getElementById('player');
    const sw = (pImg && pImg.clientWidth) ? pImg.clientWidth : 170;
    const swordX = Math.round(sw * (face>0 ? 0.883 : 0.117));
    const scale = sw / 1071;
    const dispH = 941 * scale;
    const offY = (pImg ? (pImg.clientHeight - dispH)/2 : 10);
    const swordY = 277 * scale + offY;
    const ih = pImg ? pImg.clientHeight : 170;
    const anchor = px + swordX;
    const baseTop = Math.round(80 + ih - swordY + 130);
    for(let i=0;i<3;i++){
      const el = document.createElement('div');
      el.className = 'dogSlashFx big';
      el.style.left = (anchor - 130) + "px";
      el.style.top = "calc(100% - " + baseTop + "px)";
      el.style.transform = "scaleX(" + face + ") rotate(" + (-95 + i*40) + "deg)";
      el.style.transformOrigin = "50% 50%"; // 以刀为中心旋转，左右对称
      game.appendChild(el);
      setTimeout(()=>{
        el.style.transform = "scaleX(" + face + ") rotate(" + (15 + i*40) + "deg)";
        el.style.opacity = "1";
      }, 20 + i*50);
      setTimeout(()=>{ el.remove(); }, 520 + i*50);
    }
    const flash = document.createElement('div');
    flash.className = 'dogQFlash';
    flash.style.left = (anchor - 85) + "px";
    flash.style.top = "calc(100% - " + Math.round(80 + ih - swordY + 85) + "px)";
    game.appendChild(flash);
    setTimeout(()=>flash.remove(), 330);
    shakeScreen(260, 10);
  }

  function shakeScreen(ms, intensity){
    const game = document.getElementById('game');
    if(!game) return;
    const start = Date.now();
    const iv = setInterval(()=>{
      const elapsed = Date.now() - start;
      if(elapsed >= ms){
        clearInterval(iv);
        game.style.transform = '';
        return;
      }
      const amp = intensity * (1 - elapsed/ms);
      game.style.transform = "translate(" + ((Math.random()*2-1)*amp).toFixed(1) + "px," + ((Math.random()*2-1)*amp).toFixed(1) + "px)";
    }, 16);
  }

  // ---------- R 技能：龙卷风（发射后锁定目标，持续伤害 + 眩晕） ----------
  function useTornado(){
    if(playerDead || (frog && frog.dead) || gameEnded || !state.tornadoReady || state.tornadoActive) return;
    state.tornadoReady = false;
    state.tornadoCd = window.trainingMode ? 3000 : (window.l15UltimateBoost ? 12000 : Math.round(CFG.tornadoCooldown * (window.getCdFactor?window.getCdFactor():1))); // 训练营：冷却3秒
    window.dogTornadoCooldownLeft = state.tornadoCd;
    state.tornadoActive = true;
    const face = window.miaoCatFace || 1;
    const px = (typeof enemy!=='undefined') ? enemy.x : 200;
    state.tornado = { x: px + (face>0?80:-80), dir: face, locked: false, start: Date.now(), lockTime: 0 };
    spawnTornadoFx(state.tornado.x);
    playSound("assets/audio/players/miaocuijiao_cat/attack.wav", 0.9);
    // 每 100ms 一跳的持续伤害
    state.tornadoTick = setInterval(()=>{
      if(window.gamePaused) return; // 暂停时冻结大招
      if(!state.tornadoActive || !state.tornado) return;
      if(typeof frog!=='undefined' && frog && !frog.dead){
        const t = state.tornado;
        if(t.locked && t.lockTime){
          // 从锁定奶蛙那一刻起算伤害（每秒固定）
          const el = Date.now() - t.lockTime;
          let perTick = 0;
          const l16m = (window.l16SkillBoost && window.l16SkillBoost()) ? 9 : 1; // 16关技能加强，其他关基础低伤
          const um = (window.ultMult ? window.ultMult() : 1); // 大招强化倍率
          if(el < 1000) perTick = CFG.tornadoDamage[0]/10;      // 第1秒
          else if(el < 2000) perTick = CFG.tornadoDamage[1]/10; // 第2秒
          else perTick = CFG.tornadoDamage[2]/10;               // 第3秒
          applyTornadoDamage(Math.round(perTick * l16m * um));
        }
      }
    }, 100);
    state.tornadoEnd = setTimeout(()=>{ endTornado(); }, 5000); // 兜底 5 秒
  // 大招强化5级：持续+2秒并对敌人眩晕2秒
  if(window.ultLevel && window.ultLevel() >= 5){
    if(typeof frog!=='undefined' && frog){ frog.tornadoStun = true; frog.stunned = true; setTimeout(()=>{ if(frog){ frog.tornadoStun = false; if(!frog.dead) frog.stunned = false; } }, 2000); }
  }
    // V1.0 冷却统一由 setInterval 递减到0置 ready（暂停时冻结）
  }

  // 龙卷风持续伤害（绕过无敌帧，保证连续扣血）
  function applyTornadoDamage(dmg){
    if(window.gamePaused) return; // 暂停时冻结
    if(typeof frog==='undefined' || !frog || frog.dead) return;
    if(!state.tornado || !state.tornado.locked) return; // 没卷到不算伤害
    // 龙卷风贴地：打不到跳到天上的Boss/敌人（泰山压顶滞空、跳太高都躲开）
    if(frog.smashAnim || (frog.jumpY||0) < -80) return;
    frog.hp -= dmg;
    if(frog.hp < 0) frog.hp = 0;
    if(typeof updateFrogHP==='function') updateFrogHP(); // 血条同步
    if(typeof showDamageText==='function' && frog && frog.img) showDamageText(dmg, frog.img);
    if(frog.hp <= 0){
      if(typeof frogDeath==='function') frogDeath();
    }
  }

  function endTornado(){
    if(state.tornadoTick){ clearInterval(state.tornadoTick); state.tornadoTick=null; }
    if(state.tornadoEnd){ clearTimeout(state.tornadoEnd); state.tornadoEnd=null; }
    state.tornadoActive = false;
    state.tornado = null;
    if(state.tornadoFx){ state.tornadoFx.remove(); state.tornadoFx=null; }
    // 解除眩晕
    if(typeof frog!=='undefined' && frog){
      frog.tornadoStun = false;
      if(!frog.dead) frog.stunned = false;
    }
  }

  // 聚怪：把范围内敌人吸向龙卷风（未来多敌人通用）
  function pullEnemies(tx){
    const targets=[];
    if(typeof frog!=='undefined' && frog && !frog.dead) targets.push(frog);
    if(typeof enemyManager!=='undefined' && enemyManager.enemies){
      enemyManager.enemies.forEach(e=>{ if(e && !e.dead) targets.push(e); });
    }
    targets.forEach(enemy=>{
      const d = enemy.x - tx;
      const dist = Math.abs(d);
      if(dist < CFG.tornadoPullRange && dist > 70){
        enemy.x += (d > 0 ? -1 : 1) * CFG.tornadoPullSpeed;
      }
    });
  }

    function spawnTornadoFx(x){
    if(state.tornadoFx){ state.tornadoFx.remove(); state.tornadoFx=null; }
    const game = document.getElementById('game');
    if(!game) return;
    const el = document.createElement('img');
    el.src = CFG.tornadoImage;
    el.className = 'dogTornadoImg';
    el.style.cssText = "position:absolute;width:300px;height:300px;pointer-events:none;z-index:46;object-fit:contain;";
    el.style.left = (x - 150) + "px";
    el.style.top = "calc(100% - 360px)";
    game.appendChild(el);
    state.tornadoFx = el;
  }

  function isInvincible(){ return false; }

  // ---------- 每帧更新 ----------
  function update(){
    const pImg = document.getElementById('player');

    // 护盾光环跟随角色（不遮挡）
    const showShield = (window.playerShield||0) > 0;
    if(showShield){
      ensureShieldFx();
      if(state.shieldEl && pImg){
        const r = pImg.getBoundingClientRect();
        const sz = 160;
        state.shieldEl.style.left = (r.left + r.width/2 - sz/2) + "px";
        state.shieldEl.style.top  = (r.top + r.height/2 - sz/2) + "px";
        state.shieldEl.style.opacity = "1";
      }
    }else if(state.shieldEl){
      state.shieldEl.remove();
      state.shieldEl = null;
    }

    // 龙卷风移动与锁定
    if(state.tornadoActive && state.tornado){
      const t = state.tornado;
      pullEnemies(t.x); // 聚怪：把附近敌人吸向龙卷风
      if(typeof frog!=='undefined' && frog && !frog.dead){
        if(!t.locked){
          t.x += t.dir * CFG.tornadoSpeed;
          if(Math.abs(t.x - frog.x) < CFG.tornadoRange){
            t.locked = true;
            t.lockTime = Date.now();
            // 眩晕奶蛙
            frog.tornadoStun = true;
            frog.stunned = true;
            frog.attacking = false;
            // 从锁定起算 3 秒伤害窗口
            if(state.tornadoEnd){ clearTimeout(state.tornadoEnd); }
            state.tornadoEnd = setTimeout(()=>{ endTornado(); }, CFG.tornadoDuration);
          }
        }else{
          t.x = frog.x; // 锁定后跟随奶蛙
        }
      }else{
        t.x += t.dir * CFG.tornadoSpeed;
      }
      if(state.tornadoFx){
        state.tornadoFx.style.left = (t.x - 150) + "px";
      }
    }
  }

  function draw(){}

  // 外观（正式贴图）
  function updateSprite(){
    const pImg = document.getElementById('player');
    if(!pImg) return;
    if(!pImg.src.endsWith('daodungou_idle.png')) pImg.src = CFG.idleImage;
  }

  // 非Boss关：进入关卡时大招进场即在冷却（不能一进场就放）
  function startTornadoCooldown(){
    if(state.tornadoActive) return;
    state.tornadoReady = false;
    state.tornadoCd = Math.round(CFG.tornadoCooldown * (window.getCdFactor?window.getCdFactor():1));
    window.dogTornadoCooldownLeft = state.tornadoCd;
    // V1.0 进场冷却统一由 setInterval 递减到0置 ready（暂停时冻结）
    if(window.updateV13UI) window.updateV13UI();
  }

  // 冷却计时
  setInterval(()=>{
    if(window.gamePaused) return;
    if(state.meleeCd>0){ state.meleeCd-=100; if(state.meleeCd<0)state.meleeCd=0; window.dogMeleeCooldownLeft=state.meleeCd; }
    if(state.meleeCd===0 && !state.meleeReady) state.meleeReady = true; // V1.0 减到0自动就绪
    if(state.shieldCd>0){ state.shieldCd-=100; if(state.shieldCd<0)state.shieldCd=0; window.dogShieldCooldownLeft=state.shieldCd; }
    if(state.shieldCd===0 && !state.shieldReady) state.shieldReady = true; // V1.0 减到0自动就绪
    if(state.slashCd>0){ state.slashCd-=100; if(state.slashCd<0)state.slashCd=0; window.dogSlashCooldownLeft=state.slashCd; }
    if(state.slashCd===0 && !state.slashReady) state.slashReady = true; // V1.0 减到0自动就绪
    if(state.tornadoCd>0){ state.tornadoCd-=100; if(state.tornadoCd<0)state.tornadoCd=0; window.dogTornadoCooldownLeft=state.tornadoCd; }
    if(state.tornadoCd===0 && !state.tornadoActive) state.tornadoReady = true; // 冷却结束，大招可再次使用
    // 盾反计时：10秒积攒结束→进入5秒缓冲；缓冲过期→能量作废，重新开始10秒
    if(window.dogShieldReflect){
      const rr = window.dogShieldReflect;
      const now2 = Date.now();
      if(rr.phase === 'accum' && now2 - (rr.phaseStart||0) >= 10000){
        rr.phase = 'ready';
        rr.readyDeadline = now2 + 5000;
      } else if(rr.phase === 'ready' && now2 >= (rr.readyDeadline||0)){
        rr.accum = 0;
        rr.phase = 'accum';
        rr.phaseStart = now2;
        rr.readyDeadline = 0;
      }
    }
    if(window.updateV13UI) window.updateV13UI();
  },100);

  return {
    config: CFG,
    reset: reset,
    meleeAttack: meleeAttack,
    useShield: useShield,
    absorbDamage: absorbDamage,
    isInvincible: isInvincible,
    useSlash: useSlash,
    useTornado: useTornado,
    startTornadoCooldown: startTornadoCooldown,
    update: update,
    draw: draw,
    updateSprite: updateSprite
  };
})();