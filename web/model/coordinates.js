export const revcomp=s=>s.split('').reverse().map(c=>({A:'T',T:'A',G:'C',C:'G'})[c]).join('');
export const displayTSS=(t,strand,length)=>strand==='+'?t+1:length-t;
export const displayRange=([a,b],strand,length)=>strand==='+'?[a+1,b]:[length-b+1,length-a];
export function adapt(row,strand,length) {
  const TSS=displayTSS(row.localTSS,strand,length);
  const positions=Object.fromEntries(Object.entries(row.positions).map(([k,v])=>[k,displayRange(v,strand,length)]));
  return {...row,strand,TSS,id:`${strand}:${TSS}`,positions,referenceTSS:strand==='+'?row.localTSS:length-row.localTSS};
}
