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
      ev.preventDefault();
    }
    if(t){ _lastTapT = now; _lastTapX = t.clientX; _lastTapY = t.clientY; }
  }, {passive:false});
  // dblclick（部分安卓浏览器仍会触发双击缩放）
  document.addEventListener('dblclick', _blockZoom, {passive:false});
  // 多指触摸（捏合）直接阻止默认
  document.addEventListener('touchstart', function(ev){
    if(ev.touches && ev.touches.length > 1){ ev.preventDefault(); }
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

  if(J) J.addEventListener('pointerdown', function(ev){ ev.preventDefault(); if(playerDead || gameEnded) return; if(jumpCount < currentMaxJumps){ playerVelocityY = -currentJumpPower; jumpCount++; onGround=false; } });
  if(A) A.addEventListener('pointerdown', function(ev){ ev.preventDefault(); if(window.l15LockControls || window.gamePaused) return; if(activeCharacter==='daodungou'){ if(window.DOG) window.DOG.meleeAttack(); } else { shootBullet(); } });
  if(D) D.addEventListener('pointerdown', function(ev){ ev.preventDefault(); if(window.l15LockControls || window.gamePaused) return; useDash(); });
  if(P) P.addEventListener('pointerdown', function(ev){ ev.preventDefault(); togglePause(); });

  // 猫的 R 大招：点一下开始瞄准（红圈出现），手指在屏幕上拖动调整位置，再点 R 发射
  var rAimingMobile = false;
  function toggleRAim(){
    if(activeCharacter==='daodungou') return;
    if(rAimingMobile){
      releaseRAim(); rAimingMobile=false;
      if(Rbtn){ Rbtn.classList.remove('aiming'); Rbtn.textContent='R'; }
    } else {
      startRAim(); rAimingMobile=true;
      if(Rbtn){ Rbtn.classList.add('aiming'); Rbtn.textContent='R•瞄'; }
    }
  }
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
      else if(k==='r' && su.r && typeof startRAim==='function') toggleRAim();
    }
  }
  if(E) E.addEventListener('pointerdown', function(ev){ ev.preventDefault(); skill('e'); });
  if(Q) Q.addEventListener('pointerdown', function(ev){ ev.preventDefault(); skill('q'); });
  if(Rbtn) Rbtn.addEventListener('pointerdown', function(ev){ ev.preventDefault(); skill('r'); });

  // 拖动调整 R 瞄准位置
  document.addEventListener('pointermove', function(ev){
    if(rAimingMobile && window.rAiming && window.RRocketRain){
      window.RRocketRain.targetX = Math.max(100, Math.min(window.innerWidth-100, ev.clientX));
      if(window.RRocketRain.updateWarning) window.RRocketRain.updateWarning();
    }
  });

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

  // V1.7 手机技能按钮：扇形冷却遮罩 + 数字倒计时（带小数）+ 未解锁显示锁
  var _cdTimer = setInterval(function(){
    var defs = { mcQ:['Q', 'qCooldownLeft'], mcE:['E', 'healCooldownLeft'], mcR:['R', 'rCooldownLeft'] };
    var su = (typeof skillUnlocks === 'function') ? skillUnlocks() : {e:true,q:true,r:true};
    for (var id in defs) {
      var btn = document.getElementById(id);
      if (!btn) continue;
      var label = defs[id][0], cdKey = defs[id][1];
      var cd = window[cdKey] || 0;
      var locked = (id === 'mcQ' && !su.q) || (id === 'mcE' && !su.e) || (id === 'mcR' && !su.r);
      // 扇形遮罩
      if (!btn._cdEl) { btn._cdEl = document.createElement('div'); btn._cdEl.className = 'cdSector'; btn.appendChild(btn._cdEl); }
      // 数字层
      if (!btn._cdNum) { btn._cdNum = document.createElement('span'); btn._cdNum.className = 'cdNum'; btn.appendChild(btn._cdNum); }
      if (cd > (btn._cdMax || 0)) btn._cdMax = cd;
      var max = btn._cdMax || 1;
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
        btn._cdNum.textContent = aiming ? 'R•瞄' : label;
        btn._cdNum.style.opacity = '1';
        btn._cdNum.style.fontSize = '15px';
      }
    }
  }, 150);
})();
