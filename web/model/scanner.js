import {createEngine} from './engine.js';
import {revcomp,adapt} from './coordinates.js';
export function scan(sequence,model,calibration,progress=()=>{}){
  const engine=createEngine(model,calibration),rows=[],perStrand=Math.max(0,sequence.length-77);
  let done=0;
  for(const strand of ['+','-']){
    const seq=strand==='+'?sequence:revcomp(sequence);
    for(let t=58;t<=seq.length-20;t++){
      const row=engine.at(seq,t);if(row)rows.push(adapt(row,strand,seq.length));
      if(++done%100===0)progress(done/(2*perStrand));
    }
  }
  progress(1);
  return rows.sort((a,b)=>a.TSS-b.TSS||(a.strand==='+'?-1:1));
}
