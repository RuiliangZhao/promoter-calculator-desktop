import test from 'node:test';
import assert from 'node:assert/strict';
import {analysisFilename} from '../web/io/analysis-filename.js';
test('Analysis names produce safe readable JSON filenames',()=>{
  for(const [name,expected] of [['example','example.json'],[' pBAD test ','pBAD test.json'],['pBAD.JSON','pBAD.json'],['','analysis.json'],['   ','analysis.json'],['../a/b:c\\d','_a_b_c_d.json'],['...','analysis.json'],['分析名称','分析名称.json']])assert.equal(analysisFilename(name),expected);
  assert.ok(new TextEncoder().encode(analysisFilename('测'.repeat(250))).length<=255);
});
