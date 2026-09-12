import zh from './zh-CN.json';
import en from './en.json';
let language='zh-CN';
export const locale=()=>language;
export function setLocale(value){language=value==='en'?'en':'zh-CN';document.documentElement.lang=language;}
export function t(key,params={}){return ((language==='en'?en:zh)[key]||en[key]||key).replace(/\{(\w+)\}/g,(_,name)=>String(params[name]??''));}
export function translate(root=document){
  root.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
  root.querySelectorAll('[data-placeholder]').forEach(el=>el.placeholder=t(el.dataset.placeholder));
  root.querySelectorAll('[data-label]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.label)));
}
export const fmt=value=>Number.isFinite(value)?(Math.abs(value)>=1e6?value.toExponential(4):value.toLocaleString(language,{maximumFractionDigits:4})):'—';
