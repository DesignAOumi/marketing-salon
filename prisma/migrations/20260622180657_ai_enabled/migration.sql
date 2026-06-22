-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "salonName" TEXT NOT NULL,
    "salonPhone" TEXT,
    "salonEmail" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    "currency" TEXT NOT NULL DEFAULT 'JPY',
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "aiMode" TEXT NOT NULL DEFAULT 'offline',
    "aiProvider" TEXT NOT NULL DEFAULT 'claude',
    "aiModel" TEXT,
    "encryptedApiKey" TEXT,
    "apiKeyIv" TEXT,
    "aiSharedFields" TEXT,
    "anonymizeBeforeSend" BOOLEAN NOT NULL DEFAULT true,
    "dataRetentionYears" INTEGER NOT NULL DEFAULT 3,
    "sessionIdleTimeoutMinutes" INTEGER NOT NULL DEFAULT 60,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "setupCompletedAt" DATETIME,
    "themeColor" TEXT NOT NULL DEFAULT 'zinc',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("aiMode", "aiModel", "aiProvider", "aiSharedFields", "anonymizeBeforeSend", "apiKeyIv", "createdAt", "currency", "dataRetentionYears", "encryptedApiKey", "id", "onboardingStep", "salonEmail", "salonName", "salonPhone", "sessionIdleTimeoutMinutes", "setupCompletedAt", "themeColor", "timezone", "updatedAt") SELECT "aiMode", "aiModel", "aiProvider", "aiSharedFields", "anonymizeBeforeSend", "apiKeyIv", "createdAt", "currency", "dataRetentionYears", "encryptedApiKey", "id", "onboardingStep", "salonEmail", "salonName", "salonPhone", "sessionIdleTimeoutMinutes", "setupCompletedAt", "themeColor", "timezone", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
