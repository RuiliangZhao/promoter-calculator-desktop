export const $=id=>document.getElementById(id);
export const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const colors={UP:'#779e80',hex35:'#4186b8',spacer:'#bdc7ca',ext10:'#8c6cb1',hex10:'#d29b47',disc:'#c88386',ITR:'#50a59a'};
export const names={UP:'UP',hex35:'−35',spacer:'Spacer',ext10:'Ext −10',hex10:'−10',disc:'DISC',ITR:'ITR'};
