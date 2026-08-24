(()=>{
  const art=document.querySelector('.art');
  if(!art)return;
  async function loadHDArt(){
    try{
      const names=[
        './hd/art-00.txt?v=hd1',
        './hd/art-01.txt?v=hd1',
        ...Array.from({length:7},(_,i)=>`./hd/rest-${String(i).padStart(2,'0')}.txt?v=hd1`)
      ];
      const chunks=await Promise.all(names.map(u=>fetch(u,{cache:'force-cache'}).then(r=>{
        if(!r.ok)throw new Error(`${u}: ${r.status}`);
        return r.text();
      })));
      const b64=chunks.join('').replace(/\s+/g,'');
      if(b64.length!==154076)throw new Error(`HD asset length ${b64.length}`);
      const raw=atob(b64);
      if(raw.length!==115556)throw new Error(`HD asset bytes ${raw.length}`);
      const bytes=new Uint8Array(raw.length);
      for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
      const url=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));
      const probe=new Image();
      probe.decoding='async';
      probe.onload=()=>{
        art.src=url;
        art.dataset.hd='1';
        document.documentElement.classList.add('hd-art-ready');
      };
      probe.onerror=()=>URL.revokeObjectURL(url);
      probe.src=url;
    }catch(err){console.warn('Nocturne HD fallback',err)}
  }
  loadHDArt();
})();
