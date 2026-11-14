/* ShopDirect | Seven motion infographics. No image API, paid generation or invented customer-level predictions. */
(()=>{"use strict";
const $=(q,root=document)=>root.querySelector(q), $$=(q,root=document)=>[...root.querySelectorAll(q)];
const SVG="http://www.w3.org/2000/svg",reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
const f=(n,d=1)=>Number(n).toLocaleString("bg-BG",{minimumFractionDigits:d,maximumFractionDigits:d});
const timeSafe=()=>Date.now();
const scenarios=[
 {share:.10,contacts:20,positive:16,rate:.8,lift:2.4242424242,capture:16/66},
 {share:.20,contacts:40,positive:31,rate:.775,lift:2.3484848485,capture:31/66},
 {share:.30,contacts:60,positive:37,rate:37/60,lift:1.8686868687,capture:37/66},
 {share:.40,contacts:80,positive:44,rate:.55,lift:1.6666666667,capture:44/66},
 {share:.50,contacts:100,positive:49,rate:.49,lift:1.4848484848,capture:49/66}
];
const make=(tag,attrs={},text)=>{
 const el=document.createElementNS(SVG,tag);
 for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));
 if(text!=null)el.textContent=text;
 return el;
};
function svgFrame(width,height,label){
 const root=make("svg",{viewBox:"0 0 "+width+" "+height,class:"viz-svg",role:"img","aria-label":label,preserveAspectRatio:"xMidYMid meet"});
 return root;
}
function line(svg,x1,y1,x2,y2,color="#ba93e9",width=2){
 const p=make("line",{x1,y1,x2,y2,stroke:color,"stroke-width":width});
 svg.append(p);return p;
}
function text(svg,x,y,value,size=15,color="#f4eaff",weight=600,anchor="start"){
 svg.append(make("text",{x,y,fill:color,"font-size":size,"font-weight":weight,"text-anchor":anchor},value));
}
function circle(svg,cx,cy,r,fill,extra={}){
 const c=make("circle",{cx,cy,r,fill,...extra});svg.append(c);return c;
}
function path(svg,d,stroke="#bb8aff",width=3,fill="none"){
 const el=make("path",{d,stroke,"stroke-width":width,fill,"stroke-linecap":"round","stroke-linejoin":"round"});svg.append(el);return el;
}
function head(host,label,status="DATA VISUAL / SVG"){
 host.innerHTML="";
 const top=document.createElement("div");top.className="viz-top";
 const title=document.createElement("span");title.textContent=label;
 const badge=document.createElement("span");badge.className="viz-tag";badge.textContent=status;
 top.append(title,badge);host.append(top);
}
function foot(host,message){
 const p=document.createElement("p");p.className="viz-foot";p.textContent=message;host.append(p);
}
function statCard(label,value){
 const el=document.createElement("div");el.className="viz-card";
 const b=document.createElement("b");b.textContent=value;
 const small=document.createElement("small");small.textContent=label;
 el.append(b,small);return el;
}
function buildDecision(){
 const host=$("#viz-decision");if(!host)return;
 head(host,"01 / BUSINESS QUESTION","СХЕМА НА РЕШЕНИЕТО");
 const stages=[
  {number:"01",name:"Клиентска аудитория",detail:"Налични исторически данни",kind:"audience"},
  {number:"02",name:"Прогнозен модел",detail:"Вероятност за положителен отговор",kind:"model"},
  {number:"03",name:"Приоритетна група",detail:"Ред за контакт в пилотната кампания",kind:"priority"}
 ];
 const flow=document.createElement("div");flow.className="viz-decision-flow";
 flow.setAttribute("role","list");flow.setAttribute("aria-label","Три етапа на маркетинговото решение");
 stages.forEach((stage,i)=>{
  const el=document.createElement("article");el.className="viz-decision-node viz-decision-"+stage.kind;
  el.setAttribute("role","listitem");
  const num=document.createElement("span");num.className="viz-decision-index";num.textContent=stage.number;
  const title=document.createElement("strong");title.className="viz-decision-heading";title.textContent=stage.name;
  const sub=document.createElement("p");sub.className="viz-decision-detail";sub.textContent=stage.detail;
  el.append(num,title,sub);flow.append(el);
  if(i<stages.length-1){
   const connector=document.createElement("span");connector.className="viz-decision-connector";connector.setAttribute("aria-hidden","true");connector.textContent="→";flow.append(connector);
  }
 });
 host.append(flow);
 foot(host,"Концептуална схема на приоритизирането. Не се приписват индивидуални прогнози на конкретни клиенти.");
}
function buildMatrix(){
 const host=$("#viz-customer-matrix");if(!host)return;
 head(host,"02 / DATASET","800 РЕАЛНИ НАБЛЮДЕНИЯ");
 const numbers=document.createElement("div");numbers.className="viz-cards";
 numbers.append(statCard("Всички наблюдения","800"),statCard("Положителни отговора","264"),statCard("Отрицателни отговора","536"));
 host.append(numbers);
 const matrix=document.createElement("div");matrix.className="viz-matrix";
 matrix.setAttribute("role","img");matrix.setAttribute("aria-label","800 клетки: 264 положителни и 536 отрицателни отговора. Визуализация на агрегирани броеве.");
 // Deterministic permutation for editorial distribution, not a reconstruction of customer order/IDs.
 for(let i=0;i<800;i++){
  const slot=(i*317)%800;const el=document.createElement("i");
  el.className=slot<264?"positive":"negative";
  el.setAttribute("aria-hidden","true");matrix.append(el);
 }
 host.append(matrix);
 const legend=document.createElement("div");legend.className="viz-legend";
 legend.innerHTML='<span><i></i> Yes · 264 (33%)</span><span><i class="neg"></i> No · 536 (67%)</span>';
 legend.style.marginTop="15px";host.append(legend);
 foot(host,"Една клетка = един запис като агрегирано представяне. Позициите са декоративно разпределени, не са индивидуални клиентски данни.");
}
function buildLoyalty(){
 const host=$("#viz-loyalty");if(!host)return;
 head(host,"03 / DESCRIPTIVE ANALYSIS","АСОЦИАЦИЯ ≠ ПРИЧИННОСТ");
 const split=document.createElement("div");split.className="viz-split";
 const left=document.createElement("div");left.className="viz-column";
 const a=[{label:"Членове на програмата",n:42.54,css:""},{label:"Без членство",n:25.11,css:"secondary"}];
 for(const item of a){
  const bar=document.createElement("div");bar.className="viz-barrow";
  const row=document.createElement("div");row.className="viz-data-row";
  const title=document.createElement("strong");title.textContent=item.label;
  const v=document.createElement("span");v.textContent=f(item.n)+"%";row.append(title,v);
  const track=document.createElement("div");track.className="viz-bartrack";
  const fill=document.createElement("i");fill.className="viz-barfill "+item.css;fill.style.setProperty("--fill",item.n+"%");track.append(fill);
  bar.append(row,track);left.append(bar);
 }
 const right=document.createElement("div");right.className="viz-compare";
 right.innerHTML='<div><small>Лоялни</small><strong>42,5%</strong></div><div><small>Разлика</small><strong>+17,4 п.п.</strong></div>';
 split.append(left,right);host.append(split);
 foot(host,"Дялове Yes по групи. Това са наблюдавани асоциации; от сравнението не следва, че членството причинява по-висок отговор.");
}
function buildPipeline(){
 const host=$("#viz-ml-flow");if(!host)return;
 head(host,"04 / REPRODUCIBLE PYTHON","TRAIN → VALIDATE → TEST");
 const flow=document.createElement("div");flow.className="viz-flow";
 for(const c of [{v:"800",t:"Наблюдения"},{v:"600 / 200",t:"Train / test"},{v:"5-FOLD",t:"CV само в train"}]){
  const el=document.createElement("div");el.className="viz-flow-node";
  const strong=document.createElement("b");strong.textContent=c.v;
  const sub=document.createElement("span");sub.textContent=c.t;
  el.append(strong,sub);flow.append(el);
 }
 host.append(flow);
 const lanes=document.createElement("div");lanes.className="viz-model-lanes";
 const lr=document.createElement("div");lr.innerHTML='<strong>LR / Logistic</strong><small>Стандартизиране + линейна вероятностна класификация</small>';
 const rf=document.createElement("div");rf.innerHTML='<strong>RF / 250 trees</strong><small>Ансамбъл от решаващи дървета</small>';
 lanes.append(lr,rf);host.append(lanes);
 foot(host,"Еднакъв стратифициран split 75/25, random_state=42, петкратна кръстосана проверка само в обучаващите данни.");
}
function buildRoc(){
 const host=$("#viz-roc");if(!host)return;
 head(host,"05 / ROC PERFORMANCE","ДАННИ ОТ PYTHON API");
 const panel=document.createElement("div");panel.className="viz-roc-chart";
 const initial=document.createElement("p");initial.className="viz-foot";initial.textContent="Натиснете бутона, за да изчислим реалните ROC координати от вградения CSV. Не показваме измислена примерна крива.";
 const btn=document.createElement("button");btn.className="viz-action";btn.type="button";btn.textContent="▶ Изчисли ROC с Python";
 const status=document.createElement("p");status.className="viz-foot";status.setAttribute("role","status");
 btn.addEventListener("click",()=>runRoc(btn,panel,status));
 panel.append(initial,btn,status);host.append(panel);
 foot(host,"Python: logistic vs random forest · тестова извадка 200 клиента · 95% bootstrap интервал за разликата.");
}
function curve(points){
 return points.map((pair,i)=>(i?"L":"M")+(55+pair[0]*530).toFixed(2)+" "+(310-pair[1]*260).toFixed(2)).join(" ");
}
async function runRoc(button,panel,status){
 button.disabled=true;status.textContent="Python изчислява ROC и paired bootstrap…";
 try{
  const result=await postPython("comparison");
  const data=result.result, l=data?.logistic?.roc, r=data?.forest?.roc;
  if(!Array.isArray(l)||!Array.isArray(r)||!l.length||!r.length)throw Error("Липсват валидни ROC данни.");
  if(!(data.logistic.test_auc>0&&data.forest.test_auc>0))throw Error("Невалидни ROC AUC стойности.");
  const svg=svgFrame(650,365,"Действителни ROC криви от Python: Logistic AUC "+f(data.logistic.test_auc,3)+", Random Forest AUC "+f(data.forest.test_auc,3));
  const frame=make("rect",{x:55,y:50,width:530,height:260,rx:8,fill:"#140c27",stroke:"#74539d"});
  svg.append(frame);
  for(let i=0;i<=5;i++){line(svg,55,50+i*52,585,50+i*52,"#755a943c",1);line(svg,55+i*106,50,55+i*106,310,"#755a943c",1)}
  path(svg,"M55 310L585 50","#79618e",2).setAttribute("stroke-dasharray","5 7");
  const p1=path(svg,curve(l),"#cf9bff",4),p2=path(svg,curve(r),"#6a9cff",3);
  text(svg,55,30,"ROC / TEST SET",12,"#d1b8f5",800);
  text(svg,55,347,"False positive rate →",12,"#cdb8e5");
  text(svg,10,175,"TPR",12,"#cdb8e5");
  text(svg,585,340,"1.0",11,"#d1b8f5",600,"end");
  const legend=document.createElement("div");legend.className="viz-legend";
  legend.innerHTML='<span><i style="background:#cf9bff"></i> Logistic · AUC '+f(data.logistic.test_auc,3)+'</span><span><i style="background:#6a9cff"></i> RF · AUC '+f(data.forest.test_auc,3)+'</span>';
  panel.replaceChildren(svg,legend);
  const conf=document.createElement("p");conf.className="viz-foot";
  const ci=data.difference_bootstrap_95;
  conf.textContent=Array.isArray(ci)?"Разлика AUC "+f(data.auc_difference,3)+" · 95% bootstrap CI ["+f(ci[0],3)+"; "+f(ci[1],3)+"].":"";
  panel.append(conf);status.textContent="";
  animatePaths([p1,p2]);
 }catch(error){status.classList.add("viz-error");status.textContent="Изчислението не е потвърдено: "+String(error.message||error).slice(0,160);button.disabled=false}
}
function buildTargeting(){
 const host=$("#viz-targeting");if(!host)return;
 head(host,"06 / TARGETING LAB","РЕТРОСПЕКТИВНИ СЦЕНАРИИ");
 const choices=document.createElement("div");choices.className="viz-scenarios";
 const info=document.createElement("div");info.className="viz-cards";
 const track=document.createElement("div");track.className="viz-progress";const bar=document.createElement("i");track.append(bar);
 const desc=document.createElement("p");desc.className="viz-foot";
 let available=scenarios.slice();
 function render(s){
  info.replaceChildren(statCard("Контакти",String(s.contacts)),statCard("Yes в теста",String(s.positive)),statCard("Lift",f(s.lift,2)+"×"));
  bar.style.width=s.share*100+"%";
  desc.textContent="Response rate "+f(s.rate*100,1)+"% · Capture "+f(s.capture*100,1)+"% · база 33%. Ретроспективна тестова оценка, не гарантиран ROI.";
  $$("button",choices).forEach(btn=>{const active=Number(btn.dataset.share)===s.share;btn.classList.toggle("selected",active);btn.setAttribute("aria-pressed",String(active))});
  if(window.gsap&&!reduced){
   window.gsap.fromTo($$("b",info),{opacity:.4,y:10},{opacity:1,y:0,duration:.4,stagger:.05});
   window.gsap.to(bar,{width:s.share*100+"%",duration:.5,ease:"power2.out"});
  }
 }
 for(const s of scenarios){
  const btn=document.createElement("button");btn.className="viz-choice";btn.type="button";
  btn.dataset.share=String(s.share);btn.textContent=Math.round(s.share*100)+"%";btn.addEventListener("click",()=>render(available.find(x=>x.share===s.share)||s));choices.append(btn);
 }
 const verify=document.createElement("button");verify.className="viz-action";verify.type="button";verify.textContent="Провери с Python API";
 const status=document.createElement("p");status.className="viz-foot";status.setAttribute("role","status");
 verify.addEventListener("click",async()=>{
  verify.disabled=true;status.textContent="Python преизчислява петте сценария…";
  try{
   const res=await postPython("targeting");
   if(!Array.isArray(res.result?.scenarios)||res.result.scenarios.length!==5)throw Error("Невалидни сценарии.");
   available=res.result.scenarios.map(x=>({share:x.share,contacts:x.contacts,positive:x.historical_yes,rate:x.rate,lift:x.lift,capture:x.capture}));
   const current=$(".viz-choice.selected",choices);
   render(available.find(x=>Math.abs(x.share-Number(current?.dataset.share||.3))<.0001)||available[2]);
   status.textContent="✓ Стойностите са актуално преизчислени със scikit-learn за "+f(res.elapsed_seconds,2)+" сек.";
  }catch(error){status.classList.add("viz-error");status.textContent="Проверката не успя: "+String(error.message||error).slice(0,140)}
  finally{verify.disabled=false}
 });
 host.append(choices,info,track,desc,verify,status);
 render(scenarios[2]);
 const note=document.createElement("p");note.className="viz-foot";note.textContent="Източник: проверени резултати от P3.1 Python анализа; бутонът задейства повторно изчисление.";host.append(note);
}
function buildRoadmap(){
 const host=$("#viz-roadmap");if(!host)return;
 head(host,"07 / MARKETING ACTION PLAN","3 СТЪПКИ");
 const road=document.createElement("div");road.className="viz-roadmap";
 for(const s of [
  {n:"01 / DEFINE",name:"Допустима аудитория",desc:"Актуални данни, валидни основания за контакт, изключения."},
  {n:"02 / EXPERIMENT",name:"Пилот + контрол",desc:"Топ 30% като тестова хипотеза и подходяща контролна група."},
  {n:"03 / MEASURE",name:"Измерване на ефекта",desc:"Допълнителни реализации, разходи и марж; не само response."}
 ]){
  const el=document.createElement("div");el.className="step";
  const num=document.createElement("small");num.textContent=s.n;
  const name=document.createElement("strong");name.textContent=s.name;
  const p=document.createElement("p");p.textContent=s.desc;
  el.append(num,name,p);road.append(el);
 }
 host.append(road);
 foot(host,"Прогнозната склонност за отговор не е доказателство за причинен uplift. Реалният ефект се проверява чрез експеримент.");
}
const cache=new Map();
async function postPython(step){
 if(cache.has(step))return cache.get(step);
 const c=new AbortController(),timer=setTimeout(()=>c.abort(),57000);
 try{
  const response=await fetch("/api/run",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({step}),cache:"no-store",signal:c.signal});
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw Error(data?.error||"HTTP "+response.status);
  if(data?.step!==step)throw Error("Отговорът не съответства на заявената глава.");
  cache.set(step,data);return data;
 }finally{clearTimeout(timer)}
}
function animatePaths(paths){
 if(!window.gsap||reduced)return;
 paths.forEach(p=>{
  const length=p.getTotalLength();
  if(!length)return;
  window.gsap.fromTo(p,{strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,duration:1.75,ease:"power2.inOut",clearProps:"strokeDasharray,strokeDashoffset"});
 });
}
function animateForSlide(slide){
 if(!slide||!window.gsap||reduced)return;
 const g=window.gsap;
 const shell=$(".viz-shell",slide);if(!shell)return;
 g.fromTo(shell,{opacity:0,y:20,scale:.985},{opacity:1,y:0,scale:1,duration:.8,ease:"power3.out",clearProps:"opacity,transform"});
 const bars=$$(".viz-barfill",shell);bars.forEach(bar=>{
  const width=bar.style.getPropertyValue("--fill");
  g.fromTo(bar,{scaleX:0,transformOrigin:"left center"},{scaleX:1,duration:1.1,delay:.55,ease:"power3.out",clearProps:"transform"});
 });
 const points=$$(".viz-matrix i",shell);
 if(points.length)g.fromTo(points,{opacity:0,scale:.4},{opacity:1,scale:1,duration:.4,stagger:{amount:1.4,from:"random"},delay:.2,clearProps:"opacity,transform"});
 const steps=$$(".viz-roadmap .step",shell);
 if(steps.length)g.fromTo(steps,{y:25,opacity:0},{y:0,opacity:1,duration:.65,stagger:.17,delay:.5,clearProps:"transform,opacity"});
}
function init(){
 buildDecision();buildMatrix();buildLoyalty();buildPipeline();buildRoc();buildTargeting();buildRoadmap();
 $$(".slide").forEach(slide=>{
  new MutationObserver(()=>{if(slide.classList.contains("active"))animateForSlide(slide)})
    .observe(slide,{attributes:true,attributeFilter:["class"]});
 });
 animateForSlide($(".slide.active"));
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();