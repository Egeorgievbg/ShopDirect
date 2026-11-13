# ShopDirect · Интерактивна курсова работа P3.1

**Разработила:** Илияна Цанова · Специалност „Маркетинг“ · Фак. № 252042 · 2026

[![Vercel](https://img.shields.io/badge/Online-Vercel-192d22)](https://shopdirect-nine.vercel.app/)
[![Python](https://img.shields.io/badge/Python-3.12-326a4d)](api/run.py)

## Какво представлява проектът

Уеб версия на академичния казус „Таргетиране на персонализирана оферта в онлайн магазин ShopDirect“, с:

- **Авторска титулна страница** и последователно разказан аналитичен процес.
- **Шест интерактивни глави**, всяка с „Изпълни Python“ и „Виж действителния код“.
- **Вграден преподавателски CSV**, без ръчно качване.
- **Логистична регресия** и **Random Forest** с реално обучение при изпълнение.
- **ROC, CV AUC, confusion matrices, bootstrap сравнение, odds ratios, calibration и lift/capture**.
- **Симулатор за избор на 10–50%** от най-високо ранжираните клиенти.
- **Пълен HTML доклад**, пригоден за печат, с проверка на възпроизводимостта.
- **Онлайн защита от осем слайда**, с бележки за говорене, навигация и печат в PDF.

Адреси след успешен deployment:

| Страница | URL |
|---|---|
| Интерактивна курсова | \`/\` |
| Пълен доклад | \`/report.html\` |
| Онлайн презентация | \`/presentation.html\` |
| Проверка на Python API | \`/api/run\` |
| Изпълнение на глава | \`POST /api/run\` |
| Действителен Python код | \`GET /api/run?source=logistic\` |

## Данни и публичност

Оригиналният CSV файл за задачата се намира в **\`data/P3_1_campaign_response.csv\`**. Той е включен по изрично искане за възпроизводим анализ без допълнително качване. Тъй като GitHub хранилището е публично, **самият CSV също е публично видим**. Преди реално приложение със същата архитектура трябва да се премине към разрешен/анонимизиран набор или частно съхранение на данните. Учебният файл съдържа псевдонимни ID от вида \`C3001\` и агрегирани поведенчески показатели, а не имена, имейли или телефони.

**Забележка:** изискването „не прикачвайте повторно CSV“ се отнася до трите предавани на преподавателя файла. Публикуването му в GitHub е отделен избор, направен за онлайн възпроизводимост, и следва да се съобрази с правилата за ползване на учебните данни.

## Възпроизводимост

CSV съдържа **800 клиента**, **264 Yes**, **536 No**, без липсващи стойности или повторени идентификатори.

| Показател | Logistic Regression | Random Forest |
|---|---:|---:|
| Cross-validation AUC (5 folds) | 0.76465094 | 0.73660235 |
| Test ROC AUC (n=200) | 0.77419720 | 0.75587969 |
| Accuracy | 0.780 | 0.745 |
| Sensitivity | 0.455 | 0.333 |
| Specificity | 0.940 | 0.948 |

Таргетиране на **топ 30% от тестовите клиенти**: 60 контакта, 37 положителни отговора, 61,7% response rate, 1,87× lift, 56,1% capture.

Параметрите съвпадат с предадения notebook: stratified train/test split 75/25; \`random_state=42\`; 5-fold CV само върху train данните; стандартизиране в \`Pipeline\`; Logistic Regression и 250-дървесен Random Forest.

**Предпочитан модел:** логистична регресия поради интерпретируемост и близко качество. Bootstrap 95% интервалът за AUC разликата включва нула — не твърдим категорично превъзходство.

**Критично методологично разграничение:** propensity to respond ≠ causal campaign uplift. Изборът на 30% не е доказано оптимален по ROI без реална цена на контакт, марж и контролна група.

## Независимо изпълними стъпки

Пример за стартиране на една глава:

\`\`\`bash
curl -sS https://shopdirect-nine.vercel.app/api/run \
  -H "Content-Type: application/json" \
  -d '{"step":"quality"}'
\`\`\`

Допустими стойности на \`step\`: \`quality\`, \`patterns\`, \`logistic\`, \`forest\`, \`comparison\`, \`targeting\`, \`all\`.

Това е фиксиран набор от Python функции, а **не** онлайн редактор, в който посетителите могат да изпълняват произволен Python код. При отваряне на „Виж кода“ сайтът зарежда истинския изходен текст от функцията с \`inspect.getsource\`.

## Локални тестове

\`\`\`bash
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m unittest discover -s tests -v
\`\`\`

Файлът \`.python-version\` указва Python 3.12. За локален статичен preview може да използвате \`python -m http.server 8080 --directory public\`; за истински Python endpoint използвайте \`vercel dev\` в свързания Vercel проект.

## Технологии

| Слой | Реализация |
|---|---|
| Frontend | Семантичен HTML, CSS, Vanilla JavaScript |
| Data visualization | SVG и програмно генерирани статистически компоненти |
| Backend | Vercel Python Function \`api/run.py\` |
| ML | pandas, NumPy, scikit-learn |
| Data | \`data/P3_1_campaign_response.csv\` включен във function bundle |
| Публикуване | Vercel Git Integration (без GitHub Actions) |

В \`vercel.json\` е зададен \`includeFiles\` за CSV файла, така че функцията да може да чете данните по време на изпълнение.

## Проверки при публикуване

1. Начална страница \`/\` да отговаря с **HTTP 200**, със заглавието на курсовата.
2. \`/report.html\` и \`/presentation.html\` да отговарят с **HTTP 200**.
3. \`GET /api/run\` да отговаря със \`status=ready\`.
4. \`POST /api/run\` с \`{"step":"quality"}\` да отчита **800 / 264 / 0**.
5. \`POST /api/run\` с \`{"step":"all"}\` да връща всички 6 глави и проверените AUC.
6. „Виж кода“ да показва изходните Python функции, а не демонстрационен псевдокод.
7. Печатът на доклада и презентацията да е четим.
8. Проверка на Vercel logs и бюджет за публични изчислителни заявки.

Сайтът не използва потребителска регистрация, външни аналитични SDK, рекламни маркери или изпращане на маркетингови предложения. За широко публично използване е препоръчителен лимит на заявки и допълнителен контрол на ресурсите на Vercel.

## Структура

\`\`\`
public/
  index.html          Курсова работа и интерактивна навигация
  styles.css          Дизайн система
  app.js              Визуализации и управление на шестте глави
  report.html         Пълен академичен доклад
  presentation.html   Онлайн презентация за защита
api/
  run.py              Изпълним Python анализ по глави
data/
  P3_1_campaign_response.csv
tests/
  test_analysis.py
requirements.txt
.python-version
vercel.json
\`\`\`

## Използвани технически източници

- [scikit-learn: Cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html)
- [scikit-learn: Model evaluation](https://scikit-learn.org/stable/modules/model_evaluation.html)
- [scikit-learn: Probability calibration](https://scikit-learn.org/stable/modules/calibration.html)
- [Vercel: Python functions](https://vercel.com/docs/functions/runtimes/python)
- [Vercel: Project configuration](https://vercel.com/docs/project-configuration/vercel-json)

---

Курсова работа P3.1 · Илияна Цанова · фак. № 252042 · 2026.


## Visual Performance V3 (13 ноември 2026)

- Авторски preloader с нова лилаво-златна версия на академичния символ; ограничена продължителност и fallback при грешка на JS.
- Седем оптимизирани по размер прозрачни PNG floating елемента (Python, VS Code, кодов редактор, аналитика, две университетски икони и академичен знак) в `public/visuals/floating/`.
- Три намалени PNG ресурса с прозрачност в `public/visuals/optimized/`, които вече се използват в HTML вместо по-големите originals.
- Всички нови изображения се кешират чрез `Cache-Control: public, max-age=31536000, immutable`. При следваща промяна на asset се използва ново име, не презапис.
- GSAP броячи на видимите KPI: 800 наблюдения, 33% response rate, 75/25 split, 02 модела. Показателите са статичните референтни числа от реалния CSV, а не резултат на fake изпълнение.
- Многостепенни floating анимации и фонови орбити с `pointer-events:none`; поддръжка за `prefers-reduced-motion`.
- Илияна от лявата страна на презентационната карта излиза извън рамката и се движи непрекъснато леко в хоризонтална посока.
- На широк десктоп (≥1100px и ≥760px височина) аналитичните глави са ограничени до един екран; резултатите, кодът и терминалът остават скролируеми в картата. При по-малки устройства главите растат естествено, за да няма отрязан текст.
- Python API, ML моделите, вграденият CSV и резултатите остават непроменени.

**Забележка за формата:** В production са качени намалени PNG файлове, за да се запази прозрачността и да се избегне загуба на съвместимост. Допълнителният WebP пакет е готов като локален export за последващ asset-pipeline, но в този commit не е разположен в production.
