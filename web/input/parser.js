export class InputError extends Error {
  constructor(code,params={}){super(code);this.code=code;this.params=params;}
}
export const MAX_LENGTH=20000;
export function parse(raw, title='') {
  if(typeof raw!=='string')throw new InputError('invalidProject');
  let name='',headers=0,parts=[];
  for(const line of raw.trim().split(/\r?\n/)){
    if(line.trim().startsWith('>')){
      if(++headers>1||parts.some(x=>x.length))throw new InputError('multiFasta');
      name=line.trim().slice(1).trim();
    } else parts.push(line.replace(/\s/g,''));
  }
  const sequence=parts.join('').toUpperCase();
  if(!sequence)throw new InputError('emptyInput');
  const bad=sequence.search(/[^ACGT]/);
  if(bad>=0)throw new InputError('invalidBase',{base:sequence[bad],position:bad+1});
  if(sequence.length<78)throw new InputError('shortInput',{length:sequence.length});
  if(sequence.length>MAX_LENGTH)throw new InputError('longInput',{max:MAX_LENGTH});
  return {raw,sequence,name:title.trim()||name||'Sequence',length:sequence.length};
}
