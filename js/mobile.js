// V15.16 手机触屏操作（复用主游戏的键盘/鼠标逻辑）
(function(){
  function isTouch(){ return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0); }
  if(!isTouch()) return; // 非触屏设备：按钮由 CSS 隐藏，无需绑定

  // ========== V1.10 禁止双击/双指缩放：战斗中双击会缩放页面，严重影响操作 ==========
  var _lastTapT = 0, _lastTapX = 0, _lastTapY = 0;
  function _blockZoom(ev){
    try{ ev.preventDefault(); ev.stopPropagation(); }catch(e){}
  }
  // iOS Safari：手势（捏合）缩放
  document.addEventListener('gesturestart', _blockZoom, {passive:false});
  document.addEventListener('gesturechange', _blockZoom, {passive:false});
  document.addEventListener('gestureend', _blockZoom, {passive:false});
  // 双击缩放：350ms 内第二次点击同一位置 → 阻止
  document.addEventListener('touchend', function(ev){
    var now = Date.now();
    var t = ev.changedTouches && ev.changedTouches[0];
    if(t && now - _lastTapT < 350 && Math.abs(t.clientX - _lastTapX) < 60 && Math.abs(t.clientY - _lastTapY) < 60){
      // V1.0 未缩放时拦截双击(防放大)；已缩放时放行双击(让浏览器可双击还原，避免卡死在放大状态)
      var vs = window.visualViewport;
      var zoomed = vs && vs.scale > 1.01;
      if(!zoomed){ ev.preventDefault(); }
    }
    if(t){ _lastTapT = now; _lastTapX = t.clientX; _lastTapY = t.clientY; }
  }, {passive:false});
  // dblclick（部分安卓浏览器仍会触发双击缩放）
  document.addEventListener('dblclick', _blockZoom, {passive:false});
  // V1.0 页面被意外缩放时自动恢复（防止一直卡在放大状态）
  function tryResetZoom(){
    try{
      var vs = window.visualViewport;
      if(!vs) return;
      if(vs.scale > 1.01){
        if(document.documentElement){ document.documentElement.style.zoom = (1 / vs.scale); } // Chromium 补偿抵消浏览器缩放
        if(typeof reflowGameViewport==='function') reflowGameViewport();
      } else {
        if(document.documentElement && document.documentElement.style.zoom){ document.documentElement.style.zoom = ''; }
      }
    }catch(e){}
  }
  if(window.visualViewport && window.visualViewport.addEventListener){
    window.visualViewport.addEventListener('resize', function(){ setTimeout(tryResetZoom, 60); });
  }
  window.tryResetZoom = tryResetZoom;
  // 多指触摸（捏合）直接阻止默认；疑似双击（第二下触摸）且未缩放时提前拦截，杜绝Chrome双击缩放
  document.addEventListener('touchstart', function(ev){
    if(ev.touches && ev.touches.length > 1){ ev.preventDefault(); return; }
    var now2 = Date.now();
    var t2 = ev.changedTouches && ev.changedTouches[0];
    if(t2 && now2 - _lastTapT < 350 && Math.abs(t2.clientX - _lastTapX) < 60 && Math.abs(t2.clientY - _lastTapY) < 60){
      var vs2 = window.visualViewport;
      var zoomed2 = vs2 && vs2.scale > 1.01;
      if(!zoomed2){ ev.preventDefault(); }
    }
  }, {passive:false});

  var $=function(id){ return document.getElementById(id); };
  var L=$('mcLeft'), R=$('mcRight'), J=$('mcJump'), A=$('mcAtk'), D=$('mcDash'), E=$('mcE'), Q=$('mcQ'), Rbtn=$('mcR'), P=$('mcPause');
  // V1.4 手机控制区禁止右键菜单（否则长按移动键会触发右键→冲刺）
  var mcWrap = $('mobileControls');
  if(mcWrap){ mcWrap.addEventListener('contextmenu', function(ev){ ev.preventDefault(); ev.stopPropagation(); }); }

  // 左右移动：按下/松开映射到 keys['a']/keys['d']
  function holdMove(key, el){
    var press=function(ev){ ev.preventDefault(); keys[key]=true; window.miaoCatFace = (key==='a'?-1:1); if(enemyObj) enemyObj.style.transform=(key==='a'?'scaleX(-1)':'scaleX(1)'); };
    var rel=function(){ keys[key]=false; };
    if(!el) return;
    el.addEventListener('pointerdown', press);
    el.addEventListener('pointerup', rel);
    el.addEventListener('pointercancel', rel);
    el.addEventListener('pointerleave', rel);
  }
  holdMove('a', L); holdMove('d', R);

  // V1.12 手机端跳跃力度缩小（主角变小，跳太高会出屏幕）：一段跳约94px（能躲奶蛙波），二段跳约188px
  function jumpMobilePower(){ return Math.round(currentJumpPower * (window.jumpMobileScale ? window.jumpMobileScale() : 1)); }
  if(J) J.addEventListener('pointerdown', function(ev){ ev.preventDefault(); if(playerDead || gameEnded) return; if(jumpCount < currentMaxJumps){ playerVelocityY = -jumpMobilePower(); jumpCount++; onGround=false; } });
  if(A) A.addEventListener('pointerdown', function(ev){ ev.preventDefault(); if(window.l15LockControls || window.gamePaused) return; if(activeCharacter==='daodungou'){ if(window.DOG) window.DOG.meleeAttack(); } else { shootBullet(); } });
  if(D) D.addEventListener('pointerdown', function(ev){ ev.preventDefault(); if(window.l15LockControls || window.gamePaused) return; useDash(); });
  if(P) P.addEventListener('pointerdown', function(ev){ ev.preventDefault(); togglePause(); });

  // 猫的 R 大招：按住 R 瞄准（红圈跟随手指），松开 R 释放，与电脑版一致；灵敏度适中，红圈不会拖出屏幕
  var rAimingMobile = false;
  function rAimStart(){
    if(activeCharacter==='daodungou') return;
    if(rAimingMobile) return;
    if(window.l15LockControls || window.gamePaused) return;
    var su = (typeof skillUnlocks==='function') ? skillUnlocks() : {e:true,q:true,r:true};
    if(!su.r || typeof startRAim!=='function') return;
    startRAim(); rAimingMobile=true;
    if(Rbtn){ Rbtn.classList.add('aiming'); }
  }
  function rAimEnd(){
    if(!rAimingMobile) return;
    rAimingMobile=false;
    if(Rbtn){ Rbtn.classList.remove('aiming'); }
    if(typeof releaseRAim==='function') releaseRAim();
  }
  if(Rbtn){
    Rbtn.addEventListener('pointerdown', function(ev){ ev.preventDefault(); if(activeCharacter==='daodungou'){ skill('r'); } else { rAimStart(); } });
  }
  // V1.1 手机R大招拖动：按住后手指在屏幕任意位置拖动调整红圈，松开任意位置释放（与电脑版一致）
  document.addEventListener('pointerup', function(ev){
    if(rAimingMobile){ ev.preventDefault(); rAimEnd(); }
  }, true);
  document.addEventListener('pointercancel', function(){ if(rAimingMobile) rAimEnd(); }, true);
  document.addEventListener('pointerleave', function(){ if(rAimingMobile) rAimEnd(); }, true);
  // 拖动调整 R 瞄准位置：灵敏度适中 + 限制在屏幕内（红圈中心不会拖出屏幕）
  document.addEventListener('pointermove', function(ev){
    if(rAimingMobile && window.rAiming && window.RRocketRain){
      // 灵敏度适中 + 限制在屏幕内（红圈中心不会拖出屏幕）
      window.RRocketRain.targetX = Math.max(140, Math.min(window.innerWidth-140, ev.clientX));
      if(window.RRocketRain.updateWarning) window.RRocketRain.updateWarning();
    }
  });
  // 兼容旧引用（其它代码可能调用 toggleRAim/skill('r')）
  window.toggleRAim = function(){ if(rAimingMobile) rAimEnd(); else rAimStart(); };
  function skill(k){
    if(window.l15LockControls || window.gamePaused) return;
    var su = (typeof skillUnlocks==='function') ? skillUnlocks() : {e:true,q:true,r:true};
    if(activeCharacter==='daodungou'){
      if(k==='e' && su.e && window.DOG) window.DOG.useShield();
      else if(k==='q' && su.q && window.DOG) window.DOG.useSlash();
      else if(k==='r' && su.r && window.DOG) window.DOG.useTornado();
    } else {
      if(k==='e' && su.e && typeof useHealSkill==='function') useHealSkill();
      else if(k==='q' && su.q && typeof useQRocket==='function') useQRocket();
    }
  }
  if(E) E.addEventListener('pointerdown', function(ev){ ev.preventDefault(); skill('e'); });
  if(Q) Q.addEventListener('pointerdown', function(ev){ ev.preventDefault(); skill('q'); });

  // 防止触屏误滚动/缩放
  document.addEventListener('touchmove', function(ev){ if(ev.target && ev.target.closest && ev.target.closest('#mobileControls')){ ev.preventDefault(); } }, {passive:false});

  // 只在游戏中显示触屏按钮（登录/主菜单隐藏）
  function syncMobileControls(){
    var mc = $('mobileControls');
    if(!mc) return;
    var inGame = !!(window.gameStarted || window.infiniteMode || window.trainingMode);
    mc.style.display = inGame ? '' : 'none';
  }
  window.syncMobileControls = syncMobileControls;
  setInterval(syncMobileControls, 400);
  syncMobileControls();

  // V1.11 手机技能/普攻/闪避按钮：扇形冷却遮罩 + 数字倒计时（带小数）+ 未解锁显示锁
  // 普攻、闪避也有冷却数字（猫普攻2秒/狗普攻1秒/闪避3秒）
  var _cdTimer = setInterval(function(){
    var isDog = (window.activeCharacter === 'daodungou');
    var defs = [
      { id:'mcAtk', label:'🐾', cdKey: isDog ? 'dogMeleeCooldownLeft' : 'shootCooldownLeft', locked:false, cdMax: isDog ? 1000 : 2000 },
      { id:'mcDash', label:'💨', cdKey:'dashCooldownLeft', locked:false, cdMax: 3000 },
      { id:'mcQ', label:'Q', cdKey: isDog ? 'dogSlashCooldownLeft' : 'qCooldownLeft', locked:false, cdMax: 60000 },
      { id:'mcE', label:'E', cdKey: isDog ? 'dogShieldCooldownLeft' : 'healCooldownLeft', locked:false, cdMax: 40000 },
      { id:'mcR', label:'R', cdKey: isDog ? 'dogTornadoCooldownLeft' : 'rCooldownLeft', locked:false, cdMax: 90000 }
    ];
    var su = (typeof skillUnlocks === 'function') ? skillUnlocks() : {e:true,q:true,r:true};
    for (var i=0;i<defs.length;i++){
      var d = defs[i], id = d.id;
      var btn = document.getElementById(id);
      if (!btn) continue;
      var cd = window[d.cdKey] || 0;
      var locked = (id === 'mcQ' && !su.q) || (id === 'mcE' && !su.e) || (id === 'mcR' && !su.r);
      // 扇形遮罩
      if (!btn._cdEl) { btn._cdEl = document.createElement('div'); btn._cdEl.className = 'cdSector'; btn.appendChild(btn._cdEl); }
      // 数字层
      if (!btn._cdNum) { btn._cdNum = document.createElement('span'); btn._cdNum.className = 'cdNum'; btn.appendChild(btn._cdNum); }
      var max = (cd > (btn._cdMax || 0)) ? cd : (btn._cdMax || d.cdMax || 1);
      if (cd > (btn._cdMax || 0)) btn._cdMax = cd;
      var f = Math.min(1, cd / max);
      var deg = Math.max(0, Math.min(360, Math.round(360 * (1 - f))));
      btn._cdEl.style.background = 'conic-gradient(rgba(0,0,0,0) ' + deg + 'deg, rgba(0,0,0,.68) ' + deg + 'deg 360deg)';
      if (cd <= 0) btn._cdMax = 0;
      var aiming = (id === 'mcR' && btn.classList && btn.classList.contains('aiming'));
      if (locked) { btn._cdNum.textContent = '🔒'; btn._cdNum.style.opacity = '.85'; btn._cdNum.style.fontSize = '18px'; }
      else if (cd > 0) {
        var secs = cd / 1000;
        btn._cdNum.textContent = secs >= 100 ? '99+' : (secs >= 10 ? secs.toFixed(0) : secs.toFixed(1));
        btn._cdNum.style.opacity = '1';
        btn._cdNum.style.fontSize = '15px';
      } else {
        btn._cdNum.textContent = d.label;
        btn._cdNum.style.opacity = '1';
        btn._cdNum.style.fontSize = '15px';
      }
    }
  }, 150);
})();
