// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

// ルートのインポート
const memberRoutes = require("./routes/members");
const companyRoutes = require("./routes/companies");
const qualificationRoutes = require("./routes/qualifications");
const projectRoutes = require("./routes/projects");
const loginRoutes = require("./routes/login");
const authRoutes = require("./routes/auth");
const shiftRoutes = require("./routes/shift");
const userRoutes = require("./routes/user");
// ルートの使用
app.use(memberRoutes);
app.use(companyRoutes);
app.use(qualificationRoutes);
app.use(projectRoutes);
app.use(loginRoutes);
app.use(authRoutes);
app.use(shiftRoutes);
app.use(userRoutes);
// サーバーの起動
app.listen(4000, () => {
  console.log("サーバーがポート4000で稼働中...");
});

// Prisma クライアントの切断処理
const prisma = require("./prismaClient");
process.on("SIGINT", async () => {
  console.log("Prismaクライアントを切断しています...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Prismaクライアントを切断しています...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("uncaughtException", async (err) => {
  console.error("予期しないエラーが発生しました:", err);
  await prisma.$disconnect();
  process.exit(1);
});