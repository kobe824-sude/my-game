// MilkFrog V8.6 Battle Module
// 攻击、伤害、冲击波逻辑保持兼容

function showDamageFloat(text,color='#fff',target=null){
 // V1.0 伤害数字取整：避免出现 60.1111 这类小数
 const _s=String(text);
 if(/^[+-]?\d+(\.\d+)?$/.test(_s)){
   const _neg=_s[0]==='-';
   const _pos=_s[0]==='+';
   const _n=Math.round(parseFloat(_s));
   text=(_pos?'+':_neg?'-':'')+Math.abs(_n);
 }
 let game=document.getElementById('game')||document.body;
 let el=document.createElement('div');
 el.className='damageFloat';
 el.textContent=text;
 el.style.color=color;
 let x=target&&target.x?target.x:window.innerWidth/2;
 let y=target&&target.y?target.y:200;
 el.style.left=x+'px';
 el.style.top=y+'px';
 game.appendChild(el);
 setTimeout(()=>el.remove(),900);
}
// V4.0 Unified Damage Event System
function createDamageEvent(target, damage, source=null, skill=''){
 return {target, damage, source, skill, time:Date.now()};
}

function applyDamage(target,damage,source=null,skill=''){
 if(!target) return;
 // 训练营稻草人：R大招等走本通道的伤害也累计总伤害
 if(target.type==='dummy' && typeof window.scarecrowTotalDmg!=='undefined'){
   window.scarecrowTotalDmg = (window.scarecrowTotalDmg||0) + Math.round(damage);
   if(target.dmgEl) target.dmgEl.textContent = '总伤害 ' + window.scarecrowTotalDmg;
 }
 target.hp-=damage;
 if(target.hp<0) target.hp=0;

 // 伤害数字绑定真实受击单位位置
 showDamageFloat('-'+damage,'#ffffff',target);

 if(target && target.isBoss){
   window.frogHitFlash=120;
 }

 // HP归零统一死亡处理
 if(target.hp<=0){
   if(typeof target.die==='function'){
     target.die();
   }else if(target===window.frog && typeof frogDeath==='function'){
     frogDeath();
   }else{
     target.dead=true;
     target.visible=false;
     target.alive=false;
   }
   if(target.isBoss || target===window.frog) window.gameWin=true;
 }
}

function showHealFloat(target){
 showDamageFloat('+30','#65ff65',target);
}
window.showHealFloat=showHealFloat;
