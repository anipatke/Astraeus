import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { runnerImport } from 'vite';
const root=new URL('../../',import.meta.url).pathname;
const load=async p=>(await runnerImport(root+p)).module;
const json=p=>JSON.parse(fs.readFileSync(root+p,'utf8'));
const norm=v=>Math.hypot(...v), sub=(a,b)=>a.map((x,i)=>x-b[i]);
const [{SampledTrajectory},{createOrbAstronomyAdapter},{normaliseAnchor},{solvePhysicalBurn},{buildSegment},{reconstruct}]=await Promise.all(['src/core/sampledTrajectory.ts','src/core/astronomyAdapter.ts','tools/apollo11/anchors.ts','tools/apollo11/burn.ts','tools/apollo11/segments.ts','tools/apollo11/reconstruct.ts'].map(load));
const adapter=createOrbAstronomyAdapter(), raw={anchors:json('data/apollo11/raw/anchors.json'),events:json('data/apollo11/raw/events.json')};
const anchors=new Map(raw.anchors.anchors.map(a=>[a.id,normaliseAnchor(adapter,a)]));
const report={scope:'O-004 frozen matrix /tmp/o004-scope.md',runtime:[],burns:[],joins:[],failure:[],special:[],determinism:[]};
const hash=x=>createHash('sha256').update(x).digest('hex');
for(const name of ['columbia','eagle']){
 const data=json(`data/apollo11/generated/${name}.json`), tr=new SampledTrajectory({body:name,center:'earth',samples:data.samples});
 let max={speedKmS:0}, maxExcess=-Infinity, violations=0, count=0;
 for(let t=tr.bounds.startUtcMs;t+1000<=tr.bounds.endUtcMs;t+=1000){
  const a=tr.stateAt(t),m=tr.stateAt(t+500),b=tr.stateAt(t+1000);
  const speed=Math.max(...[a,m,b].map(s=>norm(s.velocityKmS)));
  if(speed>max.speedKmS) max={speedKmS:speed,timeUtcMs:t};
  const excess=norm(sub(b.positionKm,a.positionKm))-speed;
  maxExcess=Math.max(maxExcess,excess); if(excess>0.001)violations++;count++;
 }
 const outside=[]; for(const t of [tr.bounds.startUtcMs-1,tr.bounds.endUtcMs+1]){try{tr.stateAt(t);outside.push('unexpected success')}catch(e){outside.push(e.constructor.name)}}
 report.runtime.push({name,count,violations,maxExcess,max,outside,discontinuities:data.discontinuities});
 for(let i=0;i<data.segments.length;i++){
  const s=data.segments[i];
  if(s.method==='powered-burn-physical'){
   const [from,to]=s.id.split('>'), a=anchors.get(from),b=anchors.get(to);
   const fine=solvePhysicalBurn(adapter,a,b,0.125), coarse=solvePhysicalBurn(adapter,a,b,0.25);
   report.burns.push({id:s.id,accelerationKmS2:norm(coarse.constantAccelerationKmS2),cutoffKm:coarse.cutoffPositionResidualKm,cutoffMs:coarse.cutoffVelocityResidualMs,halfStepDifferenceKm:norm(sub(fine.endState.r,coarse.endState.r)),halfStepDifferenceKmS:norm(sub(fine.endState.v,coarse.endState.v)),publishedPeak:s.peakSpeedKmS});
   const next=data.segments[i+1]; if(next){
    const coast=buildSegment(adapter,b,anchors.get(next.id.split('>')[1]),false,undefined,coarse.endState);
    const start=coast.generate(s.endUtcMs);
    report.joins.push({id:`${s.id} → ${next.id}`,positionStepKm:norm(sub(start.r,coarse.endState.r)),velocityStepKmS:norm(sub(start.v,coarse.endState.v)),adjacent:[-100,-1,0,1,100].map(dt=>({dt,speedKmS:norm(tr.stateAt(s.endUtcMs+dt).velocityKmS)}))});
   }
  }
  if(['powered-descent-two-anchor','surface-hold','powered-ascent-two-anchor'].includes(s.method))report.special.push({id:s.id,method:s.method,count:s.sampleCount,hash:hash(JSON.stringify(data.samples.slice(s.firstSampleIndex,s.firstSampleIndex+s.sampleCount)))});
 }
 if(name==='columbia'){
  const s=data.segments.find(s=>s.id==='A-02>A-03');
  report.postTli=[];
  for(let dt=0;dt<=10000;dt+=100){const t=s.startUtcMs+dt,a=tr.stateAt(t); if(dt%1000===0||dt===5000){const h=10,p=tr.stateAt(t+h).positionKm,m=tr.stateAt(t-h).positionKm;report.postTli.push({dt,speedKmS:norm(a.velocityKmS),finiteDifferenceSpeedKmS:norm(sub(p,m))*1000/(2*h),positionKm:a.positionKm})}}
  const first=tr.stateAt(s.startUtcMs),last=tr.stateAt(s.endUtcMs);report.postTliMinimumAverageSpeedKmS=norm(sub(last.positionKm,first.positionKm))/10;
 }
}
const a=anchors.get('A-13'),b=anchors.get('A-14');
for(const [label,fn] of [['zero duration',()=>solvePhysicalBurn(adapter,a,{...b,timeUtcMs:a.timeUtcMs},0.25)],['reversed duration',()=>solvePhysicalBurn(adapter,a,{...b,timeUtcMs:a.timeUtcMs-1},0.25)],['body mismatch',()=>solvePhysicalBurn(adapter,a,{...b,refBody:'earth'},0.25)],['zero step',()=>solvePhysicalBurn(adapter,a,b,0)],['negative step',()=>solvePhysicalBurn(adapter,a,b,-1)],['NaN step',()=>solvePhysicalBurn(adapter,a,b,NaN)],['nonfinite state',()=>solvePhysicalBurn(adapter,{...a,earthCentred:{r:[NaN,0,0],v:a.earthCentred.v}},b,0.25)]]){try{fn();report.failure.push({label,result:'success'})}catch(e){report.failure.push({label,result:e.constructor.name,message:e.message})}}
report.retryAfterFailure=solvePhysicalBurn(adapter,a,b,0.25).cutoffVelocityResidualMs;
const before=JSON.stringify(raw),first=reconstruct(adapter,raw),second=reconstruct(createOrbAstronomyAdapter(),raw);
for(const [p,c] of Object.entries(first.files))report.determinism.push({path:p,sha256:hash(c),secondIdentical:c===second.files[p],diskIdentical:c===fs.readFileSync(root+p,'utf8')});
report.inputUnmutated=before===JSON.stringify(raw);
report.anchorResiduals=first.validation.anchorResiduals;
report.validationKeys=Object.keys(first.validation);
fs.writeFileSync(root+'docs/evidence/o004-independent-check.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,joins:report.joins.map(x=>({...x,adjacent:undefined})),anchorResiduals:undefined,postTli:report.postTli.map(x=>({...x,positionKm:undefined}))},null,2));
