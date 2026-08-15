// V4.4.2 妙脆角猫资源同步系统
class MiaocuijiaoCat extends BasePlayer {
 constructor(){
  super({
   name:"妙脆角猫",
   hp:100,
   attack:25,
   speed:5
  });
  this.horns=2;
  this.maxHorns=2;
  this.hornCooldowns=[0,0];
  window.miaocat=this;
  this.syncHornUI();
 }

 syncHornUI(){
  window.miaocatCorn=this.horns;
  window.hornCooldowns=this.hornCooldowns;
  window.hornCooldownLeft=Math.max(...this.hornCooldowns);
  window.hornCooldowns=this.hornCooldowns.slice();
  if(window.updateCornSprite) window.updateCornSprite();
  if(window.updateMiaoCatSprite) window.updateMiaoCatSprite();
  if(window.updateV13UI) window.updateV13UI();
 }

 useHornHeal(amount){
  let index=this.hornCooldowns.findIndex(v=>v<=0);
  if(index!==-1){
   this.horns=Math.max(0,this.horns-1);
   this.heal(amount);
   this.hornCooldowns[index]=30000;
   this.syncHornUI();
   return true;
  }
  return false;
 }

 update(dt){
  let changed=false;
  for(let i=0;i<this.hornCooldowns.length;i++){
   if(this.hornCooldowns[i]>0){
    this.hornCooldowns[i]-=dt;
    if(this.hornCooldowns[i]<=0){
     this.hornCooldowns[i]=0;
     if(this.horns<this.maxHorns)this.horns++;
     changed=true;
    }
   }
  }
  if(changed || window.updateV13UI) this.syncHornUI();
 }
}
