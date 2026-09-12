import {t,fmt} from '../i18n/index.js';
import {tableRows} from '../state/selectors.js';
import {energyKeys} from '../io/table-export.js';
import {$,esc} from './utils.js';
export function renderTable(state,onSelect,onSort){
  const keys=['TSS','strand','Tx_rate',...energyKeys],names=['TSS',t('strand'),t('rate'),'ΔG total','ΔG −10','ΔG −35','ΔG UP','ΔG ext10','ΔG spacer','ΔG DISC','ΔG ITR'];
  $('tableHead').innerHTML='<tr>'+keys.map((key,i)=>`<th aria-sort="${state.view.sort===key?(state.view.direction===1?'ascending':'descending'):'none'}"><button data-sort="${key}">${names[i]}${state.view.sort===key?(state.view.direction===1?' ↑':' ↓'):''}</button></th>`).join('')+'</tr>';
  $('tableHead').onclick=e=>{const key=e.target.closest('[data-sort]')?.dataset.sort;if(key)onSort(key);};
  const rows=tableRows(state),pages=Math.max(1,Math.ceil(rows.length/state.view.pageSize));state.view.page=Math.min(state.view.page,pages-1);
  const shown=rows.slice(state.view.page*state.view.pageSize,(state.view.page+1)*state.view.pageSize);
  $('tableBody').innerHTML=shown.length?shown.map(r=>`<tr data-candidate="${r.id}" class="${state.view.selected===r.id?'selected':''}">${keys.map(key=>`<td>${key==='Tx_rate'?`<button data-candidate="${r.id}" aria-label="TSS ${r.TSS} ${r.strand} ${t('rate')} ${fmt(r.Tx_rate)}">${fmt(r[key])}</button>`:esc(typeof r[key]==='number'?(key==='TSS'?r[key]:r[key].toFixed(4)):r[key])}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="11">${t('noRows')}</td></tr>`;
  $('tableBody').onclick=e=>{const id=e.target.closest('[data-candidate]')?.dataset.candidate;if(id)onSelect(id);};
  $('pageLabel').textContent=t('pageLabel',{page:state.view.page+1,pages,count:rows.length});$('previous').disabled=state.view.page===0;$('next').disabled=state.view.page>=pages-1;
  return rows.length;
}
