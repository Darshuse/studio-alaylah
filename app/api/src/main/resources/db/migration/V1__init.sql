-- استوديو حكايات العائلة — المخطط الأساسي (V1)
-- كل الأصول الكبيرة (صوت/صور/فيديو) تُخزَّن في S3؛ الجداول تحفظ المفاتيح فقط.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- المستخدم (الأب / صاحب الحساب)
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name  TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- العائلة (نطاق الخصوصية)
CREATE TABLE families (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فرد من العائلة (ليس بالضرورة مستخدمًا)
CREATE TABLE family_members (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id  UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    relation   TEXT,                         -- ابن / أم / أب-راوي ...
    is_adult   BOOLEAN NOT NULL DEFAULT true, -- استنساخ الصوت للبالغين فقط
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- بطاقة الشخصية: الهوية البصرية الثابتة (الميزة الحاسمة)
CREATE TABLE character_profiles (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id      UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    member_id      UUID REFERENCES family_members(id) ON DELETE SET NULL,
    display_name   TEXT NOT NULL,
    age_label      TEXT,                       -- "٧ سنوات" / "في الثلاثينات"
    appearance     JSONB NOT NULL DEFAULT '{}',-- شعر/ملابس/نمط
    reference_keys TEXT[] NOT NULL DEFAULT '{}',-- مفاتيح S3 للصور المرجعية
    identity_seed  TEXT,                        -- بذرة/معرّف ثبات الهوية عبر المشاهد
    identity_ready BOOLEAN NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- الحكاية
CREATE TABLE stories (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id      UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    title          TEXT,
    status         TEXT NOT NULL DEFAULT 'draft',   -- draft/text_approved/rendering/completed
    source_kind    TEXT NOT NULL DEFAULT 'voice',   -- voice | written
    text_approved  BOOLEAN NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- مراجعات النص (تاريخ التحرير + الاعتماد)
CREATE TABLE story_revisions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id    UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    body        TEXT NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- المشاهد
CREATE TABLE story_scenes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id      UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    scene_order   INT NOT NULL,
    title         TEXT,
    caption       TEXT,
    image_key     TEXT,           -- مفتاح S3 لصورة المشهد المولّدة
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (story_id, scene_order)
);

-- موافقة استخدام الصوت (إلزامية قبل أي TTS)
CREATE TABLE voice_consents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    member_id   UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    granted_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scope       TEXT NOT NULL DEFAULT 'single_story',
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at  TIMESTAMPTZ
);

-- عيّنة الصوت
CREATE TABLE voice_samples (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id   UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    consent_id  UUID NOT NULL REFERENCES voice_consents(id) ON DELETE CASCADE,
    audio_key   TEXT NOT NULL,      -- مفتاح S3
    duration_ms INT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- مهام التوليد الثقيل (آلة الحالات)
CREATE TABLE generation_jobs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id    UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    kind        TEXT NOT NULL,      -- transcribe | scene_image | voice_tts | assemble_video
    status      TEXT NOT NULL DEFAULT 'queued', -- queued/processing/needs_review/completed/failed/cancelled
    progress    INT NOT NULL DEFAULT 0,
    error       TEXT,
    payload     JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_jobs_status ON generation_jobs(status);
CREATE INDEX idx_jobs_story  ON generation_jobs(story_id);

-- الأصول (روابط تخزين موقّعة، محدودة المدة)
CREATE TABLE media_assets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    story_id    UUID REFERENCES stories(id) ON DELETE CASCADE,
    kind        TEXT NOT NULL,      -- audio | image | video
    storage_key TEXT NOT NULL,
    content_type TEXT,
    bytes       BIGINT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- طلبات الحذف الكامل
CREATE TABLE deletion_requests (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id    UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status       TEXT NOT NULL DEFAULT 'pending', -- pending/processing/done
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- سجل التدقيق (كل موافقة / حذف / تصدير)
CREATE TABLE audit_events (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id  UUID REFERENCES families(id) ON DELETE SET NULL,
    actor_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    action     TEXT NOT NULL,      -- consent.grant / media.delete / archive.export ...
    detail     JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_family ON audit_events(family_id);
