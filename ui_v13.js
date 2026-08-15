// V1.3.3 TRUE BOSS HP + CD HUD (V5.0: 支持双角色 - 妙脆角猫 / 刀盾狗)
(function(){
let root=null;

// V5.0 各角色技能栏配置
const SKILL_META = {
  miaocuijiao_cat: {
    title: "🐱 妙脆角猫",
    atkName: "普攻",  atkIcon: "🗡️",
    eName: "E 回复",  eIcon: "🌽",  eCd: 15000,
    qName: "Q 爆炸火箭", qIcon: "💥", qCd: 60000,
    rName: "R 火箭雨",  rIcon: "🚀",  rCd: 90000
  },
  daodungou: {
    title: "🐶 刀盾狗",
    atkName: "普攻",  atkIcon: "🗡️",
    eName: "E 护盾",  eIcon: "🛡️", eCd: 40000,
    qName: "Q 旋风斩", qIcon: "🌀",  qCd: 18000,
    rName: "R 龙卷风", rIcon: "🌪️", rCd: 90000
  }
};

function init(){
 if(root||!document.getElementById('game')) return;
 root=document.createElement('div');
 const style=document.createElement('style');
 style.textContent=`
 #v13ui .hornSlots img{width:28px;height:28px;margin-right:4px}.hornCooldown{font-size:12px;color:#ffd86b;margin-top:4px}.hornProgress{width:90px;height:6px;background:#333;border-radius:5px;overflow:hidden;margin-top:3px}.hornProgress>div{height:100%;background:#ffd86b;transition:width .1s}\n #v13ui .hudBar{width:160px;height:12px;background:#333;border-radius:8px;overflow:hidden}
 #v13ui .hudBar>div{height:100%;transition:width .2s}
 #skillBar .skill{position:relative;overflow:hidden}
 #skillBar .coolCircle{position:absolute;inset:0;border-radius:12px;pointer-events:none;z-index:2}
 #skillBar span{position:relative;z-index:3}
 .bossHitFlash{filter:brightness(2) saturate(2) drop-shadow(0 0 8px red);}\n .damageFloat{position:absolute;font-size:26px;font-weight:900;text-shadow:2px 2px 0 #000;animation:floatUp .9s forwards;z-index:9999}
 @keyframes floatUp{from{transform:translateY(0);opacity:1}to{transform:translateY(-60px);opacity:0}}
 #dogShieldRow{display:none;margin-top:6px}
 #dogShieldRow .shieldLabel{font-size:13px;color:#9fd4ff;font-weight:bold;margin-bottom:2px}
 #dogShieldRow .hudBar{width:160px;height:8px}
 #dogShieldFill{background:linear-gradient(90deg,#3fa9f5,#9fd4ff)}
 .skIcon{font-size:20px;line-height:1}
 .skName{font-size:13px;font-weight:bold;margin-top:2px}
 `;
 document.head.appendChild(style);
 root.id='v13ui';
 root.innerHTML=`
 <div id="playerHUD" class="hud">
  <div class="title" id="playerTitle">🐱 妙脆角猫</div>
  <div id="playerHpText"></div>
  <div id="dashRow">⚡ 突进 <span id="dashCd">READY</span></div>
  <div class="hudBar"><div id="playerHpFill"></div></div>
  <div id="dogShieldRow">
   <div class="shieldLabel">🛡️ 护盾 <span id="shieldVal">0</span></div>
   <div class="hudBar"><div id="dogShieldFill"></div></div>
  </div>
  <div id="cornText" class="hornSlots"></div><div id="hornCooldownSlots"></div>
 </div>
 <div id="frogHUD" class="hud">
  <div class="title">🐸 奶蛙</div>
  <div id="frogHudHp"></div>
  <div class="hudBar"><div id="frogHudFill"></div></div>
 </div>
 <div id="skillBar">
  <div class="skill cooldown" id="atkSkill"><div class="coolCircle" id="atkCircle"></div><div class="skIcon" id="atkIcon">🐾</div><div class="skName" id="atkName">普攻</div><span id="atkCd">READY</span></div>
  <div class="skill cooldown" id="healSkill"><div class="coolCircle" id="healCircle"></div><div class="skIcon" id="healIcon">🌽</div><div class="skName" id="healName">E 回复</div><span id="healCd">READY</span></div>
  <div class="skill cooldown" id="qSkill"><div class="coolCircle" id="qCircle"></div><div class="skIcon" id="qIcon">💥</div><div class="skName" id="qName">Q 爆炸火箭</div><span id="qCd">READY</span></div>
  <div class="skill cooldown" id="rSkill"><div class="coolCircle" id="rCircle"></div><div class="skIcon" id="rIcon">🚀</div><div class="skName" id="rName">R 火箭雨</div><span id="rCd">READY</span></div>
 </div>`;
 document.getElementById('game').appendChild(root);
}
function colorByHp(p){return p>=60?'#55c84d':p>=30?'#f3c34b':'#e85b4b'}

// V5.0 按角色切换技能栏标签
window.applySkillLabels=function(char){
 init(); if(!root) return;
 const meta=SKILL_META[char]||SKILL_META.miaocuijiao_cat;
 const set=(id,txt)=>{const el=document.getElementById(id); if(el) el.textContent=txt;};
 set('playerTitle', meta.title);
 set('atkIcon',meta.atkIcon); set('atkName',meta.atkName);
 set('healIcon',meta.eIcon);  set('healName',meta.eName);
 set('qIcon',meta.qIcon);     set('qName',meta.qName);
 set('rIcon',meta.rIcon);     set('rName',meta.rName);
};

window.updateRUI=function(){
 init(); if(!root)return;
 const cd=window.rCooldownLeft||0;
 const txt=document.getElementById("rCd");
 const circle=document.getElementById("rCircle");
 if(!txt||!circle)return;
 // 圆环满格基准与疾风/冷却缩减同步（否则显示比例和实际不符）
 const fac=(window.getCdFactor?window.getCdFactor():1);
 const full=window.trainingMode ? 3000 : Math.max(1, (typeof R_COOLDOWN!=='undefined'?R_COOLDOWN:90000)*fac);
 if(cd>0){ txt.textContent=Math.ceil(cd/1000)+"s"; circle.style.background="conic-gradient(rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.75) "+Math.min(100,cd/full*100)+"%, transparent "+Math.min(100,cd/full*100)+"%)"; }
 else { txt.textContent="READY"; circle.style.background="transparent"; }
};

window.updateV13UI=function(){
 init(); if(!root)return;
 try{
 const char=window.activeCharacter||'miaocuijiao_cat';
 const meta=SKILL_META[char]||SKILL_META.miaocuijiao_cat;
 // V5.6 技能按关卡解锁显示
 const su=window.getSkillUnlocks?window.getSkillUnlocks():{e:true,q:true,r:true};
 const setVis=(id,v)=>{const el=document.getElementById(id); if(el) el.style.display=v?'':'none';};
 setVis('healSkill',su.e); setVis('qSkill',su.q); setVis('rSkill',su.r);
 let hp=window.playerHp??60,max=window.playerMaxHp??60,p=Math.max(0,hp/max*100);
 let pf=document.getElementById('playerHpFill');
 if(pf){pf.style.width=p+'%';pf.style.background=colorByHp(p);}
 let pt=document.getElementById('playerHpText'); if(pt)pt.textContent=`HP:${hp}/${max}`;
 const dcd=document.getElementById('dashCd');
 if(dcd) dcd.textContent=fmtCd(window.dashCooldownLeft||0);

 // 统一护盾显示（狗E技能/护盾药都给护盾值）
 const dogShieldRow=document.getElementById('dogShieldRow');
 const cornText=document.getElementById('cornText');
 const hornSlots=document.getElementById('hornCooldownSlots');
 if((window.playerShield||0) > 0){
   if(dogShieldRow) dogShieldRow.style.display='block';
   const sfill=document.getElementById('dogShieldFill');
   if(sfill) sfill.style.width=Math.max(0,(window.playerShield||0)/50*100)+'%';
   const sval=document.getElementById('shieldVal');
   if(sval) sval.textContent=(window.playerShield||0);
 } else {
   if(dogShieldRow) dogShieldRow.style.display='none';
 }
 if(char==='daodungou'){
   if(cornText) cornText.style.display='none';
   if(hornSlots) hornSlots.style.display='none';
 }else{
   if(cornText) cornText.style.display='';
   if(hornSlots) hornSlots.style.display='';
   let c=document.getElementById('cornText');
   if(c){
     let n=(window.miaocat&&window.miaocat.horns!=null)?window.miaocat.horns:(window.miaocatCorn??2);
     const ck='corn|'+n;
     if(window.__cornKey!==ck){ window.__cornKey=ck; c.innerHTML=''; for(let i=0;i<n;i++){let im=document.createElement('img');im.src='assets/ui/miaocui_horn.svg';c.appendChild(im);} }
   }
   let slots=document.getElementById('hornCooldownSlots');
   if(slots){
     let cds=(window.miaocat&&window.miaocat.hornCooldowns)?window.miaocat.hornCooldowns:(window.hornCooldowns||[0,0]);
     let total=30000;
     // 每秒只重建一次（秒数没变就不重建DOM，减少每帧开销/卡顿）
     const ck='horn|'+cds.map(x=>Math.ceil(x/1000)).join(',');
     if(window.__hornKey!==ck){
       window.__hornKey=ck;
       slots.innerHTML='';
       cds.forEach((cd,i)=>{
         let wrap=document.createElement('div');
         let label=document.createElement('div');
         label.textContent='喵碎角 '+(i+1);
         let bar=document.createElement('div');
         bar.className='hornProgress';
         let fill=document.createElement('div');
         fill.style.width=(cd>0?((1-cd/total)*100):100)+'%';
         bar.appendChild(fill);
         let text=document.createElement('div');
         text.className='hornCooldown';
         text.textContent=cd>0?Math.ceil(cd/1000)+'s':'READY';
         wrap.appendChild(label);
         wrap.appendChild(bar);
         wrap.appendChild(text);
         slots.appendChild(wrap);
       });
     } else {
       // 秒数没变，只更新进度条宽度（轻量）
       const fills=slots.querySelectorAll('.hornProgress>div');
       cds.forEach((cd,i)=>{ if(fills[i]) fills[i].style.width=(cd>0?((1-cd/total)*100):100)+'%'; });
     }
   }
 }
 let frog=window.frog;
 if(frog){
  let fp=Math.max(0,frog.hp/frog.maxHp*100);
  let ff=document.getElementById('frogHudFill');
  if(ff){ff.style.width=fp+'%';ff.style.background=colorByHp(fp);}
  let ft=document.getElementById('frogHudHp');
  if(ft)ft.textContent=`HP:${frog.hp}/${frog.maxHp}`;
 }
 function fmtCd(ms){
  if(!ms || ms<=0) return 'READY';
  const s = ms/1000;
  return (s % 1 === 0) ? Math.round(s)+'s' : (Math.round(s*10)/10)+'s';
 }
function cd(t,c,left,total){
  if(t)t.textContent=fmtCd(left);
  if(c)c.style.background=left>0?`conic-gradient(rgba(0,0,0,.65) ${left/total*360}deg,transparent 0deg)`:'transparent';
 }
 const fac=(window.getCdFactor?window.getCdFactor():1);
 const tr=!!window.trainingMode; // 训练营：技能栏满格按3秒显示
 // 普攻冷却
 cd(document.getElementById('atkCd'),document.getElementById('atkCircle'),
    char==='daodungou'?(window.dogMeleeCooldownLeft||0):(window.shootCooldownLeft||0),
    char==='daodungou'?1000:2000);
 // E 技能冷却
 if(char==='daodungou'){
   cd(document.getElementById('healCd'),document.getElementById('healCircle'),window.dogShieldCooldownLeft||0,Math.round(tr?3000:(meta.eCd*fac)));
   cd(document.getElementById('qCd'),document.getElementById('qCircle'),window.dogSlashCooldownLeft||0,Math.round(tr?3000:(meta.qCd*fac)));
   cd(document.getElementById('rCd'),document.getElementById('rCircle'),window.dogTornadoCooldownLeft||0,Math.round(tr?3000:(meta.rCd*fac)));
 }else{
   cd(document.getElementById('healCd'),document.getElementById('healCircle'),window.healCooldownLeft||0,Math.round(tr?3000:(meta.eCd*fac)));
   cd(document.getElementById('qCd'),document.getElementById('qCircle'),window.qCooldownLeft||0,Math.round(tr?3000:(meta.qCd*fac)));
   cd(document.getElementById('rCd'),document.getElementById('rCircle'),window.rCooldownLeft||0,Math.round(tr?3000:(R_COOLDOWN*fac)));
 }
 }catch(e){}
};
setInterval(()=>{ if(window.gamePaused) return; if(window.hornCooldownLeft>0){ window.hornCooldownLeft=Math.max(0,window.hornCooldownLeft-100); if(window.updateV13UI) window.updateV13UI(); } },100);
document.addEventListener('DOMContentLoaded',init);
})();

window.updateFrogHUD=function(){
 try{
  if(typeof frog!=='undefined' && frog){
    let fb=document.getElementById('frogHpFill');
    if(fb) fb.style.width=Math.max(0,frog.hp/frog.maxHp*100)+'%';
    let ft=document.getElementById('frogHpText');
    if(ft) ft.textContent=`HP:${Math.max(0,frog.hp)}/${frog.maxHp}`;
  }
 }catch(e){}
};