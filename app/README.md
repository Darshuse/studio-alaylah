# استوديو حكايات العائلة — المونوريبو

من حكاية يرويها الوالد إلى فيلم عائلي عربي خاص.

```
app/
├── web/       واجهة Next.js 15 + Tailwind (PWA, RTL)
├── api/       باك إند Java 21 + Spring Boot (modular monolith)
├── workers/   عمّال التوليد (مدمجون في api الآن، ينفصلون لاحقًا)
└── docker-compose.yml   Postgres + RabbitMQ + MinIO
```

## التشغيل محليًا

**1) البنية التحتية**
```bash
cd app
docker compose up -d
```
- Postgres → localhost:5432 · RabbitMQ لوحة → localhost:15672 · MinIO console → localhost:9001

**2) الباك إند** (المنفذ 8080)
```bash
cd app/api
mvn spring-boot:run
```
فحص: `curl http://localhost:8080/api/v1/ping`

**3) الواجهة** (المنفذ 4000)
```bash
cd app/web
npm install
npm run dev
```
افتح http://localhost:4000 — يجب أن تُظهر «حالة الباك إند: متصل ✅».

## المراجع
- الخطة التقنية الكاملة: `../docs/TECH-HANDOFF.md`
- التصميم/التوكنز: `../stitch_/family_tales_studio/DESIGN.md`
- البروتوتايب القابل للنقر: `../prototype/index.html`
