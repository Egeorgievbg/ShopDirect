/* Lightweight GSAP enhancement for the eight-slide defense deck. */
(()=>{"use strict";
 const motion=()=>{
  const g=window.gsap;
  if(!g||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const slides=[...document.querySelectorAll(".slide")];
  function enter(slide){
    if(!slide?.classList.contains("active"))return;
    const inner=slide.querySelector(".inner");if(!inner)return;
    const nodes=[...inner.children];
    g.killTweensOf(nodes);
    g.fromTo(nodes,{opacity:0,y:36,filter:"blur(6px)"},
      {opacity:1,y:0,filter:"blur(0px)",stagger:.105,duration:.8,ease:"power3.out",clearProps:"filter,opacity,transform"});
    const tracks=[...inner.querySelectorAll(".bar .track i")];
    g.fromTo(tracks,{scaleX:0,transformOrigin:"left center"},
      {scaleX:1,stagger:.11,duration:1.15,ease:"power3.out",delay:.5,clearProps:"transform"});
  }
  for(const slide of slides){
    new MutationObserver(()=>{if(slide.classList.contains("active"))enter(slide)})
      .observe(slide,{attributes:true,attributeFilter:["class"]});
  }
  enter(document.querySelector(".slide.active"));
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",motion,{once:true});else motion();
})();