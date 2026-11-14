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
 // Render the real hero immediately. Loader is decorative and must not delay LCP.
 loader.classList.add("completed");
 loader.remove();
}
function animateOrbit(){
 const gs=window.gsap,ST=window.ScrollTrigger;
 const hero=$("#cover");
 const shells=$$(".cover .float-shell");
 if(!shells.length)return;
 if(window.matchMedia("(max-width:680px)").matches){
   shells.forEach(x=>{x.style.opacity="1";x.style.transform="none"});
   return;
 }
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