/* مشغّل الاختبارات: يشغّل خادماً ثابتاً على 8765 ثم يمرّر الاختبارين. الاستخدام: npm test */
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os'),{spawn}=require('child_process');
const ROOT=path.join(__dirname,'..');
const T={'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u=='/')u='/index.html';const f=path.join(ROOT,path.normalize(u));
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end()}
  s.writeHead(200,{'content-type':T[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s)});
const run=(t,SP)=>new Promise(res=>{console.log('\n=== '+t);
  spawn('node',[path.join(__dirname,t+'.js')],{stdio:'inherit',env:{...process.env,SP}}).on('close',c=>res(c))});
srv.listen(8765,async()=>{
  const SP=fs.mkdtempSync(path.join(os.tmpdir(),'suhoola-'));let bad=0;
  for(const t of ['engine','legacy'])if(await run(t,SP)!==0)bad++;
  srv.close();process.exit(bad?1:0)});
