import {parse,InputError} from '../input/parser.js';
import {manifest,sha256,loadModel} from '../model/model-loader.js';
import {createEngine} from '../model/engine.js';
import {revcomp,displayRange,displayTSS} from '../model/coordinates.js';
import {initialView} from '../state/store.js';
import {energyKeys,elementKeys} from './table-export.js';
export function serializeProject(result,view,analysisName){return JSON.stringify({format:'promoter-local',version:1,result,view,...(analysisName===undefined?{}:{analysisName})},null,2);}
export async function readProject(text){
  const fail=()=>{throw new InputError('invalidProject');};
  let project;try{project=JSON.parse(text);}catch{fail();}
  if(project?.format!=='promoter-local'||project.version!==1)fail();
  if(project.analysisName!==undefined&&(typeof project.analysisName!=='string'||project.analysisName.length>250))fail();
  const r=project.result;
  if(!r?.input||!r.model||!manifest.calibrations[r.mode])fail();
  if(r.model.id!==manifest.id||r.model.sha256!==manifest.sha256)throw new InputError('modelMismatch');
  const input=parse(r.input.raw,r.input.name);
  if(input.sequence!==r.input.sequence||input.length!==r.input.length||await sha256(input.sequence)!==r.input.sha256)fail();
  const calibration=manifest.calibrations[r.mode];
  if(r.model.K!==calibration.K||r.model.beta!==calibration.beta||!Number.isFinite(r.seconds)||r.seconds<0||!Number.isFinite(Date.parse(r.date)))fail();
  if(!Array.isArray(r.rows)||r.rows.length!==2*(input.length-77))fail();
  const seen=new Set(),engine=createEngine(await loadModel(),calibration);
  const close=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<=1e-10+Math.abs(b)*1e-8;
  for(const row of r.rows){
    const n=input.length,t=row.localTSS,strand=row.strand;
    if(!['+','-'].includes(strand)||!Number.isInteger(t)||t<58||t>n-20||row.TSS!==displayTSS(t,strand,n)||row.id!==`${strand}:${row.TSS}`||seen.has(row.id)||row.referenceTSS!==(strand==='+'?t:n-t))fail();
    seen.add(row.id);
    if(!row.positions||!elementKeys.every(k=>typeof row[k]==='string'))fail();
    if(row.UP.length!==24||row.hex35.length!==6||row.hex10.length!==6||row.ITR.length!==20||row.spacer.length<15||row.spacer.length>20||row.disc.length<6||row.disc.length>10)fail();
    const d=row.disc.length,p=row.spacer.length,h10=t-d-6,sp=h10-p,h35=sp-6,up=h35-25;
    const expected={promoter:[up,t+20],upstream:[up,t],UP:[up,up+24],hex35:[h35,sp],spacer:[sp,h10],ext10:[h10-3,h10-1],hex10:[h10,t-d],disc:[t-d,t],ITR:[t,t+20]};
    for(const [key,range] of Object.entries(expected)){
      const mapped=displayRange(range,strand,n),stored=row.positions[key];
      if(!Array.isArray(stored)||mapped.some((x,i)=>x!==stored[i])||mapped[0]<1||mapped[1]>n)fail();
      if(key!=='upstream'){
        let seq=input.sequence.slice(mapped[0]-1,mapped[1]);if(strand==='-')seq=revcomp(seq);
        if(seq!==row[key==='promoter'?'promoter_sequence':key])fail();
      }
    }
    const e=engine.energy(row.UP,row.hex35,row.spacer,row.hex10,row.disc,row.ITR);
    if(![...energyKeys,'intercept','Tx_rate'].every(k=>close(row[k],e[k])))fail();
  }
  const v={...initialView(),...project.view};
  if(!Number.isFinite(v.threshold)||v.threshold<0||!['both','+','-'].includes(v.strand)||!['TSS','strand','Tx_rate',...energyKeys].includes(v.sort)||![1,-1].includes(v.direction)||![5,10,25,50,100].includes(v.pageSize)||!Number.isInteger(v.page)||v.page<0)fail();
  if(typeof v.motifs!=='boolean'||typeof v.log!=='boolean'||(v.selected!==null&&!seen.has(v.selected)))fail();
  const validPos=x=>Number.isInteger(x)&&x>=1&&x<=input.length;
  if(v.range!==null&&(!Array.isArray(v.range)||v.range.length!==2||!v.range.every(validPos)||v.range[0]>v.range[1]))fail();
  if([v.from,v.to].some(x=>x!==''&&!validPos(Number(x)))||(v.from&&v.to&&Number(v.from)>Number(v.to)))fail();
  return {result:r,view:v,analysisName:project.analysisName};
}
