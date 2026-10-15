'use strict';
(() => {
  const valid = value => value === undefined || (typeof value === 'string' && value.length <= 33000 && /^data:image\/(webp|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(value));
  function decode(src) {
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>img.naturalWidth*img.naturalHeight<=40000000 ? resolve(img) : reject(Error('Bildet er for stort. Velg et mindre bilde.'));
      img.onerror=()=>reject(Error('Bildet kunne ikke åpnes. Velg et JPG-, PNG- eller WebP-bilde.'));
      img.src=src;
    });
  }
  async function read(file) {
    if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw Error('Velg et JPG-, PNG- eller WebP-bilde. HEIC må først lagres som JPG.');
    if (file.size>10*1024*1024) throw Error('Bildet må være mindre enn 10 MB.');
    const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Kunne ikke lese bildet.'));r.readAsDataURL(file)});
    return decode(src);
  }
  function draw(canvas,img,{zoom=1,x=50,y=50}={}) {
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!img)return;
    const size=Math.min(img.naturalWidth,img.naturalHeight)/zoom;
    ctx.drawImage(img,(img.naturalWidth-size)*x/100,(img.naturalHeight-size)*y/100,size,size,0,0,canvas.width,canvas.height);
  }
  function encode(img,crop) {
    const canvas=document.createElement('canvas');
    for(const size of [320,256,192,128]) {
      canvas.width=canvas.height=size;draw(canvas,img,crop);
      let data=canvas.toDataURL('image/webp',.78);
      if(!data.startsWith('data:image/webp;'))data=canvas.toDataURL('image/jpeg',.78);
      if(valid(data))return data;
    }
    throw Error('Bildet kunne ikke komprimeres. Prøv et annet bilde.');
  }
  window.NikaPhoto={valid,read,decode,draw,encode};
})();
