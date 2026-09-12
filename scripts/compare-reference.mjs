import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {scan} from '../web/model/scanner.js';
import {displayRange,revcomp} from '../web/model/coordinates.js';
const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const model=await read('../resources/models/promoter-v1.0/model.json');
const manifest=await read('../resources/models/promoter-v1.0/manifest.json');
const fixtures=await read('../reference/fixtures/official.json');
let count=0,maxError=0;
for(const test of fixtures){
  const rows=scan(test.sequence,model,manifest.calibrations[test.mode]);
  assert.equal(rows.length,Object.keys(test.forward).length+Object.keys(test.reverse).length);
  for(const r of rows){
    const ref=(r.strand==='+'?test.forward:test.reverse)[r.referenceTSS];assert.ok(ref);
    for(const key of ['dG_total','dG_10','dG_35','dG_UP','dG_spacer','dG_ext10','dG_disc','dG_ITR','dG_bind','Tx_rate']){
      const error=Math.abs(r[key]-ref[key]);maxError=Math.max(maxError,error);
      assert.ok(error<=1e-10+Math.abs(ref[key])*1e-8,`${test.name} ${r.id} ${key}: ${r[key]} != ${ref[key]}`);
    }
    for(const key of ['UP','hex35','spacer','hex10','disc','ITR','promoter_sequence'])assert.equal(r[key],ref[key],`${test.name} ${r.id} ${key}`);
    for(const key of ['UP','hex35','spacer','hex10','disc'])assert.deepEqual(r.positions[key],displayRange(ref[key+'_position'],r.strand,test.sequence.length));
    for(const [key,[a,b]] of Object.entries(r.positions)){
      if(key==='upstream')continue;
      const seq=test.sequence.slice(a-1,b),expected=r[key==='promoter'?'promoter_sequence':key];
      assert.equal(r.strand==='+'?seq:revcomp(seq),expected);
    }
    count++;
  }
  if(test.name==='shared'&&test.mode==='ecoli'){
    const top=rows.reduce((a,b)=>a.Tx_rate>b.Tx_rate?a:b);assert.equal(rows.length,530);
    assert.equal(top.TSS,128);assert.ok(Math.abs(top.Tx_rate-9585.677153575014)<1e-8);
  }
}
console.log(`PASS official reference: ${fixtures.length} cases, ${count} candidates, max absolute error ${maxError}`);
