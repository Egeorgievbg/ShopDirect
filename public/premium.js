/* ShopDirect Purple · GSAP motion plus factual Python execution trace */
(()=>{"use strict";
const gsap=window.gsap, reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
const names={quality:"Качество на данните",patterns:"Зависимости",logistic:"Logistic Regression",forest:"Random Forest",comparison:"Моделно сравнение",targeting:"Таргетиране",all:"Цялото изследване"};
const explains={
dataset:"Зареждане на 800-те учебни наблюдения.",
validation:"Проверка за невалидни, повторени и липсващи записи.",
split:"Отделя се независима тестова извадка с пропорционално представяне на класовете.",
model:"Инициализация на класификационен модел с фиксирани параметри.",
cross_validation:"Петкратна кръстосана проверка върху обучаващите данни.",
fit:"Обучение само върху 600 наблюдения, без изтичане на информация от теста.",
test:"Изчисляване на ROC AUC върху независимите 200 наблюдения.",
chapter:"Изпълнение на конкретната аналитична глава.",
completed:"Стъпката е завършена. Резултатите са от действително изпълнен Python."
};
const terminal=new Map(),$=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>[...r.querySelectorAll(q)];
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
function init(){
 if(!gsap||reduced)return;
 if(window.ScrollTrigger)gsap.registerPlugin(window.ScrollTrigger);
 const st=window.ScrollTrigger;
 const timed=gsap.timeline({defaults:{ease:"power3.out"}});
 const cover=$(".cover");
 if(cover){
  timed.fromTo(".site-header",{opacity:0,y:-23},{opacity:1,y:0,duration:.62})
  .fromTo(".cover-eyebrow",{opacity:0,y:23},{opacity:1,y:0,duration:.6},"-=.22")
  .fromTo(".cover .motion-title-line",{opacity:0,y:75,filter:"blur(10px)"},
     {opacity:1,y:0,filter:"blur(0px)",duration:1.03,stagger:.18,clearProps:"filter",ease:"expo.out"},"-=.15")
  .fromTo(".cover-lede",{opacity:0,y:20},{opacity:1,y:0,duration:.75},"-=.54")
  .fromTo(".cover-actions a",{opacity:0,y:17},{opacity:1,y:0,duration:.65,stagger:.12},"-=.51")
  .fromTo(".academy-brand.hero-academy",{opacity:0,y:18,scale:.93},
    {opacity:1,y:0,scale:1,duration:.75},"-=.48")
  .fromTo(".cover-bottom > *",{opacity:0,y:12},{opacity:1,y:0,duration:.68,stagger:.12},"-=.38");
  gsap.fromTo(".cover-art",{opacity:0,scale:.82,rotate:-9},
    {opacity:.85,scale:1,rotate:0,duration:1.6,delay:.3,ease:"power2.out"});
  gsap.fromTo(".float-chip",{opacity:0,y:25,scale:.83},
    {opacity:1,y:0,scale:1,duration:.78,stagger:.18,delay:1.23,ease:"back.out(1.25)"});
 }
 if(!st)return;
 for(const element of $$(".intro-grid > *, .research-intro-row > *, .chapter-head > *, .chapter-explain > p, .method-note, .execute-card, .conclusion-grid > *, .final-cta > *, .stat-ribbon > div")){
   gsap.fromTo(element,{opacity:0,y:31},{
     opacity:1,y:0,duration:.88,ease:"power3.out",clearProps:"opacity,transform",
     scrollTrigger:{trigger:element,start:"top 94%",once:true}
   });
 }
 st.create({trigger:".cover",start:"top top",end:"bottom top",scrub:.8,animation:gsap.to(".cover-noise",{yPercent:13,ease:"none",paused:true})});
 for(const c of $$(".chapter")){
  st.create({trigger:c,start:"top 62%",end:"bottom 38%",
   onEnter:()=>c.classList.add("focused"),onLeave:()=>c.classList.remove("focused"),
   onEnterBack:()=>c.classList.add("focused"),onLeaveBack:()=>c.classList.remove("focused")});
 }
}
function make(step){
 let el=terminal.get(step);
 if(!el){
  const host=$('[data-panel="'+(step==="all"?"quality":step)+'"]');
  if(!host)return null;
  el=document.createElement("section");
  el.className="execution-terminal";
  el.setAttribute("aria-label","Python терминал — "+(names[step]||step));
  el.innerHTML=[
   '<div class="terminal-toolbar">',
   '<span class="terminal-dots" aria-hidden="true"><i></i><i></i><i></i></span>',
   '<span class="terminal-title">python3 · shopdirect/'+step+'</span>',
   '<span class="terminal-badge">IDLE</span></div>',
   '<div class="terminal-body" role="log" aria-live="polite" aria-relevant="additions"></div>',
   '<div class="terminal-explain"><strong>Пояснение</strong> · <span class="explain-text"></span></div>',
   '<div class="terminal-status"></div>'
  ].join("");
  $(".execute-top",host).insertAdjacentElement("afterend",el);
  terminal.set(step,el);
 }
 el.hidden=false;
 return el;
}
function add(el,event,kind=""){
 const body=$(".terminal-body",el),row=document.createElement("div");
 row.className="terminal-line "+kind;
 const stamp=document.createElement("span"),prompt=document.createElement("span"),message=document.createElement("span");
 stamp.className="stamp";stamp.textContent="["+Number(event.at||0).toFixed(3).padStart(7,"0")+"s]";
 prompt.className="prompt";prompt.textContent=kind==="error"?"✕":kind==="success"?"✓":"›";
 message.textContent=event.message||"";
 row.append(stamp,prompt,message);body.append(row);body.scrollTop=body.scrollHeight;
 $(".explain-text",el).textContent=explains[event.stage]||"Реално регистриран етап от изпълнението.";
 if(gsap&&!reduced)gsap.fromTo(row,{opacity:0,y:9},{opacity:1,y:0,duration:.25,ease:"power2.out"});
}
function begin(step){
 const el=make(step);if(!el)return;
 el.classList.remove("success","error");
 $(".terminal-body",el).replaceChildren();
 $(".terminal-badge",el).textContent="RUNNING";
 $(".terminal-status",el).textContent="Очакване на Python API · сървърните събития ще се покажат след отговора.";
 add(el,{at:0,stage:"request",message:"POST /api/run → step="+step+" · awaiting real Python response"},"note");
 $(".explain-text",el).textContent="Заявката е изпратена; показаните времена ще бъдат върнати от Python, а не измислени в браузъра.";
 if(gsap&&!reduced)gsap.fromTo(el,{opacity:.4,height:0},{opacity:1,height:"auto",duration:.55,ease:"power3.out"});
 if(step!=="all"&&el.getBoundingClientRect().bottom>innerHeight){
   el.scrollIntoView({behavior:reduced?"auto":"smooth",block:"center"});
 }
}
async function replay(step,payload){
 const el=make(step);if(!el)return;
 const trace=Array.isArray(payload.trace)?payload.trace:[];
 $(".terminal-status",el).textContent="Python приключи · възпроизвеждане на действителния сървърен запис.";
 const delay=reduced?0:Math.max(55,Math.min(160,1950/Math.max(1,trace.length)));
 for(const event of trace){add(el,event,event.stage==="completed"?"success":"");if(delay)await sleep(delay)}
 if(!trace.length)add(el,{at:payload.elapsed_seconds,stage:"completed",message:"Python приключи успешно."},"success");
 el.classList.add("success");
 $(".terminal-badge",el).textContent="SUCCESS";
 $(".terminal-status",el).textContent="✓ Verified execution · "+Number(payload.elapsed_seconds||0).toFixed(3)+" s · api/run.py";
 $(".explain-text",el).textContent="Изчисленията завършиха. Следва визуализация на обобщените резултати, върнати от сървъра.";
}
function fail(step,error){
 const el=terminal.get(step);if(!el)return;
 add(el,{at:0,stage:"error",message:error?.message||"Неуспешно изпълнение."},"error");
 el.classList.add("error");$(".terminal-badge",el).textContent="ERROR";
 $(".terminal-status",el).textContent="Текущото изпълнение не е потвърдено; предишните стойности може да са референтни.";
}
function revealResult(step){
 const stage=$("#result-"+step);
 if(!gsap||reduced||!stage)return;
 gsap.fromTo(stage,{opacity:.45,y:17},{opacity:1,y:0,duration:.64,ease:"power3.out",clearProps:"transform,opacity"});
 const bars=$$(".bar-track i, .odd-track i",stage);
 gsap.fromTo(bars,{scaleX:0,transformOrigin:"left center"},{scaleX:1,duration:1,stagger:.06,ease:"power3.out",clearProps:"transform"});
 const path=$(".roc-chart",stage);
 if(path){$$("path",path).forEach(p=>{if(typeof p.getTotalLength!=="function")return;const length=p.getTotalLength();if(!length)return;
  gsap.fromTo(p,{strokeDasharray:length,strokeDashoffset:length},
    {strokeDashoffset:0,duration:1.5,ease:"power2.inOut",clearProps:"strokeDasharray,strokeDashoffset"})})}
 if(window.ScrollTrigger)window.ScrollTrigger.refresh();
}
function initRunControls(){
 document.addEventListener("input",e=>{
  if(e.target.id==="target-range"&&gsap&&!reduced){
   gsap.fromTo(".sim-metrics strong, #target-hits",{opacity:.5,scale:.91},{opacity:1,scale:1,duration:.36,ease:"power3.out"});
  }
 });
}
window.ShopDirectMotion={begin,replay,fail,revealResult};
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",()=>{init();initRunControls()},{once:true})}
else{init();initRunControls()}
})();