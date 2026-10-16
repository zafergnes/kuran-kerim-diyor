-- Günlük hadis bildirimi tercihi; mevcut aboneler için varsayılan olarak açık.
ALTER TABLE "PushDevice" ADD COLUMN "dailyHadith" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "WebPushSubscription" ADD COLUMN "dailyHadith" BOOLEAN NOT NULL DEFAULT true;
