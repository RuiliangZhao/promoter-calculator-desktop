import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
const pkg=JSON.parse(await readFile(new URL('../../package.json',import.meta.url),'utf8'));

test('standalone HTML runs from file URL in Chromium', {timeout:120_000}, async()=>{
  const directory=await mkdtemp(join(tmpdir(),'promoter-calculator-'));
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({acceptDownloads:true});
  const page=await context.newPage();
  const errors=[],remoteRequests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('request',request=>{if(/^https?:/.test(request.url()))remoteRequests.push(request.url());});
  try{
    const html=resolve(`dist/Promoter-Calculator-Desktop-v${pkg.version}.html`);
    await page.goto(pathToFileURL(html).href,{waitUntil:'load'});
    await page.waitForFunction(()=>window.appReady===true);
    await page.locator('#langEn').click();
    assert.equal(await page.title(),'Promoter Calculator Desktop');
    assert.equal(await page.locator('.brand strong').textContent(),'Promoter Calculator Desktop');
    assert.equal(await page.locator('.version').textContent(),pkg.version);

    await page.locator('#example').click();
    await page.locator('#run').click();
    await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.startsWith('Complete'),null,{timeout:60_000});
    assert.equal(await page.locator('#resultCount').textContent(),'530');
    const maximum=Number((await page.locator('#resultMax').textContent()).replaceAll(',',''));
    assert.ok(Math.abs(maximum-9585.677153575014)<0.01);

    const analysisDownload=page.waitForEvent('download');
    await page.locator('#saveProject').click();
    const analysis=await analysisDownload;
    assert.equal(analysis.suggestedFilename(),'example.json');
    const analysisPath=join(directory,'example.json');
    await analysis.saveAs(analysisPath);
    const saved=JSON.parse(await readFile(analysisPath,'utf8'));
    assert.equal(saved.result.rows.length,530);

    const csvDownload=page.waitForEvent('download');
    await page.locator('#exportData').click();
    const csv=await csvDownload;
    assert.equal(csv.suggestedFilename(),'promoter-calculator-all.csv');
    const csvPath=join(directory,'results.csv');
    await csv.saveAs(csvPath);
    assert.equal((await readFile(csvPath,'utf8')).trim().split(/\r?\n/).length,531);

    await page.reload({waitUntil:'load'});
    await page.waitForFunction(()=>window.appReady===true);
    assert.equal(await page.locator('#run').textContent(),'Run');
    const chooser=page.waitForEvent('filechooser');
    await page.locator('#openProject').click();
    await (await chooser).setFiles(analysisPath);
    await page.waitForFunction(()=>document.querySelector('#resultCount')?.textContent==='530');
    assert.deepEqual(remoteRequests,[]);
    assert.deepEqual(errors,[]);
  } finally {
    await browser.close();
    await rm(directory,{recursive:true,force:true});
  }
});
