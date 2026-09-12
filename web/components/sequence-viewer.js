import {annotationRows,selectedRow} from '../state/selectors.js';
import {t,fmt} from '../i18n/index.js';
import {$,esc,colors,names} from './utils.js';
let current=null,select=null,visibleMarkup='',rulerMarkup='',width=1000,range=[1,100],visibleHeight=100;
const xAt=pos=>34+(pos-range[0])/(Math.max(1,range[1]-range[0]))*(width-68);
const label=(x,y,text,extra='')=>`<text x="${x}" y="${y}" font-size="10" fill="#526b60" ${extra}>${esc(text)}</text>`;
function ruler(){
  let svg='',span=range[1]-range[0],step=Math.max(1,Math.ceil(span/10/10)*10);
  for(let p=Math.ceil(range[0]/step)*step;p<=range[1];p+=step){const x=xAt(p);svg+=`<line x1="${x}" x2="${x}" y1="23" y2="29" stroke="#bfccc3"/>`+label(x,17,p,'text-anchor="middle"');}
  if(span<=Math.min(150,Math.floor((width-68)/8))){for(let p=Math.ceil(range[0]);p<=range[1];p++)svg+=label(xAt(p),48,current.result.input.sequence[p-1],'text-anchor="middle"');}
  else svg+=label(34,48,t('basesZoom'));
  return svg;
}
function glyph(row,y){
  const selected=row.id===current.view.selected,fill=row.strand==='+'?'#80b9a4':'#dd9b90';
  const arrow=(a,b,color)=>{
    const left=Math.max(34,xAt(a)),right=Math.min(width-34,xAt(b));if(right<left)return '';
    const tip=Math.min(7,Math.max(0,(right-left)/2));
    const points=row.strand==='+'?`${left},${y} ${right-tip},${y} ${right},${y+6} ${right-tip},${y+12} ${left},${y+12}`:`${right},${y} ${left+tip},${y} ${left},${y+6} ${left+tip},${y+12} ${right},${y+12}`;
    return `<polygon points="${points}" fill="${color}" stroke="${selected?'#18392e':'#ffffff'}" stroke-width="${selected?1.5:.5}"/>`;
  };
  let svg=`<g data-candidate="${row.id}" role="button" tabindex="0" aria-label="TSS ${row.TSS} ${row.strand} ${fmt(row.Tx_rate)} au"><title>TSS ${row.TSS} (${row.strand}) · ${fmt(row.Tx_rate)} au</title>`;
  if(selected)svg+=`<rect x="0" y="${y-5}" width="${width}" height="25" fill="#eef5ef"/>`;
  if(current.view.motifs){for(const key of ['UP','hex35','spacer','hex10','disc','ITR','ext10'])svg+=arrow(...row.positions[key],colors[key]);}
  else svg+=arrow(...row.positions.upstream,fill);
  const x=xAt(row.TSS);if(x>=34&&x<=width-34)svg+=`<line x1="${x}" x2="${x}" y1="${y-4}" y2="${y+15}" stroke="#1b4232" stroke-width="1.5"/>`;
  const text=`${row.strand} TSS ${row.TSS} · ${fmt(row.Tx_rate)} au`;
  svg+=label(Math.min(width-235,Math.max(35,xAt(row.positions.promoter[0]))),y+23,text);
  return svg+'</g>';
}
export function renderAnnotations(state,onSelect){
  current=state;select=onSelect;if(!state.result)return;
  width=Math.max(550,$('annotationScroll').clientWidth);
  range=state.view.range||[1,state.result.input.length];
  $('motifLegend').innerHTML=Object.entries(names).map(([k,n])=>`<span><i style="background:${colors[k]}"></i>${n}</span>`).join('');
  $('motifLegend').hidden=!state.view.motifs;
  $('annotationCount').textContent=t('annotationCount',{count:state.result.rows.filter(r=>r.Tx_rate>=state.view.threshold).length,total:state.result.rows.length});
  $('selectedBelow').hidden=!(selectedRow(state)?.Tx_rate<state.view.threshold);
  rulerMarkup=ruler();$('sequenceRuler').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="60" viewBox="0 0 ${width} 60">${rulerMarkup}</svg>`;
  const rows=annotationRows(current);$('annotationSpace').style.height=Math.max(60,rows.length*36)+'px';
  paint();
}
function paint(){
  if(!current?.result)return;
  const rows=annotationRows(current),start=Math.max(0,Math.min(Math.floor($('annotationScroll').scrollTop/36),rows.length-1)),end=Math.min(rows.length,start+Math.ceil($('annotationScroll').clientHeight/36)+2);
  visibleHeight=Math.max(60,(end-start)*36);visibleMarkup=rows.slice(start,end).map((r,i)=>glyph(r,i*36+6)).join('');
  const svg=$('annotationSvg');svg.setAttribute('viewBox',`0 0 ${width} ${visibleHeight}`);svg.setAttribute('height',visibleHeight);svg.style.top=(start*36)+'px';svg.innerHTML=visibleMarkup;
  $('annotationStatus').textContent=rows.length?t('annotationVirtual',{start:start+1,end,count:rows.length}):t('noAnnotations');
  svg.onclick=e=>{const id=e.target.closest('[data-candidate]')?.dataset.candidate;if(id)select(id);};
  svg.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();const id=e.target.closest('[data-candidate]')?.dataset.candidate;if(id)select(id);}};
}
export function bindAnnotationScroll(){let frame; $('annotationScroll').onscroll=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(paint);};}
export function revealAnnotation(id){const index=annotationRows(current).findIndex(r=>r.id===id);if(index>=0){$('annotationScroll').scrollTop=index*36;paint();}}
export function annotationSVG(){
  const title=label(20,22,`${t('annotationTitle')} · ${current.result.input.name}`);
  const note=label(20,42,`${t('threshold')}: ${fmt(current.view.threshold)} · ${t('visibleSvg')}`);
  const legend=Object.entries(names).map(([k,n],i)=>`<rect x="${20+i*90}" y="55" width="8" height="8" fill="${colors[k]}"/>`+label(32+i*90,63,n)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${visibleHeight+155}" viewBox="0 0 ${width} ${visibleHeight+155}"><rect width="100%" height="100%" fill="white"/>${title}${note}${legend}<g transform="translate(0,75)">${rulerMarkup}</g><g transform="translate(0,135)">${visibleMarkup}</g></svg>`;
}
