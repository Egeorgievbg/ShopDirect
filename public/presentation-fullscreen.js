/* ShopDirect — fullscreen slideshow with ElevenLabs voiceover and captions. */
(()=>{"use strict";
const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>Array.from(r.querySelectorAll(q));
const tracks=[
{duration:24.16,id:"4l0jR2gzUcFqyaX2UAEE",url:"https://elevenlabsusercontent.com/database/workspace/f3cc319fb4e4422fbb0da2ba98f659e1/content_generation/tEEznlBk1Drpt3nRaQdA/LVckhID80OjjwnFnwrWJ/content.mp3?Expires=1794618000&KeyName=assets-cdn-key-1&Signature=qm7_4i7a2Rx5Civ2-UY7cHP7HWw=",cues:["Здравейте! Аз съм Илияна Цанова.","Представям анализа за ShopDirect.","800 наблюдения и два прогнозни модела.","От данни към маркетингово решение."]},
{duration:19.12,id:"UNa8QEuLXjTAeMz6t75D",url:"https://elevenlabsusercontent.com/database/workspace/f3cc319fb4e4422fbb0da2ba98f659e1/content_generation/U1JINuS9YbLcPaMeVk0I/D1tjtpGPkGc06jkQkz2B/content.mp3?Expires=1794618000&KeyName=assets-cdn-key-1&Signature=xVcbo6A2pPov2UwJWnD3XGbYgYU=",cues:["Кампания към всички клиенти?","Кого да потърсим първо?","Моделът оценява склонността за отговор.","Прогнозата не доказва причинен ефект."]},
{duration:22.96,id:"JNv4du5HdiraXdVWBVBA",url:"https://elevenlabsusercontent.com/database/workspace/f3cc319fb4e4422fbb0da2ba98f659e1/content_generation/V7OcRM86yAN3gCU84HVC/RB7Ncee1nElvwq8231rQ/content.mp3?Expires=1794618000&KeyName=assets-cdn-key-1&Signature=jX0zRUi61yFZsPXpbCxl0f5YIFc=",cues:["800 клиентски наблюдения.","264 положителни отговора.","Обща честота: 33 процента.","Седем характеристики и нула липсващи стойности."]},
{duration:22.56,id:"XANyTu4GIYQNdqi2r3JS",url:"https://elevenlabsusercontent.com/database/workspace/f3cc319fb4e4422fbb0da2ba98f659e1/content_generation/OyQcan8Y0TcyFQalpe2t/Mr9yOJqOwSnZ1HcfWvhk/content.mp3?Expires=1794618000&KeyName=assets-cdn-key-1&Signature=46QGYJWvHfaN2SaNCR3vv2t6ios=",cues:["Членовете на лоялната програма отговарят по-често.","42,5 процента при лоялните клиенти.","25,1 процента без членство.","Това е асоциация, не доказана причинност."]},
{duration:20.88,id:"WqUKGiYrKdsXwPv06J6d",url:"https://elevenlabsusercontent.com/database/workspace/f3cc319fb4e4422fbb0da2ba98f659e1/content_generation/YFe6Pcf4VXKgFNbFT03f/Ozf23qs9g7HRxctO8DIo/content.mp3?Expires=1794618000&KeyName=assets-cdn-key-1&Signature=FaU2SeJ8V4LlEP7ZP1NIUcaVYZI=",cues:["Два модела: Logistic Regression и Random Forest.","75 процента за обучение.","25 процента за независим тест.","Петкратна кръстосана проверка."]},
{duration:26.8,id:"Na98CiNP6cNugAHw9FOQ",url:"https://elevenlabsusercontent.com/database/workspace/f3cc319fb4e4422fbb0da2ba98f659e1/content_generation/U2ve5kyq9QHtfBVHi8VQ/QQYhx8c6z8ztsF2d4N3F/content.mp3?Expires=1794618000&KeyName=assets-cdn-key-1&Signature=4uHLSBFrAc-8fmAP5DEA0gzEa_c=",cues:["Логистична регресия: AUC 0,774.","Random Forest: AUC 0,756.","Няма доказано статистическо превъзходство.","Реалните ROC криви идват от Python API."]},
{duration:24.56,id:"I4LJ7RoAxHO9YFqamovE",url:"https://elevenlabsusercontent.com/database/workspace/f3cc319fb4e4422fbb0da2ba98f659e1/content_generation/KkKSI8eJNZZQyW4ZWqsx/Va2qn6ebeFEqa0lA5myK/content.mp3?Expires=1794618000&KeyName=assets-cdn-key-1&Signature=_pNQeoXEiTXqgrhdKO6F5jaQC9E=",cues:["Подреждаме клиентите по прогнозна вероятност.","Топ 30 процента са 60 клиента.","37 положителни отговора: 61,7 процента.","Lift 1,87 — пилотна хипотеза."]},
{duration:24.08,id:"uiAxyuk0LQoBUPxq4QW6",url:"https://elevenlabsusercontent.com/database/workspace/f3cc319fb4e4422fbb0da2ba98f659e1/content_generation/VIJmrTiSHGf1npYyWywQ/2581XXgNfLn2ZZC8p1fw/content.mp3?Expires=1794618000&KeyName=assets-cdn-key-1&Signature=GLGWWhfKpgw3gUs_X2DHwOZxtJU=",cues:["Данните подпомагат избора на аудитория.","Пилот с топ 30 процента и контролна група.","Измерваме разходи, реализации и марж.","Проверимо бизнес решение. Благодаря за вниманието!"]}
];
let audio=null,index=0,cue=-1,autoplay=false,captions=true,localObjectUrl=null,playing=false,changeToken=0;
const slides=$$(".slide");
function layout(){
 for(const slide of slides){
  const inner=$(".inner",slide),viz=$(".viz-shell",slide);
  if(!inner||!viz)continue;
  slide.classList.add("slide-visual");
  const story=document.createElement("div"),stage=document.createElement("div");
  story.className="slide-story";stage.className="slide-stage";
  for(const child of Array.from(inner.children)){if(child!==viz)story.append(child)}
  stage.append(viz);inner.append(story,stage);
 }
}
function createPlayer(){
 const panel=document.createElement("section");panel.className="voice-deck";panel.setAttribute("aria-label","Аудиопрезентация");
 panel.innerHTML='<button type="button" class="voice-main" id="voice-toggle" aria-pressed="false">▶ Глас</button>'+
 '<div class="voice-middle"><div class="voice-title" id="voice-title">Илияна · Слайд 1</div><div class="voice-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="voice-progress"></i></div><span class="voice-time" id="voice-clock">00:00</span></div>'+
 '<div class="voice-controls"><button type="button" id="voice-restart">↺</button><button type="button" id="voice-captions" aria-pressed="true">CC</button>'+
 '<button type="button" id="voice-auto" aria-pressed="false">Авто: изкл.</button><label for="voice-file">+ MP3</label><input id="voice-file" class="voice-file" type="file" accept=".mp3,audio/mpeg">'+
 '<button type="button" id="voice-eleven">ElevenLabs ↗</button></div>';
 const subtitle=document.createElement("div");subtitle.id="voice-caption";subtitle.className="voice-caption";subtitle.hidden=true;
 audio=document.createElement("audio");audio.id="voice-audio";audio.preload="metadata";
 document.body.append(panel,subtitle,audio);
}
function fmt(sec){return String(Math.floor(sec/60)).padStart(2,"0")+":"+String(Math.floor(sec%60)).padStart(2,"0")}
function openDb(){return new Promise((res,rej)=>{if(!window.indexedDB)return rej(Error("No storage"));const req=indexedDB.open("shopdirect-p31-voices",1);req.onupgradeneeded=()=>req.result.createObjectStore("mp3");req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)})}
async function savedBlob(i){
 const db=await openDb();return new Promise((res,rej)=>{const tx=db.transaction("mp3","readonly"),req=tx.objectStore("mp3").get(i);req.onsuccess=()=>{db.close();res(req.result||null)};req.onerror=()=>{db.close();rej(req.error)}});
}
async function saveBlob(i,file){
 const db=await openDb();return new Promise((res,rej)=>{const tx=db.transaction("mp3","readwrite");tx.objectStore("mp3").put(file,i);tx.oncomplete=()=>{db.close();res()};tx.onerror=()=>{db.close();rej(tx.error)}});
}
function button(state){playing=state;$("#voice-toggle").textContent=state?"❚❚ Пауза":"▶ Глас";$("#voice-toggle").setAttribute("aria-pressed",String(state));if(!state)$("#voice-caption").hidden=true}
function error(message){$("#voice-title").textContent=message;button(false)}
async function setTrack(i,start){
 const ticket=++changeToken;
 index=i;cue=-1;audio.pause();button(false);audio.removeAttribute("src");audio.load();
 if(localObjectUrl){URL.revokeObjectURL(localObjectUrl);localObjectUrl=null}
 const entry=tracks[index];
 $("#voice-title").textContent="Илияна · Слайд "+String(index+1).padStart(2,"0");
 $("#voice-clock").textContent="00:00 / "+fmt(entry.duration);
 $("#voice-progress").style.width="0%";
 $("#voice-caption").textContent=entry.cues[0];$("#voice-caption").hidden=true;
 let local=null;try{local=await savedBlob(index)}catch(_){}
 if(ticket!==changeToken)return;
 if(local){localObjectUrl=URL.createObjectURL(local);audio.src=localObjectUrl}
 else{
  let published=false;const url="/audio/slide-"+String(index+1).padStart(2,"0")+".mp3";
  try{const reply=await fetch(url,{method:"HEAD"});published=reply.ok&&String(reply.headers.get("content-type")||"").includes("audio")}catch(_){}
  if(ticket!==changeToken)return;
  audio.src=published?url:entry.url;
 }
 audio.load();if(start)audio.play().catch(()=>error("Натиснете ▶, за да продължите с гласа."));
}
function revealCue(){
 if(!audio)return;
 const recording=tracks[index],seconds=audio.currentTime||0,duration=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:recording.duration;
 const progress=Math.min(1,seconds/duration);
 $("#voice-clock").textContent=fmt(seconds)+" / "+fmt(duration);
 $("#voice-progress").style.width=Math.round(progress*100)+"%";
 $(".voice-track").setAttribute("aria-valuenow",String(Math.round(progress*100)));
 const next=Math.min(3,Math.floor(progress*4));if(next===cue)return;
 cue=next;const sub=$("#voice-caption");sub.textContent=recording.cues[cue];sub.hidden=!playing||!captions;
 const active=slides[index];if(!active)return;active.dataset.voiceCue=String(cue);
 if(!window.gsap||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
 const targets=cue===0?$$(".slide-story .label, .slide-story .headline",active):cue===1?$$(".viz-card, .viz-barrow, .viz-model-lanes > div",active):cue===2?$$(".viz-shell .viz-tag, .viz-roadmap .step",active):$$(".viz-foot, .slide-story .takeaway",active);
 if(targets.length)window.gsap.fromTo(targets,{y:10,opacity:.65},{y:0,opacity:1,duration:.43,stagger:.055,clearProps:"transform,opacity"});
}
function mountEvents(){
 $("#voice-toggle").addEventListener("click",async()=>{if(audio.paused){try{await audio.play()}catch(_){error("MP3 е недостъпен: отворете ElevenLabs или добавете файл.")}}else audio.pause()});
 $("#voice-restart").addEventListener("click",()=>{audio.currentTime=0;audio.play().catch(()=>error("MP3 е недостъпен."))});
 $("#voice-captions").addEventListener("click",()=>{captions=!captions;$("#voice-captions").setAttribute("aria-pressed",String(captions));$("#voice-caption").hidden=!playing||!captions});
 $("#voice-auto").addEventListener("click",()=>{autoplay=!autoplay;$("#voice-auto").textContent=autoplay?"Авто: вкл.":"Авто: изкл.";$("#voice-auto").setAttribute("aria-pressed",String(autoplay))});
 $("#voice-eleven").addEventListener("click",()=>window.open("https://elevenlabs.io/app/flows/"+tracks[index].id,"_blank","noopener,noreferrer"));
 $("#voice-file").addEventListener("change",async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(!/\.mp3$/i.test(file.name)||file.size>25*1024*1024){error("Нужен е MP3 до 25 MB.");return}
  try{await saveBlob(index,file);await setTrack(index,false);$("#voice-title").textContent="✓ MP3 е запазен в този браузър."}catch(_){error("Неуспешно запазване на MP3.")}
  e.target.value="";
 });
 audio.addEventListener("play",()=>{button(true);cue=-1;revealCue()});
 audio.addEventListener("pause",()=>button(false));
 audio.addEventListener("timeupdate",revealCue);
 audio.addEventListener("loadedmetadata",revealCue);
 audio.addEventListener("error",()=>error("Аудиолинкът е недостъпен. Използвайте + MP3 или ElevenLabs."));
 audio.addEventListener("ended",()=>{button(false);if(autoplay&&index<slides.length-1)$("#next").click()});
 let was=-1;
 for(let i=0;i<slides.length;i++){new MutationObserver(()=>{
  if(!slides[i].classList.contains("active")||was===i)return;
  was=i;
  if(innerWidth<=980)window.scrollTo({top:0,behavior:"instant"});
  setTrack(i,autoplay).catch(()=>error("Неуспешно зареждане."));
 }).observe(slides[i],{attributes:true,attributeFilter:["class"]})}
 window.addEventListener("beforeprint",()=>audio.pause());
 window.addEventListener("pagehide",()=>audio.pause());
}
function init(){layout();createPlayer();mountEvents();const active=slides.findIndex(s=>s.classList.contains("active"));setTrack(Math.max(0,active),false).catch(()=>error("Неуспешно зареждане."))}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();