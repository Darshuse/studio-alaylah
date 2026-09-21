# النشر على Railway

المنتج = خدمتان (API جافا + Web Next.js) + 3 خدمات بنية (Postgres · RabbitMQ · تخزين S3).

## الخدمات
| الخدمة | المصدر | ملاحظات |
|---|---|---|
| **api** | `app/api/Dockerfile` | Spring Boot + FFmpeg + خطوط DejaVu |
| **web** | `app/web/Dockerfile` | Next.js standalone؛ يحتاج `API_URL` = رابط api الداخلي |
| **postgres** | Railway plugin | `railway add --database postgres` |
| **rabbitmq** | صورة `rabbitmq:3.13-management-alpine` | خدمة من صورة |
| **تخزين** | MinIO (صورة + volume) أو **Cloudflare R2** (S3-متوافق، موصى به) | R2 أبسط: بلا volume |

## متغيرات بيئة الـapi (Railway → Variables)
```
# قاعدة البيانات (من خدمة Postgres)
DB_URL=jdbc:postgresql://<host>:<port>/<db>
DB_USER=...           DB_PASSWORD=...
# RabbitMQ (من خدمة rabbitmq)
RABBIT_HOST=...  RABBIT_PORT=5672  RABBIT_USER=...  RABBIT_PASSWORD=...
# التخزين S3 (R2 أو MinIO)
S3_ENDPOINT=...  S3_BUCKET=family-tales  S3_ACCESS_KEY=...  S3_SECRET_KEY=...
# مزوّدو الذكاء (أسرار — لا تُكتب في الكود)
IMAGE_PROVIDER=together
TOGETHER_API_KEY=...
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=...
# الأمان (إلزامي في الإنتاج)
JWT_SECRET=<سر قوي عشوائي ≥32 حرف>
JWT_ALLOW_DEV_SECRET=false
# الفوترة
BILLING_WEBHOOK_SECRET=<سر مشترك مع مزوّد الدفع>
# BILLING_TEST_GRANT=false  (اتركه false في الإنتاج)
# التوسّع
GEN_WORKERS=2   GEN_WORKERS_MAX=6
```

## متغيرات بيئة الـweb
```
API_URL=https://<رابط خدمة api الداخلي/العام>
PORT=4000
```

## خطوات CLI (مختصرة)
```
railway init --name studio-alaylah
railway add --database postgres
# انشر api و web كخدمتين (من مجلديهما) واضبط المتغيّرات أعلاه
railway up --service api        # من app/api
railway up --service web        # من app/web
```
> RabbitMQ والتخزين يُضافان كخدمتين من اللوحة (صورة rabbitmq + MinIO/R2).

## ⚠️ ملاحظات إنتاج
- **الأسرار في Railway Variables فقط** — ملفات `*.key` محليّة gitignored.
- **JWT_ALLOW_DEV_SECRET=false** + `JWT_SECRET` قوي (وإلا يرفض الإقلاع).
- التخزين: **R2 موصى به** (بلا إدارة volume)؛ أنشئ bucket `family-tales`.
- الكتاب العربي يعتمد خط SansSerif→DejaVu (مثبّت في الـDockerfile).
