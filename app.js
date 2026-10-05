const $=s=>document.querySelector(s),own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DEF=()=>({ph:'',salt:'',since:'',dark:null,logs:{},items:[],forms:[],resp:[],data:{},seq:{},api:'',nt:{},lb:''});
let S=DEF(),LAST='';
try{LAST=localStorage.getItem('suhoola')||'';Object.assign(S,JSON.parse(LAST||'{}'))}catch(e){}
const TQ=[];let TB=0;
let TT=0;function toast(m,k){if(k!==undefined){TQ.length=0;clearTimeout(TT);TB=0}TQ.push([m,k]);if(!TB)nextToast()}
function nextToast(){const q=TQ.shift(),t=$('#toast');if(!q){TB=0;t.style.display='none';return}TB=1;t.textContent=q[0];t.className=q[1]||'';t.style.display='block';TT=setTimeout(nextToast,q[1]=='err'?4200:2600)}
function save(){try{const j=JSON.stringify(S);localStorage.setItem('suhoola',j);LAST=j;return true}catch(e){try{const o=Object.assign(DEF(),JSON.parse(LAST||'{}'));Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,o)}catch(_){}toast('تعذّر الحفظ: مساحة المتصفح ممتلئة');if(!$('#app').hidden)r();return false}}
/* ===== SHA-256 (للرمز) ===== */
function sha256(a){const rr=(v,n)=>(v>>>n)|(v<<(32-n)),mp=Math.pow,mw=mp(2,32);let i,j,res='';const w=[],bl=a.length*8,H=sha256.h=sha256.h||[],K=sha256.k=sha256.k||[];let pc=K.length;const comp={};
for(let c=2;pc<64;c++){if(!comp[c]){for(i=0;i<313;i+=c)comp[i]=c;H[pc]=(mp(c,.5)*mw)|0;K[pc++]=(mp(c,1/3)*mw)|0}}
a+='\x80';while(a.length%64-56)a+='\x00';for(i=0;i<a.length;i++){j=a.charCodeAt(i);w[i>>2]|=j<<((3-i)%4)*8}
w[w.length]=(bl/mw)|0;w[w.length]=bl;
let HH=H;for(j=0;j<w.length;){const x=w.slice(j,j+=16),old=HH;let h=HH.slice(0,8);
for(i=0;i<64;i++){const w15=x[i-15],w2=x[i-2],A=h[0],E=h[4];
const t1=h[7]+(rr(E,6)^rr(E,11)^rr(E,25))+((E&h[5])^(~E&h[6]))+K[i]+(x[i]=(i<16)?x[i]:(x[i-16]+(rr(w15,7)^rr(w15,18)^(w15>>>3))+x[i-7]+(rr(w2,17)^rr(w2,19)^(w2>>>10)))|0);
const t2=(rr(A,2)^rr(A,13)^rr(A,22))+((A&h[1])^(A&h[2])^(h[1]&h[2]));h=[(t1+t2)|0].concat(h);h[4]=(h[4]+t1)|0}
for(i=0;i<8;i++)h[i]=(h[i]+old[i])|0;HH=h}
for(i=0;i<8;i++)for(j=3;j+1;j--){const b=(HH[i]>>(j*8))&255;res+=(b<16?'0':'')+b.toString(16)}return res}
const sha=s=>sha256(String.fromCharCode(...new TextEncoder().encode(s)));
const nd=s=>String(s).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).trim();
const rnd=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
/* ===== البيانات ===== */
const SEC=[
{id:'wk',t:'البرنامج الأسبوعي',f:'w',d:2,dn:'كل ثلاثاء',ok:'تم الرفع',fl:['نموذج البرنامج']},
{id:'ev',t:'الأحداث والأعمال المنجزة',f:'m',d:18,dn:'يوم 18 من الشهر',ok:'تم الرفع',fl:['تقرير أبرز الأحداث','بيان الأعمال المنجزة التفصيلية']},
{id:'mt',t:'اجتماع الهيئة',f:'m',d:10,dn:'يوم 10 من الشهر',ok:'تم التوثيق',fl:['محضر ونماذج الاجتماع']},
{id:'tr',t:'متابعة المعاملات',f:'w',d:4,dn:'كل خميس',ok:'تم الإرسال',fl:['إيجاز المعاملات الأسبوعي']},
{id:'rd',t:'جاهزية الشعبة',f:'m',d:1,dn:'يوم 1 من الشهر الميلادي',ok:'تم التأكيد',fl:['بيان جاهزية الشعبة']}];
const LT=['أبرز الأحداث','الأعمال المستقبلية','الأعمال المستمرة','المنجزات','الإيجاز اليومي','التقارير والأرشفة'],TY={text:'نص',number:'رقم',date:'تاريخ',textarea:'ملاحظات',checkbox:'نعم/لا'};
const z=n=>String(n).padStart(2,'0'),ymd=d=>d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate()),sd=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate()),addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const DRE=/^\d{4}-\d{2}-\d{2}$/,DURE=/^data:[\w\/+.\-]*;base64,[A-Za-z0-9+\/=]*$/,sid=x=>String(x??'').replace(/[^\w-]/g,'').slice(0,40),str=(x,n)=>String(x??'').slice(0,n);
/* تنظيف أي بيانات قادمة من التخزين أو الاستعادة أو الاستيراد */
function clean(d){d=d&&typeof d=='object'?d:{};const o={logs:{},items:[],forms:[],resp:[]};
if(d.logs&&typeof d.logs=='object'&&!Array.isArray(d.logs))for(const[k,v]of Object.entries(d.logs)){if(!/^(wk|ev|mt|tr|rd):\d{4}-\d{2}(-\d{2})?$/.test(k)||!v||typeof v!='object')continue;
const l={ok:!!v.ok,at:DRE.test(v.at)?v.at:'',n:str(v.n,3000),f:{}};
if(v.f&&typeof v.f=='object')for(const[i,x]of Object.entries(v.f)){if(!/^[0-5]$/.test(i)||!x||typeof x!='object')continue;const e={n:str(x.n,200)};if(/^[\w-]{1,60}$/.test(x.k||''))e.k=x.k;else if(typeof x.d=='string'&&DURE.test(x.d))e.d=x.d;if(Number.isFinite(x.s))e.s=x.s;l.f[i]=e}
o.logs[k]=l}
(Array.isArray(d.items)?d.items:[]).forEach((x,n)=>{if(!x||typeof x!='object')return;const t=str(x.t,300).trim();if(!t)return;const ty=Number.isInteger(x.ty)&&x.ty>=0&&x.ty<LT.length?x.ty:0;o.items.push({id:sid(x.id)||'i'+Date.now()+n,ty,t,d:DRE.test(x.d)?x.d:ymd(new Date()),n:str(x.n,2000),done:!!x.done})});
(Array.isArray(d.forms)?d.forms:[]).forEach((x,n)=>{if(!x||typeof x!='object'||!Array.isArray(x.f))return;const f=x.f.filter(q=>q&&typeof q=='object'&&str(q.l,80).trim()).map(q=>({l:str(q.l,80),t:own(TY,q.t)?q.t:'text'}));const nm=str(x.n,100).trim();if(nm&&f.length)o.forms.push({id:sid(x.id)||'f'+Date.now()+n,n:nm,f})});
(Array.isArray(d.resp)?d.resp:[]).forEach(x=>{if(!x||typeof x!='object'||!x.v||typeof x.v!='object')return;const v={};for(const[k,y]of Object.entries(x.v))v[str(k,80)]=str(y,2000);o.resp.push({fid:sid(x.fid),at:DRE.test(x.at)?x.at:'',v})});
o.data=FE.sanitizeAll(d.data);o.seq={};if(d.seq&&typeof d.seq=='object'&&!Array.isArray(d.seq))for(const[k,v]of Object.entries(d.seq))if(own(FE.schemas,k)&&Number.isInteger(v)&&v>=0&&v<1e9)o.seq[k]=v;
return o}
/* ===== المواعيد ===== */
const due=(s,d)=>{d=sd(d);return s.f=='w'?addD(addD(d,-d.getDay()),s.d):new Date(d.getFullYear(),d.getMonth(),s.d)};
const key=(s,d)=>{d=sd(d);return s.id+':'+(s.f=='w'?ymd(addD(d,-d.getDay())):d.getFullYear()+'-'+z(d.getMonth()+1))};
const prev=(s,d,n)=>s.f=='w'?addD(d,-7*n):new Date(d.getFullYear(),d.getMonth()-n,15);
const st=s=>{const t=sd(new Date()),since=S.since||ymd(t),k=key(s,t),l=S.logs[k]||{},d=due(s,t),df=Math.round((d-t)/864e5),pre=ymd(d)<since;
const pp=prev(s,t,1),pk=key(s,pp),pd=due(s,pp),carry=!(S.logs[pk]||{}).ok&&ymd(pd)>=since,ok=!!l.ok,late=(!ok&&df<0&&!pre)||carry;
return{k,l,d,df,pre,pk,pd,carry,ok,late,cls:late?'late':ok?'ok':'pend'}};
const hist=s=>[5,4,3,2,1,0].map(n=>!!(S.logs[key(s,prev(s,new Date(),n))]||{}).ok);
const rel=df=>df<0?'متأخر '+(-df)+' يوم':df==0?'اليوم':df==1?'غداً':'بعد '+df+' يوم';
const bt=(a,s)=>a.carry?'متأخر (فترة سابقة)':a.ok?s.ok:a.late?rel(a.df):a.pre?'قبل بدء الاستخدام':rel(a.df);
const hj=d=>(d||new Date()).toLocaleDateString('ar-SA-u-ca-islamic-umalqura',{weekday:'long',day:'numeric',month:'long',year:'numeric'}),gd=d=>(d||new Date()).toLocaleDateString('ar-SA-u-ca-gregory',{day:'numeric',month:'long',year:'numeric'});
const nextDue=s=>{const a=st(s);if(!(a.ok||a.df<0))return a.d;const t=new Date();return due(s,s.f=='w'?addD(t,7):new Date(t.getFullYear(),t.getMonth()+1,15))};
const fs=n=>!n?'':n>1e6?'('+(n/1e6).toFixed(1)+' MB)':'('+Math.max(1,Math.round(n/1e3))+' KB)';
let cur='home',lt=0,cm=new Date(),sel=null,FB={n:'',f:[]},CH=[];
const NAV=[['home','🏠','الرئيسية'],['tasks','📋','المهام'],['lists','🗂️','السجلات'],['cal','📆','التقويم'],['more','⚙️','المزيد']];
function go(p){cur=p;r();scrollTo(0,0)}
function r(){$('#nv').innerHTML=NAV.map(n=>`<a class="${cur==n[0]||(cur=='forms'&&n[0]=='more')?'on':''}" onclick="go('${n[0]}')"><b>${n[1]}</b>${n[2]}</a>`).join('');$('#view').innerHTML=P[cur]();const tb=$('.tabs a.on');if(tb)tb.scrollIntoView({inline:'center',block:'nearest'})}
/* ===== الرئيسية ===== */
function home(){const A=SEC.map(s=>({s,...st(s)})),done=A.filter(a=>a.cls=='ok').length,late=A.filter(a=>a.cls=='late').length,pend=5-done-late,pct=done*20,nx=A.filter(a=>a.cls!='ok'&&(!a.pre||a.late)).sort((a,b)=>a.d-b.d),H=SEC.map(hist);
const tr=[0,1,2,3,4,5].map(i=>Math.round(H.filter(h=>h[i]).length/5*100)),pts=tr.map((v,i)=>`${285-i*54},${70-v*.6}`).join(' ');
const has=Object.keys(S.logs).length+S.items.length+S.forms.length+Object.keys(S.data).length>0,bk=has&&(!S.lb||(Date.now()-new Date(S.lb))/864e5>14);
return `${bk?`<div class="card warn"><b>احفظ نسخة احتياطية</b><br><small>بياناتك على هذا الجهاز فقط، وقد يمسحها المتصفح عند الإهمال الطويل.</small><button class="btn p" onclick="bak()">حفظ نسخة الآن</button></div>`:''}
<div class="hero"><div><small>${hj()}</small><br><small>${gd()}</small><h2>مرحباً بك</h2><p>${nx[0]?'أقرب موعد: '+nx[0].s.t+' — '+(nx[0].late?'متأخر':rel(nx[0].df)):'أُنجزت كل مهام هذه الفترة 🎉'}</p></div>
<svg width="96" height="96" viewBox="0 0 100 100" role="img" aria-label="نسبة الإنجاز ${pct}%"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="10"/><circle cx="50" cy="50" r="40" fill="none" stroke="#e4c976" stroke-width="10" stroke-linecap="round" stroke-dasharray="${2.513*pct} 251.3" transform="rotate(-90 50 50)"/><text x="50" y="57" text-anchor="middle" fill="#fff" font-size="22" font-weight="800">${pct}%</text></svg></div>
<div class="g3"><div class="stat"><b>${done}</b>منجز</div><div class="stat"><b>${pend}</b>قيد الانتظار</div><div class="stat r"><b>${late}</b>متأخر</div></div>
<div class="card"><h3>الإنجاز في آخر 6 فترات</h3>${SEC.map((s,i)=>{const c=H[i].filter(Boolean).length;return `<div class="bar"><span>${s.t}</span><div><i style="width:${c/6*100}%"></i></div><b>${c}/6</b></div>`}).join('')}</div>
<div class="card"><h3>اتجاه الالتزام العام (%)</h3><svg viewBox="0 0 300 92" width="100%" role="img" aria-label="اتجاه الالتزام"><polyline points="${pts}" fill="none" stroke="#b8923a" stroke-width="3"/>${tr.map((v,i)=>`<circle cx="${285-i*54}" cy="${70-v*.6}" r="4" fill="#0f5b3f"/>`).join('')}<text x="285" y="88" text-anchor="middle" font-size="10" fill="#8a948d">الأقدم</text><text x="15" y="88" text-anchor="middle" font-size="10" fill="#8a948d">الأحدث</text></svg></div>
<div class="card"><h3>المواعيد القادمة</h3>${SEC.map(s=>({s,d:nextDue(s)})).sort((a,b)=>a.d-b.d).map(o=>`<div class="li"><span>${o.s.t}<br><small>${gd(o.d)} · ${hj(o.d).split(' ').slice(1).join(' ')}</small></span><span class="bdg">${rel(Math.round((o.d-sd(new Date()))/864e5))}</span></div>`).join('')}</div>`}
/* ===== المهام والمرفقات ===== */
function tasks(){return SEC.map(s=>{const a=st(s),l=a.l;return `<div class="card"><div class="li"><b>${s.t}</b><span class="bdg ${a.cls=='ok'?'ok':a.cls=='late'?'late':''}">${bt(a,s)}</span></div>
<small>📅 موعد الرفع: ${s.dn} — الموعد الحالي ${gd(a.d)}</small>
${a.carry?`<label class="chk wr" style="margin-top:8px"><input type="checkbox" onchange="togP('${s.id}',this.checked)"> ${s.ok} للفترة السابقة (${gd(a.pd)})</label>`:''}
<label class="chk" style="margin:10px 0"><input type="checkbox" ${a.ok?'checked':''} onchange="tog('${s.id}',this.checked)"> ${s.ok}</label>
${s.fl.map((f,i)=>{const x=(l.f||{})[i];return `<div class="att">📎 إرفاق ${f}${x?`<br>✔ <a onclick="openF('${a.k}',${i})">${esc(x.n)}</a> <small>${fs(x.s)}</small> <a onclick="delF('${a.k}',${i})" aria-label="إزالة المرفق">🗑️</a>`:''}<input type="file" onchange="att('${s.id}',${i},this)"></div>`}).join('')}
<textarea rows="2" placeholder="ملاحظات" onchange="note('${s.id}',this.value)">${esc(l.n||'')}</textarea></div>`}).join('')}
const LGk=k=>S.logs[k]=S.logs[k]||{};
const LG=id=>LGk(key(SEC.find(x=>x.id==id),new Date()));
function tog(id,v){const l=LG(id);l.ok=v;l.at=ymd(new Date());if(save())r()}
function togP(id,v){const s=SEC.find(x=>x.id==id),l=LGk(key(s,prev(s,new Date(),1)));l.ok=v;l.at=ymd(new Date());if(save())r()}
function note(id,v){LG(id).n=v;save()}
/* الملفات تُحفظ في IndexedDB وليس localStorage */
const DB=()=>new Promise((ok,no)=>{const q=indexedDB.open('suhoola',1);q.onupgradeneeded=()=>q.result.createObjectStore('f');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)});
const tx=async(m,fn)=>{const d=await DB();return new Promise((ok,no)=>{const t=d.transaction('f',m),rq=fn(t.objectStore('f'));t.oncomplete=()=>{d.close();ok(rq.result)};t.onerror=t.onabort=()=>{d.close();no(t.error)}})};
const fput=(k,b)=>tx('readwrite',s=>s.put(b,k)),fget=k=>tx('readonly',s=>s.get(k)),fdel=k=>tx('readwrite',s=>s.delete(k));
const b2d=b=>new Promise((ok,no)=>{const f=new FileReader();f.onload=()=>ok(f.result);f.onerror=no;f.readAsDataURL(b)});
function d2b(d){const m=/^data:([^;,]*);base64,([\s\S]*)$/.exec(d),bin=atob(m[2]),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new Blob([u],{type:m[1]})}
async function att(id,i,el){const f=el.files[0];if(!f)return;el.value='';if(f.size>25e6)return toast('الملف أكبر من 25 ميغابايت');
const l=LG(id),old=(l.f=l.f||{})[i],k='f'+Date.now()+Math.random().toString(36).slice(2,8);
try{await fput(k,f)}catch(e){return toast('تعذّر حفظ الملف على هذا الجهاز')}
l.f[i]={n:f.name,k,s:f.size};if(save()){if(old&&old.k)fdel(old.k).catch(()=>{});r();toast('تم إرفاق الملف')}else fdel(k).catch(()=>{})}
async function openF(k,i){const x=(S.logs[k]||{}).f?.[i];if(!x)return;let b=null;try{if(x.k)b=await fget(x.k);else if(x.d)b=d2b(x.d)}catch(e){}if(!b)return toast('الملف غير متوفر على هذا الجهاز');dl(b,x.n)}
function delF(k,i){conf('إزالة هذا المرفق من الجهاز؟',async()=>{const l=S.logs[k],x=l&&l.f&&l.f[i];if(!x)return;delete l.f[i];if(save()){if(x.k)fdel(x.k).catch(()=>{});r()}})}
async function migrate(){let ch=0;for(const l of Object.values(S.logs))for(const x of Object.values(l.f||{})){if(x.d&&!x.k){try{const k='f'+Date.now()+Math.random().toString(36).slice(2,8),b=d2b(x.d);await fput(k,b);x.k=k;x.s=b.size;delete x.d;ch=1}catch(e){}}}if(ch&&save()&&!$('#app').hidden)r()}
/* ===== السجلات ===== */
function lists(){const L=S.items.filter(i=>i.ty==lt);return `<div class="tabs">${LT.map((t,i)=>`<a class="${i==lt?'on':''}" onclick="lt=${i};r()">${t}</a>`).join('')}</div>
<div class="card"><h3>إضافة إلى: ${LT[lt]}</h3><input id="it" placeholder="العنوان"><input id="id" type="date" value="${ymd(new Date())}"><textarea id="in" rows="2" placeholder="ملاحظات"></textarea><button class="btn p" onclick="addI()">إضافة</button></div>
<div class="card">${L.length?L.map(i=>`<div class="li"><label class="chk"><input type="checkbox" ${i.done?'checked':''} onchange="tgI('${i.id}')"><span>${esc(i.t)}<br><small>${esc(i.d)} ${esc(i.n)}</small></span></label><a onclick="delI('${i.id}')" aria-label="حذف">🗑️</a></div>`).join(''):'<p>لا توجد عناصر بعد. أضف أول عنصر من النموذج أعلاه.</p>'}</div>`}
function addI(){const t=$('#it').value.trim();if(!t)return toast('اكتب العنوان');S.items.push({id:rnd().replace(/\W/g,''),ty:lt,t,d:DRE.test($('#id').value)?$('#id').value:ymd(new Date()),n:$('#in').value,done:false});if(save())r()}
const tgI=id=>{const i=S.items.find(x=>x.id==id);if(i){i.done=!i.done;if(save())r()}};
const delI=id=>conf('حذف هذا العنصر؟',()=>{S.items=S.items.filter(x=>x.id!=id);if(save())r()});
/* ===== التقويم ===== */
const dueOn=d=>SEC.filter(s=>s.f=='w'?d.getDay()==s.d:d.getDate()==s.d);
const dots=d=>dueOn(d).map(s=>{const ok=(S.logs[key(s,d)]||{}).ok,pre=ymd(d)<(S.since||'');return `<i class="dot ${ok?'ok':!pre&&sd(d)<sd(new Date())?'late':''}"></i>`}).join('');
function cal(){const y=cm.getFullYear(),m=cm.getMonth(),f=new Date(y,m,1).getDay(),n=new Date(y,m+1,0).getDate(),td=ymd(new Date());let c='';
['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'].forEach(w=>c+=`<b><small>${w}</small></b>`);for(let i=0;i<f;i++)c+='<div></div>';
for(let d=1;d<=n;d++){const D=new Date(y,m,d),k=ymd(D);c+=`<div class="${k==td?'td':''} ${k==sel?'sl':''}" onclick="sel='${k}';r()">${d}<small>${D.toLocaleDateString('ar-SA-u-ca-islamic-umalqura',{day:'numeric'})}</small>${dots(D)}</div>`}
const sd_=sel?new Date(sel+'T00:00'):null;
return `<div class="card"><div class="li"><a onclick="cm=new Date(${y},${m-1},1);r()" aria-label="الشهر السابق">▶</a><b style="text-align:center">${cm.toLocaleDateString('ar-SA-u-ca-gregory',{month:'long',year:'numeric'})}<br><small>${new Date(y,m,15).toLocaleDateString('ar-SA-u-ca-islamic-umalqura',{month:'long',year:'numeric'})}</small></b><a onclick="cm=new Date(${y},${m+1},1);r()" aria-label="الشهر التالي">◀</a></div><div class="cal">${c}</div></div>
${sd_?`<div class="card"><h3>${hj(sd_)}<br><small>${gd(sd_)}</small></h3>${dueOn(sd_).map(s=>{const ok=(S.logs[key(s,sd_)]||{}).ok;return `<div class="li">${s.t}<span class="bdg ${ok?'ok':''}">${ok?s.ok:'موعد'}</span></div>`}).join('')}${S.items.filter(i=>i.d==sel).map(i=>`<div class="li">${esc(i.t)}<span class="bdg">${LT[i.ty]}</span></div>`).join('')}</div>`:''}`}
/* ===== المزيد ===== */
function more(){const B=(a,t)=>`<div class="li"><a onclick="${a}" style="flex:1">${t}</a></div>`;return `<div class="card">${B("go('forms')",'📝 منشئ النماذج')}${B('xlsx()','📤 تصدير Excel (‏.xlsx)')}<div class="li"><a onclick="$('#xi').click()" style="flex:1">📥 استيراد Excel / CSV</a><input id="xi" type="file" accept=".xlsx,.csv" hidden onchange="imp(this)"></div>${B('pdf()','🖨️ طباعة / حفظ PDF')}${B('bak()','💾 نسخة احتياطية (مع المرفقات)')}<div class="li"><a onclick="$('#bi').click()" style="flex:1">♻️ استعادة نسخة</a><input id="bi" type="file" accept=".json" hidden onchange="rst(this)"></div>${B('ntf()','🔔 تفعيل الإشعارات')}${B('thm()','🌓 الوضع الليلي')}${B('apiS()','🤖 إعدادات المساعد (API اختياري)')}${B('chp()','🔑 تغيير رمز الدخول')}${B('location.reload()','🚪 تسجيل الخروج')}</div><p style="text-align:center;color:var(--m)">بياناتك محفوظة على جهازك فقط، والتنبيهات تظهر عند فتح التطبيق.</p>`}
/* ===== النماذج ===== */
function forms(){return `<a onclick="go('more')">◀ رجوع</a><div class="card"><h3>منشئ النماذج</h3><input placeholder="اسم النموذج" value="${esc(FB.n)}" oninput="FB.n=this.value"><div class="row2"><input id="fl" placeholder="اسم الحقل"><select id="ft">${Object.entries(TY).map(([k,v])=>`<option value="${k}">${v}`).join('')}</select><button class="btn" onclick="addF()" aria-label="إضافة حقل">＋</button></div>${FB.f.map((f,i)=>`<div class="li">${esc(f.l)} <small>${TY[f.t]}</small><a onclick="FB.f.splice(${i},1);r()" aria-label="حذف الحقل">✕</a></div>`).join('')}<button class="btn p" onclick="saveF()">حفظ النموذج</button></div>
${S.forms.map(f=>`<div class="card"><div class="li"><b>${esc(f.n)}</b><span class="bdg">${S.resp.filter(x=>x.fid==f.id).length} تعبئة</span></div><button class="btn" onclick="fill('${f.id}')">تعبئة</button> <button class="btn" onclick="resps('${f.id}')">السجل</button> <button class="btn" onclick="delForm('${f.id}')">حذف</button></div>`).join('')}`}
function addF(){const l=$('#fl').value.trim();if(!l)return toast('اكتب اسم الحقل');if(FB.f.some(x=>x.l==l))return toast('اسم الحقل مكرر');FB.f.push({l,t:own(TY,$('#ft').value)?$('#ft').value:'text'});r()}
function saveF(){if(!FB.n.trim()||!FB.f.length)return toast('أدخل اسماً وحقلاً واحداً على الأقل');S.forms.push({id:rnd().replace(/\W/g,''),n:FB.n.trim(),f:FB.f});FB={n:'',f:[]};if(save())r()}
const delForm=id=>conf('حذف النموذج وكل تعبئاته؟',()=>{S.forms=S.forms.filter(x=>x.id!=id);S.resp=S.resp.filter(x=>x.fid!=id);if(save())r()});
function fill(id){const f=S.forms.find(x=>x.id==id);if(!f)return;modal(`<h3>${esc(f.n)}</h3>${f.f.map((x,i)=>`<label for="v${i}">${esc(x.l)}</label>${x.t=='textarea'?`<textarea id="v${i}" rows="3"></textarea>`:`<input id="v${i}" type="${x.t}" ${x.t=='checkbox'?'style="width:24px"':''}>`}`).join('')}<button class="btn p" onclick="sv('${f.id}')">حفظ</button>`)}
function sv(id){const f=S.forms.find(x=>x.id==id);if(!f)return;const v={};f.f.forEach((x,i)=>v[x.l]=x.t=='checkbox'?($('#v'+i).checked?'نعم':'لا'):$('#v'+i).value);S.resp.push({fid:f.id,at:ymd(new Date()),v});if(save()){closeM();r();toast('تم الحفظ')}}
function resps(id){const R=S.resp.filter(x=>x.fid==id);modal(`<h3>السجل</h3>${R.map(x=>`<div class="li"><span><small>${esc(x.at)}</small><br>${Object.entries(x.v).map(([k,v])=>esc(k)+': '+esc(v)).join(' | ')}</span></div>`).join('')||'لا توجد تعبئات'}`)}
const P={home,tasks,lists,cal,more,forms};
/* ===== نوافذ وتأكيد ===== */
function modal(h){$('#sh').innerHTML=h;$('#md').classList.add('on')}function closeM(){$('#md').classList.remove('on')}
function conf(m,fn){FE.ui.confirm(m).then(ok=>{if(ok)fn()})}
/* ===== البحث ===== */
function srch(){modal(`<input id="q" placeholder="ابحث في المهام والسجلات والنماذج..." oninput="sr(this.value)"><div id="sres"></div>`);$('#q').focus()}
function sr(q){q=q.trim();if(!q)return $('#sres').innerHTML='';const h=[];
SEC.forEach(s=>{const hit=s.t.includes(q)||Object.entries(S.logs).some(([k,l])=>k.startsWith(s.id+':')&&((l.n||'').includes(q)||Object.values(l.f||{}).some(f=>f.n.includes(q))));if(hit)h.push(['📋',s.t,()=>go('tasks')])});
S.items.filter(i=>(i.t+i.n).includes(q)).forEach(i=>h.push(['🗂️',i.t+' ('+LT[i.ty]+')',()=>{lt=i.ty;go('lists')}]));
S.forms.filter(f=>(f.n+JSON.stringify(S.resp.filter(x=>x.fid==f.id).map(x=>x.v))).includes(q)).forEach(f=>h.push(['📝',f.n,()=>go('forms')]));
window._h=h;$('#sres').innerHTML=h.map((x,i)=>`<div class="li"><a onclick="closeM();_h[${i}][2]()">${x[0]} ${esc(x[1])}</a></div>`).join('')||'لا نتائج'}
/* ===== المساعد ===== */
const ctx=()=>SEC.map(s=>{const a=st(s);return s.t+': '+bt(a,s)}).join('، ');
function loc(q){const A=SEC.map(s=>({s,...st(s)}));if(/متأخر|تأخر/.test(q)){const l=A.filter(a=>a.late);return l.length?'المتأخر: '+l.map(a=>a.s.t).join('، '):'لا يوجد متأخر، أحسنت ✅'}
if(/قادم|موعد|متى|التالي/.test(q))return SEC.map(s=>({s,d:nextDue(s)})).sort((a,b)=>a.d-b.d).slice(0,3).map(o=>o.s.t+' — '+gd(o.d)).join('\n');
if(/نسبة|ملخص|إنجاز|حالة/.test(q))return 'حالة هذه الفترة:\n'+ctx();if(/سجل|عنصر/.test(q))return 'لديك '+S.items.length+' عنصراً في السجلات و'+S.forms.length+' نموذجاً.';
return 'يمكنك أن تسألني: ما المتأخر؟ متى المواعيد القادمة؟ أعطني ملخص الحالة.'}
function bot(){modal(`<h3>🤖 مساعد سهولة</h3><div id="cl">${CH.map(m=>`<div class="msg ${m[0]}">${esc(m[1])}</div>`).join('')||'<div class="msg a">مرحباً! اسألني عن المتأخر أو المواعيد أو ملخص الحالة.</div>'}</div><div class="row2" style="grid-template-columns:1fr auto"><input id="ci" placeholder="اكتب سؤالك" onkeydown="if(event.key=='Enter')ask()"><button class="btn" onclick="ask()">إرسال</button></div>`);$('#ci').focus()}
async function ask(){const q=$('#ci').value.trim();if(!q)return;CH.push(['u',q]);let a=loc(q);
if(S.api){try{const x=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.api},body:JSON.stringify({model:'gpt-4o-mini',messages:[{role:'system',content:'أنت مساعد تطبيق سهولة لإدارة أعمال العمليات. أجب بالعربية بإيجاز. الحالة: '+ctx()},{role:'user',content:q}]})}),j=await x.json();if(j.error)throw new Error(j.error.message);a=j.choices[0].message.content}catch(e){a=loc(q)+'\n(تعذّر الوصول للمزوّد: '+(e.message||'اتصال')+'. استُخدم المساعد المحلي)'}}
CH.push(['a',a]);if($('#md').classList.contains('on')&&$('#cl'))bot()}
function apiS(){modal(`<h3>مفتاح API (اختياري)</h3><p><small>عند إدخال مفتاح تُرسل أسئلتك وملخص الحالة إلى المزوّد (OpenAI). بدونه يعمل المساعد المحلي دون إنترنت ولا يخرج شيء من جهازك.</small></p><input id="ak" type="password" value="${esc(S.api)}" placeholder="sk-..."><button class="btn p" onclick="S.api=$('#ak').value.trim();if(save()){closeM();toast('تم الحفظ')}">حفظ</button>`)}
function chp(){modal(`<h3>تغيير الرمز</h3><input id="np" type="password" inputmode="numeric" placeholder="الرمز الجديد"><button class="btn p" onclick="const p=nd($('#np').value);if(p.length>=4){S.salt=rnd();S.ph=sha(S.salt+p);if(save()){closeM();toast('تم التغيير')}}else toast('الرمز قصير جداً')">حفظ</button>`)}
function thm(){const d=document.documentElement.dataset.theme!='dark';S.dark=d;save();document.documentElement.dataset.theme=d?'dark':'light'}
/* ===== التنزيل والنسخ الاحتياطي ===== */
function dl(b,n){const a=document.createElement('a'),u=URL.createObjectURL(b);a.href=u;a.download=n;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),8000)}
async function bak(){try{toast('جارٍ تجهيز النسخة…');const files={};for(const l of Object.values(S.logs))for(const x of Object.values(l.f||{}))if(x.k&&!files[x.k]){const b=await fget(x.k);if(b)files[x.k]=await b2d(b)}
for(const k of FE.collectFiles(S.data))if(!files[k]){const b=await fget(k);if(b)files[k]=await b2d(b)}
S.lb=ymd(new Date());save();const data=JSON.parse(JSON.stringify(S));['ph','salt','api','nt','pin','dark'].forEach(k=>delete data[k]);
dl(new Blob([JSON.stringify({v:2,data,files})],{type:'application/json'}),'suhoola-backup-'+ymd(new Date())+'.json');toast('تم حفظ النسخة');if(cur=='home')r()}catch(e){toast('تعذّر إنشاء النسخة')}}
async function rst(el){const f=el.files[0];el.value='';if(!f)return;let j,raw,c;try{j=JSON.parse(await f.text());raw=j&&j.data&&typeof j.data=='object'?j.data:j;c=clean(raw)}catch(e){return toast('ملف النسخة غير صالح')}
const n=Object.keys(c.logs).length+c.items.length+c.forms.length+c.resp.length+Object.values(c.data).reduce((a,x)=>a+x.length,0);
conf(n?'ستُستبدل البيانات الحالية بالنسخة المختارة. متابعة؟':'الملف لا يحتوي أي بيانات. سيتم مسح البيانات الحالية. متابعة؟',async()=>{try{
const fl=j&&j.files&&typeof j.files=='object'?j.files:{};for(const[k,d]of Object.entries(fl))if(/^[\w-]{1,60}$/.test(k)&&typeof d=='string'&&DURE.test(d))await fput(k,d2b(d));
Object.assign(S,c);if(raw&&DRE.test(raw.since)&&raw.since<S.since)S.since=raw.since;if(raw&&DRE.test(raw.lb))S.lb=raw.lb;
if(save()){r();toast('تمت الاستعادة');migrate()}}catch(e){toast('تعذّرت الاستعادة')}})}
/* ===== Excel: كتابة وقراءة ملفات xlsx بدون مكتبات ===== */
const crcT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc=u=>{let c=~0;for(let i=0;i<u.length;i++)c=crcT[(c^u[i])&255]^(c>>>8);return ~c>>>0};
function zip(files){const te=new TextEncoder(),parts=[],cd=[];let off=0,n=0;
for(const[nm0,s]of Object.entries(files)){const nm=te.encode(nm0),d=te.encode(s),c=crc(d);n++;
const lh=new DataView(new ArrayBuffer(30));lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(12,0x21,true);lh.setUint32(14,c,true);lh.setUint32(18,d.length,true);lh.setUint32(22,d.length,true);lh.setUint16(26,nm.length,true);
parts.push(new Uint8Array(lh.buffer),nm,d);
const ch=new DataView(new ArrayBuffer(46));ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(14,0x21,true);ch.setUint32(16,c,true);ch.setUint32(20,d.length,true);ch.setUint32(24,d.length,true);ch.setUint16(28,nm.length,true);ch.setUint32(42,off,true);
cd.push(new Uint8Array(ch.buffer),nm);off+=30+nm.length+d.length}
const cs=cd.reduce((a,x)=>a+x.length,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,n,true);e.setUint16(10,n,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
return new Blob([...parts,...cd,new Uint8Array(e.buffer)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
async function unzip(buf){const u=new Uint8Array(buf),v=new DataView(buf);let e=-1;for(let i=u.length-22;i>=Math.max(0,u.length-65558);i--)if(v.getUint32(i,true)==0x06054b50){e=i;break}
if(e<0)throw new Error('zip');const n=v.getUint16(e+10,true);let p=v.getUint32(e+16,true);const out={},td=new TextDecoder();
for(let k=0;k<n;k++){if(v.getUint32(p,true)!=0x02014b50)throw new Error('zip');const m=v.getUint16(p+10,true),cs=v.getUint32(p+20,true),nl=v.getUint16(p+28,true),xl=v.getUint16(p+30,true),cl=v.getUint16(p+32,true),off=v.getUint32(p+42,true),name=td.decode(u.subarray(p+46,p+46+nl));p+=46+nl+xl+cl;
if(!/\.(xml|rels)$/.test(name))continue;const ln=v.getUint16(off+26,true),lx=v.getUint16(off+28,true),s=off+30+ln+lx,d=u.subarray(s,s+cs);
out[name]=td.decode(m==0?d:new Uint8Array(await new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()))}
return out}
const xe=s=>String(s??'').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sheetX=rows=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView rightToLeft="1" workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols><col min="1" max="6" width="26" customWidth="1"/></cols><sheetData>${rows.map((r,i)=>`<row r="${i+1}">${r.map((c,j)=>`<c r="${String.fromCharCode(65+j)}${i+1}" t="inlineStr"><is><t xml:space="preserve">${xe(c)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`;
function xlsx(){const R=[];SEC.forEach(s=>Object.entries(S.logs).filter(([k])=>k.startsWith(s.id+':')).sort().forEach(([k,l])=>R.push([s.t,k.split(':')[1],l.ok?s.ok:'لم يتم',l.at||'',l.n||'',Object.values(l.f||{}).map(f=>f.n).join('، ')])));
const sh=[['السجلات',[['النوع','العنوان','التاريخ','ملاحظة','الحالة'],...S.items.map(i=>[LT[i.ty],i.t,i.d,i.n,i.done?'منجز':'قائم'])]],['المهام',[['القسم','الفترة','الحالة','تاريخ الإنجاز','ملاحظات','المرفقات'],...R]],['النماذج',[['النموذج','التاريخ','البيانات'],...S.resp.map(x=>[(S.forms.find(f=>f.id==x.fid)||{}).n||'',x.at,Object.entries(x.v).map(([k,v])=>k+': '+v).join(' | ')])]]];
const H='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',F={};
F['[Content_Types].xml']=H+`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sh.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`;
F['_rels/.rels']=H+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
F['xl/workbook.xml']=H+`<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sh.map((s,i)=>`<sheet name="${xe(s[0])}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`;
F['xl/_rels/workbook.xml.rels']=H+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sh.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}</Relationships>`;
sh.forEach((s,i)=>F[`xl/worksheets/sheet${i+1}.xml`]=sheetX(s[1]));
dl(zip(F),'suhoola-'+ymd(new Date())+'.xlsx')}
async function readX(f){const zf=await unzip(await f.arrayBuffer()),P=s=>new DOMParser().parseFromString(s,'application/xml');
const ss=zf['xl/sharedStrings.xml']?[...P(zf['xl/sharedStrings.xml']).getElementsByTagName('si')].map(si=>[...si.getElementsByTagName('t')].map(t=>t.textContent).join('')):[];
const rel={};if(zf['xl/_rels/workbook.xml.rels'])[...P(zf['xl/_rels/workbook.xml.rels']).getElementsByTagName('Relationship')].forEach(x=>rel[x.getAttribute('Id')]=x.getAttribute('Target'));
return[...P(zf['xl/workbook.xml']).getElementsByTagName('sheet')].map(sh=>{let t=(rel[sh.getAttribute('r:id')]||'').replace(/^\//,'');const path=t.startsWith('xl/')?t:'xl/'+t,x=zf[path],name=sh.getAttribute('name');if(!x)return{name,rows:[]};
const rows=[...P(x).getElementsByTagName('row')].map(row=>{const r=[];[...row.getElementsByTagName('c')].forEach(c=>{const ref=c.getAttribute('r')||'',col=[...ref.replace(/\d+/g,'')].reduce((a,ch)=>a*26+ch.charCodeAt(0)-64,0)-1,ty=c.getAttribute('t'),vv=c.getElementsByTagName('v')[0];let val='';
if(ty=='s')val=ss[+(vv&&vv.textContent)]??'';else if(ty=='inlineStr')val=[...c.getElementsByTagName('t')].map(t=>t.textContent).join('');else val=vv?vv.textContent:'';r[col>=0?col:r.length]=val});return Array.from(r,x=>x??'')});
return{name,rows}})}
function csv(t){t=t.replace(/^﻿/,'');const l1=t.split('\n')[0],d=(l1.match(/;/g)||[]).length>(l1.match(/,/g)||[]).length?';':',',R=[];let r=[],c='',q=false;
for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch=='"'){if(t[i+1]=='"'){c+='"';i++}else q=false}else c+=ch}else if(ch=='"')q=true;else if(ch==d){r.push(c);c=''}else if(ch=='\n'||ch=='\r'){if(ch=='\r'&&t[i+1]=='\n')i++;r.push(c);c='';if(r.some(x=>x!==''))R.push(r);r=[]}else c+=ch}
r.push(c);if(r.some(x=>x!==''))R.push(r);return R}
const xd=v=>{v=String(v).trim();if(DRE.test(v))return v;if(/^\d{5}(\.\d+)?$/.test(v)){const D=new Date(Math.round((+v-25569)*864e5));return D.getUTCFullYear()+'-'+z(D.getUTCMonth()+1)+'-'+z(D.getUTCDate())}return ymd(new Date())};
async function imp(el){const f=el.files[0];el.value='';if(!f)return;try{let rows;
if(/\.xlsx$/i.test(f.name)){const sh=await readX(f);rows=(sh.find(s=>s.rows[0]&&String(s.rows[0][0]).trim()=='النوع')||sh[0]||{rows:[]}).rows}else rows=csv(await f.text());
if(rows[0]&&String(rows[0][0]).trim()=='النوع')rows=rows.slice(1);
const seen=new Set(S.items.map(i=>i.ty+'|'+i.t+'|'+i.d));let add=0,skip=0;const N=[];
rows.forEach((c,n)=>{const ty=LT.indexOf(String(c[0]??'').trim()),t=String(c[1]??'').trim();if(ty<0||!t){skip++;return}const d=xd(c[2]??''),k=ty+'|'+t+'|'+d;if(seen.has(k)){skip++;return}seen.add(k);N.push({id:'i'+Date.now()+n,ty,t,d,n:String(c[3]??''),done:String(c[4]??'').trim()=='منجز'});add++});
const cl=clean({items:N});S.items.push(...cl.items);if(save()){r();toast('أُضيف '+add+' عنصراً، وتُجوهل '+skip)}}catch(e){toast('تعذّرت قراءة الملف. استخدم ملف .xlsx أو .csv')}}
/* ===== PDF ===== */
function pdf(){$('#rep').innerHTML=`<h1>🕌 سهولة — تقرير إدارة أعمال العمليات</h1><p>${esc(hj())} — ${esc(gd())}</p><table><tr><th>القسم</th><th>الموعد</th><th>الحالة</th></tr>${SEC.map(s=>{const a=st(s);return `<tr><td>${s.t}</td><td>${s.dn}</td><td>${esc(bt(a,s))}</td></tr>`}).join('')}</table><h3>السجلات</h3><table><tr><th>النوع</th><th>العنوان</th><th>التاريخ</th><th>الحالة</th></tr>${S.items.map(i=>`<tr><td>${LT[i.ty]}</td><td>${esc(i.t)}</td><td>${esc(i.d)}</td><td>${i.done?'منجز':'قائم'}</td></tr>`).join('')}</table>`;try{print()}catch(e){toast('الطباعة غير متاحة هنا')}}
/* ===== الإشعارات ===== */
function ntf(){if(!window.Notification)return toast('الإشعارات غير مدعومة هنا، وستظهر التنبيهات داخل التطبيق');Notification.requestPermission().then(p=>{toast(p=='granted'?'تم التفعيل. تظهر التنبيهات عند فتح التطبيق':'لم يُسمح بالإشعارات');S.nt={};chk()}).catch(()=>toast('تعذّر تفعيل الإشعارات'))}
function chk(){const td=ymd(new Date());Object.keys(S.nt).forEach(k=>{if(!k.endsWith('|'+td))delete S.nt[k]});let ch=0;
SEC.forEach(s=>{const a=st(s),k=a.k+'|'+td;if(a.cls=='ok'||S.nt[k]||!(a.late||(!a.pre&&a.df<=1)))return;const m=s.t+' — '+bt(a,s);let shown=false;
try{if(window.Notification&&Notification.permission=='granted'){new Notification('سهولة',{body:m});shown=true}}catch(e){}
if(!shown)toast('🔔 '+m);S.nt[k]=1;ch=1});if(ch)save()}
/* ===== الدخول ===== */
function bad(){$('#lm').textContent='رمز غير صحيح'}
function lg(){const p=nd($('#pin').value);
if(!S.ph&&!S.pin){if(p.length<4)return $('#lm').textContent='الرمز قصير جداً';S.salt=rnd();S.ph=sha(S.salt+p)}
else if(S.pin&&!S.ph){if(p!=S.pin)return bad();S.salt=rnd();S.ph=sha(S.salt+p);delete S.pin}
else if(sha(S.salt+p)!=S.ph)return bad();
if(!DRE.test(S.since))S.since=ymd(new Date());save();
$('#login').style.display='none';$('#app').hidden=false;r();chk();migrate();try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}}
/* ===== ربط محرك النماذج بالتخزين ===== */
FE.host={db:()=>S.data,seq:()=>S.seq,save,user:()=>''};
FE.storage={put:fput,get:fget,del:fdel};
/* ===== تهيئة ===== */
Object.assign(S,clean(S));
if(S.ph||S.pin)$('#lm').textContent='أدخل رمز الدخول';
document.documentElement.dataset.theme=(S.dark??matchMedia('(prefers-color-scheme:dark)').matches)?'dark':'light';
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!$('#app').hidden)chk()});setInterval(()=>{if(!$('#app').hidden)chk()},18e5);
document.addEventListener('keydown',e=>{if(e.key=='Escape')closeM();const a=e.target;if((e.key=='Enter'||e.key==' ')&&a.matches&&a.matches('a[role=button]')){e.preventDefault();a.click()}});
new MutationObserver(()=>document.querySelectorAll('a[onclick]:not([role])').forEach(a=>{a.setAttribute('role','button');a.tabIndex=0})).observe(document.body,{childList:true,subtree:true});
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
