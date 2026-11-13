/* ShopDirect — voluntary visitor reporting, NOT user authentication.
   PII is transmitted only after explicit consent and never stored locally. */
(()=>{"use strict";
const KEY="shopdirect.visit-registration.v1",selector=q=>document.querySelector(q);
let gate=null,lastFocus=null,enabled=false;
function seen(){try{return !!sessionStorage.getItem(KEY)}catch{return false}}
function remember(v){try{sessionStorage.setItem(KEY,v)}catch{}}
function status(text,type=""){const x=selector("#sd-visitor-status");if(x){x.textContent=text;x.className="sd-visitor-status "+type}}
function teardown(){gate?.remove();gate=null;document.body.classList.remove("sd-visitor-locked");if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true})}
function close(v){remember(v);if(window.gsap&&!matchMedia("(prefers-reduced-motion: reduce)").matches){window.gsap.to(".sd-visitor-card",{opacity:0,scale:.96,y:18,duration:.28,ease:"power2.in",onComplete:teardown})}else teardown()}
async function config(){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6500);
 try{const r=await fetch("/api/visit",{cache:"no-store",signal:controller.signal});if(!r.ok)throw Error();
      const p=await r.json();enabled=p.email_enabled===true;}
 catch{enabled=false}finally{clearTimeout(timer)}
 const b=selector("#sd-visitor-send");if(b){b.disabled=!enabled;b.textContent="Изпрати известие и разгледай ↗"}
 status(enabled?"Известие ще бъде изпратено само след изрично съгласие.":"Пощенската функция все още не е активна. Можете да разгледате без регистрация.");
}
async function send(e){
 e.preventDefault();const form=e.currentTarget;if(!form.checkValidity()){form.reportValidity();return}
 if(!enabled){status("Системата за известия не е конфигурирана.","error");return}
 const data=new FormData(form), full_name=String(data.get("full_name")||"").trim(),email=String(data.get("email")||"").trim(),
       consent=data.get("consent")==="yes",website=String(data.get("website")||"");
 if(!consent){status("Необходимо е изрично съгласие.","error");return}
 const button=selector("#sd-visitor-send");button.disabled=true;button.textContent="Изпращане на известие…";status("Свързване с пощенската услуга…");
 const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),18000);
 try{
   const r=await fetch("/api/visit",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",cache:"no-store",
        body:JSON.stringify({full_name,email,consent,website}),signal:ac.signal});
   const payload=await r.json().catch(()=>({}));
   if(!r.ok||payload.notified!==true)throw Error(payload.error||"Известието не е потвърдено.");
   status("Известие до автора е изпратено. Отварям изследването…","success");
   await new Promise(resolve=>setTimeout(resolve,850));
   close("complete");
 }catch(err){
   status((err.name==="AbortError"?"Изчакването изтече.":err.message)+" Можете да продължите без регистрация.","error")
 }finally{clearTimeout(timer);button.disabled=!enabled;button.textContent="Изпрати известие и разгледай ↗"}
}
function init(){
 if(seen())return;
 lastFocus=document.activeElement;gate=document.createElement("div");gate.className="sd-visitor-gate";gate.id="sd-visitor-gate";
 gate.innerHTML="<div class=\"sd-visitor-card\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"sd-visitor-title\" aria-describedby=\"sd-visitor-desc\">\n  <aside class=\"sd-visitor-visual\" aria-hidden=\"true\"><div class=\"sd-visitor-visual-inner\">\n    <small>INTERACTIVE RESEARCH / P3.1</small>\n    <h2>Реални данни.<br><span>По-интелигентни решения.</span></h2>\n    <p>Проверим Python анализ и интерактивно академично изследване.</p>\n    <div class=\"sd-visitor-logo\"><img src=\"/academy-seal.svg\" alt=\"\" width=\"51\" height=\"51\"><span><strong>Стопанска академия „Д. А. Ценов“</strong><br>Свищов · 2026</span></div>\n  </div></aside>\n  <div class=\"sd-visitor-content\">\n    <div class=\"sd-visitor-icon\" aria-hidden=\"true\">✦</div>\n    <div class=\"sd-visitor-kicker\">ShopDirect · Достъп до изследването</div>\n    <h2 id=\"sd-visitor-title\">Добре дошли в<br>курсовата работа.</h2>\n    <p class=\"sd-visitor-desc\" id=\"sd-visitor-desc\">Автор: <strong style=\"color:#ede0ff\">Илияна Цанова</strong> · Маркетинг · фак. № 252042.<br>По желание регистрирайте посещението си, за да изпратим известие до автора.</p>\n    <form class=\"sd-visitor-form\" id=\"sd-visitor-form\">\n      <label class=\"sd-visitor-label\"><span>Вашите имена</span><input name=\"full_name\" type=\"text\" required minlength=\"2\" maxlength=\"96\" autocomplete=\"name\" placeholder=\"Име и фамилия\"></label>\n      <label class=\"sd-visitor-label\"><span>Вашият имейл</span><input name=\"email\" type=\"email\" required maxlength=\"180\" autocomplete=\"email\" placeholder=\"you@example.com\" spellcheck=\"false\"></label>\n      <label class=\"sd-visitor-consent\"><input name=\"consent\" type=\"checkbox\" value=\"yes\" required><span>Съгласен/а съм имената и имейлът ми да бъдат изпратени на автора единствено като известие за посещението. <a href=\"/privacy.html\" target=\"_blank\" rel=\"noopener\">Информация за личните данни ↗</a></span></label>\n      <div class=\"sd-visitor-honey\" aria-hidden=\"true\"><label>Website<input type=\"text\" name=\"website\" tabindex=\"-1\" autocomplete=\"off\"></label></div>\n      <div class=\"sd-visitor-buttons\">\n        <button id=\"sd-visitor-send\" class=\"sd-visitor-primary\" type=\"submit\" disabled>Проверка на пощенската система…</button>\n        <button class=\"sd-visitor-skip\" id=\"sd-visitor-skip\" type=\"button\">Разгледай без регистрация →</button>\n      </div>\n    </form>\n    <p class=\"sd-visitor-status\" id=\"sd-visitor-status\" role=\"status\" aria-live=\"polite\">Проверка на конфигурацията…</p>\n    <p class=\"sd-visitor-privacy-mini\">Това не е акаунт или удостоверяване на самоличност. Данните не се записват в база данни на сайта. Прегледът е възможен и без попълване.</p>\n  </div>\n</div>";
 document.body.appendChild(gate);document.body.classList.add("sd-visitor-locked");
 selector("#sd-visitor-form").addEventListener("submit",send);
 selector("#sd-visitor-skip").addEventListener("click",()=>close("guest"));
 gate.addEventListener("keydown",e=>{
   if(e.key==="Escape"){e.preventDefault();close("guest");return}
   if(e.key!=="Tab")return;
   const f=[...gate.querySelectorAll('a[href],button:not([disabled]),input:not([disabled])')].filter(n=>n.getClientRects().length);
   if(!f.length)return;
   if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f.at(-1).focus()}
   else if(!e.shiftKey&&document.activeElement===f.at(-1)){e.preventDefault();f[0].focus()}
 });
 selector("#sd-visitor-skip").focus({preventScroll:true});
 if(window.gsap&&!matchMedia("(prefers-reduced-motion: reduce)").matches)
   window.gsap.fromTo(".sd-visitor-card",{opacity:0,y:25,scale:.96},{opacity:1,y:0,scale:1,duration:.65,ease:"power3.out"});
 config();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();