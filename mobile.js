// V15.16 手机触屏操作（复用主游戏的键盘/鼠标逻辑）
(function(){
  function isTouch(){ return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0); }
  if(!isTouch()) return; // 非触屏设备：按钮由 CSS 隐藏，无需绑定

  var $=function(id){ return document.getElementById(id); };
  var L=$('mcLeft'), R=$('mcRight'), J=$('mcJump'), A=$('mcAtk'), D=$('mcDash'), E=$('mcE'), Q=$('mcQ'), Rbtn=$('mcR'), P=$('mcPause');

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
})();
