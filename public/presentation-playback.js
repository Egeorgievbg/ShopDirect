/* ShopDirect · accessible, browser-native Bulgarian narration & autoplay. */
(()=>{"use strict";
const $=s=>document.querySelector(s);
const slides=[...document.querySelectorAll(".slide")];
if(!slides.length)return;
const speech=window.speechSynthesis;
const supported=!!(speech&&window.SpeechSynthesisUtterance);
let active=0,auto=true,sound=true,playing=true,speed=1,token=0,timer=null,utterance=null,started=false,voices=[];
const names=["Въведение","Маркетингов проблем","Клиентски данни","Ключови зависимости","Прогнозни модели","Сравнение ROC","Таргетиране","Изводи и препоръки"];
const note=i=>slides[i]?.dataset.note||"";
const delay=i=>Math.max(8500,Math.min(37000,Math.round(note(i).split(/\s+/).length*450+3100)));
function current(){let v=Number(location.hash.slice(1));return Number.isInteger(v)&&v>0&&v<=slides.length?v-1:0;}
function clear(){token++;if(timer){clearTimeout(timer);timer=null}if(supported){try{speech.cancel()}catch(_){}}utterance=null;}
function next(){if(active>=slides.length-1){playing=false;refresh();return}const btn=document.querySelectorAll(".dock-step")[active+1];btn?.click();}
function chooseVoice(){voices=speech?.getVoices?.()||[];return voices.find(v=>v.lang.toLowerCase()==="bg-bg")||voices.find(v=>v.lang.toLowerCase().startsWith("bg"))||null;}
function refresh(){
 const play=$("#playback-toggle"),audio=$("#playback-audio"),repeat=$("#playback-repeat"),status=$("#playback-status");
 if(play){play.textContent=playing&&auto?"⏸":"▶";play.title=playing&&auto?"Пауза на автоматичното представяне":"Пусни автоматичното представяне";play.setAttribute("aria-label",play.title);play.setAttribute("aria-pressed",String(playing&&auto))}
 if(audio){audio.textContent=sound?"🔊":"🔇";audio.title=sound?"Изключи озвучаването":"Включи озвучаването";audio.setAttribute("aria-pressed",String(sound))}
 if(repeat)repeat.title="Прочети слайда отново";
 if(status)status.textContent=!playing?"Пауза":sound&&supported?"Автоматично · глас":"Автоматично · без звук";
}
function schedule(ms,id){timer=setTimeout(()=>{if(id!==token||!playing||!auto||document.hidden)return;next()},ms)}
function speak(){
 clear();refresh();
 if(!started||!playing||!auto||document.hidden)return;
 const id=token;
 if(!sound||!supported){schedule(delay(active),id);return;}
 const voice=chooseVoice();
 const u=new SpeechSynthesisUtterance(note(active));
 u.lang="bg-BG";u.rate=speed;u.pitch=1;u.volume=1;
 if(voice)u.voice=voice;
 utterance=u;
 u.onend=()=>{if(id===token&&playing&&auto)schedule(1400,id)};
 u.onerror=()=>{if(id===token&&playing&&auto)schedule(delay(active),id)};
 try{speech.speak(u);timer=setTimeout(()=>{if(id!==token)return;if(!speech.speaking&&!speech.pending)schedule(delay(active),id)},1800)}
 catch(_){schedule(delay(active),id)}
}
function controls(){
 const dock=$(".cinema-dock .dock-right");if(!dock)return;
 const wrap=document.createElement("div");wrap.className="playback-controls";
 wrap.innerHTML='<button type="button" class="playback-btn" id="playback-toggle" aria-label="Пауза" aria-pressed="true">⏸</button>'+
 '<button type="button" class="playback-btn" id="playback-audio" aria-label="Изключи озвучаването" aria-pressed="true">🔊</button>'+
 '<button type="button" class="playback-btn playback-repeat" id="playback-repeat" aria-label="Повтори озвучаването">↻</button>'+
 '<label class="playback-rate-label" for="playback-rate">Скорост</label><select id="playback-rate" class="playback-rate" aria-label="Скорост на гласа"><option value="0.85">0.85×</option><option value="1" selected>1×</option><option value="1.15">1.15×</option><option value="1.3">1.3×</option></select>'+
 '<span id="playback-status" class="playback-status" role="status" aria-live="polite"></span>';
 dock.insertBefore(wrap,$("#next"));
 $("#playback-toggle").addEventListener("click",()=>{started=true;playing=!playing;auto=true;speak()});
 $("#playback-audio").addEventListener("click",()=>{started=true;sound=!sound;playing=true;auto=true;speak()});
 $("#playback-repeat").addEventListener("click",()=>{started=true;playing=true;auto=true;speak()});
 $("#playback-rate").addEventListener("change",e=>{speed=Number(e.target.value)||1;started=true;speak()});
 if(!supported){$("#playback-audio").disabled=true;$("#playback-audio").title="Браузърът не поддържа гласово прочитане"}
 refresh();
}
function init(){
 controls();active=current();
 if(supported){speech.addEventListener?.("voiceschanged",chooseVoice);chooseVoice()}
 window.addEventListener("shopdirect:slidechange",e=>{active=e.detail.index;if(started)speak()});
 // Initial autoplay is enabled; when onboarding exists, its start action unlocks browser audio.
 const intro=$("#cinema-intro");
 const start=()=>{started=true;playing=true;auto=true;setTimeout(speak,100)};
 $("#intro-start")?.addEventListener("click",start);
 $("#intro-close")?.addEventListener("click",start);
 intro?.addEventListener("pointerdown",e=>{if(e.target===intro)start()});
 // Previously dismissed intro: try autoplay, but browsers may require a click to unlock speech.
 if(!intro||intro.hidden){started=true;setTimeout(speak,280)}
 document.addEventListener("visibilitychange",()=>{if(document.hidden){clear()}else if(started&&playing)speak()});
 document.addEventListener("keydown",e=>{
  if(e.target.closest("input,select,textarea,button,[contenteditable]")||!$("#cinema-intro")?.hidden)return;
  if(e.key.toLowerCase()==="p"){e.preventDefault();$("#playback-toggle").click()}
  if(e.key.toLowerCase()==="m"){e.preventDefault();$("#playback-audio").click()}
  if(e.key.toLowerCase()==="r"){e.preventDefault();$("#playback-repeat").click()}
 });
 // Browsers can suspend speech during long slide narration; keep it running when visible.
 setInterval(()=>{if(started&&playing&&sound&&supported&&speech.paused&&!document.hidden)try{speech.resume()}catch(_){}},5000);
 window.addEventListener("pagehide",clear);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
})();