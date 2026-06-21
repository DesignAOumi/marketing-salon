/**
 * 初期シード（冪等）。
 *  - Settings シングルトン行を作成（無ければ）。
 *  - ADMIN_EMAIL / ADMIN_PASSWORD が設定されていれば owner アカウントを upsert。
 * マイグレーション後・コンテナ起動時に実行される（docker-entrypoint.sh）。
 * 本番では初回ログイン後に必ずパスワードを変更すること。
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // 1) Settings シングルトン
  const salonName = process.env.SALON_NAME || "My Salon";
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", salonName },
  });
  console.log("[seed] settings singleton ensured");

  // 2) 初期 owner（任意）
  const email = (process.env.ADMIN_EMAIL || "").trim();
  const password = process.env.ADMIN_PASSWORD || "";
  if (email && password) {
    const passwordHash = await bcrypt.hash(password, 12);
    const name = process.env.ADMIN_NAME || "管理者";
    await prisma.staff.upsert({
      where: { email },
      update: { passwordHash, role: "owner", isActive: true, name },
      create: { email, passwordHash, role: "owner", isActive: true, name },
    });
    console.log(`[seed] owner account ensured: ${email}`);
  } else {
    console.log("[seed] ADMIN_EMAIL/ADMIN_PASSWORD 未設定のため管理者作成をスキップ");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("[seed] failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
