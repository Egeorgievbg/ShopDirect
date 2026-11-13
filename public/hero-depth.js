/* ShopDirect / Four subtle orbit icons.
   Idle sway uses CSS translate; scroll uses GSAP transform only.
   The preloader, numeric ribbons and analytic backend are unaffected. */
(()=>{
 "use strict";
 const setup=()=>{
  const g=window.gsap,ST=window.ScrollTrigger;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduced||!g||!ST)return;
  g.registerPlugin(ST);
  const cover=document.querySelector("#cover");
  const icons=[...document.querySelectorAll(".cover .hero-orbit-assets .float-asset")];
  if(!cover||!icons.length)return;
  const directions=[
    {x:55,y:315,rotation:24,scale:.46},
    {x:-75,y:255,rotation:-31,scale:.57},
    {x:-35,y:345,rotation:19,scale:.49},
    {x:65,y:300,rotation:-21,scale:.54}
  ];
  icons.forEach((icon,i)=>{
    // Entrance moves from below without taking over the ScrollTrigger transform.
    g.fromTo(icon,{autoAlpha:0},
      {autoAlpha:.9,duration:1,delay:.52+i*.13,ease:"power2.out"});
    const end=directions[i%directions.length];
    const timeline=g.timeline({defaults:{ease:"none"},scrollTrigger:{
      trigger:cover,start:"top top",end:"bottom bottom",
      scrub:1.05,invalidateOnRefresh:true
    }});
    // Deliberate swaying when scrolling; each icon has a unique trajectory.
    timeline.fromTo(icon,{x:0,y:0,rotation:0,scale:1},
      {x:end.x*.40,y:end.y*.33,rotation:end.rotation*.55,scale:1.12,duration:.40},0)
      .to(icon,{x:-end.x*.18,y:end.y*.66,rotation:-end.rotation*.42,scale:.87,duration:.32},.40)
      .to(icon,{x:end.x,y:end.y,rotation:end.rotation,scale:end.scale,duration:.28},.72)
      .to(icon,{opacity:0,duration:.25},.75);
  });
 };
 if(document.readyState==="loading")
   document.addEventListener("DOMContentLoaded",setup,{once:true});
 else setup();
})();