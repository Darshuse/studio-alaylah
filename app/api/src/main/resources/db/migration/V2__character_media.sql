-- صورة الطفل الأصلية المرفوعة + الأفاتار الكرتوني المشتق منها
ALTER TABLE character_profiles
    ADD COLUMN photo_key  TEXT,   -- مفتاح S3 لصورة الطفل الأصلية (مرفوعة)
    ADD COLUMN avatar_key TEXT;   -- مفتاح S3 للأفاتار الكرتوني (يُولّد من الصورة)
