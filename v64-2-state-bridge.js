/* V66: one authoritative state for legacy external modules. No timers or network calls. */
(()=>{
 "use strict";
 if(!Object.getOwnPropertyDescriptor(window,'sb')?.get)Object.defineProperty(window,'sb',{configurable:true,get:()=>sb,set:value=>{sb=value}});
 if(!Object.getOwnPropertyDescriptor(window,'user')?.get)Object.defineProperty(window,'user',{configurable:true,get:()=>user,set:value=>{user=value}});
 if(!Object.getOwnPropertyDescriptor(window,'profile')?.get)Object.defineProperty(window,'profile',{configurable:true,get:()=>profile,set:value=>{profile=value}});
 if(!Object.getOwnPropertyDescriptor(window,'school')?.get)Object.defineProperty(window,'school',{configurable:true,get:()=>school,set:value=>{school=value}});
 if(!Object.getOwnPropertyDescriptor(window,'page')?.get)Object.defineProperty(window,'page',{configurable:true,get:()=>page,set:value=>{page=value}});
 if(!Object.getOwnPropertyDescriptor(window,'cfg')?.get)Object.defineProperty(window,'cfg',{configurable:true,get:()=>cfg,set:value=>{cfg=value}});
 if(!Object.getOwnPropertyDescriptor(window,'v14TeacherProfile')?.get)Object.defineProperty(window,'v14TeacherProfile',{configurable:true,get:()=>v14TeacherProfile,set:value=>{v14TeacherProfile=value}});
 if(!Object.getOwnPropertyDescriptor(window,'v14TeacherClasses')?.get)Object.defineProperty(window,'v14TeacherClasses',{configurable:true,get:()=>v14TeacherClasses,set:value=>{v14TeacherClasses=value}});
 if(!Object.getOwnPropertyDescriptor(window,'v14TeacherSubjects')?.get)Object.defineProperty(window,'v14TeacherSubjects',{configurable:true,get:()=>v14TeacherSubjects,set:value=>{v14TeacherSubjects=value}});
 if(!Object.getOwnPropertyDescriptor(window,'cls'))Object.defineProperty(window,'cls',{configurable:true,get:()=>cls});
 if(!Object.getOwnPropertyDescriptor(window,'M'))Object.defineProperty(window,'M',{configurable:true,get:()=>M});
 if(!Object.getOwnPropertyDescriptor(window,'esc'))Object.defineProperty(window,'esc',{configurable:true,get:()=>esc});
 if(!Object.getOwnPropertyDescriptor(window,'money'))Object.defineProperty(window,'money',{configurable:true,get:()=>money});
 if(!Object.getOwnPropertyDescriptor(window,'today'))Object.defineProperty(window,'today',{configurable:true,get:()=>today});
 if(!Object.getOwnPropertyDescriptor(window,'$'))Object.defineProperty(window,'$',{configurable:true,get:()=>$});
})();
