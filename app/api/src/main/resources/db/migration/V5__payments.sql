-- سجل المدفوعات: مصدر الحقيقة الوحيد لمنح الرصيد (منع التكرار + قابلية التدقيق)
CREATE TABLE payments (
    id           UUID PRIMARY KEY,
    family_id    UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    provider     TEXT        NOT NULL,
    sku          TEXT        NOT NULL,
    credits      INT         NOT NULL,
    amount_minor BIGINT      NOT NULL,
    currency     TEXT        NOT NULL,
    status       TEXT        NOT NULL DEFAULT 'pending',
    external_ref TEXT,
    note         TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at   TIMESTAMPTZ
);
CREATE UNIQUE INDEX ux_payments_provider_ref ON payments(provider, external_ref) WHERE external_ref IS NOT NULL;
CREATE INDEX ix_payments_family ON payments(family_id, created_at DESC);
CREATE INDEX ix_payments_pending ON payments(status) WHERE status = 'pending';
