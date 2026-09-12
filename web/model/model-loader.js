import modelText from '../../resources/models/promoter-v1.0/model.json?raw';
import manifest from '../../resources/models/promoter-v1.0/manifest.json' with {type:'json'};
export {manifest};
export async function sha256(text){
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function loadModel(){
  if(await sha256(modelText)!==manifest.sha256)throw Error('modelCorrupt');
  return JSON.parse(modelText);
}
