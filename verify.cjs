const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/index.html','utf8');let syntax=0;
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){if(/\bsrc\s*=|application\/ld\+json|application\/json/i.test(m[1]))continue;new vm.Script(m[2]);syntax++}
let tests=0;const check=(name,fn)=>Promise.resolve().then(fn).then(()=>{tests++;console.log('PASS',name)});
const slice=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
(async()=>{
const nodes=new Map(),calls=[];let origin={remove(){nodes.delete('v64Modal')}};
const detail={textContent:''};const modal={remove(){nodes.delete('v64Modal');nodes.delete('v6419SearchDetail')},querySelector(s){return s==='#v6419SearchDetail'?detail:{}},querySelectorAll(){return []}};
const ctx={document:{getElementById:id=>nodes.get(id),body:{appendChild:n=>{nodes.set('v64Modal',n)}}},user:{id:'admin'},v90Admin:()=>true,toast:x=>calls.push(x),v764SearchRows:[{route:'students',record_id:'s-42'}],v64Modal:()=>{nodes.set('v64Modal',modal);nodes.set('v6419SearchDetail',detail)},dashboardStudentFull:async id=>calls.push(id),dashboardTeacherFull:async id=>calls.push(id),v6419OpenModuleResult:async i=>calls.push('module-'+i)};
vm.createContext(ctx);vm.runInContext(slice('let v6419SearchOrigin=null;','async function v6419OpenModuleResult'),ctx);
await check('Open student uses exact ID and replaces blocking popup',async()=>{nodes.set('v64Modal',origin);await ctx.v764OpenSearchResult(0);assert.equal(calls.pop(),'s-42');assert.equal(nodes.get('v64Modal'),modal)});
await check('Back restores same popup and cached results',()=>{ctx.v6419SearchBack();assert.equal(nodes.get('v64Modal'),origin);assert.equal(ctx.v764SearchRows[0].record_id,'s-42')});
await check('Open staff uses exact ID',async()=>{ctx.v764SearchRows=[{route:'staff',record_id:'t-8'}];await ctx.v764OpenSearchResult(0);assert.equal(calls.pop(),'t-8');ctx.v6419SearchBack()});
await check('Role guard prevents detail access',async()=>{ctx.v90Admin=()=>false;await ctx.v764OpenSearchResult(0);assert.match(calls.pop(),/Admin/);ctx.v90Admin=()=>true});
await check('Missing record ID reports specific error',async()=>{ctx.v764SearchRows=[{route:'students'}];await ctx.v764OpenSearchResult(0);assert.match(calls.pop(),/record ID/)});
await check('Page search discards late response',async()=>{
let pending=[],box={isConnected:true,innerHTML:''},input={value:'old'};
const c={v90Q:id=>id==='v90MasterQ'?input:box,sb:{rpc:()=>new Promise(r=>pending.push(r))},v90Safe:String,v764SearchRows:[]};vm.createContext(c);vm.runInContext(slice('let v6419SearchRevision=0;','/* ---------- SMART STUDENT'),c);
const first=c.v90RunMasterSearch();input.value='new';const second=c.v90RunMasterSearch();pending[1]({data:[{title:'NEW',module:'Students'}]});await second;pending[0]({data:[{title:'OLD',module:'Students'}]});await first;assert.equal(c.v764SearchRows[0].title,'NEW');
});
console.log(JSON.stringify({inline_script_syntax_pass:syntax,behavior_pass:tests,live_database_tested:false,browser_tested:false}));
})().catch(e=>{console.error(e);process.exitCode=1});
