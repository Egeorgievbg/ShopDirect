/* ShopDirect · cinematic 8-scene academic defense.
   No voiceover, ElevenLabs, MP3, external state or paid services.
   Real scientific graphics remain independently computed by presentation-infographics.js. */
(()=>{"use strict";
const $=(query,root=document)=>root.querySelector(query);
const $$=(query,root=document)=>Array.from(root.querySelectorAll(query));
const slides=$$(".slide");
const sceneNames=["Въведение","Маркетингов проблем","Клиентски данни","Ключови зависимости","Прогнозни модели","Сравнение ROC","Таргетиране","Изводи и препоръки"];
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const background=(i)=>"/visuals/background-"+String(i+1).padStart(2,"0")+".png";
const floating=(i)=>"/visuals/floating-"+String(i+1).padStart(2,"0")+".png";
let index=0,notesOpen=false,introOpen=false,lastFocused=null,floatTween=null,touchStart=null,dragFrame=0,pointerX=0,pointerY=0;
const $id=(id)=>document.getElementById(id);
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
const labelIndex=(n)=>String(n+1).padStart(2,"0");
function arrangeSlides(){
 slides.forEach((slide,i)=>{
  const root=$(".inner",slide);
  const viz=$(".viz-shell",root);
  slide.dataset.index=String(i);
  slide.setAttribute("aria-label","Слайд "+(i+1)+": "+sceneNames[i]);
  if(viz){
   slide.classList.add("slide-visual");
   const textGroup=document.createElement("div");
   const vizStage=document.createElement("div");
   textGroup.className="slide-story";vizStage.className="slide-stage";
   Array.from(root.children).forEach(node=>{if(node!==viz)textGroup.append(node)});
   vizStage.append(viz);
   root.append(textGroup,vizStage);
  }
  const image=document.createElement("img");
  image.className="cinema-float";
  image.alt="";
  image.setAttribute("aria-hidden","true");
  image.decoding="async";
  image.loading=i===0?"eager":"lazy";
  image.dataset.src=floating(i);
  image.style.setProperty("--float-size",i===0?"min(57vw,830px)":"min(46vw,690px)");
  image.style.setProperty("--float-top",i===0?"13%":(i%3===0?"16%":"12%"));
  image.style.setProperty("--float-right",i%2===0?"-2vw":"-4vw");
  image.style.setProperty("--float-opacity",i===0?".83":i===2?".29":".38");
  slide.append(image);
 });
}
function prepare(indexToLoad){
 const slide=slides[indexToLoad];if(!slide)return;
 if(!slide.dataset.prepared){
  slide.style.setProperty("--scene-bg",'url("'+background(indexToLoad)+'")');
  const img=$(".cinema-float",slide);
  if(img)img.src=img.dataset.src;
  slide.dataset.prepared="true";
 }
}
function installHeader(){
 const tools=$(".hud-tools");
 const help=document.createElement("button");
 help.id="intro-help";help.type="button";help.title="Инструкции и клавишни комбинации";
 help.textContent="? Инструкции";
 tools.insertBefore(help,tools.firstChild);
 help.addEventListener("click",()=>openIntro());
 const progress=document.createElement("div");progress.className="cinema-top-progress";
 progress.setAttribute("aria-hidden","true");progress.innerHTML='<i id="cinema-top-fill"></i>';
 document.body.append(progress);
 $id("notes").setAttribute("aria-pressed","false");
 $id("notes").addEventListener("click",toggleNotes);
 $id("fullscreen").addEventListener("click",toggleFullscreen);
 $id("print").addEventListener("click",()=>window.print());
}
function installDock(){
 const footer=$(".footer");
 footer.classList.add("cinema-dock");
 footer.setAttribute("aria-label","Навигация между слайдовете");
 footer.innerHTML=
 '<button id="previous" class="dock-arrow" type="button" aria-label="Предишен слайд" title="Предишен слайд — ←">‹</button>'+
 '<div class="dock-content"><div class="dock-label"><span id="dock-heading">Въведение</span><small id="dock-count">01 / 08</small></div>'+
 '<div class="dock-steps" id="dock-steps" role="group" aria-label="Премини към слайд"></div></div>'+
 '<div class="dock-right"><span class="dock-keyhint">← →</span><button id="next" class="dock-arrow" type="button" aria-label="Следващ слайд" title="Следващ слайд — →">›</button></div>';
 const host=$id("dock-steps");
 sceneNames.forEach((name,i)=>{
  const button=document.createElement("button");
  button.type="button";button.className="dock-step";button.dataset.goto=String(i);
  button.title=labelIndex(i)+" / "+name;
  button.setAttribute("aria-label","Слайд "+(i+1)+": "+name);
  button.addEventListener("click",()=>show(i));
  host.append(button);
 });
 $id("previous").addEventListener("click",()=>show(index-1));
 $id("next").addEventListener("click",()=>show(index+1));
}
function installIntro(){
 const overlay=document.createElement("div");
 overlay.className="cinema-intro";
 overlay.id="cinema-intro";
 overlay.hidden=true;
 overlay.setAttribute("role","dialog");
 overlay.setAttribute("aria-modal","true");
 overlay.setAttribute("aria-labelledby","intro-heading");
 overlay.innerHTML=
 '<div class="intro-panel">'+
 '<button id="intro-close" class="intro-close" type="button" aria-label="Затвори инструкциите">×</button>'+
 '<div class="intro-eyebrow">SHOPDIRECT · DEFENSE EXPERIENCE / 2026</div>'+
 '<h2 id="intro-heading">От данни<br><em>към решение.</em></h2>'+
 '<p>Интерактивна академична защита на Илияна Цанова. Осем последователни сцени с реални резултати от Python, визуални анализи и маркетингови изводи.</p>'+
 '<div class="intro-grid">'+
 '<article><kbd>←</kbd><kbd>→</kbd><strong>Навигация</strong><span>Сменяй слайдовете с клавиатура, стрелките или долната лента.</span></article>'+
 '<article><kbd>F</kbd><strong>Пълен екран</strong><span>Включи презентационен режим. Излез с Esc.</span></article>'+
 '<article><kbd>?</kbd><strong>Помощ</strong><span>Отвори тези инструкции отново. N — бележки за представяне.</span></article>'+
 '</div>'+
 '<p><strong>Интерактивни демонстрации:</strong> на слайд 6 изчисли реалните ROC криви, а на слайд 7 сравни сценариите за таргетиране от 10% до 50%. На телефон плъзни хоризонтално върху празно пространство, за да смениш слайда.</p>'+
 '<div class="intro-actions"><label class="intro-check"><input id="intro-remember" type="checkbox" checked> Не показвай отново автоматично</label>'+
 '<button id="intro-start" class="intro-primary" type="button">Започни презентацията →</button></div>'+
 '</div>';
 document.body.append(overlay);
 $id("intro-start").addEventListener("click",closeIntro);
 $id("intro-close").addEventListener("click",closeIntro);
 overlay.addEventListener("pointerdown",e=>{if(e.target===overlay)closeIntro()});
 let skip=false;try{skip=localStorage.getItem("shopdirect-intro-seen-v2")==="1"}catch(_){}
 if(!skip)openIntro();
}
function openIntro(){
 if(introOpen)return;
 introOpen=true;
 lastFocused=document.activeElement;
 const el=$id("cinema-intro");
 el.hidden=false;
 document.body.classList.add("intro-open");
 $id("intro-start").focus();
}
function closeIntro(){
 if(!introOpen)return;
 introOpen=false;
 $id("cinema-intro").hidden=true;
 document.body.classList.remove("intro-open");
 try{localStorage.setItem("shopdirect-intro-seen-v2",$id("intro-remember").checked?"1":"0")}catch(_){}
 if(lastFocused&&lastFocused.isConnected&&lastFocused.focus)lastFocused.focus();
 else $id("next")?.focus();
}
function toggleNotes(){
 notesOpen=!notesOpen;
 $id("speaker").classList.toggle("visible",notesOpen);
 $id("notes").setAttribute("aria-pressed",String(notesOpen));
}
function toggleFullscreen(){
 if(document.fullscreenElement){document.exitFullscreen?.().catch(()=>{});return}
 document.documentElement.requestFullscreen?.().catch(()=>{});
}
function show(to,options={}){
 const next=clamp(Number(to)||0,0,slides.length-1);
 const changed=next!==index;
 const was=slides[index];
 if(changed&&floatTween){floatTween.kill();floatTween=null}
 if(was){const img=$(".cinema-float",was);if(img&&changed){img.style.translate="";img.style.transform=""}}
 index=next;
 slides.forEach((slide,i)=>{
  const active=i===index;
  slide.classList.toggle("active",active);
  slide.setAttribute("aria-hidden",String(!active));
  slide.inert=!active;
 });
 prepare(index);prepare(index+1);
 $id("counter").textContent=labelIndex(index)+" / "+labelIndex(slides.length);
 $id("dock-count").textContent=labelIndex(index)+" / "+labelIndex(slides.length);
 $id("dock-heading").textContent=sceneNames[index];
 $id("speaker-text").textContent=slides[index].dataset.note||"";
 const ratio=(index+1)/slides.length*100;
 $id("cinema-top-fill").style.width=ratio+"%";
 $$(".dock-step").forEach((button,i)=>{
  button.classList.toggle("active",i===index);
  button.classList.toggle("done",i<index);
  button.setAttribute("aria-current",i===index?"step":"false");
 });
 $id("previous").disabled=index===0;
 $id("next").disabled=index===slides.length-1;
 $id("next").title=index===slides.length-1?"Последен слайд":"Следващ слайд — →";
 history.replaceState(null,"","#"+(index+1));
 if(changed){
  if(window.scrollY>0)window.scrollTo({top:0,behavior:"instant"});
  animateEnter();
 }
 if(!reduced)floatAnimate();
 window.dispatchEvent(new CustomEvent("shopdirect:slidechange",{detail:{index,slide:slides[index]}}));
}
function animateEnter(){
 const g=window.gsap;
 if(!g||reduced)return;
 const slide=slides[index],floater=$(".cinema-float",slide);
 const stage=$(".slide-stage",slide);
 if(stage){
  g.killTweensOf(stage);
  g.fromTo(stage,{opacity:.65,x:24,scale:.985},{opacity:1,x:0,scale:1,duration:.86,ease:"power3.out",clearProps:"transform,opacity"});
 }
 if(floater){
  g.killTweensOf(floater);
  g.fromTo(floater,{opacity:0,x:60,scale:.91},{opacity:Number(floater.style.getPropertyValue("--float-opacity")||.4),x:0,scale:1,duration:1.5,ease:"power3.out",onComplete:floatAnimate});
 }
}
function floatAnimate(){
 const g=window.gsap;
 if(!g||reduced||introOpen)return;
 const item=$(".cinema-float",slides[index]);if(!item)return;
 if(floatTween)floatTween.kill();
 floatTween=g.to(item,{y:-16,rotation:index%2===0?2:-2,duration:5.3+index%3,yoyo:true,repeat:-1,ease:"sine.inOut"});
}
function bindInput(){
 document.addEventListener("keydown",e=>{
  if(introOpen){
   if(e.key==="Escape"){e.preventDefault();closeIntro();return}
   if(e.key==="Tab"){
    const dialog=$id("cinema-intro"),focusable=$$("button,input",dialog).filter(x=>!x.disabled);
    const first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
   }
   return;
  }
  if(e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,button,[contenteditable=true]"))return;
  if(["ArrowRight","PageDown"," "].includes(e.key)){e.preventDefault();show(index+1)}
  else if(["ArrowLeft","PageUp"].includes(e.key)){e.preventDefault();show(index-1)}
  else if(e.key==="Home"){e.preventDefault();show(0)}
  else if(e.key==="End"){e.preventDefault();show(slides.length-1)}
  else if(e.key.toLowerCase()==="f"){e.preventDefault();toggleFullscreen()}
  else if(e.key.toLowerCase()==="n"){e.preventDefault();toggleNotes()}
  else if(e.key==="?"||e.key==="/"){e.preventDefault();openIntro()}
 });
 window.addEventListener("hashchange",()=>{
  const numeric=Number(location.hash.slice(1));
  if(Number.isInteger(numeric)&&numeric>=1&&numeric<=slides.length&&numeric-1!==index)show(numeric-1);
 });
 slides.forEach(slide=>{
  slide.addEventListener("touchstart",e=>{
   if(introOpen||e.touches.length!==1||e.target.closest("button,a,input,select,textarea,.viz-shell"))return;
   const touch=e.touches[0];touchStart={x:touch.clientX,y:touch.clientY};
  },{passive:true});
  slide.addEventListener("touchend",e=>{
   if(!touchStart||introOpen)return;
   const touch=e.changedTouches[0],dx=touch.clientX-touchStart.x,dy=touch.clientY-touchStart.y;
   touchStart=null;
   if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.55)show(index+(dx<0?1:-1));
  },{passive:true});
 });
 document.addEventListener("pointermove",e=>{
  if(reduced||introOpen||e.pointerType!=="mouse"||innerWidth<980)return;
  pointerX=(e.clientX/innerWidth-.5)*14;
  pointerY=(e.clientY/innerHeight-.5)*10;
  if(dragFrame)return;
  dragFrame=requestAnimationFrame(()=>{
   dragFrame=0;const floater=$(".cinema-float",slides[index]);
   if(floater)floater.style.translate=pointerX.toFixed(1)+"px "+pointerY.toFixed(1)+"px";
  });
 },{passive:true});
}
function init(){
 if(slides.length!==8)return;
 arrangeSlides();
 installHeader();
 installDock();
 installIntro();
 bindInput();
 const hash=Number(location.hash.slice(1));
 index=-1;show(Number.isInteger(hash)&&hash>=1&&hash<=8?hash-1:0);
 if(!introOpen)animateEnter();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();