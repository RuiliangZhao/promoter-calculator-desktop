import {analysisFilename} from './io/analysis-filename.js';
import {parse} from './input/parser.js';
import {state,initialView,installResult} from './state/store.js';
import {tableRows} from './state/selectors.js';
import {t,fmt,locale,setLocale,translate} from './i18n/index.js';
import {PredictionClient} from './workers/worker-client.js';
import {renderChart,resetChart,zoomChart,chartPNG} from './components/transcription-chart.js';
import {renderAnnotations,bindAnnotationScroll,revealAnnotation,annotationSVG} from './components/sequence-viewer.js';
import {renderTable} from './components/energy-table.js';
import {renderDetails} from './components/promoter-details.js';
import {exportTable} from './io/table-export.js';
import {serializeProject,readProject} from './io/project-file.js';
import {saveFile,copyText,readLanguage,saveLanguage} from './io/browser-files.js';
import {$} from './components/utils.js';
import examples from '../reference/fixtures/examples.json';
const client=new PredictionClient();
let pendingFile='fasta',modalState=null,renderVersion=0;
const showStatus=(key,params={},error=false)=>{state.status={key,params,error};renderStatus();};
function renderStatus(){
  $('status').textContent=t(state.status.key,state.status.params);$('status').classList.toggle('error',state.status.error);
  $('progress').hidden=!state.busy;$('progress').value=state.progress;
  $('run').disabled=state.busy;$('cancel').disabled=!state.busy;
  for(const id of ['newProject','openProject','importFasta'])$(id).disabled=state.busy;
  $('saveProject').disabled=!state.result||state.busy;
}
function dirty(){
  const r=state.result;
  $('stale').hidden=!r||($('sequence').value===r.input.raw&&$('mode').value===r.mode&&$('title').value.trim()===r.input.title);
  $('seqCount').textContent=t('characters',{count:$('sequence').value.split(/\r?\n/).filter(x=>!x.trim().startsWith('>')).join('').replace(/\s/g,'').length});
}
function syncControls(){
  const v=state.view;
  $('threshold').max=state.result?Math.max(...state.result.rows.map(r=>r.Tx_rate)):1;
  $('threshold').value=Math.min(v.threshold,Number($('threshold').max));$('thresholdNumber').value=v.threshold;
  const max=Number($('threshold').max);$('threshold').style.setProperty('--threshold-position',`${max>0?Math.max(0,Math.min(100,v.threshold/max*100)):0}%`);
  $('motifs').checked=v.motifs;$('logAxis').checked=v.log;$('tableStrand').value=v.strand;$('filterFrom').value=v.from;$('filterTo').value=v.to;$('pageSize').value=v.pageSize;
}
function renderExport(){if(state.result)$('exportCount').textContent=t('exportCount',{count:$('exportScope').value==='all'?state.result.rows.length:tableRows(state).length});}
function renderTabular(){if(!state.result)return;renderTable(state,selectCandidate,key=>{state.view.direction=state.view.sort===key?-state.view.direction:1;state.view.sort=key;state.view.page=0;renderTabular();});renderDetails(state,copy);renderExport();}
async function renderResults(){
  const version=++renderVersion,r=state.result;$('results').hidden=!r;$('empty').hidden=Boolean(r);if(!r)return;
  $('resultName').textContent=r.input.name;$('resultMode').textContent=t(r.mode);
  $('resultLength').textContent=r.input.length+' bp';$('resultCount').textContent=r.rows.length;$('resultMax').textContent=fmt(Math.max(...r.rows.map(x=>x.Tx_rate)));
  $('coverage').textContent=t('coverage',{forwardEnd:r.input.length-19,reverseEnd:r.input.length-58});
  $('constants').textContent=`K = ${r.model.K} au    ·    β = ${r.model.beta.toFixed(9)} mol/kcal`;
  syncControls();renderTabular();renderAnnotations(state,selectCandidate);
  await renderChart(state,selectCandidate,onRange);if(version!==renderVersion)return;
}
function onRange(value){
  if(!state.result)return;
  const n=state.result.input.length;
  state.view.range=value?[Math.max(1,Math.min(n,Math.floor(value[0]))),Math.max(1,Math.min(n,Math.ceil(value[1])))]:null;
  if(state.view.range&&state.view.range[0]>state.view.range[1])state.view.range=null;
  renderAnnotations(state,selectCandidate);
}
async function selectCandidate(id){
  if(!state.result?.rows.some(x=>x.id===id))return;
  state.view.selected=id;let rows=tableRows(state),index=rows.findIndex(x=>x.id===id);
  if(index<0){state.view.strand='both';state.view.from='';state.view.to='';rows=tableRows(state);index=rows.findIndex(x=>x.id===id);syncControls();}
  state.view.page=Math.floor(index/state.view.pageSize);
  renderTabular();renderAnnotations(state,selectCandidate);revealAnnotation(id);
  await renderChart(state,selectCandidate,onRange);
}
async function copy(text){try{await copyText(text);showStatus('copied');}catch(e){showStatus('fileError',{message:e.message},true);}}
function updateModal(){if(!modalState)return;$('modalTitle').textContent=t(modalState.confirm?'new':'help');$('modalText').textContent=t(modalState.confirm?'unsaved':'helpText');if(!modalState.confirm){const label='Promoter Calculator v1.0',text=$('modalText').textContent,index=text.indexOf(label);if(index>=0){const link=document.createElement('a');link.id='modelCodeLink';link.href='https://github.com/hsalis/SalisLabCode';link.target='_blank';link.rel='noopener noreferrer';link.textContent=label;$('modalText').replaceChildren(text.slice(0,index),link,text.slice(index+label.length));}}$('citationSection').hidden=modalState.confirm;$('modalConfirm').textContent=t(modalState.confirm?'continue':'close');$('modalCancel').hidden=!modalState.confirm;$('paperLink').hidden=modalState.confirm;$('abstractSection').hidden=modalState.confirm;}
function modal(confirm=false){return new Promise(resolve=>{modalState={confirm,resolve,focus:document.activeElement};updateModal();$('modalOverlay').hidden=false;document.querySelector('.modal-body').scrollTop=0;$('modalConfirm').focus();});}
function closeModal(accepted){const current=modalState;modalState=null;$('modalOverlay').hidden=true;current?.resolve(accepted);current?.focus?.focus();}
async function language(value){
  setLocale(value);translate();$('langZh').setAttribute('aria-pressed',value==='zh-CN');$('langEn').setAttribute('aria-pressed',value==='en');
  updateModal();renderStatus();dirty();await renderResults();
  try{await saveLanguage(value);}catch(e){showStatus('fileError',{message:e.message},true);}
}
async function run(){
  if(state.busy)return;let input;
  try{input=parse($('sequence').value,$('title').value);input.title=$('title').value.trim();}catch(e){showStatus(e.code||'emptyInput',e.params,true);return;}
  state.busy=true;state.progress=0;showStatus('calculating',{percent:0});
  try{client.run(input,$('mode').value,event=>{
    if(event.type==='progress'){state.progress=event.value;showStatus('calculating',{percent:Math.round(event.value*100)});}
    else if(event.type==='done'){
      state.busy=false;installResult(event.result);$('annotationScroll').scrollTop=0;dirty();
      showStatus('done',{count:event.result.rows.length,seconds:event.result.seconds.toFixed(2)});
      renderResults().catch(e=>showStatus('workerError',{message:e.message},true));
    }else{state.busy=false;showStatus(event.code,event.params,true);}
  });}catch(e){state.busy=false;showStatus('workerError',{message:e.message},true);}
}
function cancel(){client.cancel();state.busy=false;showStatus('cancelled');}
async function newProject(){
  if(state.busy)return;
  if(state.result&&!state.saved&&!await modal(true))return;
  state.result=null;state.view=initialView();state.saved=true;$('sequence').value='';$('title').value='';$('mode').value='ecoli';dirty();showStatus('ready');await renderResults();
}
async function persist(filename,content,binary=false,kind='export'){
  try{const result=await saveFile(filename,content,binary,kind);if(result.saved)showStatus('saveSuccess');return result.saved;}catch(e){showStatus('fileError',{message:e.message},true);return false;}
}
async function saveProject(){if(!state.result||state.busy)return;if(await persist(analysisFilename($('title').value),serializeProject(state.result,state.view,$('title').value),false,'analysis'))state.saved=true;}
async function loadContent(content,kind){
  if(state.busy){showStatus('busyFile',{},true);return;}
  try{
    if(kind==='project'){
      const loaded=await readProject(content);
      if(state.result&&!state.saved&&!await modal(true))return;
      installResult(loaded.result,loaded.view);state.saved=true;
      $('sequence').value=loaded.result.input.raw;$('title').value=loaded.analysisName??loaded.result.input.title??'';$('mode').value=loaded.result.mode;
      showStatus('opened');await renderResults();
    }else{$('sequence').value=content;showStatus('ready');}
    dirty();
  }catch(e){showStatus(e.code||'invalidProject',e.params||{},true);}
}
async function chooseFile(kind){
  if(state.busy)return;
  pendingFile=kind;$('fileInput').accept=kind==='project'?'.json':'.fa,.fasta,.fna,.txt';$('fileInput').click();
}
$('run').onclick=run;$('cancel').onclick=cancel;$('langZh').onclick=()=>language('zh-CN');$('langEn').onclick=()=>language('en');
$('help').onclick=()=>modal();$('modalConfirm').onclick=()=>closeModal(true);$('modalCancel').onclick=()=>closeModal(false);
document.addEventListener('keydown',e=>{
  if(modalState&&e.key==='Escape'){e.preventDefault();closeModal(false);}
  if(modalState&&e.key==='Tab'){
    const buttons=[...$('modalOverlay').querySelectorAll('button:not([hidden]),a:not([hidden])')].filter(element=>element.getClientRects().length>0);const first=buttons[0],last=buttons.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
});
for(const id of ['sequence','title','mode'])$(id).addEventListener('input',dirty);
$('clearInput').onclick=()=>{$('sequence').value='';dirty();};
$('example').onclick=()=>{$('sequence').value='>example\n'+examples.shared;$('title').value='example';dirty();};
$('newProject').onclick=newProject;$('saveProject').onclick=saveProject;$('openProject').onclick=()=>chooseFile('project');$('importFasta').onclick=()=>chooseFile('fasta');
$('fileInput').onchange=async e=>{const file=e.target.files[0];if(file){try{await loadContent(await file.text(),pendingFile);}catch(err){showStatus('fileError',{message:err.message},true);}}e.target.value='';};
$('sequence').ondragover=e=>{e.preventDefault();$('sequence').classList.add('dragover');};$('sequence').ondragleave=()=>$('sequence').classList.remove('dragover');
$('sequence').ondrop=async e=>{e.preventDefault();$('sequence').classList.remove('dragover');const file=e.dataTransfer.files[0];if(file){try{await loadContent(await file.text(),'fasta');}catch(err){showStatus('fileError',{message:err.message},true);}}};
function threshold(value){if(!Number.isFinite(value)||value<0){showStatus('thresholdError',{},true);return;}state.view.threshold=value;syncControls();renderAnnotations(state,selectCandidate);}
$('threshold').oninput=e=>threshold(Number(e.target.value));$('thresholdNumber').onchange=e=>threshold(Number(e.target.value));$('showAll').onclick=()=>threshold(0);$('resetThreshold').onclick=()=>threshold(Math.max(...state.result.rows.map(r=>r.Tx_rate))*0.8);
$('motifs').onchange=e=>{state.view.motifs=e.target.checked;renderAnnotations(state,selectCandidate);};
$('logAxis').onchange=async e=>{state.view.log=e.target.checked;await renderChart(state,selectCandidate,onRange);};
$('resetZoom').onclick=async()=>{state.view.range=null;await resetChart(state.result.input.length);renderAnnotations(state,selectCandidate);};
$('applyFilter').onclick=()=>{
  if(!state.result)return;const from=$('filterFrom').value,to=$('filterTo').value,n=state.result.input.length;
  if([from,to].some(x=>x!==''&&(!Number.isInteger(Number(x))||Number(x)<1||Number(x)>n))||(from&&to&&Number(from)>Number(to))){showStatus('invalidRange',{length:n},true);return;}
  Object.assign(state.view,{from,to,strand:$('tableStrand').value,page:0});renderTabular();
};
$('tableStrand').onchange=()=>$('applyFilter').click();
$('resetFilter').onclick=()=>{Object.assign(state.view,{from:'',to:'',strand:'both',page:0});syncControls();renderTabular();};
$('pageSize').onchange=e=>{state.view.pageSize=Number(e.target.value);state.view.page=0;renderTabular();};$('previous').onclick=()=>{state.view.page--;renderTabular();};$('next').onclick=()=>{state.view.page++;renderTabular();};
$('locateButton').onclick=async()=>{
  const tss=Number($('locateTSS').value);if(!state.result)return;
  const row=state.result.rows.find(r=>r.TSS===tss&&(state.view.strand==='both'||r.strand===state.view.strand));
  if(!row){showStatus('notFound',{},true);return;}
  state.view.range=[Math.max(1,tss-85),Math.min(state.result.input.length,tss+30)];await zoomChart(state.view.range);await selectCandidate(row.id);
};
$('locateTSS').onkeydown=e=>{if(e.key==='Enter')$('locateButton').click();};
$('exportScope').onchange=renderExport;
$('exportData').onclick=()=>{const format=$('exportFormat').value,rows=$('exportScope').value==='all'?state.result.rows:tableRows(state);persist('promoter-calculator-'+$('exportScope').value+'.'+format,exportTable(state.result,rows,format==='csv'?',':'\t'));};
$('png').onclick=async()=>{try{const data=await chartPNG();await persist('promoter-calculator-rates.png',data.slice(data.indexOf(',')+1),true);}catch(e){showStatus('fileError',{message:e.message},true);}};
$('svg').onclick=()=>persist('promoter-calculator-annotations.svg',annotationSVG());
bindAnnotationScroll();
window.addEventListener('resize',()=>{if(state.result)renderAnnotations(state,selectCandidate);});
window.addEventListener('error',e=>showStatus('workerError',{message:e.message},true));
await language(await readLanguage()==='en'?'en':'zh-CN');
window.appReady=true;
