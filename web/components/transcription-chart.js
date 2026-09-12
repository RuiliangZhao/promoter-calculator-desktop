import Plotly from 'plotly.js-dist-min';
import {t,locale} from '../i18n/index.js';
import {$} from './utils.js';
const zh={moduleType:'locale',name:'zh-CN',dictionary:{'Zoom':'缩放','Pan':'平移','Zoom in':'放大','Zoom out':'缩小','Autoscale':'自动缩放','Reset axes':'重置坐标轴','Download plot as a PNG':'下载 PNG','Double-click to zoom back out':'双击恢复缩放','Click to enter Colorscale title':'编辑色标标题'}};
Plotly.register(zh);
let listening=false;
export async function renderChart(state,onSelect,onRange){
  const r=state.result;if(!r)return;
  const traces=['+','-'].map((strand,index)=>{
    const rows=r.rows.filter(x=>x.strand===strand);
    return {type:'scatter',mode:'lines+markers',name:t(index?'reverse':'forward'),x:rows.map(x=>x.TSS),y:rows.map(x=>x.Tx_rate),customdata:rows.map(x=>x.id),text:rows.map(x=>`ΔG = ${x.dG_total.toFixed(5)}`),line:{color:index?'#c75b4c':'#2861b5',width:1.4},marker:{size:3},hovertemplate:`TSS %{x} (${strand})<br>${t('rate')}: %{y:.5g} au<br>%{text}<extra></extra>`};
  });
  const selected=r.rows.find(x=>x.id===state.view.selected);
  if(selected)traces.push({type:'scatter',mode:'markers',x:[selected.TSS],y:[selected.Tx_rate],customdata:[selected.id],marker:{size:12,color:'#19392f',symbol:'circle-open',line:{width:2}},showlegend:false,hoverinfo:'skip'});
  const layout={margin:{l:75,r:25,t:20,b:58},paper_bgcolor:'#fff',plot_bgcolor:'#fff',font:{family:'-apple-system,BlinkMacSystemFont,sans-serif',size:11,color:'#486358'},xaxis:{title:{text:t('tssAxis')},range:state.view.range||[1,r.input.length],gridcolor:'#edf1ed',zeroline:false},yaxis:{title:{text:t('rateAxis')},type:state.view.log?'log':'linear',rangemode:'tozero',gridcolor:'#edf1ed',zeroline:false},legend:{orientation:'h',y:1.14,x:0},hovermode:'closest',uirevision:r.date,dragmode:'zoom'};
  await Plotly.react($('chart'),traces,layout,{responsive:true,displaylogo:false,locale:locale(),modeBarButtonsToRemove:['toImage','select2d','lasso2d','autoScale2d','hoverClosestCartesian','hoverCompareCartesian','toggleSpikelines']});
  if(!listening){
    $('chart').on('plotly_click',e=>{const id=e.points?.[0]?.customdata;if(id)onSelect(id);});
    $('chart').on('plotly_relayout',e=>{
      if(e['xaxis.autorange'])onRange(null);
      else if(e['xaxis.range'])onRange(e['xaxis.range']);
      else if(e['xaxis.range[0]']!==undefined)onRange([e['xaxis.range[0]'],e['xaxis.range[1]']]);
    });listening=true;
  }
}
export async function resetChart(length){await Plotly.relayout($('chart'),{'xaxis.range':[1,length],'yaxis.autorange':true});}
export async function zoomChart(range){await Plotly.relayout($('chart'),{'xaxis.range':range});}
export async function chartPNG(){return Plotly.toImage($('chart'),{format:'png',width:1500,height:500,scale:2});}
