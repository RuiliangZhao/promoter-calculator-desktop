export async function saveFile(filename,content,binary=false){
  const bytes=binary?Uint8Array.from(atob(content),character=>character.charCodeAt(0)):content;
  const url=URL.createObjectURL(new Blob([bytes]));
  const link=document.createElement('a');
  link.href=url;link.download=filename;link.hidden=true;
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  return {saved:true};
}
export async function copyText(text){
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return;}
  const field=document.createElement('textarea');
  field.value=text;field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';
  document.body.append(field);field.select();
  const copied=document.execCommand('copy');field.remove();
  if(!copied)throw Error('Clipboard access is unavailable in this browser.');
}
export async function readLanguage(){
  try{return localStorage.getItem('promoter-calculator-language')||'zh-CN';}catch{return 'zh-CN';}
}
export async function saveLanguage(language){
  try{localStorage.setItem('promoter-calculator-language',language);}catch{}
}
