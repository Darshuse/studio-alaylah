# مراجعة الكود + المعمارية النظيفة + خطة الوصول للهدف

> الهدف: **ثبات جودة عالية + تكلفة أقل + خدمة عشرات الآلاف بالتزامن.**
> المراجعة مبنية على قراءة الكود الفعلي (2769 سطر Java + الواجهة). صريحة، بلا مجاملة.

---

## 1) مراجعة الكود (Code Review)

### ✅ نقاط القوة (نبني عليها)
- **بنية نظيفة package-by-feature** (auth/story/character/media/render) — سهلة الفهم والتوسّع.
- **تجريد المزوّدين** (`ImageProvider`/`TtsProvider` interfaces) — ممتاز؛ بدّلنا Pollinations→Together→Kontext بسهولة.
- **عزل بيانات على مستوى العائلة** متحقّق (13/13 QA).
- **JWT stateless** — يسهّل التوسّع الأفقي.
- **روابط موقّعة (presigned)** للوسائط — لا تمرّ عبر التطبيق (صح).
- استخدام **records** للـDTOs، **Flyway** للـmigrations، **HikariCP** pooling.

### 🔴 حرجة (تمنع التوسّع/الإطلاق)
| # | المشكلة | الأثر | الحل |
|---|---|---|---|
| C1 | **`@EnableAsync` بلا Executor مخصّص** → SimpleAsyncTaskExecutor يصنع thread/مهمة **بلا حد** | تحت ضغط: OOM + كراش | **طابور حقيقي (RabbitMQ)** + workers محدودة، أو ThreadPoolTaskExecutor محدود كحدّ أدنى |
| C2 | **التوليد داخل عملية الويب** (@Async) | 60–120ث/مهمة تخنق الويب + الـDB pool | فصل الـworkers عن الـAPI |
| C3 | **JWT secret افتراضي** في application.yml | اختراق كل الجلسات | إجباري env في الإنتاج + رفض الافتراضي عند البدء |
| C4 | **لا حدود/rate limiting** | مستخدم واحد يستهلك السعة/الرصيد | fair-use + rate limit + حدود server-side |
| C5 | **لا fallback بين المزوّدين** | وقوع كامل لو ElevenLabs/Together سقط | سلسلة مزوّدين أنداد + circuit breaker |

### 🟡 متوسطة (جودة/متانة)
- **M1 — لا Quality Gate:** المخرجات تُسلّم بلا فحص → جودة متذبذبة. (حجر الأساس لوعد «أفضل جودة على طول».)
- **M2 — N+1 في `StoryController.list`:** hasFilm + coverUrl + displayTitle = 3 استعلامات/قصة. (batch أو حدّ صفحات.)
- **M3 — لا `@ControllerAdvice`:** معالجة أخطاء موحّدة ناقصة (نعتمد على ResponseStatusException + include-message).
- **M4 — لا idempotency للتوليد:** الدبل-كليك سبّب بق transaction (اتصلح جزئيًا)؛ يلزم مفتاح idempotency.
- **M5 — retry موجود في Together فقط:** يعمّم على كل نداء خارجي (ElevenLabs/الترجمة).
- **M6 — لا مراقبة/metrics:** لا نرى الطابور يطول أو مزوّد يفشل قبل الكراش.

### 🟢 صغيرة
- logout غير موجود في الواجهة · RabbitMQ مُعرّف في compose غير مُستخدم · بعض الأسرار تُقرأ من ملفات (مقبول محليًا).

---

## 2) المعمارية النظيفة المستهدفة

### مبادئ
1. **الـAPI رفيع وسريع** — يتحقّق، يحفظ، **يضع مهمة في الطابور**, يرجّع فورًا. لا عمل ثقيل فيه.
2. **Workers منفصلة قابلة للتوسّع** — تستهلك الطابور، تولّد، تحدّث الحالة.
3. **كل عمل ثقيل = مهمة idempotent قابلة لإعادة المحاولة.**
4. **مزوّدون خلف تجريد + سلسلة أنداد + circuit breaker.**
5. **بوابة جودة قبل التسليم** — لا يخرج شيء تحت المستوى.

### المخطّط
```
[Next.js/CDN] → [API (عدة نسخ، stateless) خلف Load Balancer]
                      │ enqueue
                      ▼
                 [Queue: RabbitMQ/SQS]
                      │ consume
                      ▼
        [Generation Workers (قابلة للتوسّع أفقيًا)]
          ├─ ImageProviderChain (Kontext→fal→Qwen ذاتي)   ← أنداد
          ├─ TtsProviderChain (ElevenLabs→Replicate→Chatterbox ذاتي)
          ├─ QualityGate (شبه وش + مطابقة نص + صحّة صوت) ← يعيد لو رسب
          └─ FFmpeg/PDFBox
                      │
        [Postgres مُدار] · [S3 + CDN] · [Metrics/Alerts]
```

### الطبقات المضافة (ملموسة)
- **JobQueue** interface (نبدأ RabbitMQ) — ينقل `SceneGenerationService` من @Async لمستهلك طابور.
- **ProviderChain<T>** — قائمة مرتّبة + circuit breaker (Resilience4j) + fallback بين أنداد.
- **QualityGate** — يفحص كل مخرج (شبه الوش، مطابقة المشهد للنص، صحّة الصوت) ويعيد التوليد تلقائيًا.
- **RateLimiter / UsageGuard** — حدود لكل مستخدم/باقة + حارس ميزانية المزوّدين.
- **ControllerAdvice** — أخطاء موحّدة. **Observability** — Micrometer/Prometheus.

---

## 3) إطار QA (يراجع ورا كل شيء)

| البُعد | كيف يُقاس (آليًا) | العتبة | الحالة |
|---|---|---|---|
| **دقة الأفاتار** (شبه الشخص) | face-embedding cosine (ArcFace/InsightFace) بين الصورة والأفاتار | ≥ 0.90 | يحتاج خدمة وجوه |
| **دقة الصورة من النص** | CLIP/vision score بين البرومبت والصورة + كشف نص/علامة/NSFW | ≥ عتبة | يحتاج CLIP |
| **دقة الصوت نسبةً للأب** | speaker-verification (ECAPA/Resemblyzer) بين العيّنة والسرد | ≥ عتبة | يحتاج نموذج تحقّق متحدّث |
| **دقة النطق للكلمات** | STT (Whisper) للسرد ثم مقارنة بالنص (WER عربي) | WER منخفض | يحتاج Whisper |
| **ثبات الشخصية عبر المشاهد** | face-embedding بين المشاهد | تباين منخفض | يحتاج خدمة وجوه |
| **سلامة الفيديو/الكتاب** | ffprobe (صوت+صورة+مدة) · صفحات PDF | يمر | ✅ آلي الآن |

**ملاحظة صدق:** أبعاد الوش/الصوت/النطق تحتاج **نماذج تقييم** (وجوه + متحدّث + Whisper) — تُبنى كخدمة QA. الرقم «90%» **يُقاس بها، لا يُدّعى**.

---

## 4) الخطة (للوصول للأهداف الثلاثة)

### الهدف: جودة ثابتة + تكلفة أقل + عشرات الآلاف
| المرحلة | يعمل ماذا | يحقّق |
|---|---|---|
| **P0 — تثبيت** | ThreadPool محدود (سريع) بدل unbounded · JWT env-only · rate limit · idempotency · ControllerAdvice | يمنع الكراش الفوري |
| **P1 — طابور** | RabbitMQ + workers منفصلة + retry/dead-letter + metrics | يتحمّل الآلاف بلا خنق |
| **P2 — مرونة + جودة** | ProviderChain (أنداد) + circuit breaker + **QualityGate** (شبه وش/نص/صوت) | لا وقوع + جودة ثابتة |
| **P3 — تكلفة صفر عند الحجم** | خدمة GPU ذاتية (Qwen-Edit/FLUX-schnell/Chatterbox) كأحد الأنداد | تكلفة متغيّرة ≈ صفر + تحكّم جودة كامل |
| **P4 — عشرات الآلاف** | autoscaling workers · Postgres مُدار · S3/CDN · load balancer | سعة أفقية مرنة |

**الحكم النهائي:** **لا إعادة كتابة.** الأساس نظيف. المطلوب **إضافات معمارية** (طابور + workers + سلسلة أنداد + بوابة جودة + مراقبة) بالترتيب أعلاه. أخطر بند فوري = **C1 (unbounded async)**.
