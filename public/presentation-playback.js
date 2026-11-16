/* ShopDirect · reliable original Iliyana MP3 narrator · 2026-11-16
 * Native HTMLAudioElement, no paid services, no synthetic voice substitution.
 * First audible play is triggered synchronously by a user's gesture.
 * Browsers may block unprompted autoplay; reveal an explicit, accessible start control.
 */
(() => {
 "use strict";
 const $ = (selector) => document.querySelector(selector);
 const slides = [...document.querySelectorAll(".slide")];
 if (slides.length !== 8) return;

 const audio = new Audio();
 audio.preload = "auto";
 audio.setAttribute("playsinline", "");
 audio.setAttribute("aria-label", "Оригинално озвучаване на Илияна Цанова");
 const icons = {
  play: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M9 5v14M15 5v14"/></svg>',
  volume: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5a10 10 0 0 1 0 14"/></svg>',
  mute: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></svg>'
 };
 const asset = i => "/audio/slide-" + String(i + 1).padStart(2, "0") + ".mp3";
 const vttAsset = i => "/audio/slide-" + String(i + 1).padStart(2, "0") + ".vtt";
 const note = i => slides[i]?.dataset.note || "";
 let index = 0;
 let currentToken = 0;
 let wantsPlayback = true;
 let hasInteracted = false;
 let muted = false;
 let rate = 1;
 let currentMode = "ready";
 let captionItems = [];
 let vttAbort = null;
 let nextTimer = 0;

 function textChunks(value) {
  const words = (value || "").trim().split(/\s+/).filter(Boolean);
  const items = [];
  for (let i = 0; i < words.length; i += 7) items.push(words.slice(i, i + 7).join(" "));
  return items;
 }
 function estimatedCues(value, duration) {
  const chunks = textChunks(value);
  const sum = chunks.reduce((acc, chunk) => acc + chunk.length, 0) || 1;
  let t = 0;
  return chunks.map(chunk => {
   const start = t;
   t += duration * chunk.length / sum;
   return { start, end: t, text: chunk };
  });
 }
 function seconds(raw) {
  const parts = raw.trim().split(":").map(Number);
  const n = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
  return Number.isFinite(n) ? n : NaN;
 }
 function parseVtt(value) {
  const items = [];
  for (const entry of value.replace(/\r/g, "").split(/\n\s*\n/)) {
   const rows = entry.trim().split("\n");
   const line = rows.findIndex(s => s.includes("-->"));
   if (line < 0) continue;
   const range = rows[line].split("-->");
   const start = seconds(range[0]), end = seconds((range[1] || "").trim().split(/\s+/)[0]);
   const caption = rows.slice(line + 1).join(" ").replace(/<[^>]+>/g, "").trim();
   if (Number.isFinite(start) && Number.isFinite(end) && end > start && caption) {
    items.push({ start, end, text: caption });
   }
  }
  return items;
 }
 function captionAt(time) {
  const caption = $("#scene-caption");
  if (!caption) return;
  const found = captionItems.find(item => time >= item.start && time < item.end);
  caption.textContent = found ? found.text : "";
 }
 function setStatus(message, action = false) {
  const node = $("#playback-status");
  if (node) node.textContent = message;
  const prompt = $("#voice-start-prompt");
  if (prompt) {
   prompt.hidden = !action;
   const label = $("#voice-start-label");
   if (label) label.textContent = message;
  }
 }
 function render() {
  const play = $("#playback-toggle"), volume = $("#playback-audio");
  if (play) {
   const running = !audio.paused && !audio.ended;
   play.innerHTML = running ? icons.pause : icons.play;
   play.title = running ? "Пауза" : "Пусни гласа на Илияна";
   play.setAttribute("aria-label", play.title);
   play.setAttribute("aria-pressed", String(running));
   document.body.classList.toggle("narration-playing", running);
  }
  if (volume) {
   volume.innerHTML = muted ? icons.mute : icons.volume;
   volume.title = muted ? "Включи звука" : "Изключи звука";
   volume.setAttribute("aria-label", volume.title);
   volume.setAttribute("aria-pressed", String(!muted));
  }
 }
 function abortVtt() {
  if (vttAbort) vttAbort.abort();
  vttAbort = null;
 }
 function loadCaptions(i, token) {
  abortVtt();
  const controller = new AbortController();
  vttAbort = controller;
  const dur = Number.isFinite(audio.duration) ? audio.duration : Math.max(12, note(i).length / 13);
  captionItems = estimatedCues(note(i), dur);
  fetch(vttAsset(i), { signal: controller.signal, cache: "force-cache" })
   .then(response => response.ok ? response.text() : "")
   .then(text => {
    if (token !== currentToken) return;
    const parsed = parseVtt(text);
    if (parsed.length) captionItems = parsed;
    captionAt(audio.currentTime);
   }).catch(() => {});
 }
 function loadSlide(i) {
  clearTimeout(nextTimer);
  const token = ++currentToken;
  abortVtt();
  audio.pause();
  audio.src = asset(i);
  audio.playbackRate = rate;
  audio.muted = muted;
  audio.load();
  currentMode = "ready";
  captionItems = estimatedCues(note(i), Math.max(12, note(i).length / 13));
  const node = $("#scene-caption");
  if (node) node.textContent = "";
  loadCaptions(i, token);
  setStatus("Гласът на Илияна е готов");
  render();
 }
 function startPlayback(fromGesture = false) {
  if (document.hidden) return;
  if (fromGesture) hasInteracted = true;
  wantsPlayback = true;
  const token = currentToken;
  currentMode = "loading";
  setStatus("Зареждане на оригиналния запис…");
  // CRITICAL: play() must be called immediately inside the click handler,
  // before any HEAD, fetch, metadata wait, promise chain or setTimeout.
  let attempt;
  try { attempt = audio.play(); }
  catch (error) { playbackError(error, token); return; }
  render();
  Promise.resolve(attempt).then(() => {
   if (token !== currentToken) return;
   currentMode = "audio";
   setStatus("Звучи оригиналният запис на Илияна");
   render();
  }).catch(error => playbackError(error, token));
 }
 function playbackError(error, token) {
  if (token !== currentToken) return;
  // Switching slides interrupts pending play promises: not a playback failure.
  if (error?.name === "AbortError") return;
  wantsPlayback = false;
  currentMode = "blocked";
  render();
  if (error?.name === "NotAllowedError") {
   setStatus("Натисни ▶, за да чуеш Илияна", true);
  } else {
   setStatus("Записът не се зареди. Натисни ▶ за повторен опит.", true);
   console.warn("[ShopDirect narration]", error);
  }
 }
 function pausePlayback() {
  wantsPlayback = false;
  audio.pause();
  currentMode = "paused";
  setStatus("Озвучаването е на пауза");
  render();
 }
 function goNext() {
  if (index >= slides.length - 1) {
   wantsPlayback = false;
   currentMode = "ended";
   setStatus("Презентацията завърши");
   render();
   return;
  }
  const target = document.querySelectorAll(".dock-step")[index + 1];
  if (target) target.click();
 }
 function controls() {
  const footer = $(".cinema-dock");
  if (!footer) return;
  const wrapper = document.createElement("div");
  wrapper.className = "playback-controls";
  wrapper.innerHTML =
   '<button type="button" class="playback-btn" id="playback-toggle" aria-label="Пусни гласа на Илияна"></button>' +
   '<button type="button" class="playback-btn" id="playback-audio" aria-label="Изключи звука"></button>' +
   '<button type="button" class="playback-btn playback-repeat" id="playback-repeat" aria-label="Повтори записа" title="Повтори записа">↻</button>' +
   '<label class="playback-rate-label" for="playback-rate">Скорост</label>' +
   '<select id="playback-rate" class="playback-rate" aria-label="Скорост на озвучаване"><option value=".85">0.85×</option><option value="1" selected>1×</option><option value="1.15">1.15×</option><option value="1.3">1.3×</option></select>' +
   '<button type="button" class="playback-btn" id="caption-toggle" aria-label="Скрий субтитрите" aria-pressed="true">CC</button>' +
   '<span class="playback-status" id="playback-status" role="status"></span>';
  footer.append(wrapper);
  const captions = document.createElement("div");
  captions.className = "scene-captions"; captions.id = "scene-captions";
  captions.setAttribute("aria-live", "off");
  captions.innerHTML = '<span class="scene-caption" id="scene-caption"></span>';
  document.body.append(captions);
  const prompt = document.createElement("div");
  prompt.id = "voice-start-prompt";
  prompt.className = "voice-start-prompt";
  prompt.hidden = true;
  prompt.innerHTML = '<span id="voice-start-label">Натисни ▶, за да чуеш Илияна</span><button type="button" id="voice-start-now">▶ Пусни гласа</button>';
  document.body.append(prompt);
  $("#playback-toggle").addEventListener("click", () => {
   if (!audio.paused && !audio.ended) pausePlayback();
   else startPlayback(true);
  });
  $("#voice-start-now").addEventListener("click", () => startPlayback(true));
  $("#playback-audio").addEventListener("click", () => {
   muted = !muted;
   audio.muted = muted;
   if (muted) setStatus("Звукът е изключен");
   else if (audio.paused) startPlayback(true);
   render();
  });
  $("#playback-repeat").addEventListener("click", () => {
   audio.currentTime = 0;
   startPlayback(true);
  });
  $("#playback-rate").addEventListener("change", event => {
   rate = Number(event.target.value) || 1;
   audio.playbackRate = rate;
  });
  $("#caption-toggle").addEventListener("click", () => {
   captions.hidden = !captions.hidden;
   $("#caption-toggle").setAttribute("aria-pressed", String(!captions.hidden));
   $("#caption-toggle").setAttribute("aria-label", captions.hidden ? "Покажи субтитрите" : "Скрий субтитрите");
  });
  render();
 }
 function init() {
  controls();
  const hash = Number(location.hash.slice(1));
  index = Number.isInteger(hash) && hash >= 1 && hash <= 8 ? hash - 1 : 0;
  loadSlide(index);

  audio.addEventListener("play", render);
  audio.addEventListener("pause", render);
  audio.addEventListener("timeupdate", () => captionAt(audio.currentTime));
  audio.addEventListener("loadedmetadata", () => {
   if (!captionItems.length) captionItems = estimatedCues(note(index), audio.duration || 24);
  });
  audio.addEventListener("error", () => {
   if (currentMode === "blocked") return;
   playbackError(new Error("Аудиофайлът не може да бъде зареден: " + asset(index)), currentToken);
  });
  audio.addEventListener("ended", () => {
   currentMode = "ended";
   setStatus("Записът приключи");
   render();
   if (wantsPlayback) {
    const token = currentToken;
    nextTimer = setTimeout(() => { if (token === currentToken && wantsPlayback) goNext(); }, 850);
   }
  });
  window.addEventListener("shopdirect:slidechange", event => {
   index = event.detail.index;
   loadSlide(index);
   // Directly reached from navigation clicks or from the previous audio's end.
   // Keep the same unlocked HTMLAudioElement for uninterrupted narration.
   if (wantsPlayback && ($("#cinema-intro")?.hidden ?? true)) startPlayback(false);
  });
  // Welcome animation advances automatically after 2.65 seconds. Attempt
  // autoplay immediately; if the browser denies sound, reveal one explicit
  // unlock button instead of silently suppressing the voice.
  window.addEventListener("shopdirect:introclosed", event => {
   if (event.detail?.reason === "auto" && wantsPlayback && audio.paused) {
    startPlayback(false);
   }
  });

  // The cinematic intro is installed BEFORE this script. Both handlers fire
  // synchronously during the same trusted click; no timeouts permitted here.
  $("#intro-start")?.addEventListener("click", () => startPlayback(true));
  $("#intro-close")?.addEventListener("click", () => startPlayback(true));
  const intro = $("#cinema-intro");
  intro?.addEventListener("pointerdown", event => {
   if (event.target === intro) startPlayback(true);
  });

  document.addEventListener("visibilitychange", () => {
   if (document.hidden) {
    audio.pause();
   } else if (wantsPlayback && hasInteracted && intro?.hidden) {
    startPlayback(false);
   }
  });
  document.addEventListener("keydown", event => {
   if (event.metaKey || event.ctrlKey || event.altKey || event.target?.closest?.("button,input,select,textarea,[contenteditable]")) return;
   if (!intro?.hidden) return;
   const key = event.key.toLowerCase();
   if (key === "p") {
    event.preventDefault();
    if (audio.paused) startPlayback(true);
    else pausePlayback();
   } else if (key === "m") {
    event.preventDefault();
    $("#playback-audio")?.click();
   } else if (key === "c") {
    event.preventDefault();
    $("#caption-toggle")?.click();
   } else if (key === "r") {
    event.preventDefault();
    $("#playback-repeat")?.click();
   }
  });
  window.addEventListener("pagehide", () => {
   clearTimeout(nextTimer);
   abortVtt();
   audio.pause();
  });
  if (!intro || intro.hidden) {
   // Attempt user-preferred automatic playback. If the browser blocks it, the
   // visible "Пусни гласа" button is the supported mobile-browser path.
   startPlayback(false);
  } else {
   wantsPlayback = true;
   setStatus("Започни презентацията с гласа на Илияна");
  }
 }
 if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
 else init();
})();
