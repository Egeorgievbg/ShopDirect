/* ShopDirect · Cinematic pinned portrait / editorial text motion.
   The hero scroll timeline only transforms decorative UI. Python and data remain untouched. */
(()=>{"use strict";
 const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>Array.from(r.querySelectorAll(q));
 function initialize(){
  const g=window.gsap,ST=window.ScrollTrigger;
  if(!g||!ST||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  g.registerPlugin(ST);
  const cover=$("#cover"),stage=$(".cover-stage"),photo=$(".cover-portrait");
  if(cover&&stage&&photo&&window.matchMedia("(min-width:681px)").matches){
    g.set(photo,{opacity:1});
    // An independently timed entrance: her full-color figure rises into view.
    g.fromTo(photo,{y:105,opacity:0,scale:.965},
      {y:0,opacity:1,scale:1,duration:1.5,delay:.55,ease:"power3.out",
       clearProps:"scale"});
    // The stage is sticky through an additional ~one viewport of scrolling.
    // First the lower body appears; only near the end does the figure move away.
    const scroll=g.timeline({defaults:{ease:"none"},scrollTrigger:{
      trigger:cover,start:"top top+=0",end:"bottom bottom",scrub:.85,
      invalidateOnRefresh:true
    }});
    scroll
      .to(photo,{yPercent:-61,duration:.75},0)
      .to(photo,{yPercent:-110,autoAlpha:0,duration:.25},.75)
      .to(".cover .float-chip",{yPercent:-68,autoAlpha:0,duration:.22,stagger:.03},.78)
      .to(".cover .cover-copy",{y:-80,autoAlpha:0,duration:.28},.72)
      .to(".cover .orbit-illustration",{yPercent:-18,autoAlpha:0,duration:.32},.68);
  }

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
