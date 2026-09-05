(()=>{
  const projects=[
    {title:'Patron',director:''},
    {title:'The WrapBook',director:'directed by Eva Michon'},
    {title:'Toyota',director:'directed by Tristan Holmes'},
    {title:'Air Jordan',director:'directed by Christo Anesti'},
    {title:'Vera Bradley',director:'directed by Eva Michon'},
    {title:'Smartfood',director:"directed by John O'Hagan"},
    {title:'Red Robin',director:'directed by Jonathan Zames'},
    {title:'Simon Malls',director:''},
    {title:'Patron',director:''}
  ];
  const desktopTitle=document.querySelector('[data-ref="project-title"]');
  const desktopDirector=document.querySelector('[data-ref="project-director"]');
  const mobileTitle=document.querySelector('[data-ref="mobile-project-title"]');
  const mobileDirector=document.querySelector('[data-ref="mobile-project-director"]');
  const desktopCopy=document.querySelector('[data-ref="desktop-project-copy"]');
  const mobileCopy=document.querySelector('[data-ref="mobile-project-copy"]');
  const toggle=document.querySelector('[data-ref="menu-toggle"]');
  const menu=document.querySelector('[data-ref="mobile-menu"]');
  let active=-1,scheduled=false;

  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function indexFromScroll(){
    const h=Math.max(1,window.innerHeight);
    return clamp(Math.round(window.scrollY/h),0,projects.length-1);
  }
  function render(){
    scheduled=false;
    const next=indexFromScroll();
    if(next===active)return;
    active=next;
    const p=projects[active];
    desktopTitle.textContent=p.title;
    desktopDirector.textContent=p.director;
    mobileTitle.textContent=p.title;
    mobileDirector.textContent=p.director;
    desktopCopy.classList.toggle('is-empty',!p.director);
    mobileCopy.classList.toggle('is-empty',!p.director);
    document.body.dataset.activeProject=String(active);
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(render)}}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  render();

  function setMenu(open){
    menu.setAttribute('aria-hidden',open?'false':'true');
    toggle.setAttribute('aria-expanded',open?'true':'false');
    toggle.textContent=open?'Close':'Menu';
    document.documentElement.style.overflow=open?'hidden':'';
    document.body.style.overflow=open?'hidden':'';
  }
  toggle.addEventListener('click',()=>setMenu(toggle.getAttribute('aria-expanded')!=='true'));
  menu.addEventListener('click',event=>{if(event.target.closest('a'))setMenu(false)});
  addEventListener('keydown',event=>{if(event.key==='Escape')setMenu(false)});
})();
