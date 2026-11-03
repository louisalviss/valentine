const data={
home:["PAGE / PERFORMANCE","Homepage","example.com /","Hero image may be heavier than necessary.","Inspect image delivery before proposing a change."],
services:["PAGE / TECHNICAL SEO","Services","example.com / services","Internal links merit review.","Inspect metadata and links before recommending changes."],
articles:["PAGE / CONTENT","Articles","example.com / articles","Content may be outdated.","Compare current positioning before drafting revisions."],
plugins:["STACK / MAINTENANCE","Plugins","example.com / plugins","Compatibility should be reviewed.","Check dependencies and rollback before updates."]
};
const byId=id=>document.getElementById(id);
function pick(key){
const a=data[key];if(!a)return;
["inspect-type","inspect-title","inspect-path","inspect-finding","inspect-next"].forEach((id,i)=>byId(id).textContent=a[i]);
document.querySelectorAll("[data-node]").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.node===key)));
document.querySelectorAll("[data-wire]").forEach(x=>x.classList.toggle("active",x.dataset.wire===key));
}
function show(mode){
byId("map-view").hidden=mode!=="map";
byId("overview").hidden=mode!=="list";
document.querySelectorAll("[data-view]").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.view===mode)));
}
document.querySelectorAll("[data-node]").forEach(x=>x.addEventListener("click",()=>pick(x.dataset.node)));
document.querySelectorAll("[data-view]").forEach(x=>x.addEventListener("click",()=>show(x.dataset.view)));
document.querySelectorAll("[data-target]").forEach(x=>x.addEventListener("click",()=>{pick(x.dataset.target);show("map")}));
byId("show-process").addEventListener("click",()=>byId("workflow").scrollIntoView());
pick("home");
