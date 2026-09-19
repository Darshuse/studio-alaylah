-- تسجيل صوت الأب/البطل مرة واحدة → نسخة صوتية دائمة تُستخدم لسرد كل القصص
ALTER TABLE character_profiles
    ADD COLUMN voice_sample_key TEXT,  -- مفتاح S3 لعيّنة الصوت المرفوعة
    ADD COLUMN voice_id         TEXT;  -- معرّف النسخة الصوتية لدى المزوّد (ElevenLabs)
