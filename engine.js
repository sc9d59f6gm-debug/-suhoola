/* ===========================================================
   Form Engine — محرك نماذج وسجلات مستقل عن الأقسام.
   كل قسم يُعرَّف بـ Schema عبر FE.defineSchema(...) في sections.js.
   يعتمد على موصّلين يضبطهما app.js: FE.host (التخزين) و FE.storage (الملفات).
   =========================================================== */
(function(g){'use strict';
const FE=g.FE={schemas:{},types:{},
  host:{db:()=>({}),seq:()=>({}),save:()=>true,user:()=>''},
  storage:{put:async()=>{},get:async()=>null,del:async()=>{}}};
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
FE.esc=esc;
const DRE=/^\d{4}-\d{2}-\d{2}$/,TRE=/^([01]\d|2[0-3]):[0-5]\d$/,ISO=/^\d{4}-\d{2}-\d{2}T[\d:.]+Z?$/;
const z=n=>String(n).padStart(2,'0'),ymd=d=>d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());
const sid=x=>String(x??'').replace(/[^\w-]/g,'').slice(0,40),str=(x,n)=>String(x??'').slice(0,n);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const iso=()=>new Date().toISOString();
const isoOr=v=>typeof v=='string'&&ISO.test(v)?v:iso();
const isDate=v=>typeof v=='string'&&DRE.test(v)&&(d=>!isNaN(d)&&ymd(d)==v)(new Date(v+'T00:00'));
const nd=s=>String(s).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/٫/g,'.').replace(/[٬،]/g,'').trim();
FE.uid=uid;FE.isDate=isDate;FE.ymd=ymd;FE.today=()=>ymd(new Date());
const TONES=['ok','warn','bad','info','mute'];
FE.PRIORITIES=[{v:'low',l:'منخفضة',tone:'mute'},{v:'medium',l:'متوسطة',tone:'info'},{v:'high',l:'عالية',tone:'warn'},{v:'urgent',l:'عاجلة',tone:'bad'}];
const RESERVED=['id','no','createdAt','updatedAt','archived','log'];
const LOGT=['created','edited','status','archived','restored','note'];

/* ---------- التاريخ هجري/ميلادي ---------- */
const dfmt=(d,cal)=>d.toLocaleDateString('ar-SA-u-ca-'+cal,{day:'numeric',month:'long',year:'numeric'});
FE.greg=v=>isDate(v)?dfmt(new Date(v+'T00:00'),'gregory'):'';
FE.hijri=v=>isDate(v)?dfmt(new Date(v+'T00:00'),'islamic-umalqura'):'';
FE.fmtDate=v=>isDate(v)?FE.greg(v)+' — '+FE.hijri(v):'';
FE.fmtDT=s=>{const d=new Date(s);return isNaN(d)?'':d.toLocaleString('ar-SA-u-ca-gregory',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})};

/* ---------- الخيارات ---------- */
const nopt=o=>(Array.isArray(o)?o:[]).map(x=>x&&typeof x=='object'?{v:String(x.v),l:String(x.l??x.v),tone:TONES.includes(x.tone)?x.tone:''}:{v:String(x),l:String(x),tone:''}).filter(x=>x.v!=='');
FE.titleOf=(col,r)=>{const s=FE.schemas[col];return (r.no?r.no+' — ':'')+(s&&r[s.titleField]||'(بدون عنوان)')};
function optList(f,c){c=c||{};
  if(f.type=='ref')return FE.store.list(f.ref).map(r=>({v:r.id,l:FE.titleOf(f.ref,r),tone:''}));
  let o=typeof f.options=='function'?f.options(c.vals||{}):f.options;
  if(f.type=='status')o=o||(c.schema&&c.schema.statuses);
  if(f.type=='priority')o=o||FE.PRIORITIES;
  return nopt(o)}
const labelOf=(f,v,c)=>{const o=optList(f,c).find(x=>x.v==v);return o?o.l:(f.type=='ref'&&v?'(سجل غير متاح)':String(v))};
const toneOf=(f,v,c)=>{const o=optList(f,c).find(x=>x.v==v);return o?o.tone:''};

/* ---------- سجل الأنواع ---------- */
const Lb=f=>'«'+f.label+'»';
const isEmptyDef=v=>v===''||v==null||(Array.isArray(v)&&!v.length);
FE.registerType=(name,def)=>{
  if(!/^[a-z][\w-]*$/.test(name))throw new Error('اسم نوع غير صالح: '+name);
  ['empty','norm','html','read'].forEach(k=>{if(typeof def[k]!='function')throw new Error('النوع '+name+' ينقصه: '+k)});
  FE.types[name]=Object.assign({isEmpty:isEmptyDef,validate:()=>'',format:(f,v)=>esc(String(v)),text:(f,v)=>String(v??''),grouped:false,span:1,sub:true},def)};
const T=FE.types;
const A=(f,c)=>`id="${c.id}" name="${esc(f.key)}" aria-describedby="${c.id}_e"${c.req?' aria-required="true"':''}`;
const textRead=(f,w)=>w.querySelector('input,textarea,select').value.trim();
const inputV=(f,v,c,type,extra)=>`<input type="${type}" ${A(f,c)} value="${esc(v)}"${extra||''}${f.placeholder?` placeholder="${esc(f.placeholder)}"`:''} autocomplete="off">`;
const pat=f=>{if(!f.pattern)return null;try{return f.pattern instanceof RegExp?f.pattern:new RegExp(f.pattern)}catch(e){return null}};

FE.registerType('text',{empty:()=>'',norm:(f,v)=>str(v,f.maxLength||200).trim(),read:textRead,
  html:(f,v,c)=>inputV(f,v,c,'text',` maxlength="${Number(f.maxLength)||200}"${f.inputmode?` inputmode="${esc(f.inputmode)}"`:''}${f.dir?` dir="${f.dir=='ltr'?'ltr':'rtl'}"`:''}`),
  validate:(f,v)=>{const m=f.maxLength||200;if(v.length>m)return Lb(f)+' لا يزيد عن '+m+' حرفاً';const p=pat(f);if(p&&!p.test(v))return f.patternMsg||(Lb(f)+' بصيغة غير صحيحة');return ''}});
FE.registerType('textarea',{empty:()=>'',norm:(f,v)=>str(v,f.maxLength||5000).trim(),read:textRead,span:2,
  html:(f,v,c)=>`<textarea ${A(f,c)} rows="${Number(f.rows)||3}" maxlength="${Number(f.maxLength)||5000}"${f.placeholder?` placeholder="${esc(f.placeholder)}"`:''}>${esc(v)}</textarea>`,
  format:(f,v)=>esc(v).replace(/\n/g,'<br>'),
  validate:(f,v)=>{const m=f.maxLength||5000;return v.length>m?Lb(f)+' لا يزيد عن '+m+' حرفاً':''}});
FE.registerType('number',{empty:()=>'',norm:(f,v)=>{const n=typeof v=='number'?v:Number(nd(v));return v!==''&&v!=null&&Number.isFinite(n)&&(f.min==null||n>=f.min)&&(f.max==null||n<=f.max)?n:''},
  read:(f,w)=>{const s=nd(w.querySelector('input').value);if(s==='')return '';const n=Number(s);return Number.isFinite(n)?n:s},
  html:(f,v,c)=>`<div class="fe-unit">${inputV(f,v,c,'text',` inputmode="decimal" dir="${f.dir=='rtl'?'rtl':'ltr'}"`)}${f.unit?`<span>${esc(f.unit)}</span>`:''}</div>`,
  format:(f,v)=>esc(v)+(f.unit?' '+esc(f.unit):''),text:(f,v)=>v===''?'':v+(f.unit?' '+f.unit:''),
  validate:(f,v)=>{if(typeof v!='number')return Lb(f)+' يجب أن يكون رقماً';if(f.integer&&!Number.isInteger(v))return Lb(f)+' يجب أن يكون رقماً صحيحاً';
    if(f.min!=null&&v<f.min)return Lb(f)+' لا يقل عن '+f.min;if(f.max!=null&&v>f.max)return Lb(f)+' لا يزيد عن '+f.max;return ''}});
const selHTML=(f,v,c)=>{let o=optList(f,c);if(f.type=='ref'&&v&&!o.some(x=>x.v==v))o=o.concat({v,l:'(سجل مؤرشف أو محذوف)',tone:''});
  return `<select ${A(f,c)}><option value="">${esc(f.placeholder||'اختر…')}</option>${o.map(x=>`<option value="${esc(x.v)}"${x.v==v?' selected':''}>${esc(x.l)}</option>`).join('')}</select>`};
const inOpts=(f,v,x)=>optList(f,{vals:x.vals,schema:x.schema}).some(o=>o.v==v)?'':'قيمة غير مسموحة في '+Lb(f);
FE.registerType('select',{empty:()=>'',norm:(f,v)=>{const s=String(v??'');return optList(f).some(o=>o.v==s)||typeof f.options=='function'?s:''},read:textRead,html:selHTML,
  format:(f,v,c)=>esc(labelOf(f,v,c)),text:(f,v,c)=>labelOf(f,v,c),validate:inOpts});
FE.registerType('ref',{empty:()=>'',norm:(f,v)=>sid(v),read:textRead,html:selHTML,
  format:(f,v)=>{const r=FE.store.get(f.ref,v);return r?`<a class="fe-link" role="button" tabindex="0" data-open="${esc(f.ref)}|${esc(v)}">${esc(FE.titleOf(f.ref,r))}</a>`:'<span class="fe-dim">(سجل غير متاح)</span>'},
  text:(f,v)=>{const r=FE.store.get(f.ref,v);return r?FE.titleOf(f.ref,r):''},
  validate:(f,v,x)=>{const r=FE.store.get(f.ref,v);return r&&(!r.archived||(x.orig&&x.orig[f.key]==v)||(x.origVals&&x.origVals.has(v)))?'':Lb(f)+': السجل المرتبط غير موجود'}});
const chipsHTML=(f,v,c,multi)=>{const o=optList(f,c),sel=multi?(Array.isArray(v)?v:[]):[v];
  return `<div class="fe-chips" role="${multi?'group':'radiogroup'}" aria-labelledby="${c.id}_l" aria-describedby="${c.id}_e">${o.map(x=>`<label class="fe-chip${x.tone?' t-'+x.tone:''}"><input type="${multi?'checkbox':'radio'}" name="${c.id}" value="${esc(x.v)}"${sel.includes(x.v)?' checked':''}><span>${esc(x.l)}</span></label>`).join('')}</div>`+(!multi&&!c.req?`<button type="button" class="fe-clear" data-act="clear">مسح الاختيار</button>`:'')};
const chipRead=(f,w)=>{const c=w.querySelector('input:checked');return c?c.value:''};
['radio','status','priority'].forEach(n=>FE.registerType(n,{empty:()=>'',norm:(f,v)=>{const s=String(v??'');return optList(f,{schema:f.__schema}).some(o=>o.v==s)?s:''},read:chipRead,grouped:true,span:2,
  html:(f,v,c)=>chipsHTML(f,v,c,false),
  format:(f,v,c)=>{const t=toneOf(f,v,c);return `<span class="bdg${t?' t-'+t:''}">${esc(labelOf(f,v,c))}</span>`},text:(f,v,c)=>labelOf(f,v,c),validate:inOpts}));
FE.registerType('multiselect',{empty:()=>[],norm:(f,v)=>{const ok=optList(f).map(o=>o.v);return [...new Set((Array.isArray(v)?v:[]).map(String).filter(x=>ok.includes(x)))]},
  read:(f,w)=>[...w.querySelectorAll('input:checked')].map(i=>i.value),grouped:true,span:2,html:(f,v,c)=>chipsHTML(f,v,c,true),
  format:(f,v,c)=>v.map(x=>`<span class="bdg${toneOf(f,x,c)?' t-'+toneOf(f,x,c):''}">${esc(labelOf(f,x,c))}</span>`).join(' '),text:(f,v,c)=>v.map(x=>labelOf(f,x,c)).join('، '),
  validate:(f,v,x)=>{const ok=optList(f,{vals:x.vals,schema:x.schema}).map(o=>o.v);if(v.some(i=>!ok.includes(i)))return 'قيمة غير مسموحة في '+Lb(f);
    if(f.min&&v.length<f.min)return Lb(f)+': اختر '+f.min+' على الأقل';if(f.max&&v.length>f.max)return Lb(f)+': الحد الأقصى '+f.max+' خيارات';return ''}});
FE.registerType('date',{empty:()=>'',norm:(f,v)=>isDate(v)?v:'',read:textRead,
  html:(f,v,c)=>`<input type="date" ${A(f,c)} value="${esc(v)}"${typeof f.min=='string'?` min="${esc(f.min)}"`:''}${typeof f.max=='string'?` max="${esc(f.max)}"`:''}><div class="fe-hij" aria-live="polite">${v?'الموافق: '+esc(FE.hijri(v)):''}</div>`,
  format:v=>esc(FE.fmtDate(v)),text:(f,v)=>FE.fmtDate(v),
  validate:(f,v,x)=>{if(!isDate(v))return Lb(f)+' تاريخ غير صالح';if(typeof f.min=='string'&&v<f.min)return Lb(f)+' لا يسبق '+FE.greg(f.min);if(typeof f.max=='string'&&v>f.max)return Lb(f)+' لا يتجاوز '+FE.greg(f.max);
    if(f.notBefore){const o=x.vals[f.notBefore];if(isDate(o)&&v<o){const of=x.fields&&x.fields.find(q=>q.key==f.notBefore);return Lb(f)+' يجب ألا يسبق '+(of?Lb(of):'التاريخ السابق')}}return ''}});
FE.types.date.format=(f,v)=>esc(FE.fmtDate(v));
FE.registerType('time',{empty:()=>'',norm:(f,v)=>TRE.test(v)?v:'',read:textRead,html:(f,v,c)=>inputV(f,v,c,'time'),
  validate:(f,v)=>TRE.test(v)?'':Lb(f)+' وقت غير صالح',format:(f,v)=>esc(v),text:(f,v)=>v});
FE.registerType('checkbox',{empty:()=>false,norm:(f,v)=>v===true,isEmpty:v=>!v,read:(f,w)=>w.querySelector('input').checked,grouped:true,
  html:(f,v,c)=>`<label class="fe-chk"><input type="checkbox" ${A(f,c)}${v?' checked':''}><span>${esc(f.text||f.label)}</span></label>`,
  format:(f,v)=>v?'نعم':'لا',text:(f,v)=>v?'نعم':'لا'});
const maxMB=f=>(f.maxSize||25e6);
const fsz=n=>!n?'':n>1e6?(n/1e6).toFixed(1)+' MB':Math.max(1,Math.round(n/1e3))+' KB';
FE.fsz=fsz;
const fileItem=(f,m)=>`<div class="fe-file"><a class="fe-link" role="button" tabindex="0" data-file="${esc(m.k)}" data-name="${esc(m.n)}">📎 ${esc(m.n)}</a><small>${fsz(m.s)}</small><button type="button" class="fe-x" data-act="rmfile" data-k="${esc(m.k)}" aria-label="إزالة ${esc(m.n)}">✕</button></div>`;
FE.registerType('file',{empty:()=>[],norm:(f,v)=>(Array.isArray(v)?v:[]).filter(m=>m&&typeof m=='object'&&/^[\w-]{1,60}$/.test(m.k||'')).slice(0,f.max||10).map(m=>({n:str(m.n,200),k:m.k,s:Number.isFinite(m.s)?m.s:0,t:str(m.t,100)})),
  grouped:true,span:2,sub:false,read:(f,w,s)=>((s&&s.files[f.key])||[]).slice(),
  html:(f,v,c)=>`<label class="btn fe-pick"><input type="file" class="fe-sr" id="${c.id}" aria-labelledby="${c.id}_l" aria-describedby="${c.id}_e" multiple${f.accept?` accept="${esc(f.accept)}"`:''}> 📎 ${esc(f.pickLabel||'إرفاق ملف')}</label><span class="fe-dim"> حتى ${Number(f.max)||10} ملفات، لكل ملف ${fsz(maxMB(f))} كحد أقصى</span><div class="fe-filelist" data-list="${esc(f.key)}">${v.map(m=>fileItem(f,m)).join('')}</div>`,
  format:(f,v)=>v.map(m=>`<div class="fe-file"><a class="fe-link" role="button" tabindex="0" data-file="${esc(m.k)}" data-name="${esc(m.n)}">📎 ${esc(m.n)}</a><small>${fsz(m.s)}</small></div>`).join(''),
  text:(f,v)=>v.map(m=>m.n).join('، '),validate:(f,v)=>v.length>(f.max||10)?Lb(f)+': الحد الأقصى '+(f.max||10)+' ملفات':''});
FE.fileItemHTML=fileItem;
let rowSeq=0;
const rowHTML=(f,vals,c)=>{const n=++rowSeq;return `<fieldset class="fe-row" data-rid="${esc(vals&&vals._id||'')}"><legend>${esc(f.rowLabel||'بند')} <span class="fe-rn"></span></legend><div class="fe-grid">${f.fields.map(sf=>wrap(sf,{id:c.id+'_r'+n+'_'+sf.key,schema:c.schema,vals:vals||{},sess:c.sess,sub:true})).join('')}</div><button type="button" class="btn sm danger" data-act="delrow">حذف ${esc(f.rowLabel||'البند')}</button></fieldset>`};
function rowEmpty(f,r){return !f.fields.some(sf=>sf.type!='checkbox'&&!T[sf.type].isEmpty(r[sf.key],sf))}
FE.registerType('rows',{empty:()=>[],grouped:true,span:2,sub:false,isEmpty:(v,f)=>!v.length||(!!f&&v.every(r=>rowEmpty(f,r))),
  norm:(f,v)=>(Array.isArray(v)?v:[]).slice(0,f.maxRows||50).map(r=>{r=r&&typeof r=='object'?r:{};const o={_id:sid(r._id)||uid()};f.fields.forEach(sf=>{o[sf.key]=T[sf.type].norm(sf,r[sf.key])});return o}).filter(o=>!rowEmpty(f,o)),
  read:(f,w)=>[...w.querySelectorAll(':scope > .fe-rows > .fe-row')].map(row=>{const o={_id:row.dataset.rid||''};f.fields.forEach(sf=>{const el=row.querySelector('.fe-field[data-key="'+sf.key+'"]');o[sf.key]=el?T[sf.type].read(sf,el):T[sf.type].empty(sf)});return o}),
  html:(f,v,c)=>`<div class="fe-rows" data-rows="${esc(f.key)}" data-label="${esc(f.rowLabel||'بند')}">${v.map(r=>rowHTML(f,r,c)).join('')}</div><button type="button" class="btn sm" data-act="addrow">＋ ${esc(f.addLabel||'إضافة')}</button>`,
  format:(f,v,c)=>!v.length?'':`<div class="fe-tablewrap"><table class="fe-tbl"><thead><tr>${f.fields.map(sf=>`<th>${esc(sf.label)}</th>`).join('')}</tr></thead><tbody>${v.map(r=>`<tr>${f.fields.map(sf=>`<td>${T[sf.type].isEmpty(r[sf.key])&&sf.type!='checkbox'?'<span class="fe-dim">—</span>':T[sf.type].format(sf,r[sf.key],{schema:c&&c.schema,vals:r})}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
  text:(f,v)=>v.map(r=>f.fields.map(sf=>T[sf.type].text(sf,r[sf.key],{vals:r})).filter(Boolean).join(' ')).join(' | '),
  validate:(f,v,x)=>{const live=v.filter(r=>!rowEmpty(f,r));if(f.minRows&&live.length<f.minRows)return 'أضف '+f.minRows+' على الأقل في '+Lb(f);
    const old=new Set(((x.orig&&x.orig[f.key])||[]).flatMap(r=>Object.values(r||{})));
    v.forEach((r,i)=>{if(rowEmpty(f,r))return;f.fields.forEach(sf=>checkField(sf,r[sf.key],r,x.errors,x.path+'.'+i+'.'+sf.key,{schema:x.schema,orig:null,origVals:old,fields:f.fields}))});return ''}});

/* قراءة متساهلة عند التحميل: تحافظ على القيم المخزّنة حتى لو تغيّر تعريف القسم لاحقاً */
const LD=(n,fn)=>{T[n].load=fn};
LD('text',(f,v)=>str(v,2000).trim());LD('textarea',(f,v)=>str(v,50000).trim());
LD('number',(f,v)=>{const n=typeof v=='number'?v:Number(nd(v));return v!==''&&v!=null&&Number.isFinite(n)?n:''});
['select','radio','status','priority'].forEach(n=>LD(n,(f,v)=>str(v,200)));
LD('multiselect',(f,v)=>[...new Set((Array.isArray(v)?v:[]).map(x=>str(x,200)).filter(Boolean))].slice(0,100));
LD('rows',(f,v)=>(Array.isArray(v)?v:[]).slice(0,f.maxRows||50).map(r=>{r=r&&typeof r=='object'?r:{};const o={_id:sid(r._id)||uid()};f.fields.forEach(sf=>{const t=T[sf.type];o[sf.key]=(t.load||t.norm)(sf,r[sf.key])});return o}).filter(o=>!rowEmpty(f,o)));
/* ---------- تعريف Schema ---------- */
FE.defineSchema=s=>{
  const bad=m=>{throw new Error('Schema «'+(s&&s.id)+'»: '+m)};
  if(!s||!/^[a-z][\w]*$/.test(s.id||''))bad('id غير صالح');
  if(!s.title)bad('العنوان مطلوب');
  if(!Array.isArray(s.fields)||!s.fields.length)bad('لا توجد حقول');
  s.groups=Array.isArray(s.groups)&&s.groups.length?s.groups:[{id:'main',title:'البيانات الأساسية'}];
  const gids=s.groups.map(g=>g.id),seen=new Set(),chk=(f,sub)=>{
    if(!f||!/^[A-Za-z]\w*$/.test(f.key||''))bad('مفتاح حقل غير صالح');
    if(!sub&&RESERVED.includes(f.key))bad('المفتاح محجوز: '+f.key);
    if(!T[f.type])bad('نوع غير معروف: '+f.type+' (الحقل '+f.key+')');
    if(sub&&!T[f.type].sub)bad('النوع '+f.type+' غير مسموح داخل rows ('+f.key+')');
    if(!f.label)bad('الحقل '+f.key+' بلا تسمية');
    if(['select','radio','multiselect'].includes(f.type)&&!(typeof f.options=='function'||nopt(f.options).length))bad('الحقل '+f.key+' بلا خيارات');
    if(f.type=='ref'&&!f.ref)bad('الحقل '+f.key+' بلا ref');
    if(f.type=='rows'){if(!Array.isArray(f.fields)||!f.fields.length)bad('rows بلا حقول فرعية ('+f.key+')');const ss=new Set();f.fields.forEach(q=>{chk(q,true);if(ss.has(q.key))bad('حقل فرعي مكرر '+q.key);ss.add(q.key)})}};
  s.fields.forEach(f=>{chk(f,false);if(seen.has(f.key))bad('مفتاح مكرر: '+f.key);seen.add(f.key);
    if(f.group&&!gids.includes(f.group))bad('مجموعة غير معروفة: '+f.group);f.__schema=s;
    if(f.type=='rows')f.fields.forEach(q=>q.__schema=s)});
  if((s.fields.some(f=>f.type=='status')||s.statusField)&&!nopt(s.statuses).length)bad('الحالات (statuses) مطلوبة');
  ['titleField','dateField','statusField','priorityField'].forEach(k=>{if(s[k]&&!seen.has(s[k]))bad(k+' يشير إلى حقل غير موجود: '+s[k])});
  (s.unique||[]).forEach(u=>{if(!Array.isArray(u)||u.some(k=>!seen.has(k)))bad('unique يحوي حقلاً غير موجود')});
  s.titleField=s.titleField||s.fields[0].key;s.singular=s.singular||s.title;
  FE.schemas[s.id]=s;return s};
const fieldsOf=s=>s.fields;

/* ---------- القيم الافتراضية والتطبيع ---------- */
FE.defaults=s=>{const v={};s.fields.forEach(f=>{let d=typeof f.default=='function'?f.default():f.default;
  if(d===undefined&&f.type=='status')d=nopt(s.statuses)[0].v;if(d===undefined)d=T[f.type].empty(f);v[f.key]=T[f.type].norm(f,d)});return v};
const visible=(f,vals)=>f.showIf?!!f.showIf(vals):true;
const isReq=(f,vals)=>typeof f.required=='function'?!!f.required(vals):!!f.required;
FE.normalize=(s,vals,opt)=>{const o={},ld=opt&&opt.load;vals=vals||{};s.fields.forEach(f=>{const t=T[f.type];o[f.key]=ld?(t.load||t.norm)(f,vals[f.key]):visible(f,vals)?t.norm(f,vals[f.key]):t.empty(f)});return o};

/* ---------- التحقق (بدون DOM) ---------- */
function checkField(f,v,vals,errors,path,x){
  const t=T[f.type];
  if(t.isEmpty(v,f)){if(isReq(f,vals))errors[path]=f.type=='checkbox'?Lb(f)+' يجب تأكيده':['select','radio','status','priority','ref','multiselect'].includes(f.type)?'اختر '+Lb(f):Lb(f)+' مطلوب';return}
  let m=t.validate(f,v,{vals,schema:x.schema,orig:x.orig,origVals:x.origVals,errors,path,fields:x.fields});
  if(!m&&typeof f.validate=='function')m=f.validate(v,vals)||'';
  if(m)errors[path]=m}
function uniqueConflict(s,vals,id,errors){for(const keys of (s.unique||[])){if(errors&&keys.some(k=>errors[k]))continue;const norm=r=>keys.map(k=>String(r[k]??'').trim().toLowerCase()).join('|'),me=norm(vals);
    if(keys.every(k=>!T[s.fields.find(f=>f.key==k).type].isEmpty(vals[k]))&&FE.store.list(s.id).some(r=>r.id!=id&&norm(r)==me))return {key:keys[0],msg:s.uniqueMsg||('يوجد سجل مماثل بنفس '+keys.map(k=>Lb(s.fields.find(f=>f.key==k))).join(' و'))}}return null}
FE.validate=(s,values,ctx)=>{ctx=ctx||{};const errors={},vals=values||{},orig=ctx.id?FE.store.get(s.id,ctx.id):null;
  s.fields.forEach(f=>{if(visible(f,vals))checkField(f,vals[f.key],vals,errors,f.key,{schema:s,orig,fields:s.fields})});
  const uc=uniqueConflict(s,vals,ctx.id,errors);if(uc&&!errors[uc.key])errors[uc.key]=uc.msg;
  if(typeof s.validate=='function'){const e=s.validate(vals,ctx)||{};Object.entries(e).forEach(([k,m])=>{if(!errors[k])errors[k]=m})}
  return {ok:!Object.keys(errors).length,errors}};

/* ---------- تنظيف السجلات القادمة من التخزين/الاستعادة ---------- */
FE.sanitizeRecord=(s,r)=>{if(!r||typeof r!='object')return null;const o=FE.normalize(s,r,{load:true});
  o.id=sid(r.id)||uid();o.no=str(r.no,30);o.createdAt=isoOr(r.createdAt);o.updatedAt=isoOr(r.updatedAt);
  if(r.archived&&typeof r.archived=='object'&&typeof r.archived.at=='string'&&ISO.test(r.archived.at))o.archived={at:r.archived.at,reason:str(r.archived.reason,500),by:str(r.archived.by,100)};
  o.log=(Array.isArray(r.log)?r.log:[]).filter(e=>e&&typeof e=='object'&&LOGT.includes(e.t)).slice(-300).map(e=>({at:isoOr(e.at),t:e.t,x:str(e.x,500),by:str(e.by,100)}));
  return o};
FE.sanitizeAll=data=>{const out={};if(!data||typeof data!='object'||Array.isArray(data))return out;
  Object.keys(FE.schemas).forEach(id=>{if(!own(data,id)||!Array.isArray(data[id]))return;const ids=new Set();
    out[id]=data[id].slice(0,20000).map(r=>FE.sanitizeRecord(FE.schemas[id],r)).filter(Boolean).map(r=>{if(ids.has(r.id))r.id=uid();ids.add(r.id);return r})});
  /* مجموعات بلا Schema مسجّل (إصدار أقدم/أحدث): تُحفظ كما هي دون عرض حتى لا تضيع بيانات المستخدم */
  Object.keys(data).forEach(id=>{if(own(out,id)||!/^[a-z]\w{0,30}$/.test(id)||!Array.isArray(data[id]))return;
    try{const j=JSON.stringify(data[id].filter(r=>r&&typeof r=='object'&&!Array.isArray(r)).slice(0,20000));if(j.length<5e6)out[id]=JSON.parse(j)}catch(e){}});
  return out};
FE.collectFiles=data=>{const ks=new Set(),walk=(x,d)=>{if(!x||typeof x!='object'||d>6)return;if(typeof x.k=='string'&&/^f[\w-]{1,59}$/.test(x.k)&&typeof x.n=='string')ks.add(x.k);Object.values(x).forEach(y=>walk(y,d+1))};
  Object.keys(data||{}).forEach(id=>walk(data[id],0));return [...ks]};
/* يمنع تكرار الأرقام: العدّاد لا يقل عن أكبر رقم مستخدم فعلاً */
FE.fixSeq=(data,seq)=>{const o=Object.assign({},seq||{});Object.keys(FE.schemas).forEach(id=>{const s=FE.schemas[id];if(!s.numbering)return;let m=o[id]||0;((data&&data[id])||[]).forEach(r=>{const x=/(\d+)$/.exec(r.no||'');if(x)m=Math.max(m,parseInt(x[1],10))});if(m)o[id]=m});return o};

/* ---------- مخزن السجلات ---------- */
const colOf=id=>{const db=FE.host.db();return db[id]||(db[id]=[])};
const recFiles=(s,r)=>{const ks=[];s.fields.filter(f=>f.type=='file').forEach(f=>(r[f.key]||[]).forEach(m=>ks.push(m.k)));return ks};
const pushLog=(r,t,x)=>{r.log=(r.log||[]).concat({at:iso(),t,x,by:FE.host.user()||''}).slice(-300)};
FE.store={
  list(id,o){o=o||{};return (FE.host.db()[id]||[]).filter(r=>o.all||!!r.archived===!!o.archived)},
  get(id,rid){return (FE.host.db()[id]||[]).find(r=>r.id==rid)||null},
  add(s,vals){const now=iso(),seq=FE.host.seq(),rec=FE.normalize(s,vals);
    if(s.numbering){seq[s.id]=(seq[s.id]||0)+1;rec.no=(s.numbering.prefix||'')+'-'+String(seq[s.id]).padStart(s.numbering.pad||4,'0')}else rec.no='';
    rec.id=uid();rec.createdAt=now;rec.updatedAt=now;rec.log=[];pushLog(rec,'created','تم إنشاء السجل');
    colOf(s.id).push(rec);return FE.host.save()?rec:null},
  update(s,rid,vals){const rec=FE.store.get(s.id,rid);if(!rec)return null;const nv=FE.normalize(s,vals),ch=[];
    s.fields.forEach(f=>{if(JSON.stringify(nv[f.key])!==JSON.stringify(rec[f.key]))ch.push(f)});if(!ch.length)return rec;
    const old=s.statusField?rec[s.statusField]:null;
    ch.forEach(f=>{rec[f.key]=nv[f.key]});rec.updatedAt=iso();
    const others=ch.filter(f=>f.key!=s.statusField);if(others.length)pushLog(rec,'edited','تعديل: '+others.map(f=>f.label).join('، '));
    if(s.statusField&&ch.some(f=>f.key==s.statusField)){const sf=s.fields.find(f=>f.key==s.statusField);pushLog(rec,'status','تغيّرت الحالة من «'+(old?labelOf(sf,old,{schema:s}):'—')+'» إلى «'+labelOf(sf,rec[s.statusField],{schema:s})+'»')}
    return FE.host.save()?rec:null},
  archive(s,rid,reason){const rec=FE.store.get(s.id,rid);if(!rec)return null;rec.archived={at:iso(),reason:str(reason,500),by:FE.host.user()||''};rec.updatedAt=iso();pushLog(rec,'archived','نُقل إلى الأرشيف'+(reason?': '+reason:''));return FE.host.save()?rec:null},
  restore(s,rid){const rec=FE.store.get(s.id,rid);if(!rec)return null;const uc=uniqueConflict(s,rec,rid);FE.store.lastError=uc?uc.msg:'';if(uc)return null;delete rec.archived;rec.updatedAt=iso();pushLog(rec,'restored','استُعيد من الأرشيف');return FE.host.save()?rec:null},
  purge(s,rid){const db=FE.host.db(),rec=FE.store.get(s.id,rid);if(!rec)return false;const ks=recFiles(s,rec);db[s.id]=db[s.id].filter(r=>r.id!=rid);
    if(!FE.host.save())return false;ks.forEach(k=>FE.storage.del(k).catch(()=>{}));return true},
  refsTo(col,id){const out=[];Object.keys(FE.schemas).forEach(k=>{const s=FE.schemas[k];FE.store.list(k,{all:true}).forEach(r=>{if(k==col&&r.id==id)return;
    if(s.fields.some(f=>(f.type=='ref'&&f.ref==col&&r[f.key]==id)||(f.type=='rows'&&f.fields.some(q=>q.type=='ref'&&q.ref==col&&(r[f.key]||[]).some(x=>x[q.key]==id)))))out.push({schema:s,rec:r})})});return out},
  archived(){const out=[];Object.keys(FE.schemas).forEach(id=>FE.store.list(id,{archived:true}).forEach(r=>out.push({schema:FE.schemas[id],rec:r})));return out.sort((a,b)=>a.rec.archived.at<b.rec.archived.at?1:-1)}};

/* ---------- نص قابل للبحث والعرض ---------- */
FE.plain=(s,r,key)=>{const f=s.fields.find(q=>q.key==key);return f?T[f.type].text(f,r[key],{schema:s,vals:r}):''};
FE.searchText=(s,r)=>[r.no,...s.fields.map(f=>FE.plain(s,r,f.key))].filter(Boolean).join(' \n').toLowerCase();
FE.detailHTML=(s,r,o)=>{o=o||{};const st=s.statusField&&s.fields.find(f=>f.key==s.statusField),pr=s.priorityField&&s.fields.find(f=>f.key==s.priorityField);
  const head=`<div class="fe-dhead"><div>${r.no?`<span class="fe-no">${esc(r.no)}</span>`:''}<h3>${esc(r[s.titleField]||'(بدون عنوان)')}</h3></div><div class="fe-dbadges">${st&&r[st.key]?T[st.type].format(st,r[st.key],{schema:s}):''}${pr&&r[pr.key]?T[pr.type].format(pr,r[pr.key],{schema:s}):''}${r.archived?'<span class="bdg t-mute">مؤرشف</span>':''}</div></div>`;
  const body=s.groups.map(g=>{const fs=s.fields.filter(f=>(f.group||s.groups[0].id)==g.id&&f.key!=s.titleField&&f.key!=(st&&st.key)&&f.key!=(pr&&pr.key)&&visible(f,r)&&!T[f.type].isEmpty(r[f.key],f));
    if(!fs.length)return '';return `<section class="fe-group"><h4>${esc(g.title)}</h4><dl class="fe-kv">${fs.map(f=>`<div class="${T[f.type].span==2?'wide':''}"><dt>${esc(f.label)}</dt><dd>${T[f.type].format(f,r[f.key],{schema:s,vals:r})}</dd></div>`).join('')}</dl></section>`}).join('');
  const arch=r.archived?`<section class="fe-group warn"><h4>الأرشفة</h4><dl class="fe-kv"><div><dt>تاريخ الأرشفة</dt><dd>${esc(FE.fmtDT(r.archived.at))}</dd></div><div><dt>السبب</dt><dd>${esc(r.archived.reason||'—')}</dd></div>${r.archived.by?`<div><dt>بواسطة</dt><dd>${esc(r.archived.by)}</dd></div>`:''}</dl></section>`:'';
  const tl=o.timeline===false?'':`<section class="fe-group"><h4>السجل الزمني</h4><ol class="fe-tl">${(r.log||[]).slice().reverse().map(e=>`<li class="t-${e.t}"><time>${esc(FE.fmtDT(e.at))}</time><span>${esc(e.x)}</span>${e.by?`<small>${esc(e.by)}</small>`:''}</li>`).join('')||'<li><span class="fe-dim">لا توجد أحداث</span></li>'}</ol></section>`;
  return head+body+arch+tl};

/* ---------- مكوّنات الواجهة المشتركة ---------- */
const UI=FE.ui={
  badge:(tone,t)=>`<span class="bdg${tone?' t-'+tone:''}">${esc(t)}</span>`,
  progress:p=>{p=Math.max(0,Math.min(100,Number(p)||0));return `<div class="fe-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><i style="width:${p}%"></i><b>${p}%</b></div>`},
  empty:o=>`<div class="fe-empty"><div class="fe-empty-i" aria-hidden="true">${esc(o.icon||'🗂️')}</div><h4>${esc(o.title||'لا توجد بيانات')}</h4>${o.hint?`<p>${esc(o.hint)}</p>`:''}${o.action||''}</div>`,
  skeleton:(n)=>`<div class="fe-skel" aria-busy="true" aria-label="جارٍ التحميل">${Array.from({length:n||3},()=>'<i></i>').join('')}</div>`,
  notify:(m,type)=>{const t=type=='err'?'err':'';(g.toast||(()=>{}))((type=='err'?'✕ ':'✓ ')+m,t)},
  confirm:(msg,o)=>new Promise(res=>{o=o||{};const prev=document.activeElement,d=document.createElement('div');d.className='fe-dlg';
    d.innerHTML=`<div class="fe-dcard" role="alertdialog" aria-modal="true" aria-labelledby="fe_dt" aria-describedby="fe_dm"><h3 id="fe_dt">${esc(o.title||'تأكيد')}</h3><p id="fe_dm">${esc(msg)}</p><div class="fe-acts"><button type="button" class="btn ${o.danger?'danger':'p'}" data-r="1">${esc(o.okLabel||'نعم، متابعة')}</button><button type="button" class="btn" data-r="0">${esc(o.cancelLabel||'إلغاء')}</button></div></div>`;
    document.body.appendChild(d);const done=r=>{document.removeEventListener('keydown',kd,true);d.remove();try{prev&&prev.focus()}catch(e){}res(r)};
    const kd=e=>{if(e.key=='Escape'){e.stopPropagation();e.preventDefault();done(false)}};document.addEventListener('keydown',kd,true);
    d.addEventListener('click',e=>{const b=e.target.closest('[data-r]');if(b)done(b.dataset.r=='1');else if(e.target==d)done(false)});
    (d.querySelector(o.danger?'[data-r="0"]':'[data-r="1"]')).focus()}),
  prompt:o=>new Promise(res=>{o=o||{};const prev=document.activeElement,d=document.createElement('div');d.className='fe-dlg';
    d.innerHTML=`<div class="fe-dcard" role="dialog" aria-modal="true" aria-labelledby="fe_pt"><h3 id="fe_pt">${esc(o.title||'')}</h3><label class="fe-label" for="fe_pi">${esc(o.label||'')}${o.required?'<b class="fe-req">*</b>':''}</label><textarea id="fe_pi" rows="3" maxlength="${o.max||500}" placeholder="${esc(o.placeholder||'')}"></textarea><div class="fe-err" id="fe_pe" role="alert"></div><div class="fe-acts"><button type="button" class="btn ${o.danger?'danger':'p'}" data-r="1">${esc(o.okLabel||'تأكيد')}</button><button type="button" class="btn" data-r="0">إلغاء</button></div></div>`;
    document.body.appendChild(d);const ta=d.querySelector('textarea'),er=d.querySelector('#fe_pe');
    const done=r=>{document.removeEventListener('keydown',kd,true);d.remove();try{prev&&prev.focus()}catch(e){}res(r)};
    const ok=()=>{const v=ta.value.trim();if(o.required&&v.length<(o.minLen||3)){er.textContent=(o.label||'الحقل')+' مطلوب ('+(o.minLen||3)+' أحرف على الأقل)';ta.setAttribute('aria-invalid','true');ta.focus();return}done(v)};
    const kd=e=>{if(e.key=='Escape'){e.stopPropagation();e.preventDefault();done(null)}else if(e.key=='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();ok()}};document.addEventListener('keydown',kd,true);
    d.addEventListener('click',e=>{const b=e.target.closest('[data-r]');if(b)b.dataset.r=='1'?ok():done(null);else if(e.target==d)done(null)});ta.focus()})
};

/* ---------- تنزيل الملفات ---------- */
FE.download=(b,n)=>{const a=document.createElement('a'),u=URL.createObjectURL(b);a.href=u;a.download=n;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),8000)};
FE.openFile=async(k,name)=>{let b=null;try{b=await FE.storage.get(k)}catch(e){}if(!b)return UI.notify('الملف غير متوفر على هذا الجهاز','err');FE.download(b,name||'file')};
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('[data-file]');if(a){e.preventDefault();FE.openFile(a.dataset.file,a.dataset.name)}});

/* ---------- بناء النموذج ---------- */
let fseq=0;
function wrap(f,c){const t=T[f.type],vals=c.vals,v=vals[f.key]!==undefined?vals[f.key]:t.empty(f),req=isReq(f,vals);
  c=Object.assign({},c,{req});const vis=c.sub||visible(f,vals),span=f.span||t.span||1,id=c.id,lbl=esc(f.label);
  const lab=t.grouped?`<span class="fe-label" id="${id}_l">${lbl}<b class="fe-req" aria-hidden="true"${req?'':' hidden'}>*</b></span>`:`<label class="fe-label" id="${id}_l" for="${id}">${lbl}<b class="fe-req" aria-hidden="true"${req?'':' hidden'}>*</b></label>`;
  return `<div class="fe-field" data-key="${esc(f.key)}" data-type="${f.type}" data-span="${span}"${vis?'':' hidden'}>${lab}${t.html(f,v,c)}${f.hint?`<div class="fe-hint">${esc(f.hint)}</div>`:''}<div class="fe-err" id="${id}_e" role="alert"></div></div>`}
function formHTML(s,vals,sess){const gfirst=s.groups[0].id;
  return s.groups.map(g=>{const fs=s.fields.filter(f=>(f.group||gfirst)==g.id);if(!fs.length)return '';
    return `<section class="fe-group"><h4>${esc(g.title)}</h4>${g.hint?`<p class="fe-hint">${esc(g.hint)}</p>`:''}<div class="fe-grid">${fs.map(f=>wrap(f,{id:sess.pre+'_'+f.key,schema:s,vals,sess})).join('')}</div></section>`}).join('')}

FE.form=(s,o)=>{o=o||{};const rec=o.record||null,mode=o.mode||(rec?'edit':'add'),prev=document.activeElement;
  const pre='fe'+(++fseq),sess={pre,files:{},added:new Set(),removed:new Set(),live:false,pending:[]};
  let init=mode=='add'?FE.defaults(s):Object.assign(FE.defaults(s),rec||{});
  if(o.defaults&&mode=='add')Object.assign(init,FE.normalize(s,Object.assign({},init,o.defaults)));
  if(mode=='copy'){init[s.titleField]=str((init[s.titleField]||'')+' (نسخة)',(s.fields.find(f=>f.key==s.titleField).maxLength||200));
    s.fields.filter(f=>f.type=='file').forEach(f=>init[f.key]=[]);if(s.statusField)init[s.statusField]=nopt(s.statuses)[0].v}
  s.fields.filter(f=>f.type=='file').forEach(f=>sess.files[f.key]=(init[f.key]||[]).map(m=>Object.assign({},m)));
  const layer=document.createElement('div');layer.className='fe-layer';
  const title=mode=='edit'?'تعديل '+s.singular:mode=='copy'?'نسخ '+s.singular:'إضافة '+s.singular;
  layer.innerHTML=`<div class="fe-sheet" role="dialog" aria-modal="true" aria-labelledby="${pre}_t"><div class="fe-head"><h3 id="${pre}_t">${esc(title)}${mode=='edit'&&rec.no?` <small>${esc(rec.no)}</small>`:''}</h3><button type="button" class="fe-close" data-act="cancel" aria-label="إغلاق">✕</button></div>
  <form class="fe-body" novalidate>${mode=='copy'?`<div class="fe-note">نسخة من ${esc(o.record&&o.record.no||'السجل')}. لا تُنسخ المرفقات، وتبدأ الحالة من أولى الحالات.</div>`:''}<div class="fe-summary" role="alert" hidden></div>${formHTML(s,init,sess)}</form>
  <div class="fe-foot"><button type="button" class="btn p" data-act="save">${mode=='edit'?'حفظ التعديلات':'حفظ'}</button><button type="button" class="btn" data-act="cancel">إلغاء</button>${mode=='edit'?`<span class="fe-sp"></span><button type="button" class="btn" data-act="copy">نسخ</button><button type="button" class="btn danger" data-act="archive">أرشفة</button>`:''}</div></div>`;
  document.body.appendChild(layer);document.body.classList.add('fe-lock');
  const form=layer.querySelector('form'),saveBtn=layer.querySelector('[data-act=save]');
  const readAll=()=>{const v={};s.fields.forEach(f=>{const w=form.querySelector(':scope > .fe-group > .fe-grid > .fe-field[data-key="'+f.key+'"]');v[f.key]=w?T[f.type].read(f,w,sess):T[f.type].empty(f)});return v};
  const snap=()=>JSON.stringify(readAll());let base=snap();
  const wrapEl=path=>{const p=path.split('.');if(p.length==1)return form.querySelector(':scope > .fe-group > .fe-grid > .fe-field[data-key="'+p[0]+'"]');
    const row=form.querySelectorAll('.fe-rows[data-rows="'+p[0]+'"] > .fe-row')[+p[1]];return row&&row.querySelector('.fe-field[data-key="'+p[2]+'"]')};
  const showErrors=errors=>{form.querySelectorAll('.fe-field.bad').forEach(w=>{w.classList.remove('bad');const e=w.querySelector(':scope > .fe-err');if(e)e.textContent='';w.querySelectorAll('[aria-invalid]').forEach(i=>i.removeAttribute('aria-invalid'))});
    const sum=form.querySelector('.fe-summary'),items=[];
    Object.entries(errors).forEach(([path,m])=>{const w=wrapEl(path);if(!w){items.push([null,m]);return}w.classList.add('bad');const e=w.querySelector(':scope > .fe-err');if(e)e.textContent='⚠ '+m;
      w.querySelectorAll('input,select,textarea').forEach(i=>i.setAttribute('aria-invalid','true'));items.push([w,m])});
    if(items.length){sum.hidden=false;sum.innerHTML='<b>يرجى تصحيح '+items.length+' '+(items.length>2?'حقول':'حقل')+':</b><ul>'+items.map((x,i)=>`<li><a data-focus="${i}">${esc(x[1])}</a></li>`).join('')+'</ul>';sum._items=items}else{sum.hidden=true;sum.innerHTML=''}
    return items};
  const revalidate=()=>{if(!sess.live)return;showErrors(FE.validate(s,readAll(),{id:mode=='edit'?rec.id:null}).errors)};
  const refresh=()=>{const v=readAll();s.fields.forEach(f=>{const w=form.querySelector(':scope > .fe-group > .fe-grid > .fe-field[data-key="'+f.key+'"]');if(!w)return;
    if(f.showIf)w.hidden=!visible(f,v);const st=w.querySelector(':scope > .fe-label .fe-req');if(st)st.hidden=!isReq(f,v);const rq=isReq(f,v);if(f.type!='rows'&&f.type!='file')w.querySelectorAll('input,select,textarea').forEach(i=>{if(rq)i.setAttribute('aria-required','true');else i.removeAttribute('aria-required')})})};
  const close=()=>{document.removeEventListener('keydown',kd,true);layer.remove();document.body.classList.remove('fe-lock');try{prev&&prev.focus&&prev.focus()}catch(e){}};
  const discardAdded=()=>{sess.added.forEach(k=>FE.storage.del(k).catch(()=>{}));sess.added.clear()};
  const cancel=async()=>{if(snap()!==base&&!(await UI.confirm('توجد تعديلات غير محفوظة. هل تريد تجاهلها؟',{title:'تجاهل التعديلات',okLabel:'تجاهل',danger:true})))return;discardAdded();close();o.onCancel&&o.onCancel()};
  const save=async()=>{if(saveBtn.disabled)return;await Promise.all(sess.pending);const vals=readAll(),res=FE.validate(s,vals,{id:mode=='edit'?rec.id:null});sess.live=true;
    const items=showErrors(res.errors);if(!res.ok){UI.notify('تعذّر الحفظ: راجع الحقول المحددة','err');const first=items.find(x=>x[0]);if(first){first[0].scrollIntoView({block:'center'});const i=first[0].querySelector('input,select,textarea');i&&i.focus()}return}
    saveBtn.disabled=true;saveBtn.classList.add('busy');const lab=saveBtn.textContent;saveBtn.textContent='جارٍ الحفظ…';
    let out=null;try{out=mode=='edit'?FE.store.update(s,rec.id,vals):FE.store.add(s,vals)}catch(e){out=null}
    if(!out){saveBtn.disabled=false;saveBtn.classList.remove('busy');saveBtn.textContent=lab;UI.notify('تعذّر حفظ السجل','err');return}
    sess.removed.forEach(k=>FE.storage.del(k).catch(()=>{}));sess.added.clear();close();
    UI.notify(mode=='edit'?'تم حفظ التعديلات':'تمت إضافة «'+(out[s.titleField]||s.singular)+'»');
    try{o.onSaved&&o.onSaved(out,mode)}catch(e){console.error(e)}};
  const archive=async()=>{const reason=await UI.prompt({title:'نقل «'+(rec[s.titleField]||s.singular)+'» إلى الأرشيف',label:'سبب الأرشفة',required:true,okLabel:'أرشفة',danger:true,placeholder:'مثال: انتهى العمل، أو أُدخل بالخطأ'});if(reason===null)return;
    const out=FE.store.archive(s,rec.id,reason);if(!out)return UI.notify('تعذّرت الأرشفة','err');discardAdded();close();UI.notify('نُقل السجل إلى الأرشيف');o.onArchived&&o.onArchived(out)};
  const addFiles=(f,input)=>{const list=sess.files[f.key],box=form.querySelector('.fe-filelist[data-list="'+f.key+'"]'),w=input.closest('.fe-field'),errs=[];
    [...input.files].forEach(file=>{if(list.length>=(f.max||10)){errs.push('الحد الأقصى '+(f.max||10)+' ملفات');return}
      if(file.size>maxMB(f)){errs.push('الملف «'+file.name+'» أكبر من '+fsz(maxMB(f)));return}
      if(f.accept){const ok=f.accept.split(',').some(a=>{a=a.trim().toLowerCase();return a.startsWith('.')?file.name.toLowerCase().endsWith(a):a.endsWith('/*')?file.type.startsWith(a.slice(0,-1)):file.type==a});if(!ok){errs.push('نوع الملف «'+file.name+'» غير مسموح');return}}
      const k='f'+uid(),m={n:file.name.slice(0,200),k,s:file.size,t:file.type};list.push(m);sess.added.add(k);
      sess.pending.push(FE.storage.put(k,file).catch(()=>{const i=list.indexOf(m);if(i>=0)list.splice(i,1);sess.added.delete(k);box.innerHTML=list.map(x=>fileItem(f,x)).join('');UI.notify('تعذّر حفظ الملف «'+file.name+'»','err')}))});
    input.value='';box.innerHTML=list.map(m=>fileItem(f,m)).join('');
    const e=w.querySelector(':scope > .fe-err');if(errs.length){w.classList.add('bad');e.textContent='⚠ '+errs.join('، ')}else{w.classList.remove('bad');e.textContent=''}};
  layer.addEventListener('click',e=>{const b=e.target.closest('[data-act],[data-focus]');if(!b){if(e.target==layer)cancel();return}
    if(b.dataset.focus!==undefined){const it=form.querySelector('.fe-summary')._items[+b.dataset.focus];if(it&&it[0]){it[0].scrollIntoView({block:'center'});const i=it[0].querySelector('input,select,textarea');i&&i.focus()}return}
    const a=b.dataset.act;
    if(a=='save')save();else if(a=='cancel')cancel();
    else if(a=='copy'){const r=rec;cancel().then(()=>{if(!document.body.contains(layer))FE.form(s,Object.assign({},o,{record:r,mode:'copy'}))})}
    else if(a=='archive')archive();
    else if(a=='addrow'){const fld=b.closest('.fe-field'),f=s.fields.find(q=>q.key==fld.dataset.key),box=fld.querySelector('.fe-rows');
      if(box.children.length>=(f.maxRows||50))return UI.notify('بلغت الحد الأقصى للبنود','err');box.insertAdjacentHTML('beforeend',rowHTML(f,{},{id:sess.pre+'_'+f.key,schema:s,sess}));const row=box.lastElementChild;row.dataset.rid='';const i=row.querySelector('input,select,textarea');i&&i.focus();revalidate()}
    else if(a=='delrow'){b.closest('.fe-row').remove();revalidate()}
    else if(a=='clear'){b.closest('.fe-field').querySelectorAll('input:checked').forEach(i=>{i.checked=false});refresh();revalidate()}
    else if(a=='rmfile'){const fld=b.closest('.fe-field'),f=s.fields.find(q=>q.key==fld.dataset.key),list=sess.files[f.key],i=list.findIndex(m=>m.k==b.dataset.k);
      if(i>=0){const m=list.splice(i,1)[0];if(sess.added.has(m.k)){sess.added.delete(m.k);FE.storage.del(m.k).catch(()=>{})}else sess.removed.add(m.k);b.closest('.fe-file').remove();revalidate()}}});
  layer.addEventListener('input',e=>{const t=e.target;if(t.type=='date'){const h=t.closest('.fe-field').querySelector('.fe-hij');if(h)h.textContent=t.value?'الموافق: '+FE.hijri(t.value):''}if(t.type=='file')return;refresh();revalidate()});
  layer.addEventListener('change',e=>{const t=e.target;if(t.type=='file'){const f=s.fields.find(q=>q.key==t.closest('.fe-field').dataset.key);addFiles(f,t);return}refresh();revalidate()});
  const kd=e=>{if(!document.body.contains(layer))return;if(document.querySelector('.fe-dlg'))return;
    if(e.key=='Escape'){e.preventDefault();e.stopPropagation();cancel()}else if(e.key=='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();save()}};
  document.addEventListener('keydown',kd,true);
  form.addEventListener('submit',e=>{e.preventDefault();save()});
  const first=form.querySelector('input:not([type=file]),select,textarea');first&&first.focus();
  return {layer,form,close,readAll,save,sess}};
})(window);
