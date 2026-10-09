(()=>{
'use strict';
const D=window.SKY_COMPETITION_DATA;if(!D)return;D.examSources=D.examSources||{};
const today='2026-10-08';
const generic={
 'State Teacher Exam':{url:'',status:'SELECT STATE / OFFICIAL NOTICE REQUIRED',verified:today},
 'State PCS':{url:'',status:'SELECT STATE COMMISSION / OFFICIAL NOTICE REQUIRED',verified:today},
 'SI':{url:'',status:'SELECT RECRUITING BOARD / OFFICIAL NOTICE REQUIRED',verified:today},
 'Constable':{url:'',status:'SELECT RECRUITING BOARD / OFFICIAL NOTICE REQUIRED',verified:today},
 'Defence Exam':{url:'https://joinindianarmy.nic.in/',status:'GENERIC HUB • SELECT EXACT EXAM',verified:today},
 'B.Ed Entrance':{url:'',status:'SELECT UNIVERSITY/STATE OFFICIAL NOTICE',verified:today},
 'D.El.Ed Entrance':{url:'',status:'SELECT STATE OFFICIAL NOTICE',verified:today},
 'Entrance Exam':{url:'',status:'SELECT EXACT EXAM / OFFICIAL NOTICE',verified:today}
};
Object.assign(D.examSources,generic);
for(const s of ['General Studies','General Knowledge','Current Affairs','Reasoning','Mathematics','Hindi','English','Computer','Science','Geography','History','Polity','Economy','Environment'])D.examSources[s]={url:'',status:'SUBJECT HUB • NO SINGLE OFFICIAL EXAM',verified:today};
Object.entries(D.examSubjects||{}).forEach(([exam,subjects])=>{
 D.examBlueprints=D.examBlueprints||{}; const old=D.examBlueprints[exam]||{};
 D.examBlueprints[exam]={...old,subjects:[...new Set(subjects||[])],source:D.examSources[exam]||old.source||null,sourceStatus:(D.examSources[exam]?.status)||old.sourceStatus||'NEEDS REVIEW',lastVerified:(D.examSources[exam]?.verified)||old.lastVerified||''};
});
})();
