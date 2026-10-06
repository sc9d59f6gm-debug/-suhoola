const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs'),crypto=require('crypto');
const SP=process.env.SP;let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true,locale:'ar-SA',timezoneId:'Asia/Riyadh'});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()=='error'&&!/fonts|ERR_|favicon|net::/.test(m.text()))errs.push(m.text())});
await p.clock.install({time:new Date('2026-10-04T10:00:00+03:00')});
await p.goto('http://localhost:8765/index.html');
// sha256 vs node
const tests=['','abc','1234','سهولة-٣٤٥٦','x'.repeat(55),'y'.repeat(56),'z'.repeat(64),'q'.repeat(200)];
for(const t of tests){const h=await p.evaluate(t=>sha(t),t);ok(h==crypto.createHash('sha256').update(t).digest('hex'),'sha256 '+JSON.stringify(t).slice(0,18))}
// login: Arabic-Indic digits
await p.fill('#pin','١٢٣٤');await p.click('#login button');
ok(await p.isVisible('#app'),'login with arabic digits');
let st=await p.evaluate(()=>({ph:S.ph.length,pin:S.pin,since:S.since}));
ok(st.ph==64&&!st.pin&&st.since=='2026-10-04','pin hashed, since set');
// Sunday Oct 4 2026 status
let r=await p.evaluate(()=>SEC.map(s=>{const a=st(s);return [s.id,a.cls,ymd(a.d),a.carry,a.pre]}));
console.log(JSON.stringify(r));
const m=Object.fromEntries(r.map(x=>[x[0],x]));
ok(m.wk[2]=='2026-10-06'&&m.tr[2]=='2026-10-08','weekly due Tue/Thu');
ok(m.ev[2]=='2026-10-18'&&m.mt[2]=='2026-10-10','monthly 18 / 10');
ok(m.rd[2]=='2026-10-01'&&m.rd[4]==true&&m.rd[1]!='late','day-1 before first use is not late');
// advance to Wed Oct 7: weekly tue should be late
await p.clock.setFixedTime(new Date('2026-10-07T10:00:00+03:00'));
r=await p.evaluate(()=>SEC.map(s=>[s.id,st(s).cls]));ok(r.find(x=>x[0]=='wk')[1]=='late','Tuesday task late on Wed');
await p.evaluate(()=>{LG('wk').ok=true;save()});
r=await p.evaluate(()=>st(SEC[0]).cls);ok(r=='ok','mark done -> ok');
// next Sunday Oct 11: unfinished Thursday task (Oct 8) must carry as late
await p.clock.setFixedTime(new Date('2026-10-11T10:00:00+03:00'));
r=await p.evaluate(()=>{const a=st(SEC[3]);return [a.cls,a.carry]});ok(r[0]=='late'&&r[1]==true,'unfinished Thu task carries over after week rollover');
await p.evaluate(()=>togP('tr',true));
r=await p.evaluate(()=>st(SEC[3]).carry);ok(r===false,'carry cleared via previous-period checkbox');
// month rollover Nov 1: Oct 18 'ev' unfinished carries
await p.clock.setFixedTime(new Date('2026-11-02T10:00:00+03:00'));
r=await p.evaluate(()=>{const a=st(SEC[1]);return [a.cls,a.carry,ymd(a.pd)]});ok(r[1]===true&&r[2]=='2026-10-18','month rollover carry');
await p.clock.setFixedTime(new Date('2026-10-04T10:00:00+03:00'));
await p.evaluate(()=>{S.logs={};save();go('tasks')});
// attachment upload
fs.writeFileSync(SP+'/doc.pdf',Buffer.concat([Buffer.from('%PDF-1.4 test '),crypto.randomBytes(1500000)]));
await p.setInputFiles('.card:nth-of-type(1) input[type=file]',SP+'/doc.pdf');
await p.waitForTimeout(500);
let sz=await p.evaluate(()=>localStorage.getItem('suhoola').length);ok(sz<5000,'1.5MB attachment kept out of localStorage ('+sz+' chars)');
await p.reload();await p.fill('#pin','1234');await p.click('#login button');await p.evaluate(()=>go('tasks'));
const [d]=await Promise.all([p.waitForEvent('download'),p.click('a:has-text("doc.pdf")')]);
const pth=await d.path();ok(fs.readFileSync(pth).equals(fs.readFileSync(SP+'/doc.pdf')),'attachment survives reload and downloads identical');
// wrong pin
await p.reload();await p.fill('#pin','9999');await p.click('#login button');ok(!(await p.isVisible('#app')),'wrong pin rejected');
await p.fill('#pin','1234');await p.click('#login button');
// items, forms
await p.evaluate(()=>{lt=3;go('lists')});await p.fill('#it','<img src=x onerror=alert(1)> عنصر');await p.click('text=إضافة >> nth=-1');
ok(await p.evaluate(()=>S.items.length)==1,'item added');
await p.evaluate(()=>{FB={n:'نموذج',f:[{l:'الاسم',t:'text'},{l:'مؤكد',t:'checkbox'}]};saveF();});
await p.evaluate(()=>{const f=S.forms[0];fill(f.id)});await p.fill('#v0','أحمد');await p.check('#v1');await p.click('#sh .btn.p');
ok(await p.evaluate(()=>S.resp.length)==1,'form response saved');
// backup
await p.evaluate(()=>go('more'));
const [bd]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>bak())]);
const bj=JSON.parse(fs.readFileSync(await bd.path(),'utf8'));
ok(bj.v==2&&!bj.data.ph&&!bj.data.api&&!bj.data.salt&&Object.keys(bj.files).length==1,'backup excludes secrets, includes file');
fs.writeFileSync(SP+'/backup.json',JSON.stringify(bj));
// wipe + restore into fresh context
const c2=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p2=await c2.newPage();await p2.goto('http://localhost:8765/index.html');
await p2.fill('#pin','5555');await p2.click('#login button');
await p2.evaluate(()=>go('more'));await p2.setInputFiles('#bi',SP+'/backup.json');await p2.click('.fe-dlg [data-r="1"]');await p2.waitForTimeout(600);
ok(await p2.evaluate(()=>S.items.length==1&&S.forms.length==1&&S.resp.length==1),'restore data');
ok(await p2.evaluate(()=>sha(S.salt+'5555')==S.ph),'restore keeps new device pin');
await p2.evaluate(()=>go('tasks'));
const [d2]=await Promise.all([p2.waitForEvent('download'),p2.click('a:has-text("doc.pdf")')]);
ok(fs.readFileSync(await d2.path()).equals(fs.readFileSync(SP+'/doc.pdf')),'restored attachment identical');
// malicious backup
const evil={logs:{'wk:2026-10-04':{ok:true,n:'x',f:{0:{n:'a',d:'javascript:alert(1)'},1:{n:'"><svg onload=alert(2)>',k:'a"b'}}},'__proto__':{ok:1},'bad':null},items:[{id:'x\' onclick=\'alert(3)',ty:99,t:'<b>t</b>',d:'"><img src=x onerror=alert(4)>',n:'n',done:1}],forms:[{id:'q\');alert(5);//',n:'f',f:[{l:'l',t:'constructor'}]}],resp:[{fid:'z',at:'<i>',v:{a:'<u>'}}],pin:'0',ph:'',api:'sk-evil'};
fs.writeFileSync(SP+'/evil.json',JSON.stringify(evil));
let dialogs=0;p2.on('dialog',d=>{dialogs++;d.dismiss()});
await p2.evaluate(()=>go('more'));await p2.setInputFiles('#bi',SP+'/evil.json');await p2.click('.fe-dlg [data-r="1"]');await p2.waitForTimeout(300);
for(const pg of['home','tasks','lists','cal','more','forms']){await p2.evaluate(pg=>go(pg),pg)}
await p2.evaluate(()=>{lt=0;go('lists')});await p2.evaluate(()=>pdf&&0);
const html=await p2.evaluate(()=>document.body.innerHTML);
const sy=await p2.evaluate(()=>({it:S.items[0],forms:S.forms[0],api:S.api,ph:S.ph.length,pin:S.pin,k:Object.keys(S.logs),f:S.logs['wk:2026-10-04']&&S.logs['wk:2026-10-04'].f}));
console.log(JSON.stringify(sy));
ok(dialogs==0&&!/onerror=alert|onload=alert/.test(html.replace(/&lt;[^]*?&gt;/g,'')),'no executed/injected handlers after malicious restore');
ok(sy.api==''&&sy.ph==64&&!sy.pin,'restore cannot override pin/api');
ok(sy.forms.f[0].t=='text','unknown field type sanitised');
// import
await p2.evaluate(()=>{S.items=[];save();lt=3;go('more')});
await p2.setInputFiles('#xi',__dirname+'/in.xlsx');await p2.waitForTimeout(500);
let items=await p2.evaluate(()=>S.items.map(i=>[LT[i.ty],i.t,i.d,i.done]));console.log(JSON.stringify(items));
ok(items.length==2&&items[0][2]=='2026-10-02'&&items[0][3]===true&&items[1][2]=='2026-10-05','xlsx import (shared strings, serial date, unknown type skipped)');
await p2.setInputFiles('#xi',__dirname+'/in.xlsx');await p2.waitForTimeout(400);
ok(await p2.evaluate(()=>S.items.length)==2,'re-import deduplicated');
await p2.setInputFiles('#xi',__dirname+'/in.csv');await p2.waitForTimeout(400);
items=await p2.evaluate(()=>S.items.map(i=>i.t+'|'+i.n));ok(items.some(x=>x.startsWith('عنوان "مقتبس" ; فاصلة|سطر1')),'csv import with ; delimiter, quotes, newline');
// export xlsx and read with openpyxl
const [xd]=await Promise.all([p2.waitForEvent('download'),p2.evaluate(()=>xlsx())]);
await xd.saveAs(SP+'/out.xlsx');
await p2.setInputFiles('#xi',SP+'/out.xlsx');await p2.waitForTimeout(400);
ok(await p2.evaluate(()=>S.items.length)==3,'own xlsx round-trips (deflate-less zip read by app)');
// UI
await ctx.close();
const c3=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'ar-SA'});const p3=await c3.newPage();
await p3.clock.install({time:new Date('2026-10-04T10:00:00+03:00')});
await p3.goto('http://localhost:8765/index.html');await p3.fill('#pin','1234');await p3.click('#login button');
await p3.evaluate(()=>{S.items.push({id:'a',ty:3,t:'عنصر تجريبي بعنوان طويل جداً جداً جداً لاختبار الالتفاف في السطر',d:'2026-10-02',n:'',done:true});LG('wk').ok=true;save()});
for(const [n,pg] of [['home','home'],['tasks','tasks'],['cal','cal'],['more','more']]){await p3.evaluate(pg=>{sel='2026-10-06';go(pg)},pg);await p3.screenshot({path:`${SP}/s_${n}.png`,fullPage:false})}
await p3.evaluate(()=>{lt=3;go('lists')});await p3.screenshot({path:SP+'/s_lists.png'});
await p3.evaluate(()=>{document.documentElement.dataset.theme='dark';go('home')});await p3.screenshot({path:SP+'/s_dark.png'});
const ov=await p3.evaluate(()=>document.documentElement.scrollWidth-innerWidth);ok(ov<=0,'no horizontal overflow at 390px ('+ov+')');
ok(errs.length==0,'no JS errors '+JSON.stringify(errs));
console.log(fails?('FAILED '+fails):'ALL PASS');await b.close();process.exit(fails?1:0)})().catch(e=>{console.error('CRASH',e);process.exit(2)});
