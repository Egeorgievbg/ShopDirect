/* ShopDirect · Cinematic pinned portrait / editorial text motion.
   The hero scroll timeline only transforms decorative UI. Python and data remain untouched. */
(()=>{"use strict";
 const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>Array.from(r.querySelectorAll(q));
 function initialize(){
  const g=window.gsap,ST=window.ScrollTrigger;
  if(!g||!ST||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  g.registerPlugin(ST);
  // The desktop hero uses a stable two-track CSS Grid instead of a pinned
  // portrait scroll timeline. This prevents transforms from colliding with
  // its copy, art and navigation at different viewport sizes.

  // More expressive typographic choreography (short, readable and not distracting).
  for(const el of $$(".intro-section .display,.research-intro h2,.chapter-head h2,.conclusion .display,.presenting-feature h3")){
    g.fromTo(el,{autoAlpha:0,y:42,filter:"blur(8px)"},
     {autoAlpha:1,y:0,filter:"blur(0px)",duration:.96,ease:"power3.out",
      clearProps:"filter,transform,opacity,visibility",
      scrollTrigger:{trigger:el,start:"top 91%",once:true}});
  }
  const feature=$(".presenting-feature");
  if(feature&&window.matchMedia("(min-width:681px)").matches){
   g.fromTo(".presenting-feature-copy > *",
     {autoAlpha:0,y:28,filter:"blur(4px)"},
     {autoAlpha:1,y:0,filter:"blur(0px)",duration:.7,stagger:.12,ease:"power3.out",
      clearProps:"filter,transform,opacity,visibility",
      scrollTrigger:{trigger:feature,start:"top 76%",once:true}});
   // Independent left-to-right entrance; the PNG hand naturally points right.
   let floatingTween=null;
   g.fromTo(".presenting-portrait",{autoAlpha:0,x:-125,rotate:-3,scale:.95},
     {autoAlpha:1,x:0,rotate:0,scale:1,duration:1.25,ease:"power3.out",
      clearProps:"opacity,visibility",
      onComplete:()=>{
        floatingTween=g.to(".presenting-portrait",{
          x:25,y:-8,rotation:1.2,duration:3.8,ease:"sine.inOut",
          repeat:-1,yoyo:true,overwrite:"auto"
        });
      },
      scrollTrigger:{trigger:feature,start:"top 83%",once:true}});
  }
  for(const el of $$(".intro-aside > p,.chapter-explain > p,.strategy-list > div,.sources-grid p")){
    g.fromTo(el,{autoAlpha:0,y:20},{autoAlpha:1,y:0,duration:.72,
      clearProps:"opacity,transform,visibility",ease:"power2.out",
      scrollTrigger:{trigger:el,start:"top 94%",once:true}});
  }
  ST.refresh();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialize,{once:true});
 else initialize();
})();
