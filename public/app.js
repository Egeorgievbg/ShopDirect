/* ShopDirect / Iliana Tsanova — one chapter, one verifiable Python execution. */
(() => {
  "use strict";

  const steps = ["quality", "patterns", "logistic", "forest", "comparison", "targeting"];
  const results = new Map();
  const sourceCode = new Map();
  let activeRun = false;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const format = (x, digits = 3) => Number(x).toLocaleString("bg-BG", {
    minimumFractionDigits: digits, maximumFractionDigits: digits
  });
  const percentage = (x, digits = 1) => format(x * 100, digits) + "%";
  const escape = value => String(value).replace(/[&<>"']/g, c =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const codeOf = key => document.querySelector('[data-code-content="' + key + '"]');
  const stageOf = key => document.getElementById("result-" + key);
  const stateOf = key => document.querySelector('[data-state="' + key + '"]');
  const runButtonsOf = key => $$('[data-run="' + key + '"]');
  const referenceScenarios = [
    {share:.1,contacts:20,historical_yes:16,rate:.8,lift:2.4242424242,capture:16/66},
    {share:.2,contacts:40,historical_yes:31,rate:.775,lift:2.3484848485,capture:31/66},
    {share:.3,contacts:60,historical_yes:37,rate:37/60,lift:1.8686868687,capture:37/66},
    {share:.4,contacts:80,historical_yes:44,rate:.55,lift:1.6666666667,capture:44/66},
    {share:.5,contacts:100,historical_yes:49,rate:.49,lift:1.4848484848,capture:49/66}
  ];
  let toastTimer;
  function toast(message) {
    const node = $("#toast");
    node.textContent = message; node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.hidden = true, 4200);
  }
  function runState(step, text, state) {
    const label = stateOf(step);
    if (label) {
      label.className = "execution-state " + (state || "");
      label.textContent = text;
    }
    runButtonsOf(step).forEach(button => {
      button.disabled = state === "running";
      button.classList.toggle("busy", state === "running");
    });
  }
  function basicMetrics(items) {
    return '<div class="mini-metrics">' + items.map(x =>
      '<div><span>' + escape(x[0]) + '</span><strong>' + escape(x[1]) + '</strong></div>'
    ).join("") + "</div>";
  }
  function rowBars(rows, max = 1) {
    return rows.map(item => '<div class="bar-row"><label>' + escape(item.label) +
      '</label><div class="bar-track"><i style="width:' +
      (Math.max(0, Math.min(100, item.rate / max * 100))).toFixed(2) +
      '%"></i></div><strong>' + percentage(item.rate) + '</strong></div>').join("");
  }
  function metaOutput(elapsed) {
    return '<div class="execution-meta">✓ Python · Изчислено от вградения CSV · ' +
      format(elapsed, 2) + ' s · random_state=42</div>';
  }

  function renderQuality(data, elapsed) {
    const s = data.statistics;
    stageOf("quality").innerHTML = basicMetrics([
      ["Клиенти", data.population.rows], ["Yes", data.population.yes],
      ["Липсващи", data.population.missing_values]
    ]) +
      '<div class="result-card-note">Всички ' + data.population.unique_ids +
      ' клиентски идентификатора са уникални. Обучаваща извадка: ' +
      data.split.train + '; тестова: ' + data.split.test + '.</div>' +
      '<table class="response-table"><thead><tr><th>Променлива</th><th>Средна</th><th>Медиана</th></tr></thead><tbody>' +
      s.map(row => '<tr><td>' + escape(row.label) + '</td><td>' +
        format(row.mean, 2) + '</td><td>' + format(row.median, 2) +
        '</td></tr>').join("") + '</tbody></table>' + metaOutput(elapsed);
  }
  function renderPatterns(data, elapsed) {
    const v = data.quartiles.website_visits_30d;
    const r = data.quartiles.recency_days;
    stageOf("patterns").innerHTML =
      '<div class="viz-title">Лоялност / Response rate</div>' +
      rowBars(data.loyalty) +
      '<div class="divider-lite"></div><div class="viz-title">Посещения за 30 дни / квартил</div>' +
      rowBars(v.map(x => ({label:x.quartile,rate:x.rate}))) +
      '<div class="divider-lite"></div><div class="viz-title">Дни от последна покупка / квартил</div>' +
      rowBars(r.map(x => ({label:x.quartile,rate:x.rate}))) +
      '<p class="figure-footnote">Квартилите са рангови. Посочените разлики не доказват причинни ефекти.</p>' + metaOutput(elapsed);
  }
  function oddsBars(items, fieldName) {
    const sorted = [...items].sort((a,b) =>
      (b.odds_ratio ?? b.importance) - (a.odds_ratio ?? a.importance));
    const high = Math.max(...sorted.map(x => x.odds_ratio ?? x.importance));
    return '<div class="odd-list">' + sorted.map(x => {
      const raw = x.odds_ratio ?? x.importance;
      const width = high ? Math.max(1, raw / high * 100) : 0;
      return '<div class="odd-item"><label>' + escape(x.feature) +
        '</label><div class="odd-track"><i class="' + (raw < 1 && fieldName === "odds" ? "negative" : "") +
        '" style="width:' + width.toFixed(1) + '%"></i></div><b>' +
        format(raw, fieldName === "odds" ? 2 : 3) + '</b></div>';
    }).join("") + "</div>";
  }
  function metricsTable(m) {
    return '<table class="response-table"><thead><tr><th>Показател</th><th>Стойност</th></tr></thead><tbody>' +
      [['CV AUC',format(m.cv_auc)],['Accuracy',percentage(m.accuracy)],
        ['Sensitivity',percentage(m.sensitivity)],['Specificity',percentage(m.specificity)],
        ['Brier score',format(m.brier)]].map(x =>
        '<tr><td>' + x[0] + '</td><td>' + x[1] + '</td></tr>').join("") +
      '</tbody></table>';
  }
  function renderLogistic(data, elapsed) {
    const m = data.metrics;
    stageOf("logistic").innerHTML =
      '<div class="model-hero"><div><small>TEST ROC AUC / 200 клиента</small><strong>' +
      format(m.test_auc) + '</strong><span>Logistic Regression</span></div><div class="model-circle">LR<span>01</span></div></div>' +
      metricsTable(m) + '<div class="viz-title">Odds ratios · асоциации при равни други условия</div>' +
      oddsBars(data.odds_ratios, "odds") +
      '<p class="figure-footnote">За числовите предиктори: изменение с 1 стандартно отклонение; 1,00 = без промяна в odds.</p>' +
      metaOutput(elapsed);
  }
  function renderForest(data, elapsed) {
    const m = data.metrics;
    stageOf("forest").innerHTML =
      '<div class="model-hero forest-hero"><div><small>TEST ROC AUC / 200 клиента</small><strong>' +
      format(m.test_auc) + '</strong><span>Random Forest</span></div><div class="model-circle">RF<span>02</span></div></div>' +
      metricsTable(m) + '<div class="viz-title">Вътрешномоделна важност на характеристиките</div>' +
      oddsBars(data.feature_importance, "importance") +
      '<p class="figure-footnote">Feature importance показва използването в модела, а не причинен ефект.</p>' +
      metaOutput(elapsed);
  }
  function rocSVG(lines) {
    const width = 550, height = 280;
    const axis = {left:52,right:22,top:15,bottom:42};
    const x = v => axis.left + v * (width-axis.left-axis.right);
    const y = v => height-axis.bottom - v*(height-axis.top-axis.bottom);
    const path = points => points.map((p,i) =>
      (i ? "L" : "M") + x(p[0]).toFixed(1) + " " + y(p[1]).toFixed(1)).join(" ");
    const grid = [0,.25,.5,.75,1].map(v =>
      '<line x1="'+x(0)+'" x2="'+x(1)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#e5ece5"/>' +
      '<text x="'+(axis.left-9)+'" y="'+(y(v)+4)+'" text-anchor="end" fill="#71877a" font-size="10">'+
      v.toFixed(2)+'</text>' +
      '<text x="'+x(v)+'" y="'+(height-19)+'" text-anchor="middle" fill="#71877a" font-size="10">'+v.toFixed(2)+'</text>').join("");
    return '<svg class="roc-chart" viewBox="0 0 550 280" role="img" aria-label="ROC криви на логистичната регресия и Random Forest">' +
      grid +
      '<line x1="'+x(0)+'" x2="'+x(1)+'" y1="'+y(0)+'" y2="'+y(1)+'" stroke="#afbbae" stroke-width="1.5" stroke-dasharray="6 5"/>' +
      '<path d="'+path(lines.logistic)+'" fill="none" stroke="#267358" stroke-width="3"/>' +
      '<path d="'+path(lines.forest)+'" fill="none" stroke="#c59b61" stroke-width="3"/>' +
      '<text x="295" y="277" text-anchor="middle" fill="#506b59" font-size="12">False Positive Rate</text>' +
      '<text x="15" y="145" text-anchor="middle" transform="rotate(-90 15 145)" fill="#506b59" font-size="12">True Positive Rate</text></svg>' +
      '<div class="legend-row"><span><i></i>Логистична регресия</span>' +
      '<span class="forest"><i></i>Random Forest</span></div>';
  }
  function renderComparison(data, elapsed) {
    const l=data.logistic,f=data.forest, ci=data.difference_bootstrap_95;
    stageOf("comparison").innerHTML =
      '<div class="compare-preview"><div><small>Logistic ROC AUC</small><strong>' +
      format(l.test_auc) + '</strong></div><span class="versus">vs</span><div><small>Forest ROC AUC</small><strong>' +
      format(f.test_auc) + '</strong></div></div>' +
      rocSVG({logistic:l.roc,forest:f.roc}) +
      '<div class="result-callout"><b>Разлика:</b> ' + format(data.auc_difference) +
      ' · 95% bootstrap интервал: [' + format(ci[0]) + '; ' + format(ci[1]) +
      ']. ' + (ci[0]<0 && ci[1]>0 ? 'Той пресича 0, затова не е доказана категорична разлика.' : 'Интервалът не пресича 0 в тази проверка.') +
      '</div>' +
      '<table class="response-table"><thead><tr><th>Модел</th><th>Accuracy</th><th>Sensitivity</th><th>Specificity</th></tr></thead><tbody>' +
      [['Logistic',l],['Forest',f]].map(([name,m]) =>
        '<tr><td>'+name+'</td><td>'+percentage(m.accuracy)+'</td><td>'+percentage(m.sensitivity)+
        '</td><td>'+percentage(m.specificity)+'</td></tr>').join("") +
      '</tbody></table><p class="figure-footnote">Базов модел „всички No“: ' +
      percentage(data.base_accuracy_no,0) +
      ' Accuracy, но 0% Sensitivity. Bootstrap: 2000 повторения върху тестовата извадка.</p>' + metaOutput(elapsed);
  }
  function renderTargeting(data,elapsed) {
    const table='<table class="response-table"><thead><tr><th>Обхват</th><th>Контакти</th><th>Yes</th><th>Rate</th><th>Lift</th></tr></thead><tbody>' +
      data.scenarios.map(s=>
        '<tr'+(s.share===.3?' class="emphasize"':'')+'><td>'+percentage(s.share,0)+'</td><td>'+
        s.contacts+'</td><td>'+s.historical_yes+'</td><td>'+percentage(s.rate)+'</td><td>'+
        format(s.lift,2)+'×</td></tr>').join("") + '</tbody></table>';
    const holder=stageOf("targeting");
    // Keep the interactive slider DOM stable; replace only the source note and add table.
    const oldTable=$("#targeting-table");
    if(oldTable)oldTable.remove();
    const node=document.createElement("div");node.id="targeting-table";node.innerHTML=table+metaOutput(elapsed);
    holder.appendChild(node);
    const caption=$("#target-caption");
    caption.textContent="Резултатите вече са изчислени от Python на сървъра. Движението на плъзгача сравнява действителните тестови сценарии.";
    updateSimulator();
  }
  function updateSimulator() {
    const pct=Number($("#target-range").value);
    const s=(results.get("targeting")?.scenarios||referenceScenarios).find(x=>Math.round(x.share*100)===pct);
    if(!s)return;
    $("#target-value").textContent=pct+"%";
    $("#target-contacts").textContent=s.contacts;
    $("#target-rate").textContent=percentage(s.rate);
    $("#target-lift").textContent=format(s.lift,2)+"×";
    $("#target-hits").textContent=s.historical_yes+" от 66";
  }

  const renderers={quality:renderQuality,patterns:renderPatterns,
    logistic:renderLogistic,forest:renderForest,
    comparison:renderComparison,targeting:renderTargeting};

  async function request(step) {
    const response=await fetch("/api/run",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({step}),cache:"no-store"});
    const payload=await response.json().catch(()=>({error:"Невалиден отговор от Python API."}));
    if(!response.ok)throw Error(payload.error||"HTTP "+response.status);
    if(payload.step!==step)throw Error("Несъответствие между заявката и изпълнената глава.");
    return payload;
  }

  async function runOne(step) {
    if(!steps.includes(step)||activeRun)return;
    activeRun=true;
    runState(step,"Изпълнява се…","running");
    window.ShopDirectMotion?.begin?.(step);
    const button=$('[data-run="'+step+'"]');
    const prior=button.textContent;
    button.innerHTML='<i class="loading-spin" aria-hidden="true"></i> Изчисляване…';
    try{
      const payload=await request(step);
      await window.ShopDirectMotion?.replay?.(step,payload);
      results.set(step,payload.result);
      renderers[step](payload.result,payload.elapsed_seconds);
      window.ShopDirectMotion?.revealResult?.(step);
      runState(step,"✓ Изпълнено с Python","success");
      toast("Глава "+(steps.indexOf(step)+1)+" е изпълнена успешно.");
    }catch(error){
      window.ShopDirectMotion?.fail?.(step,error);
      runState(step,"⚠ Грешка","error");
      toast("Неуспешно изпълнение на главата.");
      const stage=stageOf(step);
      const prev=$(".error-msg",stage);if(prev)prev.remove();
      const msg=document.createElement("p");msg.className="error-msg";
      msg.textContent=error.message+" Проверете Vercel Python logs или опитайте отново.";
      stage.appendChild(msg);
    }finally{
      button.textContent=prior;
      activeRun=false;
    }
  }

  async function runAll() {
    if(activeRun)return;
    activeRun=true;
    window.ShopDirectMotion?.begin?.("all");
    const triggerButtons=["nav-run-all","final-run-all"].map(id=>$("#"+id)).filter(Boolean);
    triggerButtons.forEach(b=>{b.disabled=true;b.textContent="Изчисляване на всички глави…"});
    steps.forEach(s=>runState(s,"Изчислява се…","running"));
    try{
      const payload=await request("all");
      await window.ShopDirectMotion?.replay?.("all",payload);
      const finished=payload.result||{};
      for(const step of steps){
        if(!finished[step])throw Error("Липсва резултат за глава "+step);
        results.set(step,finished[step]);
        renderers[step](finished[step],payload.elapsed_seconds);
        window.ShopDirectMotion?.revealResult?.(step);
        runState(step,"✓ Изпълнено с Python","success");
      }
      const status=$("#complete-status");
      status.hidden=false;
      status.innerHTML='<strong>Всички шест глави са изпълнени.</strong> Общо време: '+
        format(payload.elapsed_seconds,2)+' s. Показателите са преизчислени от 800-те вградени записа. ' +
        '<a href="/report.html" style="text-decoration:underline;font-weight:800">Прочети пълния доклад ↗</a>';
      toast("Успешно изпълнение на шестте Python глави.");
      $("#chapter-quality").scrollIntoView({behavior:"smooth",block:"start"});
    }catch(error){
      window.ShopDirectMotion?.fail?.("all",error);
      steps.forEach(s=>runState(s,"⚠ Проверете API","error"));
      toast("Неуспешно пълно изпълнение: "+error.message);
      const status=$("#complete-status");status.hidden=false;
      status.textContent="Изпълнението не е завършило: "+error.message;
    }finally{
      activeRun=false;
      triggerButtons.forEach((b,i)=>{b.disabled=false;b.innerHTML=i===0
        ?'<span class="play-small">▶</span> Стартирай изследването'
        :'▶ Стартирай цялото изследване'});
    }
  }

  async function toggleCode(step,button) {
    const container=$("#code-"+step);
    const opening=container.hidden;
    container.hidden=!opening;button.setAttribute("aria-expanded",String(opening));
    button.innerHTML='<span>⌘</span> '+(opening?"Скрий Python логиката":"Прегледай Python логиката");
    if(!opening)return;
    const node=codeOf(step);
    if(sourceCode.has(step)){node.textContent=sourceCode.get(step);return}
    node.textContent="Зарежда се действителният Python код…";
    try{
      const response=await fetch("/api/run?source="+encodeURIComponent(step),{cache:"no-store"});
      const body=await response.json();
      if(!response.ok)throw Error(body.error||"HTTP "+response.status);
      if(body.step!==step||!body.code)throw Error("Неочакван отговор от API.");
      sourceCode.set(step,body.code);node.textContent=body.code;
    }catch(error){node.textContent="Кодът не може да се зареди: "+error.message+
      "\n\nПълен изходен файл: github.com/Egeorgievbg/ShopDirect/blob/main/api/run.py"}
  }

  async function copyCode(step,button){
    const code=sourceCode.get(step);
    if(!code){toast("Първо отворете кода на главата.");return}
    try{
      await navigator.clipboard.writeText(code);
      button.textContent="Копирано ✓";
      setTimeout(()=>button.textContent="Копирай",1600);
    }catch{toast("Копирането е ограничено от браузъра. Маркирайте кода ръчно.")}
  }
  document.addEventListener("click",event=>{
    const run=event.target.closest("[data-run]");
    if(run){runOne(run.dataset.run);return}
    const code=event.target.closest("[data-code-toggle]");
    if(code){toggleCode(code.dataset.codeToggle,code);return}
    const copy=event.target.closest("[data-copy]");
    if(copy){copyCode(copy.dataset.copy,copy);return}
  });
  $("#target-range").addEventListener("input",updateSimulator);
  updateSimulator();
  $("#nav-run-all").addEventListener("click",runAll);
  $("#final-run-all").addEventListener("click",runAll);
  $("#nav-menu").addEventListener("click",()=>{
    const menu=$("#mobile-nav"),opening=menu.hidden;
    menu.hidden=!opening;$("#nav-menu").setAttribute("aria-expanded",String(opening));
  });
  $$("#mobile-nav a").forEach(a=>a.addEventListener("click",()=>{
    $("#mobile-nav").hidden=true;$("#nav-menu").setAttribute("aria-expanded","false");
  }));

  let lastActive="";
  const observer = new IntersectionObserver(entries=>{
    for(const item of entries){
      if(item.isIntersecting){
        const step=item.target.dataset.chapter||"final";
        if(step!==lastActive){lastActive=step;
          $$("[data-rail]").forEach(a=>a.classList.toggle("active",a.dataset.rail===step))}
      }
    }
  },{rootMargin:"-16% 0px -63% 0px",threshold:0});
  $$(".chapter-anchor").forEach(el=>observer.observe(el));

  function readingProgress() {
    const size=document.documentElement.scrollHeight-window.innerHeight;
    const fraction=size>0?Math.max(0,Math.min(100,window.scrollY/size*100)):0;
    $("#read-progress span").style.width=fraction+"%";
  }
  window.addEventListener("scroll",readingProgress,{passive:true});
  readingProgress();

  // Generative but deterministic orbit ornament, no external images and no customer rows.
  const dots=$("#orbit-points");
  if(dots){
    const fragments=[];
    for(let i=0;i<145;i++){
      const phase=i*2.399963229728653;
      const ring=92+((i*79)%138);
      const x=315+Math.cos(phase)*ring;
      const y=312+Math.sin(phase)*ring;
      const radius=i%11===0?4.0:(i%3===0?2.1:1.3);
      const opacity=(.16+((i*7)%13)/23).toFixed(2);
      fragments.push('<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+
        '" r="'+radius+'" fill="'+(i%7===0?"#c7ff8c":"#b3d5bd")+'" opacity="'+opacity+'"/>');
    }
    dots.innerHTML=fragments.join("");
  }
  if("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    const revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){
        e.target.classList.add("visible");revealObserver.unobserve(e.target)}})
    },{threshold:.11});
    $$("[data-reveal]").forEach(node=>revealObserver.observe(node));
  }
  // Check backend availability without silently faking execution success.
  fetch("/api/run",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject(r.status))
    .then(status=>{if(status.status==="ready"){
      const online=$(".nav-online");
      online.title="Python API отговаря; изпълнението ще започне при натискане на бутон.";
    }})
    .catch(()=>{
      const online=$(".nav-online");
      if(online){online.textContent="Python API: недостъпен";online.style.color="#ffb9a8";}
    });
})();
