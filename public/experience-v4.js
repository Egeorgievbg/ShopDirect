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
 // Static icon positions are owned by responsive CSS. Subtle CSS image
 // sway remains; GSAP transforms were displacing desktop icons on scroll.
 const shells=$$(".cover .float-shell");
 shells.forEach(shell=>{shell.style.removeProperty("transform");shell.style.removeProperty("opacity")});
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