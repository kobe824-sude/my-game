// MilkFrog V8.6 AI module
// 状态机定义，供后续扩展玩家系统使用

function setFrogState(next){
 if(typeof frog!=="undefined"){
  frog.state=next;
 }
}
