export const initialView=()=>({threshold:0,motifs:true,selected:null,range:null,strand:'both',from:'',to:'',sort:'TSS',direction:1,page:0,pageSize:10,log:false});
export const state={result:null,view:initialView(),busy:false,progress:0,status:{key:'ready',params:{},error:false},saved:true};
export function installResult(result,view){state.result=result;state.view={...initialView(),threshold:Math.max(...result.rows.map(r=>r.Tx_rate))*0.8,...view};state.saved=false;}
