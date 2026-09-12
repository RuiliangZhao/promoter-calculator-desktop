export function analysisFilename(name){
  let stem=String(name).trim().replace(/\.json$/i,'').replace(/[\x00-\x1f\x7f/\\:*?"<>|]/g,'_').replace(/^\.+/,'').trim();
  // Keep the generated name within the common 255-byte filesystem component limit.
  let safe='',bytes=0;const encoder=new TextEncoder();
  for(const character of stem){const size=encoder.encode(character).length;if(bytes+size>240)break;safe+=character;bytes+=size;}
  return (safe.trim()||'analysis')+'.json';
}
