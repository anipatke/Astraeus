import fs from 'node:fs';
import { runnerImport } from 'vite';
const root=new URL('../../',import.meta.url).pathname;
const load=async p=>(await runnerImport(root+p)).module;
const json=p=>JSON.parse(fs.readFileSync(root+p,'utf8'));
const [{createOrbAstronomyAdapter},{SampledTrajectory},a,{planSegments},{earthStateAt}]=await Promise.all(['src/core/astronomyAdapter.ts','src/core/sampledTrajectory.ts','tools/apollo11/anchors.ts','tools/apollo11/trajectory.ts','tools/apollo11/sampling.ts'].map(load));
const adapter=createOrbAstronomyAdapter(),raw=json('data/apollo11/raw/anchors.json'),events=json('data/apollo11/generated/events.json'),config=json('tools/apollo11/config.json');
const anchors=new Map(raw.anchors.map(x=>[x.id,a.normaliseAnchor(adapter,x)]));
const lift=events.events.find(e=>e.id===config.liftoff.eventId);
anchors.set(config.liftoff.anchorId,a.liftoffAnchor(adapter,anchors.get(config.liftoff.surfaceAnchorId),config.liftoff.anchorId,lift.timeUtcMs,lift.label,lift.getPrinted));
const out={segments:[],anchors:[]};
for(const name of ['columbia','eagle']){
 const data=json(`data/apollo11/generated/${name}.json`),tr=new SampledTrajectory({body:name,center:'earth',samples:data.samples});
 const plan={chain:config.vehicles[name].chain,...(name==='columbia'?{parking:{fromAnchor:config.parkingOrbit.fromAnchor,startUtcMs:data.metadata.startUtcMs,startLabel:config.parkingOrbit.startEventId}}:{})};
 const segments=planSegments(adapter,anchors,plan,config);
 for(let j=0;j<segments.length;j++){
  const s=segments[j],row=data.segments[j];let max=0,count=0;
  const lastIndex=Math.min(row.firstSampleIndex+row.sampleCount,data.samples.length-1);
  for(let i=row.firstSampleIndex;i<lastIndex;i++){
   for(const fraction of [0.25,0.5,0.75]){
    const t=Math.round(data.samples[i].timeUtcMs+(data.samples[i+1].timeUtcMs-data.samples[i].timeUtcMs)*fraction);
    const expected=earthStateAt(adapter,s,t),actual=tr.stateAt(t);
    max=Math.max(max,Math.hypot(...expected.r.map((x,k)=>x-actual.positionKm[k])));count++;
   }
  }
  out.segments.push({vehicle:name,id:s.id,probes:count,maxErrorKm:max});
 }
 const cutoffs=new Set(segments.filter(s=>s.burn).map(s=>s.to.id));
 for(const x of data.anchors){const state=tr.stateAt(x.timeUtcMs),expected=anchors.get(x.id);out.anchors.push({vehicle:name,id:x.id,cutoff:cutoffs.has(x.id),positionKm:Math.hypot(...expected.earthCentred.r.map((p,k)=>p-state.positionKm[k])),velocityMs:1000*Math.hypot(...expected.earthCentred.v.map((v,k)=>v-state.velocityKmS[k]))})}
}
fs.writeFileSync(root+'docs/evidence/o004-interpolation.json',JSON.stringify(out,null,2));
console.log(JSON.stringify({segments:out.segments.length,probes:out.segments.reduce((n,s)=>n+s.probes,0),worst:out.segments.reduce((a,b)=>a.maxErrorKm>b.maxErrorKm?a:b),nonCutoffs:out.anchors.filter(a=>!a.cutoff).length,nonCutoffMaxKm:Math.max(...out.anchors.filter(a=>!a.cutoff).map(a=>a.positionKm))},null,2));
