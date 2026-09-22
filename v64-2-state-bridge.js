/* V64.2: expose live lexical state to existing extension modules, without copying it. */
(()=>{'use strict';
 const bindings={
 sb:{get:()=>sb,set:v=>{sb=v}},user:{get:()=>user,set:v=>{user=v}},
 profile:{get:()=>profile,set:v=>{profile=v}},school:{get:()=>school},cls:{get:()=>cls},
 v69CurrentExam:{get:()=>typeof v69CurrentExam==='undefined'?null:v69CurrentExam}
 };
 for(const [key,descriptor] of Object.entries(bindings)){
  const old=Object.getOwnPropertyDescriptor(window,key);
  if(!old||old.configurable)Object.defineProperty(window,key,{...descriptor,configurable:true});
 }
})();
