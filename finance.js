/* نظام سهولة المالي — OutCap (محلي بالكامل) */
(function(g){
'use strict';
const FIN=g.FIN=g.FIN||{};
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
FIN.esc=esc;
const nd=s=>String(s).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/٫/g,'.').replace(/[٬،]/g,'').trim();
const z=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());
const DRE=/^\d{4}-\d{2}-\d{2}$/;
const sid=x=>String(x??'').replace(/[^\w-]/g,'').slice(0,40);
const str=(x,n)=>String(x??'').slice(0,n);
const rnd=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const num=v=>{const n=Number(nd(v));return Number.isFinite(n)?n:0};

FIN.CATS=[
  {id:'food',l:'مطاعم ووجبات',k:'need'},
  {id:'grocery',l:'بقالة ومواد غذائية',k:'need'},
  {id:'fuel',l:'وقود ونقل',k:'need'},
  {id:'health',l:'صحة وصيدليات',k:'need'},
  {id:'bills',l:'فواتير واتصالات',k:'need'},
  {id:'edu',l:'تعليم',k:'need'},
  {id:'home',l:'منزل وصيانة',k:'need'},
  {id:'clothes',l:'ملابس',k:'want'},
  {id:'shop',l:'تسوق عام',k:'want'},
  {id:'ent',l:'ترفيه واشتراكات',k:'want'},
  {id:'cafe',l:'مقاهي',k:'want'},
  {id:'travel',l:'سفر وفنادق',k:'want'},
  {id:'other',l:'أخرى',k:'want'}
];
const CATIDS=FIN.CATS.map(c=>c.id);
FIN.catOf=id=>FIN.CATS.find(c=>c.id==id)||FIN.CATS[FIN.CATS.length-1];
FIN.kindOf=id=>FIN.catOf(id).k;

function nrm(s){return String(s||'').toLowerCase().replace(/[^\u0600-\u06FFa-z0-9]+/g,'').trim()}
FIN.nrm=nrm;

/* قاعدة 330+ متجر سعودي */
const RAW=[
['food','ماكدونالدز','mcdonalds','هارديز','hardees','برجر كنج','burgerking','كنتاكي','kfc','البيك','albaik','هرفي','herfy','كودو','kudu','شاورما','شاورما هاوس','الطازج','tazaj','مايسترو بيتزا','maestro','دومينوز','dominos','بيتزا هت','pizzahut','بابا جونز','papajohns','صب واي','subway','تاكو بل','tacobell','تكا','تكا','شاورمر','shawarmer','مندي','مندي باشا','كبابجي','كباب','ستاربكس فود','بروست','بروستد','دجاج','friedchicken','nandos','ناندوز','فايرجريل','firegrill','بافلو وينجز','buffalowings','تشيليز','chilis','أبل بيز','applebees','تي جي آي','tgifridays','فوديز','foodies','وجبات سريعة','fastfood','مطعم','restaurant','كرم الشام','كشري','كشري التحرير','يلا يلا','يللا','dunkin food','دانكن فود','ليتل سيزر','littlecaesars','هت','pizza','برجر','burger','شاورما الملك','king shawarma','مشويات','grill','ستيك','steak','سمك','seafood','سوشي','sushi','هوكايدو','hokkaido','بنانزا','bonanza','فودكورت','foodcourt'],
['grocery','بنده','panda','التميمي','tamimi','العثيم','othaim','كارفور','carrefour','لولو','lulu','دانوب','danube','نوري','nouri','الراية','alraya','السدحان','saddhan','هايبر','hyperpanda','farm','المزرعة','bindawood','بن داود','مانويل','manuel','سبلو','saco grocery','أسواق','market','سوبرماركت','supermarket','الجزيرة ماركت','الجود','خيرات','خيرات الريف','جمعية','coops','تمور','dates','حليب','dairy','مخبز','bakery','أفران','أفران الرياض','لحم','butcher','خضار','vegetables','فواكه','fruit','wholesale','جملة'],
['fuel','أرامكو','aramco','ساسكو','sasco','الدريس','aldrees','بترول','petrol','محطة','station','وقود','fuel','نافت','naft','الناقلة','naqla','أوبر','uber','كريم','careem','تاكسي','taxi','حافلات','bus','قطار','train','سار','sar','خطوط','airline','الخطوط السعودية','saudia','فلاي ناس','flynas','مواقف','parking','نقل','transport','توصيل','delivery fee','أوبر درايف','uber drive'],
['health','صيدلية','pharmacy','النهدي','nahdi','الدواء','al dawaa',' acquia',' acquia','whitedot','وايت دوت','مستشفى','hospital','عيادة','clinic','مختبر','lab','دكتور','doctor','أسنان','dental','نظارات','optical','السعودية الألمانية','german','الحبيب','alhabib','دله','dallah','الموسى','almousa','سوليدرتي','solidarity','تكافل','takaful','تأمين طبي','bupa','بوبا','ميدغلف','medgulf','لقاحات','vaccine','فيتامين','vitamin'],
['bills','STC','stc','موبايلي','mobily','زين','zain','الاتصالات','telecom','كهرباء','sec','السعودية للكهرباء','مياه','nwc','الوطنية للمياه','فاتورة','bill','إنترنت','internet','فايبر','fiber','جوال','jawwal','سلفا','salam','ليبارا','lebaras','فريندلي','friendly','نت','wifi','اشتراك جوال','recharge','شحن','topup','سداد','sadad','مدى فواتير','sadad bill'],
['edu','مدارس','school','جامعة','university','كلية','college','معهد','institute','دورة','course','تعليم','education','قرطاسية','stationery','مكتبة جرير كتب','jarir books','نهضة','nahda','العبيكان','obeikan','رسوم دراسية','tuition','روضة','kg','تحفيظ','quran school'],
['home','ساكو','saco','إكسترا صيانة','extra home','هوم سنتر','homecenter','ايكيا','ikea','هوم بوكس','homebox','سيف','safeer','الصيانة','maintenance','سباك','plumber','كهربائي','electrician','دهان','paint','أثاث','furniture','ستائر','curtains','مفروشات','linen','سفاري','safari','باني','bany','سيراميك','ceramic','أدوات منزلية','household','تنظيف','cleaning','غسيل','laundry','مغسلة','dryclean'],
['clothes','زارا','zara','اتش اند ام','hm','إتش آند إم',' pronovias',' pronovias','ماكس','max','سنتربوينت','centrepoint','رد تاغ','redtag','نمشي','namshi','نون ملابس','noon fashion','شي إن','shein','أديداس','adidas','نايكي','nike','بوما','puma','ريبوك','reebok',' Lacoste','lacoste','polo','رالف','ralph','أحذية','shoes',' millano','ميلانو','cc','charleskeith','باتشي ملابس','bathah','العثيم مول ملابس'],
['shop','جرير','jarir','اكسترا','extra','نون','noon','أمازون','amazon','حراج','haraj','علي بابا','alibaba','مكتبة','bookstore','إلكترونيات','electronics','سامسونج','samsung','آبل ستور','applestore','هواوي','huawei','شاومي','xiaomi','سوني','sony','بست باي','bestbuy','السيف','alsaif','السيف غاليري','alsaifgallery','ساكو تسوق','saco shop','اللولو تسوق','lulu shop','المدينة','madina mall','الرياض بارك','riyadhpark','السلام مول','salammall','العثيم مول','othaimmall','الراشد مول','rashidmall','ردسي مول','redseamall','جدة مول','jeddahmall','مول','mall','سوق','souq','تسوق','shopping'],
['ent','نتفلكس','netflix','شاهد','shahid','يوتيوب','youtube','سبوتيفاي','spotify','بلايستيشن','playstation','إكس بوكس','xbox','ستيم','steam','سينما','cinema','موفي','movie','vox','فيوكس','ام سي','amc','بولينج','bowling','ملاهي','fun',' festiva','festival','تذكرة','ticket','webook','وي بوك','ستاد','stadium','نادي','gym','fitness','وقت اللياقة','fitness time','جولدز','goldsgym','اشتراك نادي'],
['cafe','ستاربكس','starbucks','دانكن','dunkin','بارنز','barns','كوفي','coffee','قهوة','qahwa','نوفارا','novara','نوارا','دوز','doze','أور','urth','أورث','timhortons','تيم هورتنز','كوستا','costa','كوفي بيل','coffeebeel','كوب','cup','محمصة','roastery','نسبريسو','nespresso','بيت الشاي','teahouse','شاي','tea','كرك','karak','موهيتو','mojito'],
['travel','فندق','hotel','هيلتون','hilton','ماريوت','marriott','موفنبيك','movenpick','نوفوتيل','novotel','ريتز','ritz','فورسيزونز','fourseasons','حياة','hyatt','شقق فندقية','aparthotel','طيران','flight','تذاكر سفر','booking','booking.com','Airbnb','airbnb','عمرة','umrah','حج','hajj','خطوط القطار','harramain','الحرمين','تاكسي مطار','airport'],
['other','حوالة','transfer','صراف','atm','بنك','bank','الراجحي','rajhi','الأهلي','alahli','الإنماء','alinma','الرياض بنك','riyadbank','ساب','sabb','البلاد','bilad','الجزيرة بنك','jazira','رسوم','fee','عمولة','commission','زكاة','zakat','صدقة','sadaqa','تبرع','donation','غير مصنف','uncategorized','أخرى','other']
];
const DEF={};
RAW.forEach(([cat,...names])=>names.forEach(n=>{const k=nrm(n);if(k)DEF[k]=cat}));
FIN.DEF=DEF;
FIN.MERCHANT_COUNT=Object.keys(DEF).length;

FIN.defaults=()=>({
  salary:0,payday:1,startBal:0,useStart:false,bigAmt:300,smallAmt:30,
  cats:Object.fromEntries(FIN.CATS.map(c=>[c.id,c.l])),
  merchants:{}, txs:[], bills:[], recDays:[]
});

FIN.sanitize=d=>{
  const o=FIN.defaults();
  if(!d||typeof d!='object')return o;
  o.salary=Math.max(0,num(d.salary));
  o.payday=Math.min(28,Math.max(1,Math.round(num(d.payday)||1)));
  o.startBal=num(d.startBal);
  o.useStart=!!d.useStart;
  o.bigAmt=Math.max(1,num(d.bigAmt)||300);
  o.smallAmt=Math.max(1,num(d.smallAmt)||30);
  if(d.cats&&typeof d.cats=='object')Object.keys(d.cats).forEach(k=>{if(/^[a-z]{1,20}$/.test(k))o.cats[k]=str(d.cats[k],40)||o.cats[k]||k});
  if(d.merchants&&typeof d.merchants=='object')Object.entries(d.merchants).forEach(([k,v])=>{const nk=nrm(k);if(nk&&CATIDS.includes(v))o.merchants[nk]=v});
  (Array.isArray(d.txs)?d.txs:[]).forEach((x,i)=>{
    if(!x||typeof x!='object')return;
    const amt=Math.abs(num(x.amt));if(!amt)return;
    const dt=DRE.test(x.d)?x.d:ymd(new Date());
    const mer=str(x.m,120).trim()||'غير معروف';
    const cat=CATIDS.includes(x.c)?x.c:FIN.guess(mer,o);
    o.txs.push({id:sid(x.id)||'t'+Date.now()+i,d:dt,amt,m:mer,c:cat,h:str(x.h,80)});
  });
  (Array.isArray(d.bills)?d.bills:[]).forEach((x,i)=>{
    if(!x||typeof x!='object')return;
    const nm=str(x.n,80).trim();if(!nm)return;
    o.bills.push({id:sid(x.id)||'b'+Date.now()+i,n:nm,amt:Math.max(0,num(x.amt)),day:Math.min(28,Math.max(1,Math.round(num(x.day)||1))),paid:!!x.paid,last:DRE.test(x.last)?x.last:''});
  });
  (Array.isArray(d.recDays)?d.recDays:[]).forEach(x=>{const n=Math.round(num(x));if(n>=1&&n<=31)o.recDays.push(n)});
  o.recDays=[...new Set(o.recDays)].sort((a,b)=>a-b);
  return o;
};

FIN.guess=(merchant,F)=>{
  const k=nrm(merchant);
  if(F&&F.merchants&&F.merchants[k])return F.merchants[k];
  if(DEF[k])return DEF[k];
  const keys=Object.keys(DEF);
  for(const d of keys){if(k.includes(d)||d.includes(k))return DEF[d]}
  return 'other';
};

FIN.learn=(F,merchant,cat)=>{
  const k=nrm(merchant);if(!k||!CATIDS.includes(cat))return;
  F.merchants[k]=cat;
};

FIN.hashTx=(d,amt,m)=>String(d)+'|'+Number(amt).toFixed(2)+'|'+nrm(m);

FIN.parseCSV=t=>{
  t=String(t||'').replace(/^\uFEFF/,'');
  const l1=t.split('\n')[0]||'';
  const d=(l1.match(/;/g)||[]).length>(l1.match(/,/g)||[]).length?';':',';
  const R=[];let r=[],c='',q=false;
  for(let i=0;i<t.length;i++){
    const ch=t[i];
    if(q){if(ch=='"'){if(t[i+1]=='"'){c+='"';i++}else q=false}else c+=ch}
    else if(ch=='"')q=true;
    else if(ch==d){r.push(c);c=''}
    else if(ch=='\n'||ch=='\r'){if(ch=='\r'&&t[i+1]=='\n')i++;r.push(c);c='';if(r.some(x=>x!==''))R.push(r);r=[]}
    else c+=ch;
  }
  r.push(c);if(r.some(x=>x!==''))R.push(r);
  return R;
};

FIN.parseDate=v=>{
  v=nd(String(v||'').trim());
  if(DRE.test(v))return v;
  let m=/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/.exec(v);
  if(m){let y=+m[3];if(y<100)y+=2000;const a=+m[1],b=+m[2];const day=a>12?a:b,mo=a>12?b:a;return y+'-'+z(mo)+'-'+z(day)}
  if(/^\d{5}(\.\d+)?$/.test(v)){const D=new Date(Math.round((+v-25569)*864e5));return D.getUTCFullYear()+'-'+z(D.getUTCMonth()+1)+'-'+z(D.getUTCDate())}
  return '';
};

FIN.importRows=(F,rows)=>{
  if(!rows.length)return {add:0,skip:0};
  let head=rows[0].map(x=>nrm(x));
  const di=head.findIndex(h=>h==='date'||h==='التاريخ'||h==='تاريخ');
  const ai=head.findIndex(h=>h==='amount'||h==='المبلغ'||h==='قيمة');
  const mi=head.findIndex(h=>h==='merchant'||h==='المتجر'||h==='التاجر'||h==='الوصف');
  const start=(di>=0&&ai>=0)?1:0;
  const D=start?di:0,A=start?ai:1,M=start? (mi>=0?mi:2):2;
  const seen=new Set(F.txs.map(t=>t.h||FIN.hashTx(t.d,t.amt,t.m)));
  let add=0,skip=0;
  for(let i=start;i<rows.length;i++){
    const row=rows[i];
    const d=FIN.parseDate(row[D]);
    const amt=Math.abs(num(row[A]));
    const mer=str(row[M],120).trim();
    if(!d||!amt||!mer){skip++;continue}
    const h=FIN.hashTx(d,amt,mer);
    if(seen.has(h)){skip++;continue}
    seen.add(h);
    const c=FIN.guess(mer,F);
    F.txs.push({id:'t'+rnd().replace(/\W/g,''),d,amt,m:mer,c,h});
    add++;
  }
  return {add,skip};
};

FIN.cycle=(F,now)=>{
  now=now||new Date();
  const y=now.getFullYear(),m=now.getMonth(),day=now.getDate();
  const pd=Math.min(F.payday||1,28);
  let start=new Date(y,m,pd);
  if(day<pd)start=new Date(y,m-1,pd);
  const end=new Date(start.getFullYear(),start.getMonth()+1,pd);
  end.setDate(end.getDate()-1);
  const days=Math.round((end-start)/864e5)+1;
  const bills=F.bills.reduce((a,b)=>a+Math.max(0,b.amt),0);
  const income=F.useStart?num(F.startBal):num(F.salary);
  const pool=Math.max(0,income-bills);
  const cap=days?pool/days:0;
  return {start,end,days,bills,income,pool,cap,key:ymd(start)};
};

FIN.daySpent=(F,d)=>F.txs.filter(t=>t.d===d).reduce((a,t)=>a+t.amt,0);

FIN.status=(spent,cap)=>{
  if(cap<=0)return spent>0?'bad':'ok';
  const r=spent/cap;
  if(r>=1)return 'bad';
  if(r>=0.7)return 'warn';
  return 'ok';
};

FIN.todayStats=(F,now)=>{
  now=now||new Date();
  const cyc=FIN.cycle(F,now);
  const td=ymd(now);
  const spent=FIN.daySpent(F,td);
  const left=cyc.cap-spent;
  const st=FIN.status(spent,cyc.cap);
  const over=Math.max(0,spent-cyc.cap);
  return {cyc,td,spent,left,st,over};
};

FIN.monthTx=(F,now)=>{
  const c=FIN.cycle(F,now);
  const a=ymd(c.start),b=ymd(c.end);
  return F.txs.filter(t=>t.d>=a&&t.d<=b);
};

FIN.dual=(txs)=>{
  let need=0,want=0;
  txs.forEach(t=>{if(FIN.kindOf(t.c)==='need')need+=t.amt;else want+=t.amt});
  const tot=need+want;
  return {need,want,tot,needP:tot?Math.round(need/tot*100):0,wantP:tot?Math.round(want/tot*100):0};
};

FIN.smallSum=(F,now)=>{
  const lim=F.smallAmt||30;
  return FIN.monthTx(F,now).filter(t=>t.amt<lim).reduce((a,t)=>a+t.amt,0);
};

FIN.bigOnes=(F,now)=>{
  const lim=F.bigAmt||300;
  return FIN.monthTx(F,now).filter(t=>t.amt>=lim).sort((a,b)=>b.amt-a.amt);
};

FIN.topMerchants=(txs,n)=>{
  const m={};
  txs.forEach(t=>{const k=t.m;m[k]=(m[k]||0)+t.amt});
  return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,n||8);
};

FIN.peakDays=(txs)=>{
  const m={};
  txs.forEach(t=>{m[t.d]=(m[t.d]||0)+t.amt});
  const arr=Object.entries(m).sort((a,b)=>b[1]-a[1]);
  return {heavy:arr[0],light:arr[arr.length-1],byDay:arr};
};

FIN.prevCycle=(F,now)=>{
  const c=FIN.cycle(F,now);
  const p=new Date(c.start);p.setDate(p.getDate()-1);
  return FIN.cycle(F,p);
};

FIN.compare=(F,now)=>{
  const cur=FIN.monthTx(F,now).reduce((a,t)=>a+t.amt,0);
  const pc=FIN.prevCycle(F,now);
  const a=ymd(pc.start),b=ymd(pc.end);
  const prev=F.txs.filter(t=>t.d>=a&&t.d<=b).reduce((s,t)=>s+t.amt,0);
  return {cur,prev,diff:cur-prev};
};

FIN.insights=(F,now)=>{
  const txs=FIN.monthTx(F,now);
  const dual=FIN.dual(txs);
  const peak=FIN.peakDays(txs);
  const small=FIN.smallSum(F,now);
  const big=FIN.bigOnes(F,now);
  const top=FIN.topMerchants(txs,5);
  const st=FIN.todayStats(F,now);
  const cmp=FIN.compare(F,now);
  const out=[];
  if(peak.heavy)out.push('يومك الأثقل مالياً هذا الدورة: '+peak.heavy[0]+' بمبلغ '+peak.heavy[1].toFixed(0)+' ر.س.');
  if(dual.wantP>=40)out.push('الرفاهية تمثل '+dual.wantP+'٪ من صرفك — أعلى مما يظن كثيرون.');
  else out.push('أساسياتك تمثل '+dual.needP+'٪ وهذا توزيع متزن نسبياً.');
  if(small>0)out.push('المشتريات الصغيرة (أقل من '+(F.smallAmt||30)+' ر.س) تراكمت إلى '+small.toFixed(0)+' ر.س.');
  if(big.length)out.push('عمليات كبيرة ('+(F.bigAmt||300)+'+): '+big.length+' عملية، أعلاها '+big[0].m+' '+big[0].amt.toFixed(0)+' ر.س.');
  if(top[0])out.push('عادتك الأكثر استهلاكاً: '+top[0][0]+' ('+top[0][1].toFixed(0)+' ر.س).');
  if(cmp.prev)out.push(cmp.diff>0?'صرفك أعلى من الدورة السابقة بـ '+cmp.diff.toFixed(0)+' ر.س.':'صرفك أقل من الدورة السابقة بـ '+(-cmp.diff).toFixed(0)+' ر.س.');
  if(st.over>0)out.push('تجاوزت حد اليوم بـ '+st.over.toFixed(0)+' ر.س. يمكن توزيعه على أيام التعافي التي تختارها.');
  if(!txs.length)out.push('لا مصروفات في هذه الدورة بعد. ابدأ بإضافة عملية أو استيراد كشف.');
  return out;
};

FIN.recover=(over,days)=>{
  days=(days&&days.length)?days:[];
  if(!days.length||over<=0)return 0;
  return over/days.length;
};

FIN.resetBills=(F,now)=>{
  const k=FIN.cycle(F,now).key;
  F.bills.forEach(b=>{if(b.last!==k){b.paid=false;b.last=k}});
};

FIN.dueBills=(F,now)=>{
  now=now||new Date();
  const d=now.getDate();
  return F.bills.filter(b=>!b.paid&&((b.day-d)<=2&&(b.day-d)>=0));
};

FIN.csvReport=(F,now)=>{
  const txs=FIN.monthTx(F,now);
  const lines=[['التاريخ','المبلغ','المتجر','الفئة'].join(',')].concat(txs.map(t=>[t.d,t.amt, '"'+String(t.m).replace(/"/g,'""')+'"',FIN.catOf(t.c).l].join(',')));
  return lines.join('\n');
};

FIN.jsonPack=F=>({v:1,kind:'suhoola-finance',data:FIN.sanitize(F)});

if(typeof module!=='undefined'&&module.exports)module.exports=FIN;
})(typeof window!=='undefined'?window:globalThis);
