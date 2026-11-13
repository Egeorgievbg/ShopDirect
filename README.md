# ShopDirect — Marketing Intelligence Lab

**P3.1 | Таргетиране на персонализирана оферта в онлайн магазин**

Академичен проект на **Илияна Цанова**, фак. № **252042**, специалност **„Маркетинг“**, 2026.

Този проект представя интерактивен маркетингов анализ, Python изпълнение на реалните класификационни модели и възпроизводимо правило за избор на клиенти. Публичният код може да се преглежда; преподавателският набор данни не се публикува.

## Какво включва

- Editorial-style, responsive HTML interface (без JavaScript build tool или GitHub Actions).
- Проверени исторически резултати: 800 клиента, 264 положителни отговора, тестов AUC **0,774** / **0,756**.
- Симулатор на таргетираща аудитория 20%, 30%, 40% преди изпълнение; 10–50% след успешно Python изчисление.
- Python Vercel Function (`api/run.py`), използваща scikit-learn, pandas и NumPy.
- Истинско повторно обучение, оценка на два модела, ROC криви, confusion matrices и lift/capture.
- Публично проверим код, без публикуване на клиентски ID или индивидуални оценки.

## Начин на работа

1. Отворете сайта във Vercel.
2. В секцията **Live Python Lab** посочете оригиналния `P3_1_campaign_response.csv` от преподавателя.
3. Данните се прочитат и проверяват **локално** в браузъра; не се изпращат автоматично.
4. Натиснете **„Изпълни Python анализ“**. Браузърът изпраща CSV редовете към `/api/run`.
5. Сървърът валидира входа, обучава двата модела, пресмята резултатите и връща **само обобщени показатели**. Данните не се записват в приложението.

**Важно:** Качването в публичен API все пак е обработване на данни от трета страна. Използвайте само CSV, за който имате разрешение за подобно обработване. За напълно локално изпълнение използвайте оригиналния notebook от курсовата работа.

## Локално изпълнение на тестовете

Изисква Python **3.12**. Създайте виртуална среда и инсталирайте зависимостите:

```bash
python -m venv .venv
# Linux/macOS:
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m unittest discover -s tests -v
```

Тестовете използват синтетични (непотребителски) данни за smoke test. Ако поставите преподавателския CSV **само локално** в корена, се изпълнява и регресионен тест срещу референтните показатели. Първоначалният CSV остава извън Git чрез `.gitignore`.

### Референтни резултати от оригиналния notebook

| Показател | Logistic Regression | Random Forest |
|---|---:|---:|
| CV AUC (5 folds) | 0,76465 | 0,73660 |
| Test AUC (n=200) | 0,77420 | 0,75588 |
| Accuracy | 0,780 | 0,745 |
| Sensitivity (threshold 0,50) | 0,455 | 0,333 |
| Specificity | 0,940 | 0,948 |

Логистичната регресия е практически предпочетена заради интерпретируемост и близки или малко по-добри показатели. Малката разлика **не** доказва статистически значимо превъзходство.

Топ 30% от тестовите клиенти = **60 клиента**, от които **37** имат исторически положителен отговор; **61,7%** response rate, **1,87×** lift и **56,1%** capture от 66 положителни отговора.

## Примерно внедряване във Vercel

1. Vercel Dashboard → **Add New → Project**.
2. Изберете екипа **egeorgievbgs-projects**.
3. Импортирайте `Egeorgievbg/ShopDirect` след като работният branch бъде одобрен/слет с `main`.
4. Задайте проектно име `shopdirect-p31`, **Framework Preset: Other**, **Root Directory: ./**.
5. Не са необходими Build Command, Output Directory override или Environment Variables.
6. Разпознатата Python функция трябва да се появи под `/api/run`. Проверете `GET /api/run`, след което изпълнете CSV анализа в сайта.
7. Git integration разгръща автоматично при push; **GitHub Actions не са нужни**.

**Deployment статус:** източниците са налични в GitHub. Vercel MCP правата за създаване на проект в екипа връщат HTTP 403. Публикуван адрес не е потвърден. Не приемайте, че Preview е успешен без Vercel READY + HTTP smoke tests.

## Структура

```text
public/index.html      Responsive frontend, CSV parser, simulator, charts
api/run.py             Deterministic sklearn API
requirements.txt       Pinned runtime dependencies
.python-version        Python 3.12
vercel.json            Serverless limits and headers
tests/test_analysis.py Synthetic and optional original-CSV checks
```

## Академична и статистическа коректност

- 75/25 stratified train/test split, `random_state=42`.
- 5-fold stratified CV само върху train split.
- Стандартизацията се обучава вътре в `Pipeline`.
- Оценяваме Accuracy, Sensitivity, Specificity, ROC AUC и Brier score.
- Прогнозна вероятност за response **не е** инкрементален ефект от кампанията.
- Липсват надеждни исторически времеви маркери за предикторите, директен бюджет и марж за оценка на ROI.
- Публичният endpoint не приема произволен Python код, валидира схема и размер на заявката и връща само агрегати.
- Нужни са допълнителни мерки за rate limiting/WAF преди широк публичен достъп до изчислителния endpoint.
