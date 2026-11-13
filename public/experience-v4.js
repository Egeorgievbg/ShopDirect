/* ShopDirect V4 — one GSAP owner for orbital icons and centered university preloader.
 * Real Python analysis and its data are not touched.
 */
(()=>{"use strict";
const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const reduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let loaderClosed=false;
async function initPreloader(){
 const loader=$("#academy-loader");if(!loader)return;
 const closeImmediately=()=>{loader.classList.add("completed");loader.remove()};
 if(reduced()){closeImmediately();return}
 const gs=window.gsap,track=$("#loader-track"),pct=$("#loader-percent"),badge=$(".loader-icon",loader);
 if(!gs||!track||!pct){closeImmediately();return}
 const minVisible=800;
 const started=performance.now();
 const state={progress:0};
 const write=()=>{const n=Math.max(0,Math.min(100,Math.round(state.progress)));track.style.width=n+"%";pct.textContent=n+"%"};
 const settle=async()=>{
   if(loaderClosed)return;loaderClosed=true;
   await sleep(Math.max(0,minVisible-(performance.now()-started)));
   const end=gs.timeline({onComplete:closeImmediately});
   end.to(state,{progress:100,duration:.23,ease:"power2.out",onUpdate:write},0)
      .to(".loader-emblem",{scale:1.14,filter:"brightness(1.25)",duration:.38,ease:"power2.inOut"},.12)
      .to(".loader-composition",{y:-35,opacity:0,filter:"blur(8px)",duration:.5,ease:"power3.inOut"},.39)
      .to(".academy-loader",{clipPath:"inset(0 0 100% 0)",opacity:0,duration:.86,ease:"power3.inOut"},.5);
 };
 const intro=gs.timeline();
 intro.fromTo(".loader-kicker",{opacity:0,y:13},{opacity:1,y:0,duration:.42})
      .fromTo(".loader-emblem",{opacity:0,scale:.63,rotate:-18},{opacity:1,scale:1,rotate:0,duration:.78,ease:"back.out(1.7)"},.1)
      .fromTo(".loader-university,.loader-title,.loader-subtitle",{opacity:0,y:15},
         {opacity:1,y:0,duration:.47,stagger:.095,ease:"power3.out"},.45)
      .fromTo(".loader-progress,.loader-bottom",{opacity:0,y:8},
         {opacity:1,y:0,duration:.35,stagger:.05},.72);
 // Progress is a visual readiness cue, not a claim about files or ML computations.
 gs.to(state,{progress:89,duration:1.35,ease:"power2.out",onUpdate:write});
 const resources=[badge?.complete?Promise.resolve():badge?.decode?.().catch(()=>{})||Promise.resolve(),
   document.fonts?.ready?.catch(()=>{})||Promise.resolve()];
 const ready=Promise.allSettled(resources);
 await Promise.race([ready,sleep(1750)]);
 await settle();
 // Safety fallback in case GSAP timelines were interrupted.
 setTimeout(closeImmediately,1500);
}
function animateOrbit(){
 const gs=window.gsap,ST=window.ScrollTrigger;
 const hero=$("#cover");
 const shells=$$(".cover .float-shell");
 if(!shells.length)return;
 if(!gs||reduced()){
   shells.forEach(x=>x.style.opacity="0.8");
   return;
 }
 if(ST)gs.registerPlugin(ST);
 const goLeft=[-85,60,-110,90,45];
 const drift=[-50,35,70,-25,45];
 const rotate=[-32,40,-28,35,31];
 const randomStart=[0.98,1.08,.9,1.05,.97];
 shells.forEach((shell,i)=>{
   gs.fromTo(shell,{opacity:0,scale:.45,y:28,rotation:rotate[i]*-.25},
     {opacity:.94,scale:randomStart[i],y:0,rotation:0,
       duration:.85,delay:.45+i*.1,ease:"back.out(1.65)"});
   if(!ST)return;
   // As scroll approaches the lower edge, the icons drift down, swing,
   // change scale and disappear UNDER the clipped hero scene.
   gs.timeline({scrollTrigger:{
      trigger:hero,start:"top top",end:"bottom bottom",
      scrub:1.15,invalidateOnRefresh:true
   }})
   .to(shell,{y:()=>Math.max(180,window.innerHeight*.34)+i*25,
     x:goLeft[i],rotation:rotate[i],scale:[.62,1.25,.75,1.17,.58][i],
     ease:"sine.inOut",duration:.65},0)
   .to(shell,{y:()=>Math.max(420,window.innerHeight*.85)+i*35,
     x:drift[i],rotation:rotate[i]*1.8,scale:.35,opacity:0,
     ease:"power2.in",duration:.35},.65);
 });
 // Recalculate after fonts and photos alter layout.
 window.addEventListener("load",()=>ST?.refresh(),{once:true});
}
function start(){
 initPreloader().catch(()=>{
    const loader=$("#academy-loader");loader?.classList.add("completed");loader?.remove();
 });
 animateOrbit();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
else start();
})();