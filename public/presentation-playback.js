/* ShopDirect presentation: local recorded voiceovers first, browser TTS fallback.
   Supply files at /audio/slide-01.mp3 .. slide-08.mp3 and optional /audio/slide-01.vtt etc.
   Caption progress for recordings uses actual media clock, fallback timing is approximate. */
(()=>{"use strict";
const $=s=>document.querySelector(s);
const slides=[...document.querySelectorAll(".slide")];
if(slides.length!==8)return;
const synth=window.speechSynthesis;
const canSpeak=!!(synth&&window.SpeechSynthesisUtterance);
const media=new Audio();media.preload="auto";media.setAttribute("playsinline","");
let index=0,auto=true,muted=false,playing=true,started=false,rate=1,seq=0,timer=0,mode="idle",utterance=null,captionItems=[],captionOffset=0,vttAbort=null;
const pad=n=>String(n+1).padStart(2,"0");
const note=i=>slides[i]?.dataset.note||"";
const fallbackDuration=i=>Math.max(8,Math.min(45,note(i).split(/\s+/).length*.42+3));
const activeIndex=()=>{let n=parseInt(location.hash.slice(1),10);return Number.isInteger(n)&&n>=1&&n<=8?n-1:0};
function cancel(){seq++;clearTimeout(timer);timer=0;media.pause();media.onended=null;media.onerror=null;media.ontimeupdate=null;if(canSpeak)try{synth.cancel()}catch(_){};utterance=null;if(vttAbort)vttAbort.abort();vttAbort=null}
function next(){if(index===7){playing=false;render();return}document.querySelectorAll(".dock-step")[index+1]?.click()}
function schedule(ms,id){clearTimeout(timer);timer=setTimeout(()=>{if(seq===id&&playing&&auto&&!document.hidden)next()},ms)}
const chunks=text=>text.match(/[^.!?;:]+[.!?;:]?/g)?.map(s=>s.trim()).filter(Boolean)||[text];
function estimated(text,duration){const phrases=chunks(text);const weights=phrases.map(s=>Math.max(1,s.length));const total=weights.reduce((a,b)=>a+b,0);let pos=0;return phrases.map((t,i)=>{const start=pos;pos+=duration*weights[i]/total;return {start,end:pos,text:t}})}
function parseVtt(str){const out=[];const stamp=s=>{const p=s.trim().split(":").map(Number);return p.length===3?p[0]*3600+p[1]*60+p[2]:p[0]*60+p[1]};for(const block of str.replace(/\r/g,"").split(/\n\s*\n/)){const l=block.trim().split("\n");const at=l.findIndex(s=>s.includes("-->"));if(at<0)continue;const times=l[at].split("-->");const start=stamp(times[0]),end=stamp(times[1]);if(Number.isFinite(start)&&Number.isFinite(end)&&end>start)out.push({start,end,text:l.slice(at+1).join(" ").replace(/<[^>]+>/g,"")})}return out}
function setCaption(text){const el=$("#scene-caption");if(el)el.textContent=text}
function displayAt(seconds){const hit=captionItems.find(c=>seconds>=c.start&&seconds<c.end);setCaption(hit?.text||"")}
async function getCues(i,duration,id){
 const ctl=new AbortController();vttAbort=ctl;
 try{const resp=await fetch("/audio/slide-"+pad(i)+".vtt",{signal:ctl.signal,cache:"no-store"});if(resp.ok){const cues=parseVtt(await resp.text());if(cues.length&&seq===id)return cues}}catch(_){}
 return estimated(note(i),duration)
}
function render(){const p=$("#playback-toggle"),a=$("#playback-audio"),s=$("#playback-status");if(p){p.textContent=playing?"⏸":"▶";p.title=playing?"Пауза":"Възпроизвеждане";p.setAttribute("aria-pressed",String(playing))}if(a){a.textContent=muted?"🔇":"🔊";a.title=muted?"Включи звука":"Изключи звука";a.setAttribute("aria-pressed",String(!muted))}if(s)s.textContent=playing?(mode==="audio"?"Запис на Илияна":mode==="tts"?"Браузърен глас":mode==="silent"?"Само субтитри":"Autoplay"):"Пауза"}
async function play(){
 cancel();setCaption("");render();
 if(!started||!playing||!auto||document.hidden)return;
 const id=seq;const i=index;const source="/audio/slide-"+pad(i)+".mp3";
 try{
  const exists=await fetch(source,{method:"HEAD",cache:"no-store"});
  if(exists.ok&&seq===id){
   media.src=source;media.playbackRate=rate;media.muted=muted;mode="audio";render();
   await new Promise((resolve,reject)=>{if(media.readyState>=1)return resolve();media.onloadedmetadata=resolve;media.onerror=reject;setTimeout(()=>reject(new Error("audio timeout")),4500)});
   if(seq!==id)return;
   captionItems=await getCues(i,media.duration||fallbackDuration(i),id);
   if(seq!==id)return;
   media.ontimeupdate=()=>{if(seq===id)displayAt(media.currentTime)};
   media.onended=()=>{if(seq===id){setCaption("");schedule(1000,id)}};
   await media.play();return;
  }
 }catch(_){media.pause()}
 if(seq!==id)return;
 const duration=fallbackDuration(i)/rate;
 captionItems=estimated(note(i),duration);
 if(canSpeak&&!muted){
  mode="tts";const voice=synth.getVoices().find(v=>v.lang.toLowerCase()==="bg-bg")||synth.getVoices().find(v=>v.lang.toLowerCase().startsWith("bg"));
  const u=new SpeechSynthesisUtterance(note(i));u.lang="bg-BG";u.rate=rate;if(voice)u.voice=voice;utterance=u;
  let startTime=performance.now();
  u.onboundary=e=>{if(seq!==id)return;const position=note(i).slice(0,e.charIndex).length/Math.max(1,note(i).length)*duration;displayAt(position)};
  u.onend=()=>{if(seq===id){setCaption("");schedule(1200,id)}};
  u.onerror=()=>{if(seq===id)schedule(Math.round(duration*1000),id)};
  try{synth.speak(u)}catch(_){mode="silent";schedule(Math.round(duration*1000),id)}
 }else{mode="silent";schedule(Math.round(duration*1000),id)}
 render();
 // Captions remain readable when the device has no word boundary events.
 if(mode!=="audio"){const stamp=performance.now();const tick=()=>{if(seq!==id||!playing||document.hidden)return;const seconds=(performance.now()-stamp)/1000;displayAt(seconds);if(seconds<duration)requestAnimationFrame(tick)};requestAnimationFrame(tick)}
}
function controls(){
 const dock=$(".cinema-dock .dock-right");if(!dock)return;
 const wrapper=document.createElement("div");wrapper.className="playback-controls";
 wrapper.innerHTML='<button type="button" class="playback-btn" id="playback-toggle" aria-label="Пауза">⏸</button><button type="button" class="playback-btn" id="playback-audio" aria-label="Изключи звука">🔊</button><button type="button" class="playback-btn playback-repeat" id="playback-repeat" aria-label="Повтори">↻</button><label class="playback-rate-label" for="playback-rate">Скорост</label><select id="playback-rate" class="playback-rate" aria-label="Скорост"><option value=".85">0.85×</option><option value="1" selected>1×</option><option value="1.15">1.15×</option><option value="1.3">1.3×</option></select><button type="button" class="playback-btn" id="caption-toggle" aria-label="Скрий субтитрите" aria-pressed="true">CC</button><span class="playback-status" id="playback-status" role="status"></span>';
 dock.insertBefore(wrapper,$("#next"));
 const captions=document.createElement("div");captions.className="scene-captions";captions.id="scene-captions";captions.setAttribute("aria-live","off");captions.innerHTML='<span class="scene-caption" id="scene-caption"></span>';document.body.append(captions);
 $("#playback-toggle").onclick=()=>{started=true;playing=!playing;if(playing)play();else{cancel();render()}};
 $("#playback-audio").onclick=()=>{started=true;muted=!muted;playing=true;play()};
 $("#playback-repeat").onclick=()=>{started=true;playing=true;play()};
 $("#playback-rate").onchange=e=>{rate=Number(e.target.value)||1;started=true;playing=true;play()};
 $("#caption-toggle").onclick=()=>{captions.hidden=!captions.hidden;$("#caption-toggle").setAttribute("aria-pressed",String(!captions.hidden));$("#caption-toggle").setAttribute("aria-label",captions.hidden?"Покажи субтитрите":"Скрий субтитрите")};
 render();
}
function init(){
 controls();index=activeIndex();
 window.addEventListener("shopdirect:slidechange",e=>{index=e.detail.index;if(started)play()});
 const begin=()=>{started=true;playing=true;setTimeout(play,120)};
 $("#intro-start")?.addEventListener("click",begin);
 $("#intro-close")?.addEventListener("click",begin);
 const intro=$("#cinema-intro");intro?.addEventListener("pointerdown",e=>{if(e.target===intro)begin()});
 if(!intro||intro.hidden){started=true;setTimeout(play,280)}
 document.addEventListener("visibilitychange",()=>{if(document.hidden)cancel();else if(started&&playing)play()});
 document.addEventListener("keydown",e=>{if(e.target.closest("button,input,select,textarea,[contenteditable]")||!$("#cinema-intro")?.hidden)return;if(e.key.toLowerCase()==="p")$("#playback-toggle").click();else if(e.key.toLowerCase()==="m")$("#playback-audio").click();else if(e.key.toLowerCase()==="c")$("#caption-toggle").click()});
 window.addEventListener("pagehide",cancel);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
})();