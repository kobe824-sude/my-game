// V4.2 Player Framework
class BasePlayer {
 constructor(config){
  this.name=config.name||"player";
  this.maxHp=config.hp||100;
  this.hp=this.maxHp;
  this.attack=config.attack||1;
  this.speed=config.speed||1;
  this.state="IDLE";
 }
 takeDamage(value){
  this.hp=Math.max(0,this.hp-value);
  this.state="HURT";
  if(this.hp<=0)this.state="DEAD";
 }
 heal(value){
  this.hp=Math.min(this.maxHp,this.hp+value);
 }
 updateState(next){
  this.state=next;
 }
}
