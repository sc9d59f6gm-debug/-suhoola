/* اختبارات محرك النماذج (المرحلة 2). التشغيل: SP=<مجلد مؤقت> node tests/engine.js  (يتطلب خادماً على المنفذ 8765) */
const {chromium}=require(process.env.PW||'/opt/npm-tools/node_modules/playwright');
const fs=require('fs'),crypto=require('crypto'),os=require('os');
const TMP=process.env.SP||os.tmpdir(),URL='http://localhost:8765/index.html';
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const SCHEMA=`
FE.defineSchema({id:'tcol',title:'سجلات الاختبار',singular:'سجل',titleField:'title',statusField:'status',priorityField:'prio',dateField:'date',
 numbering:{prefix:'T',pad:3},unique:[['title','date']],
 statuses:[{v:'new',l:'جديد',tone:'info'},{v:'done',l:'منجز',tone:'ok'},{v:'hold',l:'مؤجل',tone:'warn'}],
 validate:v=>v.title=='ممنوع'?{title:'عنوان محجوز'}:{},
 groups:[{id:'a',title:'البيانات الأساسية'},{id:'b',title:'التفاصيل'}],
 fields:[
  {key:'title',type:'text',label:'العنوان',required:true,group:'a',maxLength:50},
  {key:'date',type:'date',label:'التاريخ',required:true,group:'a'},
  {key:'end',type:'date',label:'النهاية',group:'a',notBefore:'date'},
  {key:'time',type:'time',label:'الوقت',group:'a'},
  {key:'status',type:'status',label:'الحالة',required:true,group:'a'},
  {key:'prio',type:'priority',label:'الأولوية',group:'a'},
  {key:'kind',type:'select',label:'النوع',options:['أ','ب'],group:'b'},
  {key:'tags',type:'multiselect',label:'وسوم',options:['x','y','z'],max:2,group:'b'},
  {key:'mode',type:'radio',label:'النمط',options:['م1','م2'],group:'b'},
  {key:'pct',type:'number',label:'النسبة',unit:'%',min:0,max:100,group:'b'},
  {key:'ok',type:'checkbox',label:'تأكيد',text:'أؤكد صحة البيانات',group:'b'},
  {key:'reason',type:'textarea',label:'سبب التأجيل',showIf:v=>v.status=='hold',required:true,group:'b'},
  {key:'files',type:'file',label:'مرفقات',max:3,group:'b'},
  {key:'acts',type:'rows',label:'الإجراءات',rowLabel:'إجراء',addLabel:'إضافة إجراء',group:'b',fields:[
    {key:'what',type:'text',label:'الإجراء',required:true},{key:'who',type:'text',label:'المسؤول'},{key:'due',type:'date',label:'الموعد'}]},
  {key:'parent',type:'ref',ref:'tcol',label:'مرتبط بـ',group:'b'}]});`;
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
async function mk(w,h){const ctx=await b.newContext({serviceWorkers:'block',viewport:{width:w||390,height:h||844},acceptDownloads:true,locale:'ar-SA',timezoneId:'Asia/Riyadh'});
  await ctx.route('**/sections.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(__dirname+'/../sections.js','utf8')+SCHEMA}));
  const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.on('console',m=>{if(m.type()=='error'&&!/fonts|ERR_|favicon|net::/.test(m.text()))p.errs.push(m.text())});
  await p.goto(URL);await p.fill('#pin','1234');await p.click('#login button');return {ctx,p}}
let {ctx,p}=await mk();
const V=o=>p.evaluate(o=>FE.validate(FE.schemas.tcol,Object.assign(FE.defaults(FE.schemas.tcol),o)),o);
const openAdd=()=>p.evaluate(()=>{window.__saved=null;FE.form(FE.schemas.tcol,{onSaved:(r,m)=>{window.__saved=[r.id,m,r.no]}})});
const fld=k=>`.fe-layer .fe-field[data-key="${k}"]`;
const chip=(k,t)=>p.click(`${fld(k)} label:has-text("${t}")`);

/* A. تعريف Schema */
const e=await p.evaluate(()=>{const t=fn=>{try{fn();return 'NO-THROW'}catch(x){return x.message}},B=()=>({id:'x1',title:'t',fields:[{key:'a',type:'text',label:'A'}]});
 return {dup:t(()=>FE.defineSchema({...B(),fields:[{key:'a',type:'text',label:'A'},{key:'a',type:'text',label:'B'}]})),
  type:t(()=>FE.defineSchema({...B(),fields:[{key:'a',type:'nope',label:'A'}]})),
  res:t(()=>FE.defineSchema({...B(),fields:[{key:'id',type:'text',label:'A'}]})),
  sel:t(()=>FE.defineSchema({...B(),fields:[{key:'a',type:'select',label:'A'}]})),
  rowsFile:t(()=>FE.defineSchema({...B(),fields:[{key:'a',type:'rows',label:'A',fields:[{key:'f',type:'file',label:'F'}]}]})),
  status:t(()=>FE.defineSchema({...B(),fields:[{key:'a',type:'status',label:'A'}]})),
  title:t(()=>FE.defineSchema({...B(),titleField:'zz'})),
  ok:t(()=>FE.defineSchema({...B(),id:'x2'}))}});
ok(/مكرر/.test(e.dup)&&/نوع غير معروف/.test(e.type)&&/محجوز/.test(e.res)&&/بلا خيارات/.test(e.sel)&&/غير مسموح داخل rows/.test(e.rowsFile)&&/statuses/.test(e.status)&&/titleField/.test(e.title)&&e.ok=='NO-THROW','defineSchema rejects invalid schemas, accepts valid');

/* B. التحقق (بدون DOM) */
let r=await V({});ok(r.errors.title&&r.errors.date&&!r.errors.status,'required fields flagged, defaults satisfy status');
r=await V({title:'ن'.repeat(51),date:'2026-10-04'});ok(/لا يزيد عن 50/.test(r.errors.title),'maxLength');
r=await V({title:'a',date:'2026-02-31'});ok(/تاريخ غير صالح/.test(r.errors.date),'impossible date rejected');
r=await V({title:'a',date:'2026-10-10',end:'2026-10-01'});ok(/يجب ألا يسبق/.test(r.errors.end),'end before start rejected');
r=await V({title:'a',date:'2026-10-10',pct:150});ok(/لا يزيد عن 100/.test(r.errors.pct),'number max');
r=await V({title:'a',date:'2026-10-10',pct:'abc'});ok(/رقماً/.test(r.errors.pct),'number type');
r=await V({title:'a',date:'2026-10-10',tags:['x','y','z']});ok(/الحد الأقصى 2/.test(r.errors.tags),'multiselect max');
r=await V({title:'a',date:'2026-10-10',tags:['q']});ok(/غير مسموحة/.test(r.errors.tags),'multiselect invalid option');
r=await V({title:'a',date:'2026-10-10',kind:'ج'});ok(/غير مسموحة/.test(r.errors.kind),'select invalid option');
r=await V({title:'a',date:'2026-10-10',status:'hold'});ok(r.errors.reason&&/مطلوب/.test(r.errors.reason),'conditional required (showIf)');
r=await V({title:'a',date:'2026-10-10',status:'new',reason:''});ok(!r.errors.reason,'hidden field not required');
r=await V({title:'a',date:'2026-10-10',acts:[{_id:'1',what:'',who:'س',due:''}]});ok(r.errors['acts.0.what'],'row sub-field required (path acts.0.what)');
r=await V({title:'a',date:'2026-10-10',acts:[{_id:'1',what:'ok',who:'',due:'2026-13-45'}]});ok(r.errors['acts.0.due'],'row sub-field date validated');
r=await V({title:'a',date:'2026-10-10',parent:'nope'});ok(/غير موجود/.test(r.errors.parent),'ref to missing record rejected');
r=await V({title:'ممنوع',date:'2026-10-10'});ok(r.errors.title=='عنوان محجوز','custom schema validate hook');
r=await V({title:'a',date:'2026-10-10',time:'25:61'});ok(/وقت غير صالح/.test(r.errors.time),'time validated');
let n=await p.evaluate(()=>FE.normalize(FE.schemas.tcol,{title:' x ',date:'bad',status:'new',reason:'يجب أن يُمسح',pct:'٥٠',tags:['x','x','y'],acts:[{what:'a'},{what:'',who:''}]}));
ok(n.title=='x'&&n.date==''&&n.reason==''&&n.pct==50&&n.tags.length==2&&n.acts.length==1&&n.acts[0]._id,'normalize: trim, bad date cleared, hidden cleared, Arabic digits, dedupe, empty rows dropped, row ids');

/* C. واجهة الإضافة */
await openAdd();
ok(await p.isVisible('.fe-layer'),'form opens');
ok(await p.locator('.fe-layer .fe-group').count()==2&&await p.locator('.fe-layer .fe-field').count()>=15,'form has sections and fields');
ok(await p.locator(fld('reason')).isHidden(),'conditional field hidden initially');
await p.click('.fe-foot [data-act=save]');
ok(await p.isVisible('.fe-summary')&&(await p.textContent(fld('title')+' .fe-err')).includes('مطلوب'),'empty submit shows summary + inline error');
ok(await p.getAttribute(fld('title')+' input','aria-invalid')=='true','aria-invalid set');
ok(await p.evaluate(()=>document.activeElement&&document.activeElement.name=='title'),'focus moves to first invalid field');
await p.fill(fld('title')+' input','اجتماع الاختبار');await p.fill(fld('date')+' input','2026-10-06');
ok((await p.textContent(fld('date')+' .fe-hij')).includes('هـ'),'Hijri date hint shown');
await chip('status','مؤجل');ok(await p.locator(fld('reason')).isVisible(),'showIf reveals reason when status=hold');
await p.click('.fe-foot [data-act=save]');
ok((await p.textContent(fld('reason')+' .fe-err')).includes('مطلوب'),'conditional required enforced');
await p.fill(fld('reason')+' textarea','بانتظار الموافقة');await chip('status','جديد');ok(await p.locator(fld('reason')).isHidden(),'reason hidden again');
await p.click(fld('acts')+' [data-act=addrow]');await p.fill('.fe-row [name=who]','مسؤول');await p.click('.fe-foot [data-act=save]');
ok((await p.textContent('.fe-row .fe-err')).includes('مطلوب'),'row field error rendered inline');
await p.fill('.fe-row [name=what]','إجراء أول');await p.fill('.fe-row [name=who]','مسؤول تجريبي');
await chip('prio','عالية');await p.fill(fld('pct')+' input','٧٥');
const f1=TMP+'/eng-a.pdf';fs.writeFileSync(f1,Buffer.concat([Buffer.from('%PDF eng '),crypto.randomBytes(300000)]));
await p.setInputFiles(fld('files')+' input[type=file]',f1);await p.waitForTimeout(300);
ok(await p.locator(fld('files')+' .fe-file').count()==1,'file listed after selection');
const key1=await p.evaluate(()=>document.querySelector('.fe-layer .fe-file a').dataset.file);
ok(await p.evaluate(k=>fget(k).then(x=>!!x),key1),'file stored in IndexedDB immediately');
await p.click('.fe-foot [data-act=save]');await p.waitForTimeout(200);
ok(!(await p.isVisible('.fe-layer')),'form closes after save');
ok((await p.textContent('#toast')).includes('تمت إضافة'),'success toast');
let sv=await p.evaluate(()=>window.__saved);ok(sv&&sv[1]=='add'&&sv[2]=='T-001','onSaved called, number T-001');
let rec=await p.evaluate(()=>FE.store.list('tcol')[0]);
ok(rec.pct==75&&rec.prio=='high'&&rec.acts.length==1&&rec.files.length==1&&rec.log.length==1&&rec.log[0].t=='created','record stored correctly with attachment and log');
await p.evaluate(()=>{});

/* D. تكرار / تعديل / سجل زمني */
await openAdd();await p.fill(fld('title')+' input','اجتماع الاختبار');await p.fill(fld('date')+' input','2026-10-06');await p.click('.fe-foot [data-act=save]');
ok((await p.textContent(fld('title')+' .fe-err')).includes('يوجد سجل مماثل'),'duplicate record rejected');
await p.click('.fe-foot [data-act=cancel]');
ok(await p.isVisible('.fe-dlg'),'cancel after typing asks to discard');
await p.click('.fe-dlg [data-r="0"]');ok(await p.isVisible('.fe-layer'),'declining keeps the form');
await p.click('.fe-foot [data-act=cancel]');await p.click('.fe-dlg [data-r="1"]');ok(!(await p.isVisible('.fe-layer')),'confirming discards');
await p.evaluate(id=>{FE.form(FE.schemas.tcol,{record:FE.store.get('tcol',id)})},rec.id);
ok((await p.inputValue(fld('title')+' input'))=='اجتماع الاختبار'&&(await p.inputValue(fld('pct')+' input'))=='75','edit form is prefilled');
await p.click('.fe-foot [data-act=save]');await p.waitForTimeout(150);
ok(await p.evaluate(()=>FE.store.list('tcol')[0].log.length)==1,'save without changes adds no log entry');
await p.evaluate(id=>{FE.form(FE.schemas.tcol,{record:FE.store.get('tcol',id)})},rec.id);
await p.fill(fld('title')+' input','عنوان معدّل');await chip('status','منجز');await p.click('.fe-foot [data-act=save]');await p.waitForTimeout(150);
rec=await p.evaluate(()=>FE.store.list('tcol')[0]);
ok(rec.title=='عنوان معدّل'&&rec.status=='done'&&rec.log.some(x=>x.t=='edited'&&x.x.includes('العنوان'))&&rec.log.some(x=>x.t=='status'&&x.x.includes('منجز')),'edit logs changed fields and status transition');

/* E. نسخ السجل */
await p.evaluate(id=>{FE.form(FE.schemas.tcol,{record:FE.store.get('tcol',id)})},rec.id);
await p.click('.fe-foot [data-act=copy]');await p.waitForTimeout(150);
ok(await p.isVisible('.fe-note')&&(await p.inputValue(fld('title')+' input')).endsWith('(نسخة)'),'copy mode opens prefilled with note');
ok(await p.locator(fld('files')+' .fe-file').count()==0&&await p.isChecked(fld('status')+' input[value=new]'),'copy drops attachments and resets status');
await p.fill(fld('date')+' input','2026-10-07');await p.click('.fe-foot [data-act=save]');await p.waitForTimeout(150);
sv=await p.evaluate(()=>window.__saved);
ok(await p.evaluate(()=>FE.store.list('tcol').length)==2,'copy saved as a new record');
const copyRec=await p.evaluate(()=>FE.store.list('tcol')[1]);ok(copyRec.no=='T-002'&&copyRec.id!=rec.id,'copy gets its own number (T-002)');

/* F. ref بين السجلات */
await openAdd();await p.fill(fld('title')+' input','مرتبط');await p.fill(fld('date')+' input','2026-10-08');
ok(await p.locator(fld('parent')+' option').count()==3,'ref select lists the existing records');
await p.selectOption(fld('parent')+' select',rec.id);await p.click('.fe-foot [data-act=save]');await p.waitForTimeout(150);
const linked=await p.evaluate(()=>FE.store.list('tcol')[2]);ok(linked.parent==rec.id,'ref value stored');
ok(await p.evaluate(()=>FE.detailHTML(FE.schemas.tcol,FE.store.list('tcol')[2]).includes('data-open="tcol|')),'detail renders ref as link');

/* G. المرفقات: إلغاء/إزالة */
await p.evaluate(id=>{FE.form(FE.schemas.tcol,{record:FE.store.get('tcol',id)})},rec.id);
const f2=TMP+'/eng-b.txt';fs.writeFileSync(f2,'hello');await p.setInputFiles(fld('files')+' input[type=file]',f2);await p.waitForTimeout(250);
const key2=await p.evaluate(()=>[...document.querySelectorAll('.fe-layer .fe-file a')].map(a=>a.dataset.file)[1]);
ok(await p.evaluate(k=>fget(k).then(x=>!!x),key2),'new attachment stored while editing');
await p.click('.fe-foot [data-act=cancel]');await p.click('.fe-dlg [data-r="1"]');await p.waitForTimeout(250);
ok(!(await p.evaluate(k=>fget(k).then(x=>!!x),key2)),'cancel deletes newly added attachment');
ok(await p.evaluate(k=>fget(k).then(x=>!!x),key1),'cancel keeps original attachment');
await p.evaluate(id=>{FE.form(FE.schemas.tcol,{record:FE.store.get('tcol',id)})},rec.id);
await p.click('.fe-file [data-act=rmfile]');ok(await p.evaluate(k=>fget(k).then(x=>!!x),key1),'removed attachment kept until save');
await p.click('.fe-foot [data-act=save]');await p.waitForTimeout(300);
ok(!(await p.evaluate(k=>fget(k).then(x=>!!x),key1))&&await p.evaluate(()=>FE.store.list('tcol')[0].files.length)==0,'save deletes removed attachment');
await p.evaluate(id=>{FE.form(FE.schemas.tcol,{record:FE.store.get('tcol',id)})},rec.id);
const big=TMP+'/eng-big.bin';fs.writeFileSync(big,Buffer.alloc(26e6));await p.setInputFiles(fld('files')+' input[type=file]',big);await p.waitForTimeout(150);
ok((await p.textContent(fld('files')+' .fe-err')).includes('أكبر من')&&await p.locator(fld('files')+' .fe-file').count()==0,'oversize file rejected with message');
await p.click('.fe-foot [data-act=cancel]');await p.waitForTimeout(100);if(await p.isVisible('.fe-dlg'))await p.click('.fe-dlg [data-r="1"]');

/* H. الأرشفة والاستعادة والحذف النهائي */
await p.evaluate(id=>{FE.form(FE.schemas.tcol,{record:FE.store.get('tcol',id)})},copyRec.id);
await p.click('.fe-foot [data-act=archive]');await p.click('.fe-dlg [data-r="1"]');
ok((await p.textContent('#fe_pe')).includes('مطلوب'),'archive requires a reason');
await p.fill('#fe_pi','انتهى العمل');await p.click('.fe-dlg [data-r="1"]');await p.waitForTimeout(200);
ok(await p.evaluate(()=>FE.store.list('tcol').length)==2&&await p.evaluate(()=>FE.store.archived().length)==1,'archived record leaves the active list and enters the archive');
const ar=await p.evaluate(()=>FE.store.archived()[0].rec);ok(ar.archived.reason=='انتهى العمل'&&ar.archived.at&&ar.log.some(x=>x.t=='archived'),'archive stores date, reason, log');
ok(await p.evaluate(id=>FE.detailHTML(FE.schemas.tcol,FE.store.get('tcol',id)).includes('انتهى العمل'),copyRec.id),'detail shows archive info');
await p.evaluate(id=>FE.store.restore(FE.schemas.tcol,id),copyRec.id);
ok(await p.evaluate(()=>FE.store.list('tcol').length)==3&&await p.evaluate(()=>FE.store.archived().length)==0,'restore returns the record');
ok(await p.evaluate(id=>FE.store.get('tcol',id).log.some(x=>x.t=='restored'),copyRec.id),'restore logged');
// ref to archived record: validation must not allow new links
await p.evaluate(id=>FE.store.archive(FE.schemas.tcol,id,'اختبار'),copyRec.id);
r=await V({title:'zz',date:'2026-12-01',parent:copyRec.id});ok(/غير موجود/.test(r.errors.parent||''),'cannot newly link to an archived record');

/* I. اختصارات لوحة المفاتيح */
await openAdd();await p.keyboard.press('Escape');await p.waitForTimeout(100);ok(!(await p.isVisible('.fe-layer')),'Escape closes a clean form');
await openAdd();await p.fill(fld('title')+' input','باختصار');await p.fill(fld('date')+' input','2026-11-11');await p.keyboard.press('Control+Enter');await p.waitForTimeout(200);
ok(await p.evaluate(()=>FE.store.list('tcol').some(r=>r.title=='باختصار')),'Ctrl+Enter saves');

/* J. التنظيف عند الاستعادة (بيانات خبيثة) */
const san=await p.evaluate(()=>FE.sanitizeAll({tcol:[{id:'a"onload=1',title:'<img src=x onerror=alert(1)>'.repeat(10),date:'٢٠٢٦',status:'مخترع',pct:'9e99',tags:'x',acts:'bad',files:[{k:'a b',n:1},{k:'ok-1',n:'f',s:5}],archived:{at:'no'},log:[{t:'hack',x:'x'},{t:'edited',x:'ok'}]},null,5],nope:[{title:'x'}]}));
const sr=san.tcol[0];ok(Object.keys(san).sort().join()=='nope,tcol'&&san.nope.length==1&&san.tcol.length==1&&sr.id=='aonload1'&&sr.date==''&&sr.status=='مخترع'&&sr.tags.length==0&&sr.acts.length==0&&sr.files.length==1&&!sr.archived&&sr.log.length==1,'sanitizeAll coerces fields, drops junk, keeps unknown collections inert');
const dh=await p.evaluate(()=>FE.detailHTML(FE.schemas.tcol,FE.sanitizeAll({tcol:[{title:'<img src=x onerror=1>',status:'مخترع'}]}).tcol[0]));
ok(!/<img/.test(dh)&&dh.includes('&lt;img'),'old/unknown stored values are preserved but rendered escaped');
const html=await p.evaluate(()=>FE.detailHTML(FE.schemas.tcol,{id:'1',no:'T-9',title:'<img src=x onerror=alert(1)>',date:'2026-10-04',status:'new',reason:'',log:[{t:'edited',x:'<b>x</b>',at:new Date().toISOString()}],acts:[{_id:'1',what:'<script>1</script>'}],tags:[],files:[]}));
ok(!/<img src=x|<script>1|<b>x<\/b>/.test(html)&&html.includes('&lt;img'),'detailHTML escapes all user values');
const st=await p.evaluate(()=>FE.searchText(FE.schemas.tcol,FE.store.list('tcol')[0]));ok(st.includes('t-001')&&st.includes('منجز')&&st.includes('هـ'),'searchText covers number, labels and Hijri date');

/* K. حفظ واسترجاع بعد إعادة التحميل */
const cnt=await p.evaluate(()=>S.data.tcol.length),seq=await p.evaluate(()=>S.seq.tcol);
await p.reload();await p.fill('#pin','1234');await p.click('#login button');
ok(await p.evaluate(()=>S.data.tcol.length)==cnt&&await p.evaluate(()=>S.seq.tcol)==seq,'records and counter persist after reload');
await openAdd();await p.fill(fld('title')+' input','بعد التحميل');await p.fill(fld('date')+' input','2026-12-12');await p.click('.fe-foot [data-act=save]');await p.waitForTimeout(150);
ok((await p.evaluate(()=>window.__saved))[2]==='T-'+String(seq+1).padStart(3,'0'),'numbering continues after reload');

/* L. نسخة احتياطية تشمل بيانات المحرك وملفاته */
await p.evaluate(id=>{FE.form(FE.schemas.tcol,{record:FE.store.get('tcol',id)})},rec.id);
await p.setInputFiles(fld('files')+' input[type=file]',f1);await p.waitForTimeout(250);await p.click('.fe-foot [data-act=save]');await p.waitForTimeout(200);
const [bd]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>bak())]);const bj=JSON.parse(fs.readFileSync(await bd.path(),'utf8'));
const bfiles=Object.keys(bj.files);ok(bj.data.data.tcol.length>=4&&bfiles.length>=1&&!bj.data.ph&&!bj.data.api,'backup includes engine records and files, still no secrets');
fs.writeFileSync(TMP+'/eng-backup.json',JSON.stringify(bj));
const c2=await mk();await c2.p.evaluate(()=>go('more'));await c2.p.setInputFiles('#bi',TMP+'/eng-backup.json');await c2.p.click('.fe-dlg [data-r="1"]');await c2.p.waitForTimeout(700);
ok(await c2.p.evaluate(()=>S.data.tcol&&S.data.tcol.length)==bj.data.data.tcol.length,'restore brings back engine records on a new device');
const k3=bj.data.data.tcol.find(x=>x.files.length).files[0];ok(await c2.p.evaluate(k=>fget(k).then(x=>!!x),k3.k),'restore brings back engine attachments');
await c2.ctx.close();

/* M. تجاوب وشكل */
await openAdd();
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow at 390px with form open');
await p.screenshot({path:TMP+'/eng-form-mobile.png'});
await p.click('.fe-foot [data-act=save]');await p.waitForTimeout(100);await p.screenshot({path:TMP+'/eng-form-errors.png'});
await p.evaluate(()=>{document.documentElement.dataset.theme='dark'});await p.screenshot({path:TMP+'/eng-form-dark.png'});
await p.evaluate(()=>{document.documentElement.dataset.theme='light'});
await p.click('.fe-foot [data-act=cancel]');await p.waitForTimeout(100);
await p.setViewportSize({width:1280,height:900});await p.evaluate(id=>{FE.form(FE.schemas.tcol,{record:FE.store.get('tcol',id)})},rec.id);await p.waitForTimeout(150);await p.screenshot({path:TMP+'/eng-form-desktop.png'});
await p.keyboard.press('Escape');await p.waitForTimeout(100);
await p.evaluate(id=>{const s=FE.schemas.tcol;const d=document.createElement('div');d.id='dt';d.style.cssText='position:fixed;inset:0;z-index:99;background:var(--bg);overflow:auto;padding:16px';d.innerHTML=FE.detailHTML(s,FE.store.get('tcol',id))+FE.ui.empty({title:'لا توجد سجلات',hint:'ابدأ بإضافة أول سجل'})+FE.ui.progress(60)+FE.ui.skeleton(2);document.body.appendChild(d)},rec.id);
await p.screenshot({path:TMP+'/eng-detail.png'});await p.evaluate(()=>document.getElementById('dt').remove());
ok(p.errs.length==0,'no JS errors '+JSON.stringify(p.errs));
console.log(fails?('FAILED '+fails):'ALL PASS');await b.close();process.exit(fails?1:0)})().catch(e=>{console.error('CRASH',e);process.exit(2)});
