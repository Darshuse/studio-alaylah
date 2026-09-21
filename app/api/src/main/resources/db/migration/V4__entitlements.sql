-- نظام الاستحقاق: خطة + رصيد قصص (يحمي التكلفة ويطبّق «قصة مجانية هدية + الباقي بدفع»)
ALTER TABLE families
    ADD COLUMN plan            TEXT NOT NULL DEFAULT 'free',   -- free | payg | subscription
    ADD COLUMN story_credits   INT  NOT NULL DEFAULT 1,        -- رصيد قصص متبقٍّ (يبدأ بقصة هدية)
    ADD COLUMN stories_created INT  NOT NULL DEFAULT 0;        -- إجمالي المولّد (تحليلات)
