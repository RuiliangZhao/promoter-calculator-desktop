import source from 'prediction-worker-source';
export class PredictionClient {
  constructor(){this.generation=0;this.worker=null;}
  cancel(){this.generation++;this.worker?.terminate();this.worker=null;}
  run(input,mode,onEvent){
    this.cancel();const id=this.generation;
    const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
    try{this.worker=new Worker(url);}finally{URL.revokeObjectURL(url);}
    this.worker.onmessage=({data})=>{
      if(data.id!==this.generation)return;
      if(data.type==='done'||data.type==='error'){this.worker.terminate();this.worker=null;}
      onEvent(data);
    };
    this.worker.onerror=e=>{if(id!==this.generation)return;this.cancel();onEvent({type:'error',code:'workerError',params:{message:e.message}});};
    this.worker.postMessage({id,input,mode});
  }
}
