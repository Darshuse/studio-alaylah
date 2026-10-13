-- تسجيل الدخول الاجتماعي (جوجل): مزوّد + معرّفه، وباسورد اختياري للحسابات الاجتماعية
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN provider     TEXT;   -- google | (null = إيميل/باسورد)
ALTER TABLE users ADD COLUMN provider_id  TEXT;   -- sub من جوجل
CREATE INDEX ix_users_provider ON users(provider, provider_id) WHERE provider IS NOT NULL;
