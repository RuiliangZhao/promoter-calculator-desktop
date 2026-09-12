export const energyKeys=['dG_total','dG_10','dG_35','dG_UP','dG_ext10','dG_spacer','dG_disc','dG_ITR'];
export const elementKeys=['UP','hex35','spacer','ext10','hex10','disc','ITR'];
export function exportTable(result,rows,delimiter=','){
  const headers=['sequence_name','TSS_1based','strand','Tx_rate',...energyKeys,'intercept','reference_TSS','internal_TSS',...elementKeys.flatMap(k=>[k+'_sequence',k+'_start_1based',k+'_end_1based']),'promoter_sequence','promoter_start_1based','promoter_end_1based','model_id','model_sha256','calibration','K','beta','coordinate_system','run_utc'];
  const values=rows.map(r=>[result.input.name,r.TSS,r.strand,r.Tx_rate,...energyKeys.map(k=>r[k]),r.intercept,r.referenceTSS,r.localTSS,...elementKeys.flatMap(k=>[r[k],...r.positions[k]]),r.promoter_sequence,...r.positions.promoter,result.model.id,result.model.sha256,result.mode,result.model.K,result.model.beta,'1-based-inclusive',result.date]);
  const quote=x=>{let s=String(x);if(typeof x==='string'&&/^[=+\-@\t\r]/.test(s)&&s!=='+'&&s!=='-')s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  return '\uFEFF'+[headers,...values].map(r=>r.map(quote).join(delimiter)).join('\r\n');
}
