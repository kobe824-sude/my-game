// V1.3 R大招素材兜底：图片未加载完时用画布画出红圈/火箭/爆炸，保证第一次用就有可见反馈
window._rImgPreload = window._rImgPreload || {};
function rRocketImg(type){
  var map = { warn:'assets/players/miaocuijiao_cat/skills/R_rocket_rain/warning_circle.png', rocket:'assets/players/miaocuijiao_cat/skills/R_rocket_rain/rocket.png', boom:'assets/players/miaocuijiao_cat/skills/R_rocket_rain/explosion_smoke.png' };
  var p = map[type];
  if(!window._rImgPreload[type]){ window._rImgPreload[type] = new Image(); window._rImgPreload[type].src = p; }
  var im = window._rImgPreload[type];
  if(im.complete && im.naturalWidth > 0) return p;
  var cv = document.createElement('canvas');
  if(type === 'warn'){ cv.width=340; cv.height=125; var c=cv.getContext('2d'); c.strokeStyle='#ff3b3b'; c.lineWidth=6; c.setLineDash([18,14]); c.strokeRect(8,8,324,109); }
  else if(type === 'rocket'){ cv.width=75; cv.height=75; var c2=cv.getContext('2d'); c2.fillStyle='#ff6d00'; c2.beginPath(); c2.ellipse(37,37,18,10,0,0,Math.PI*2); c2.fill(); c2.fillStyle='#ffd54f'; c2.beginPath(); c2.arc(55,37,8,0,Math.PI*2); c2.fill(); }
  else { cv.width=160; cv.height=160; var c3=cv.getContext('2d'); c3.fillStyle='rgba(255,150,40,.7)'; c3.beginPath(); c3.arc(80,80,55,0,Math.PI*2); c3.fill(); c3.fillStyle='rgba(255,80,40,.6)'; c3.beginPath(); c3.arc(80,80,30,0,Math.PI*2); c3.fill(); }
  return cv.toDataURL('image/png');
}

window.RRocketRain={
 cooldown:90000,count:6,interval:500,warningTime:1000,damage:25, explosionDamage:5, rocketHitbox:60, // 基础低伤，16关才高（×4.8）
 targetX:300, warning:null, locked:false, lockedX:300, rocketArea:200, explosionRadius:200,
 pendingSpawns:[], pendingLaunch:false,
 isL15(){ return typeof currentLevel!=='undefined' && currentLevel+1===16; },

 createWarning(){
  const game=document.getElementById('game'); if(!game)return;
  let el=document.getElementById('rWarningCircle');
  if(!el){
   el=document.createElement('img');
   el.id='rWarningCircle';
   el.src=rRocketImg('warn'); // V1.3 兜底
   game.appendChild(el);
  }
  const cw = this.isL15() ? 500 : 340; // 第15关红圈更大
  const ch = this.isL15() ? 180 : 125;
  Object.assign(el.style,{position:'absolute',width:cw+'px',height:ch+'px',zIndex:20,pointerEvents:'none'});
  el.style.display='block';
  this.warning=el;
  this.locked=false;
  this.lockedX=this.targetX;
  this.updateWarning();
  return el;
 },
 updateWarning(){
  if(this.warning && !this.locked){
   this.warning.style.left=(this.targetX-110)+'px';
   this.warning.style.top='calc(100% - 180px)';
  }
 },
 lockWarning(){
  this.locked=true;
  this.lockedX=this.targetX;
  if(this.warning){
   this.warning.style.left=(this.lockedX-110)+'px';
  }
 },
 flashWarning(el){
  let n=0;
  let t=setInterval(()=>{el.style.filter=n++%2?'brightness(3)':'none';},150);
  setTimeout(()=>{clearInterval(t);el.style.display='none';},this.warningTime);
 },
 launch(){
  if(!this.locked) this.lockWarning(); // 松开R时已锁定红圈位置；这里不再重锁，避免1秒延迟期间鼠标移动把落点带跑
  const center=this.lockedX; // 火箭落在松开R时红圈停留的位置
  const area = this.isL15() ? 330 : this.rocketArea; // 第15关范围更大
  this._radius = this.isL15() ? 280 : this.explosionRadius;
  const cnt = this.count + ((window.ultLevel && window.ultLevel() >= 5) ? 2 : 0); // 大招强化5级：火箭数量+2
  for(let i=0;i<cnt;i++){
   setTimeout(()=>{
    if(window.gamePaused){ this.pendingSpawns.push(center+(Math.random()*area*2-area)); return; } // 暂停时不发射，恢复后补发
    const x=center+(Math.random()*area*2-area);
    this.spawnRocket(x);
   },this.warningTime+i*this.interval);
  }
 },
 spawnRocket(x){
  let game=document.getElementById('game'); if(!game)return;
  let r=document.createElement('img');
  r.src=rRocketImg('rocket'); // V1.3 兜底
  Object.assign(r.style,{position:'absolute',left:(x-25)+'px',top:'80px',width:'75px',zIndex:50,pointerEvents:'none'});
  game.appendChild(r);
  let y=80;
  let f=setInterval(()=>{
   if(window.gamePaused) return; // 暂停时火箭停在半空，恢复后再下落
   y+=15; r.style.top=y+'px';
   if(y>window.innerHeight-180){
    clearInterval(f); r.remove(); this.explode(x);
   }
  },30);
 },
 explode(x){
  let game=document.getElementById('game'); if(!game)return;
  let e=document.createElement('img');
  e.src=rRocketImg('boom'); // V1.3 兜底
  Object.assign(e.style,{position:'absolute',left:(x-80)+'px',top:'calc(100% - 220px)',width:'160px',zIndex:60,pointerEvents:'none'});
  game.appendChild(e);

  let a=new Audio('assets/audio/players/miaocuijiao_cat/r_rocket_explosion.mp3');
  a.volume = .8 * (window.sfxVol||1); a.play().catch(()=>{});

  // R火箭雨爆炸伤害：使用锁定区域，不受鼠标影响
  const targets=[];
  const seenTargets=new Set();
  const addTarget=(t)=>{
    if(t && !seenTargets.has(t)){
      seenTargets.add(t);
      targets.push(t);
    }
  };
  if(typeof enemyManager!=='undefined' && enemyManager.enemies){
   enemyManager.enemies.forEach(addTarget);
  }
  // 兼容当前奶蛙对象，避免同一敌人被重复加入导致伤害翻倍
  if(typeof frog!=='undefined') addTarget(frog);
  if(typeof window.frog!=='undefined') addTarget(window.frog);

  targets.forEach(enemy=>{
    if(!enemy) return;
    let ex=enemy.x||0;
    let ey=enemy.y||0;
    // V3.4: 使用实时敌人位置检测，避免移动中的奶蛙漏判
    if(enemy===window.frog && typeof frogImg!=='undefined' && frogImg){
      const rect=frogImg.getBoundingClientRect();
      ex=rect.left+rect.width/2;
      ey=rect.top+rect.height/2;
    }
    const distance=Math.hypot(ex-x, ey-(window.innerHeight-180));
    const radius = this._radius || this.explosionRadius;
    const hit=distance < radius;
    if(hit){
      const l16m = (window.l16SkillBoost && window.l16SkillBoost()) ? 4.8 : 1; // 16关技能加强，其他关基础低伤
      const um = (window.ultMult ? window.ultMult() : 1); // 大招强化倍率
      const dmg1 = Math.round(this.damage * l16m * um);
      const dmg2 = Math.round(this.explosionDamage * l16m * um);
      if(typeof window.applyDamage==='function'){
        window.applyDamage(enemy,dmg1,window.player,'R_direct');
        window.applyDamage(enemy,dmg2,window.player,'R_explosion');
        if(window.updateFrogHUD) window.updateFrogHUD();
      }else if(typeof applyDamage==='function'){
        applyDamage(enemy,dmg1,window.player,'R_direct');
        applyDamage(enemy,dmg2,window.player,'R_explosion');
        if(window.updateFrogHUD) window.updateFrogHUD();
      }else if(typeof enemy.hp==='number'){
        enemy.hp-=dmg1; enemy.hp-=dmg2;
      }
    }
  });
  setTimeout(()=>e.remove(),700);
 },
 onResume(){
  // 暂停结束后：补发暂停期间被推迟的整轮发射与单颗火箭
  if(this.pendingLaunch){ this.pendingLaunch=false; this.launch(); }
  if(this.pendingSpawns && this.pendingSpawns.length){
   const arr=this.pendingSpawns.splice(0);
   arr.forEach(x=>{ this.spawnRocket(x); });
  }
 }
};
