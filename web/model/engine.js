/* GPL-3.0-or-later. Adapted from SalisLabCode r2022, La Fleur, Hossain & Salis.
 * The upstream uses non-overlapping dinucleotides (step 2), not a sliding step 1.
 */
export function createEngine(M, calibration) {
  const C=M.coeffs;
  const idx=s=>{let n=0;for(const c of s)n=n*4+'ACGT'.indexOf(c);return n;};
  const pairs=(s,d)=>{let n=0;for(let i=0;i<s.length-1;i+=2)n+=d[s.slice(i,i+2)];return n;};
  function energy(up,h35,sp,h10,disc,itr) {
    const hybrid=pairs(itr.slice(0,14),M.DNA_DNA_hybrids)-pairs(itr.slice(0,14),M.RNA_DNA_hybrids);
    const rigidity=pairs(up+h35+sp.slice(0,14),M.persistence)/44;
    const dG_10=C[idx(h10.slice(0,3))]+C[64+idx(h10.slice(3))];
    const dG_35=C[128+idx(h35.slice(0,3))]+C[192+idx(h35.slice(3))];
    const dG_disc=C[256+idx(disc.slice(0,3))];
    const dG_ITR=hybrid/4.300000000000002*C[C.length-2];
    const dG_ext10=C[320+idx(sp.slice(-3,-1))];
    const dG_spacer=0.1463*sp.length**2-4.9113*sp.length+41.119;
    const dG_UP=pairs(up.slice(0,12),M.groove_access)/256*C[C.length-4]+pairs(up.slice(12),M.groove_access)/255*C[C.length-3]+rigidity/25.780434782608694*C[C.length-1];
    const dG_total=dG_10+dG_35+dG_disc+dG_ITR+dG_ext10+dG_spacer+dG_UP+M.intercept;
    return {dG_10,dG_35,dG_disc,dG_ITR,dG_ext10,dG_spacer,dG_UP,dG_total,intercept:M.intercept,
      dG_bind:dG_10+dG_35+dG_spacer+dG_ext10+dG_UP,Tx_rate:calibration.K*Math.exp(-calibration.beta*dG_total)};
  }
  function at(s,t){
    if(t<58||t+20>s.length)return null;
    let best=null;
    for(let d=6;d<=10;d++)for(let p=15;p<=20;p++){
      const h10=t-d-6,sp=h10-p,h35=sp-6,up=h35-25;
      if(up<0)continue;
      const UP=s.slice(up,up+24),hex35=s.slice(h35,sp),spacer=s.slice(sp,h10),hex10=s.slice(h10,t-d),disc=s.slice(t-d,t),ITR=s.slice(t,t+20);
      const e=energy(UP,hex35,spacer,hex10,disc,ITR);
      if(!best||e.dG_total<best.dG_total)best={...e,localTSS:t,UP,hex35,spacer,hex10,disc,ITR,ext10:spacer.slice(-3,-1),promoter_sequence:s.slice(up,t+20),
        positions:{promoter:[up,t+20],upstream:[up,t],UP:[up,up+24],hex35:[h35,sp],spacer:[sp,h10],ext10:[h10-3,h10-1],hex10:[h10,t-d],disc:[t-d,t],ITR:[t,t+20]}};
    }
    return best;
  }
  return {energy,at};
}
