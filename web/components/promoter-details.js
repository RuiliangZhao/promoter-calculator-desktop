import {t,fmt} from '../i18n/index.js';
import {selectedRow} from '../state/selectors.js';
import {elementKeys} from '../io/table-export.js';
import {$,esc,colors,names} from './utils.js';
export function renderDetails(state,onCopy){
  const r=selectedRow(state);if(!r){$('promoterDetails').innerHTML=`<p class="hint">${t('selectPrompt')}</p>`;return;}
  const keys={UP:'dG_UP',hex35:'dG_35',spacer:'dG_spacer',ext10:'dG_ext10',hex10:'dG_10',disc:'dG_disc',ITR:'dG_ITR'};
  $('promoterDetails').innerHTML=`<div class="detail-heading"><h3>${t('detailTitle')} · TSS ${r.TSS} (${r.strand})</h3><span class="detail-rate">${fmt(r.Tx_rate)} au</span></div><p class="hint">${t('completeContext')} · ${r.positions.promoter.join('–')} · ${r.promoter_sequence.length} bp <button data-copy="promoter_sequence">${t('copy')}</button></p><div class="sequence-block">${esc(r.promoter_sequence)}</div><div class="detail-grid">${elementKeys.map(k=>`<article class="element-card" style="--color:${colors[k]}"><header><strong>${names[k]}</strong><button data-copy="${k}">${t('copy')}</button></header><code>${r[k]}</code><small>${r.positions[k].join('–')} · ${r[k].length} bp<br>ΔG ${r[keys[k]].toFixed(6)} kcal/mol</small></article>`).join('')}</div><p class="energy-total">${t('intercept')}: ${r.intercept.toFixed(8)} kcal/mol &nbsp; · &nbsp; ${t('totalEnergy')}: ${r.dG_total.toFixed(8)} kcal/mol</p><p class="hint">${t('rawCoordinate',{reference:r.referenceTSS,local:r.localTSS})}</p><p class="hint">${t('lowNote')}</p>`;
  $('promoterDetails').onclick=e=>{const key=e.target.closest('[data-copy]')?.dataset.copy;if(key)onCopy(r[key]);};
}
