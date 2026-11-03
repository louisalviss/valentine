/* SiteOps AI evidence desk demo. All state is in-memory; no fetch, cookies or storage. */
(() => {
  const issues = {
    asset:{id:"PERF–001",category:"performance",code:"PERFORMANCE",title:"Hero image takes too much work to load",summary:"A large first-screen asset could delay the page. The sample suggests checking delivery before assuming a code rewrite is needed.",next:"Inspect asset delivery",why:"Visitors see the hero first. Asset weight can affect how quickly the main content appears.",plan:"Check file sizes, responsive sources, formats and caching. Estimate impact before preparing a proposed change."},
    links:{id:"SEO–002",category:"seo",code:"TECHNICAL SEO",title:"Service page is hard to discover",summary:"An example service page could be missing useful internal links. This must be verified against the actual site before work begins.",next:"Review internal links",why:"Important pages need clear paths for visitors and crawlers. Missing links are a hypothesis until inspected.",plan:"Review crawl paths, in-context links and navigation hierarchy. Provide a proposed linking plan for approval."},
    copy:{id:"COPY–003",category:"content",code:"CONTENT",title:"Service description is out of date",summary:"An illustrative mismatch between an older service description and current product positioning.",next:"Compare page claims",why:"Inconsistent product language can cause confusion. Confirm the live content before rewriting it.",plan:"Compare the page with the approved product brief, annotate differences and propose specific copy changes."},
    plugins:{id:"OPS–004",category:"maintenance",code:"MAINTENANCE",title:"Update needs a compatibility check",summary:"A plugin release might require testing before a website update. No version or vulnerability is being asserted here.",next:"Assess compatibility",why:"A routine update can affect dependent features. Its release, dependency chain and rollback need review.",plan:"Inspect changelog, compatibility, backups, rollback readiness and test results; then request approval."}
  };
  const $=id=>document.getElementById(id);
  const buttons=[...document.querySelectorAll("[data-issue]")],filters=[...document.querySelectorAll("[data-filter]")];
  const search=$("search-dialog"),input=$("search-input"),results=$("search-results");
  let selected="asset",filter="all",searched=[],searchIndex=0,lastFocus=null;
  const review=new Set();
  const q=(str)=>str.trim().toLowerCase();
  function choose(id,{jump=false}={}){
    const o=issues[id];if(!o)return;
    selected=id;
    for(const b of buttons){const active=b.dataset.issue===id;b.classList.toggle("selected",active);b.setAttribute("aria-pressed",String(active))}
    $("detail-code").textContent=o.code+" / "+o.id;
    $("detail-title").textContent=o.title;
    $("detail-summary").textContent=o.summary;
    $("detail-next-short").textContent=o.next;
    $("detail-why").textContent=o.why;
    $("detail-plan").textContent=o.plan;
    $("decision-id").textContent=o.id;
    const done=review.has(id);
    $("mark-review").setAttribute("aria-pressed",String(done));
    $("mark-review").firstChild.textContent=done?"Marked for review ":"Mark for review ";
    $("decision-state").textContent=done?"Added to demo review list":"Pending human review";
    $("review-feedback").textContent=done?"Demo note saved in this browser session only. No backend action.":"This only marks the local demo record. No backend action.";
    if(jump&&window.matchMedia("(max-width:690px)").matches)$("evidence").scrollIntoView({block:"start",behavior:"smooth"});
  }
  function setFilter(next){
    filter=next;
    let visible=[];
    for(const b of buttons){let show=next==="all"||b.dataset.category===next;b.hidden=!show;if(show)visible.push(b.dataset.issue)}
    for(const b of filters){b.setAttribute("aria-pressed",String(b.dataset.filter===next));b.classList.toggle("active",b.dataset.filter===next)}
    $("visible-count").textContent=visible.length+" "+(visible.length===1?"ITEM":"ITEMS");
    if(!visible.includes(selected)&&visible[0])choose(visible[0]);
  }
  buttons.forEach(b=>b.addEventListener("click",()=>choose(b.dataset.issue,{jump:true})));
  filters.forEach(b=>b.addEventListener("click",()=>setFilter(b.dataset.filter)));
  $("mark-review").addEventListener("click",()=>{
    if(review.has(selected))review.delete(selected);else review.add(selected);
    choose(selected);
  });
  function renderSearch(){
    const term=q(input.value);
    searched=Object.keys(issues).filter(id=>{const v=issues[id];return q(v.title+" "+v.code+" "+v.id+" "+v.category+" "+id).includes(term)});
    searchIndex=0;
    results.replaceChildren();
    if(!searched.length){const empty=document.createElement("p");empty.className="no-results";empty.textContent="No matching sample findings.";results.append(empty);return}
    searched.forEach((id,index)=>{
      const v=issues[id],b=document.createElement("button");b.type="button";b.className="search-result";b.setAttribute("role","option");b.setAttribute("aria-selected",String(index===0));b.dataset.result=id;
      const title=document.createElement("strong");title.textContent=v.title;
      const secondary=document.createElement("small");secondary.textContent=v.id;
      b.append(title,secondary);
      b.addEventListener("click",()=>{setFilter("all");choose(id,{jump:false});closeSearch();$("evidence").scrollIntoView({block:"start",behavior:"smooth"})});
      results.append(b);
    });
  }
  function syncSearch(){results.querySelectorAll("[data-result]").forEach((b,i)=>b.setAttribute("aria-selected",String(i===searchIndex)))}
  function openSearch(){
    if(!search.hidden)return;
    lastFocus=document.activeElement;
    search.hidden=false;
    input.value="";
    renderSearch();
    input.focus();
    document.body.style.overflow="hidden";
  }
  function closeSearch(){
    if(search.hidden)return;
    search.hidden=true;
    document.body.style.overflow="";
    if(lastFocus&&lastFocus.focus)lastFocus.focus();
  }
  $("open-search").addEventListener("click",openSearch);
  $("open-search-secondary").addEventListener("click",openSearch);
  $("close-search").addEventListener("click",closeSearch);
  search.addEventListener("click",e=>{if(e.target===search)closeSearch()});
  input.addEventListener("input",renderSearch);
  document.addEventListener("keydown",e=>{
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();search.hidden?openSearch():closeSearch();return}
    if(search.hidden)return;
    if(e.key==="Escape"){e.preventDefault();closeSearch();return}
    if(e.key==="ArrowDown"){e.preventDefault();searchIndex=Math.min(searched.length-1,searchIndex+1);syncSearch()}
    if(e.key==="ArrowUp"){e.preventDefault();searchIndex=Math.max(0,searchIndex-1);syncSearch()}
    if(e.key==="Enter"&&document.activeElement===input&&searched[searchIndex]){
      e.preventDefault();setFilter("all");choose(searched[searchIndex]);closeSearch();$("evidence").scrollIntoView({block:"start",behavior:"smooth"});
    }
  });
  choose("asset");setFilter("all");
})();
