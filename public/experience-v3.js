/* ShopDirect 2026 · Cinematic experience orchestrator.
   The preloader is presentational only; analytic computation is never faked. */
(()=>{"use strict";
const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>[...r.querySelectorAll(q)];
const reduced=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const g=window.gsap;
const sleep=(ms)=>new Promise(done=>setTimeout(done,ms));

function initLoader(){
 const loader=$("#academy-loader");
 if(!loader)return;
 if(reduced()){loader.classList.add("completed");return}
 const track=$("#loader-track"),counter=$("#loader-percent"),icon=$(".loader-icon",loader);
 let finished=false;
 const close=()=>{
  if(finished)return;finished=true;
  if(g){
    const tl=g.timeline({onComplete:()=>{loader.classList.add("completed");loader.remove()}});
    tl.to(".loader-icon",{scale:1.28,rotateY:28,duration:.34,ease:"power2.in"},0)
      .to(".loader-orbits",{scale:1.7,opacity:0,duration:.55,ease:"power2.in"},0)
      .to(".academy-loader",{clipPath:"inset(0 0 100% 0)",opacity:0,duration:.83,ease:"power3.inOut"},.23);
  }else{loader.classList.add("completed");setTimeout(()=>loader.remove(),200)}
 };
 if(g){
  const progress={value:0};
  g.fromTo(icon,{scale:.75,opacity:0,rotate:-10},{scale:1,opacity:1,rotate:0,duration:.9,ease:"back.out(1.8)"});
  g.fromTo(".loader-university,.loader-title,.loader-bottom",
   {opacity:0,y:18},{opacity:1,y:0,duration:.55,stagger:.15,ease:"power2.out"});
  g.to(progress,{value:100,duration:1.42,ease:"power2.inOut",onUpdate:()=>{
    const percent=Math.floor(progress.value);
    counter.textContent=percent+"%";track.style.width=percent+"%";
  },onComplete:close});
 }else{
  track.style.width="100%";counter.textContent="100%";setTimeout(close,800);
 }
 // The overlay can never block navigation if images/network stall.
 setTimeout(close,2600);
}

function animateStats(){
 const ribbon=$("#animated-stat-ribbon");
 if(!ribbon)return;
 const counters=$$("[data-count]",ribbon);
 function run(){
  for(const element of counters){
    const target=Number(element.dataset.count);
    if(!Number.isFinite(target))continue;
    const state={value:0};
    if(g&&!reduced()){
      g.to(state,{value:target,duration:1.95,ease:"power3.out",onUpdate:()=>{
        let v=Math.round(state.value);
        element.textContent=element.dataset.format==="pad2"?String(v).padStart(2,"0"):String(v);
      },onComplete:()=>element.textContent=element.dataset.format==="pad2"?String(target).padStart(2,"0"):String(target)});
    }else element.textContent=element.dataset.format==="pad2"?String(target).padStart(2,"0"):String(target);
  }
  if(g&&!reduced())g.fromTo($$(".stat-item",ribbon),
   {opacity:.42,y:28,scale:.96},{opacity:1,y:0,scale:1,duration:.9,stagger:.11,ease:"back.out(1.2)",clearProps:"transform,opacity"});
 }
 if(window.IntersectionObserver){
  const watcher=new IntersectionObserver(entries=>{
   if(entries.some(x=>x.isIntersecting)){watcher.disconnect();run()}
  },{threshold:.32});
  watcher.observe(ribbon);
 }else run();
}

function motionAssets(){
 if(reduced()||!g)return;
 // Floating hero icons have one coordinated scroll owner in hero-depth.js.
 // Do not animate their transforms/opacity here: competing GSAP tweens cause jumps.
 if(window.ScrollTrigger){
  g.registerPlugin(window.ScrollTrigger);
  const ambient=$$(".research-orbit");
  ambient.forEach((blob,i)=>{
   g.to(blob,{yPercent:i%2===0?60:-50,xPercent:i%2===0?30:-30,ease:"none",
    scrollTrigger:{trigger:".research-surface",start:"top bottom",end:"bottom top",scrub:1.4}});
  });
  const bgAssets=$$(".research-float");
  bgAssets.forEach((el,i)=>g.fromTo(el,{yPercent:-35,rotate:-9},{yPercent:50,rotate:9,ease:"none",
    scrollTrigger:{trigger:".research-surface",start:"top bottom",end:"bottom top",scrub:1.9+i*.2}}));
 }
 // Gentle cursor responsive aura, not applied to portraits or critical text.
 const hero=$("#cover");
 if(hero){
  const easeX=g.quickTo?.(".cover .orbit-illustration","x",{duration:1.2,ease:"power2.out"});
  const easeY=g.quickTo?.(".cover .orbit-illustration","y",{duration:1.2,ease:"power2.out"});
  hero.addEventListener("pointermove",e=>{
   if(e.pointerType==="touch"||window.innerWidth<950)return;
   const bounds=hero.getBoundingClientRect();
   const nx=(e.clientX-bounds.left)/Math.max(1,bounds.width)-.5;
   const ny=(e.clientY-bounds.top)/Math.max(1,bounds.height)-.5;
   easeX?.(nx*24);easeY?.(ny*24);
  },{passive:true});
 }
}

function focusChapters(){
 const chapters=$$(".chapter");
 chapters.forEach(chapter=>{
  const card=$(".execute-card",chapter);
  if(!card)return;
  // Decorative local glow follows the pointer without layout work.
  card.addEventListener("pointermove",ev=>{
   if(window.innerWidth<1024)return;
   const rect=card.getBoundingClientRect();
   card.style.setProperty("--glow-x",Math.round(ev.clientX-rect.left)+"px");
   card.style.setProperty("--glow-y",Math.round(ev.clientY-rect.top)+"px");
  },{passive:true});
 });
}

function init(){
 /* V4 owns overlay and floating GSAP to avoid overlapping timelines. */ animateStats();focusChapters();
 if(window.ScrollTrigger&&!reduced()){
  requestAnimationFrame(()=>window.ScrollTrigger.refresh());
 }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();