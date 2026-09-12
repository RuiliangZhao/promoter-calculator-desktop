import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '../web/input/parser.js';
import {scan} from '../web/model/scanner.js';
import {exportTable} from '../web/io/table-export.js';
import {tableRows,annotationRows} from '../web/state/selectors.js';
import {initialView} from '../web/state/store.js';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const model=read('../resources/models/promoter-v1.0/model.json'),manifest=read('../resources/models/promoter-v1.0/manifest.json');
test('Input normalization, FASTA boundaries and unsupported bases',()=>{
  assert.equal(parse('>demo\n'+('acgt '.repeat(20))).sequence,'ACGT'.repeat(20));
  assert.throws(()=>parse('>one\n'+'A'.repeat(80)+'\n>two\n'+'C'.repeat(80)),e=>e.code==='multiFasta');
  assert.throws(()=>parse('A'.repeat(78)+'N'),e=>e.code==='invalidBase'&&e.params.position===79);
  assert.throws(()=>parse('A'.repeat(77)),e=>e.code==='shortInput');
  assert.throws(()=>parse('A'.repeat(20001)),e=>e.code==='longInput');
});
test('Minimum context, strand coordinates and rates',()=>{
  const rows=scan('A'.repeat(78),model,manifest.calibrations.ecoli);
  assert.deepEqual(rows.map(x=>x.TSS),[20,59]);
  assert.deepEqual(rows.map(x=>x.strand),['-','+']);
  assert.equal(rows[0].positions.ITR[0],1);assert.equal(rows[1].positions.ITR[1],78);
});
test('Independent annotation/table filters and complete exports',()=>{
  const input=parse('ACGT'.repeat(30)),rows=scan(input.sequence,model,manifest.calibrations.ecoli);
  const result={input,rows,model:{...manifest,...manifest.calibrations.ecoli},mode:'ecoli',date:'2026-09-08T00:00:00Z'};
  const state={result,view:{...initialView(),threshold:1e9}};
  assert.equal(annotationRows(state).length,0);assert.equal(tableRows(state).length,86);
  state.view.selected=rows[0].id;assert.equal(annotationRows(state).length,1);
  state.view.from=60;state.view.to=62;assert.equal(tableRows(state).length,6);
  const csv=exportTable(result,rows);assert.equal(csv.split('\r\n').length,87);assert.ok(csv.includes('"dG_ext10"'));assert.ok(csv.includes('"UP_start_1based"'));
});
test('Chinese and English dictionary keys are identical',()=>{
  const zh=read('../web/i18n/zh-CN.json'),en=read('../web/i18n/en.json');
  assert.deepEqual(Object.keys(zh).sort(),Object.keys(en).sort());
  for(const key of Object.keys(en)){
    assert.ok(en[key]&&zh[key]);assert.deepEqual((en[key].match(/\{\w+\}/g)||[]).sort(),(zh[key].match(/\{\w+\}/g)||[]).sort(),key);
  }
});
