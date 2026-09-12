import {loadModel,manifest,sha256} from '../model/model-loader.js';
import {scan} from '../model/scanner.js';
self.onmessage=async({data})=>{
  const {id,input,mode}=data;
  try{
    const started=performance.now(),model=await loadModel(),calibration=manifest.calibrations[mode];
    if(!calibration)throw Error('modelCorrupt');
    const rows=scan(input.sequence,model,calibration,p=>self.postMessage({id,type:'progress',value:p}));
    const result={input:{...input,sha256:await sha256(input.sequence)},mode,model:{...manifest,...calibration},rows,date:new Date().toISOString(),seconds:(performance.now()-started)/1000};
    self.postMessage({id,type:'done',result});
  }catch(error){self.postMessage({id,type:'error',code:error.message==='modelCorrupt'?'modelCorrupt':'workerError',params:{message:error.message}});}
};
