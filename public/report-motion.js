/* GSAP report reading transitions; disabled for printing/reduced motion */
(()=>{"use strict";
const start=()=>{
const g=window.gsap;
if(!g||!window.ScrollTrigger||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
g.registerPlugin(window.ScrollTrigger);
for(const section of document.querySelectorAll(".report-section")){
 const children=[...section.children].filter(x=>x.tagName==="H2"||x.classList.contains("report-callout")||x.classList.contains("report-figure"));
 for(const node of children)g.fromTo(node,{opacity:0,y:19},{opacity:1,y:0,duration:.77,ease:"power2.out",clearProps:"opacity,transform",scrollTrigger:{trigger:node,start:"top 95%",once:true}});
}
window.addEventListener("beforeprint",()=>{g.globalTimeline.clear();window.ScrollTrigger?.getAll().forEach(t=>t.kill())});
};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();