export const selectedRow=s=>s.result?.rows.find(r=>r.id===s.view.selected);
export function tableRows(s){
  if(!s.result)return [];
  const v=s.view;
  return s.result.rows.filter(r=>(v.strand==='both'||r.strand===v.strand)&&(!v.from||r.TSS>=Number(v.from))&&(!v.to||r.TSS<=Number(v.to))).sort((a,b)=>{
    const av=a[v.sort],bv=b[v.sort];return (typeof av==='number'?av-bv:String(av).localeCompare(String(bv)))*v.direction||a.TSS-b.TSS||a.strand.localeCompare(b.strand);
  });
}
export function annotationRows(s){
  if(!s.result)return [];
  const range=s.view.range||[1,s.result.input.length];
  return s.result.rows.filter(r=>(r.Tx_rate>=s.view.threshold||r.id===s.view.selected)&&r.positions.upstream[1]>=range[0]&&r.positions.upstream[0]<=range[1]);
}
